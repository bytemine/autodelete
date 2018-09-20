#!/usr/bin/env python


import sys
import time
import io
import re
import json
import locale
import kopano
import argparse
import datetime
import struct



opts = None
config = None
logfile = sys.stdout
errfile = sys.stderr


def log(s):
  pfx = '' if logfile == sys.stdout else time.ctime() + ' - '
  logfile.write(pfx + s.encode('UTF-8') + '\n')

def err(s):
  pfx = '' if errfile == sys.stderr else time.ctime() + ' - '
  errfile.write(pfx + s.encode('UTF-8') + '\n')

def dumpitem(p, i):
  try:
    errfile.write(u'\n========\nFolder: {}\nEntry:  {}\n========\n'.format(p, i.entryid))
    for p in i:
      errfile.write(u' * {:32.32} | {:.128}\n'.format(p.strid, p.strval.encode('unicode_escape')))
    errfile.write('========\n\n')
  except:
    err('\n******** failed to dump item ********\n')

def folder_path(f, r):
  n = f.name
  if f.parent and f.parent != r:
    n = folder_path(f.parent, r) + '/' + n
  return n

class IgnObjException(Exception):
  def __init__(self, message):
    super(IgnObjException, self).__init__(message)


# delete item if timestamp older than keeptime
#
def scrub_item(f, i, kt, ts):
  now = datetime.datetime.now()
  if ts < now and (now - ts).days > kt:
    # when we get here, message_class property exists
    log(u'DEL ({} >{}d) ts = {}, subject = "{}"'.format(i.message_class, kt, ts, i.subject))
    if not opts.dry_run:
      pass # f.delete(i, soft=True)


# purge condition:
# 	timestamp (received/created) is older than keep time
#
def scrub_message(f, i, kt):
  ts = i.received if i.received else i.created
  if not ts:
    err('WARNING: missing timestamp, ignoring: ' + p + '/' + i.subject)
    raise IgnObjException('message')
  else:
    scrub_item(f, i, kt, ts)


# purge condition:
# 	end time is older than keep time (if single)
#	end of recurrence is older than keep time (if recurring)
#
def scrub_appointment(f, i, kt):
  now = datetime.datetime.now()
  try:
    if i.recurring:
      try:
        ts = i.recurrence._end
      except Exception as e:
        err(u'{} {}'.format(type(e), e))
        err(u'broken recurrence, ignoring appointment: {}'.format(i.subject))
        raise IgnObjException('appointment')
    else:
      ts = i.end
  except Exception as e:
    err(u'{} {}'.format(type(e), e))
    err(u'ignoring broken appointment: {}'.format(i.subject))
    raise IgnObjException('appointment')
  scrub_item(f, i, kt, ts)


# purge condition:
#	status is completed
#	recurrence has ended (if recurring)
#	last modification date is older than keep time
#
def scrub_task(f, i, kt):
  try:
    t_status = i.prop('task:33025').value
    if t_status != 2:
      return
    t_complete = i.prop('task:33052').value
  except:
    err(u'broken item, ignoring task: {}'.format(i.subject))
    raise IgnObjException('task')
  if not t_complete:
    err('WARNING: status mismatch, ignoring task: ' + i.subject)
    raise IgnObjException('task')
  now = datetime.datetime.now()
  try:
    t_recurring = i.prop('task:33062')
    tmp = i.get_prop('task:33046')
  except:
    t_recurring = None

  # do not purge completed tasks for ongoing series
  if t_recurring and t_recurring.value and tmp:
    try:
      rd = tmp.value
      pt = struct.unpack_from('<L', rd, 6)
      p_sed = 50 if pt else 46
      if pt == 3 or pt == 11:
        p_sed += 4
      (re,) = struct.unpack_from('<L', rd, p_sed)
      re = datetime.datetime.fromtimestamp(ts_ex2u(re))
      if re > now:
        return
    except:
      err(u'broken recurrence data, ignoring task: {}'.format(i.subject))
      raise IgnObjException('task')

  ts = i.last_modified
  scrub_item(f, i, kt, ts)


def ts_ex2u(t):
  # t is in 'number of minutes since 1.1.1601' (?!)
  return (t - 194074560) * 60



# process one folder
#
def scrub_folder(f, r, us, Z=None):
  p = folder_path(f, r)
  log(u'processing "{}" ({}) note={}, task={}, appointment={}, purge_empty={}'.format(p, f.container_class, us['note'], us['task'], us['appointment'], us['purge_empty']))
  for i in f:
    try:
      mc = i.message_class
    except Exception as e:
      err(u'{} {}'.format(type(e), e))
      err(u'ERROR: illegal object (missing message_class property) ignored')
      dumpitem(p, i)
      return
    try:
      if mc == 'IPM.Note' or scrub_folder.re.match(mc):
        scrub_message(f, i, us['note'])
      elif i.message_class == 'IPM.Appointment':
        scrub_appointment(f, i, us['appointment'])
      elif i.message_class == 'IPM.Task':
        scrub_task(f, i, us['task'])
    except IgnObjException:
      dumpitem(p, i)
  f = f.parent.folder(entryid=f.entryid) # refresh
  if us['purge_empty'] and not f.count and not f.subfolder_count and not f.parent == r:
    log(u'DEL FOLDER "{}"'.format(p))
    if not opts.dry_run:
      f.parent.delete(f, soft=True)

scrub_folder.re = re.compile('IPM.Schedule')


# get value from settings and limit to max (or use default)
#
def getktval(un, ws, tag, wstag):
  try:
    kt = int(ws['settings']['zarafa']['v1']['plugins']['autodelete'][wstag])
    if kt > config['max_keep'][tag]:
      log(u'NOTICE: keeptime (' + tag + ') too high for ' + un + ', clamped to max')
      kt = config['max_keep'][tag]
  except Exception as e:
    log(u'{} {}'.format(type(e), e))
    log(u'NOTICE: no or invalid keeptime (' + tag + ') setting for ' + un + ', using default')
    kt = config['default_keep'][tag]
  return kt


# get settings for user/store (from webapp settings property)
#
def user_settings(s, un):
  from MAPI.Tags import PR_EC_WEBACCESS_SETTINGS_JSON
  cf = s.get_prop(PR_EC_WEBACCESS_SETTINGS_JSON)
  if cf:
    try:
      ws = json.loads(cf.value)
    except:
      err(u'WARNING: broken settings for ' + un + ', using default')
      return config['default_keep']
  else:
    log(u'NOTICE: no settings found for ' + un + ', using default')
    return config['default_keep']
  us = {}
  us['note'] = getktval(un, ws, 'note', 'period_email')
  us['task'] = getktval(un, ws, 'task', 'period_task')
  us['appointment'] = getktval(un, ws, 'appointment', 'period_appointment')
  pe = True
  if not opts.force_purge:
    try:
      pe = bool(ws['settings']['zarafa']['v1']['plugins']['autodelete']['purge_empty'])
    except Exception as e:
      log(u'{} {}'.format(type(e), e))
      log(u'NOTICE: no or invalid purge_emtpy setting for ' + un + ', using default')
  us['purge_empty'] = pe
  return us


# postorder folder list
#
def fldlst(f):
  return [x for ff in f.folders(recurse=False) for x in fldlst(ff)] + [f]


# process one user store
#
def scrub_store(s):
  un = s.user.name if s.user else '???'
  if un in config['omit']:
    log('skipping user ' + un)
    return
  us = user_settings(s, un)
  log(u'processing user "{}" - note={}, task={}, appointment={}, purge_empty={}'.format(un, us['note'], us['task'], us['appointment'], us['purge_empty']))
  for f in fldlst(s.subtree):
    if f != s.subtree:
      scrub_folder(f, s.subtree, us)


# process the public store
#
def scrub_public(s, mt):
  if mt:
    det = ' for ' + s.company.name if s.company else '???'
  else:
    det = ''
  log('processing public store' + det)
  for (n, skt) in config['public'].items():
    r = s.get_folder(n)
    if not r:
      err('WARNING: public folder not found: ' + n)
    else:
      us = {'note': skt, 'task': skt, 'appointment': skt, 'purge_empty': False}
      for f in r.folders():
        scrub_folder(f, s.subtree, us)
      scrub_folder(r, s.subtree, us)


def main():
  global opts
  global config
  global logfile
  global errfile
  locale.setlocale(locale.LC_ALL, '')

  # command line arguments
  ap = argparse.ArgumentParser(description='Purge old mails, obsolete calender items and completed tasks')
  ap.add_argument('-c', '--config', nargs=1, required=True, help='configuration file [required]')
  ap.add_argument('-n', '--dry-run', action='store_true', help='print to stdout what would happen')
  gr = ap.add_mutually_exclusive_group()
  gr.add_argument('-u', '--user', nargs=1, help='cleanup selected user only')
  gr.add_argument('-p', '--public', action='store_true', help='cleanup public store(s) only')
  gr.add_argument('-Z', '--force_purge', metavar='USER', nargs=1, help='cleanup selected user and force removal of empty subfolders')
  opts = ap.parse_args()
  sys.argv = [sys.argv[0]]

  # read config
  try:
    ts = open(opts.config[0]).read()
    ts = re.sub('^\s*#.*$', '', ts, 0, re.M)
    config = json.loads(ts)
  except IOError as e:
    print 'Cannot read config:', e.args[1]
    exit(1)
  except ValueError as e:
    print 'Cannot parse config:', e.args[0]
    exit(1)

  # check config
  cns = ['omit', 'public', 'default_keep', 'max_keep', 'logfile', 'errorlog']
  for a in config:
    try:
      cns.remove(a)
    except ValueError as e:
      print 'unknown config setting:', a
  if len(cns):
      print 'Missing config setting:', cns

  # open logfile
  if not opts.dry_run:
    try:
      logfile = io.open(config['logfile'], mode='ab')
      errfile = io.open(config['errorlog'], mode='ab')
    except IOError as e:
      print 'Cannot open logfile:', e.args[1]
      exit(1)
    log(' *** starting cleanup run ***')

  # iterate stores
  ks = kopano.Server()
  u = opts.user[0] if opts.user else opts.force_purge[0] if opts.force_purge else None
  if u:
    try:
      s = ks.get_user(u).store
    except:
      err('Fatal: Failed to open store for user: ' + u)
      exit(1)
    scrub_store(s)
  else:
    for s in ks.stores():
      if s.orphan:
        err('Warning, orphaned store found: ' + s.guid)
        continue
      if s.public:
        scrub_public(s, ks.multitenant)
      elif opts.public:
        continue
      else:
        scrub_store(s)

  # done
  logfile.close()
  exit(0)


if __name__ == '__main__':
  main()


### end ###
