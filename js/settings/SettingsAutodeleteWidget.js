Ext.namespace("Zarafa.plugins.autodelete.settings");

/**
 * @class Zarafa.plugins.autodelete.settings.SettingsAutodeleteWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 *
 * @author Daniel Rauer, bytemine GmbH
 * @copyright 2018 bytemine GmbH
 * @license http://www.gnu.org/licenses/ GNU Affero General Public License
 * @link https://www.bytemine.net/
 *
 * Widget view in settings for two-factor authentication
 */
Zarafa.plugins.autodelete.settings.SettingsAutodeleteWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {
	constructor: function(a) 
	{
		a = a || {};
		purge_empty = container.getSettingsModel().get("zarafa/v1/plugins/autodelete/purge_empty") === undefined ? true : container.getSettingsModel().get("zarafa/v1/plugins/autodelete/purge_empty");
		Ext.applyIf(a, {
			title: dgettext("plugin_autodelete", "Konfiguration zum automatischen Löschen"),
			layout: "form",
			items: [{
				xtype: "displayfield",
				  hideLabel: true,
				  value: "<h2>E-Mail:</h2></br>" +
				         dgettext("plugin_autodelete", "Maximaler Zeitraum: " + container.getSettingsModel().get("zarafa/v1/plugins/autodelete/max_period_email") + " Tage") + "<br />" +
					       dgettext("plugin_autodelete", "Aktuell eingestellter Zeitraum: ") + "<span id=\"autodelete_period_email\">" + container.getSettingsModel().get("zarafa/v1/plugins/autodelete/period_email") + "</span>" + " Tage"
			}, {
				xtype: "button",
				  text: dgettext("plugin_autodelete", "Ändern"),
				  handler: this.openSetPeriodEmailDialog,
				  scope: this,
				  width: 250
			}, {
			  xtype: "displayfield",
				  hideLabel: true,
				  value: "<br/><hr /><br/><h2>Leere Unterordner löschen:</h2></br>" +
				         '<input type="checkbox" id="purge_empty" checked="'+purge_empty+'"/>' + '<br />'
			}, {
				xtype: "button",
				  text: dgettext("plugin_autodelete", "Ändern"),
				  handler: this.setPurgeEmpty,
				  scope: this,
				  width: 250
			}, {
				xtype: "displayfield",
				  hideLabel: true,
				  value: "<br/><hr /><br/><h2>Aufgaben:</h2></br>" +
				         dgettext("plugin_autodelete", "Maximaler Zeitraum: " + container.getSettingsModel().get("zarafa/v1/plugins/autodelete/max_period_task") + " Tage") + "<br />" +
					       dgettext("plugin_autodelete", "Aktuell eingestellter Zeitraum: ") + "<span id=\"autodelete_period_task\">" + container.getSettingsModel().get("zarafa/v1/plugins/autodelete/period_task") + "</span>" + " Tage"
			}, {
				xtype: "button",
				  text: dgettext("plugin_autodelete", "Ändern"),
				  handler: this.openSetPeriodTaskDialog,
				  scope: this,
				  width: 250
  		}, {
				xtype: "displayfield",
				  hideLabel: true,
				  value: "<br/><hr /><br/><h2>Termine:</h2></br>" +
				         dgettext("plugin_autodelete", "Maximaler Zeitraum: " + container.getSettingsModel().get("zarafa/v1/plugins/autodelete/max_period_appointment") + " Tage") + "<br />" +
					       dgettext("plugin_autodelete", "Aktuell eingestellter Zeitraum: ") + "<span id=\"autodelete_period_appointment\">" + container.getSettingsModel().get("zarafa/v1/plugins/autodelete/period_appointment") + "</span>" + " Tage"
			}, {
				xtype: "button",
				  text: dgettext("plugin_autodelete", "Ändern"),
				  handler: this.openSetPeriodAppointmentDialog,
				  scope: this,
				  width: 250
			}]
		});
		Zarafa.plugins.autodelete.settings.SettingsAutodeleteWidget.superclass.constructor.call(this, a)
	},
	openSetPeriodEmailDialog: function(a)
	{
		Zarafa.common.dialogs.MessageBox.prompt(dgettext("plugin_autodelete", "neuen Zeitraum für E-Mails eingeben"), dgettext("plugin_autodelete", "Bitte einen Zeitraum in Tagen angeben"), this.setPeriodEmail, this)
	},
	setPeriodEmail: function(a, b)
	{
		if (a === "ok") {
			container.getRequest().singleRequest("autodeletemodule", "setperiodemail", {period: b}, new Zarafa.plugins.autodelete.data.ResponseHandler({
                        	successCallback: this.openResponseDialog.createDelegate(this)
	                }))
		}	
	},
	setPurgeEmpty: function(a)
	{
  	container.getRequest().singleRequest("autodeletemodule", "setpurgeempty", {purge_empty: Ext.get('purge_empty').dom.checked.toString()}, new Zarafa.plugins.autodelete.data.ResponseHandler({
                        	successCallback: this.openResponseDialog.createDelegate(this)
	                }))
	},
	openSetPeriodTaskDialog: function(a)
	{
		Zarafa.common.dialogs.MessageBox.prompt(dgettext("plugin_autodelete", "neuen Zeitraum für Aufgaben eingeben"), dgettext("plugin_autodelete", "Bitte einen Zeitraum angeben"), this.setPeriodTask, this)
	},
	setPeriodTask: function(a, b)
	{
		if (a === "ok") {
			container.getRequest().singleRequest("autodeletemodule", "setperiodtask", {period: b}, new Zarafa.plugins.autodelete.data.ResponseHandler({
                        	successCallback: this.openResponseDialog.createDelegate(this)
	                }))
		}	
	},
	openSetPeriodAppointmentDialog: function(a)
	{
		Zarafa.common.dialogs.MessageBox.prompt(dgettext("plugin_autodelete", "neuen Zeitraum für Termine eingeben"), dgettext("plugin_autodelete", "Bitte einen Zeitraum angeben"), this.setPeriodAppointment, this)
	},
	setPeriodAppointment: function(a, b)
	{
		if (a === "ok") {
			container.getRequest().singleRequest("autodeletemodule", "setperiodappointment", {period: b}, new Zarafa.plugins.autodelete.data.ResponseHandler({
                        	successCallback: this.openResponseDialog.createDelegate(this)
	                }))
		}	
	},
	openResponseDialog: function(a)
	{
		if (a.isPeriodOK)
		{
		  if (a.type && a.type == "email") {
		    f = document.getElementById("autodelete_period_email");
		    if (f) {
          f.textContent = a.period;
          f.innerHTML = a.period;
        }
      } else if (a.type && a.type == "task") {
        f = document.getElementById("autodelete_period_task");
		    if (f) {
          f.textContent = a.period;
          f.innerHTML = a.period;
        }
      } else if (a.type && a.type == "appointment") {
        f = document.getElementById("autodelete_period_appointment");
		    if (f) {
          f.textContent = a.period;
          f.innerHTML = a.period;
        }
      } else if (a.type && a.type == "purge_empty") {
        Ext.Msg.alert('Einstellung gespeichert', 'Die Einstellung wurde gespeichert.');
      }
		} else {
			Zarafa.common.dialogs.MessageBox.show({
				title: dgettext("plugin_autodelete", "Fehler"),
				msg: dgettext("plugin_autodelete", "Die Änderung konnte nicht gespeichert werden."),
				icon: Zarafa.common.dialogs.MessageBox.ERROR,
				buttons: Zarafa.common.dialogs.MessageBox.OK,
				scope: this,
				width: 350
			})
		}
	},
	activate: function() 
	{
		container.getRequest().singleRequest("autodeletemodule", "activate", {}, new Zarafa.plugins.autodelete.data.ResponseHandler({
			successCallback: this.setStatus.createDelegate(this)
		}))
	}
});
Ext.reg("Zarafa.plugins.autodelete.settingsautodeletewidget", Zarafa.plugins.autodelete.settings.SettingsAutodeleteWidget);
