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
        return
    else:
      ts = i.end
  except Exception as e:
    err(u'{} {}'.format(type(e), e))
    err(u'ignoring broken appointment: {}'.format(i.subject))
    return
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
    return
  if not t_complete:
    err('WARNING: status mismatch, ignoring task: ' + i.subject)
    return
  now = datetime.datetime.now()
  try:
    t_recurring = i.prop('task:33062')
    tmp = i.get_prop('task:33046')
  except:
    t_recurring = None

  # do not purge completed tasks for ongoing series
  if t_recurring and t_recurring.value and tmp:
    rd = tmp.value
    pt = struct.unpack_from('<L', rd, 6)
    p_sed = 50 if pt else 46
    if pt == 3 or pt == 11:
      p_sed += 4
    (re,) = struct.unpack_from('<L', rd, p_sed)
    re = datetime.datetime.fromtimestamp(ts_ex2u(re))
    if re > now:
      return

  ts = i.last_modified
  scrub_item(f, i, kt, ts)


def ts_ex2u(t):
  # t is in 'number of minutes since 1.1.1601' (?!)
  return (t - 194074560) * 60


# process one folder
#
def scrub_folder(f, r, kt):
  p = folder_path(f, r)
  log(u'processing "{}" ({}) note={}, task={}, appointment={}'.format(p, f.container_class, kt['note'], kt['task'], kt['appointment']))
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
        scrub_message(f, i, kt['note'])
      elif i.message_class == 'IPM.Appointment':
        scrub_appointment(f, i, kt['appointment'])
      elif i.message_class == 'IPM.Task':
        scrub_task(f, i, kt['task'])
    except:
      dumpitem(p, i)

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


# get keeptime for store (from webapp settings property) in days
#
def keeptime(s, un):
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
  kt = {}
  kt['note'] = getktval(un, ws, 'note', 'period_email')
  kt['task'] = getktval(un, ws, 'task', 'period_task')
  kt['appointment'] = getktval(un, ws, 'appointment', 'period_appointment')
  return kt


# process one user store
#
def scrub_store(s):
  un = s.user.name if s.user else '???'
  if un in config['omit']:
    log('skipping user ' + un)
    return
  kt = keeptime(s, un)
  log(u'processing user "{}" - note={}, task={}, appointment={}'.format(un, kt['note'], kt['task'], kt['appointment']))
  for f in s:
    scrub_folder(f, s.subtree, kt)


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
      kt = {'note': skt, 'task': skt, 'appointment': skt} 
      for f in r.folders():
        scrub_folder(f, s.subtree, kt)
      scrub_folder(r, s.subtree, kt)


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
  if opts.user:
    try:
      s = ks.get_user(opts.user[0]).store
    except:
      err('Fatal: Failed to open store for user: ' + opts.user[0])
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
