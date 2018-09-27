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

		period_email = container.getSettingsModel().get("zarafa/v1/plugins/autodelete/period_email");
		period_task = container.getSettingsModel().get("zarafa/v1/plugins/autodelete/period_task");
		period_appointment = container.getSettingsModel().get("zarafa/v1/plugins/autodelete/period_appointment");
		Ext.applyIf(a, {
			title: dgettext("plugin_autodelete", "Konfiguration zum automatischen Löschen"),
			layout: "form",
			items: [{
				xtype: "displayfield",
				  hideLabel: true,
				  value: "<h2>E-Mail:</h2></br>" +
				         dgettext("plugin_autodelete", "Maximaler Zeitraum: " + container.getSettingsModel().get("zarafa/v1/plugins/autodelete/max_period_email") + " Tage") + "<br />" +
					       dgettext("plugin_autodelete", "Aktuell eingestellter Zeitraum: ") + "<input type=\"text\" id=\"period_email\" size=\"3\" value=\""+ period_email +"\"></input>" + " Tage"
			}, {
				xtype: "button",
				  text: dgettext("plugin_autodelete", "Ändern"),
				  handler: this.setPeriodEmail,
				  scope: this,
				  width: 250
			}, {
				xtype: "displayfield",
				  hideLabel: true,
				  value: "<br/><hr /><br/><h2>Aufgaben:</h2></br>" +
				         dgettext("plugin_autodelete", "Maximaler Zeitraum: " + container.getSettingsModel().get("zarafa/v1/plugins/autodelete/max_period_task") + " Tage") + "<br />" +
					       dgettext("plugin_autodelete", "Aktuell eingestellter Zeitraum: ") + "<input type=\"text\" id=\"period_task\" size=\"3\" value=\""+ period_task +"\"></input>" + " Tage"
			}, {
				xtype: "button",
				  text: dgettext("plugin_autodelete", "Ändern"),
				  handler: this.setPeriodTask,
				  scope: this,
				  width: 250
  		}, {
				xtype: "displayfield",
				  hideLabel: true,
				  value: "<br/><hr /><br/><h2>Termine:</h2></br>" +
				         dgettext("plugin_autodelete", "Maximaler Zeitraum: " + container.getSettingsModel().get("zarafa/v1/plugins/autodelete/max_period_appointment") + " Tage") + "<br />" +
					       dgettext("plugin_autodelete", "Aktuell eingestellter Zeitraum: ") + "<input type=\"text\" id=\"period_appointment\" size=\"3\" value=\""+ period_appointment +"\"></input>" + " Tage"
			}, {
				xtype: "button",
				  text: dgettext("plugin_autodelete", "Ändern"),
				  handler: this.setPeriodAppointment,
				  scope: this,
				  width: 250
			}, {
			  xtype: "displayfield",
				  hideLabel: true,
				  value: "<br/><hr /><br/><h2>Leere Unterordner löschen:</h2></br>" +
				         '<input type="checkbox" id="purge_empty" ' + (purge_empty==true ? 'checked' : '') + '/>' + '<br />'
			}, {
				xtype: "button",
				  text: dgettext("plugin_autodelete", "Ändern"),
				  handler: this.setPurgeEmpty,
				  scope: this,
				  width: 250
			}]
		});
		Zarafa.plugins.autodelete.settings.SettingsAutodeleteWidget.superclass.constructor.call(this, a)
	},
	setPeriodEmail: function(a)
	{
		container.getRequest().singleRequest("autodeletemodule", "setperiodemail", {period: Ext.get('period_email').dom.value}, new Zarafa.plugins.autodelete.data.ResponseHandler({
                      	successCallback: this.openResponseDialog.createDelegate(this)
                }))
	},
	setPurgeEmpty: function(a)
	{
  	container.getRequest().singleRequest("autodeletemodule", "setpurgeempty", {purge_empty: Ext.get('purge_empty').dom.checked.toString()}, new Zarafa.plugins.autodelete.data.ResponseHandler({
                        	successCallback: this.openResponseDialog.createDelegate(this)
	                }))
	},
	setPeriodTask: function(a)
	{
		container.getRequest().singleRequest("autodeletemodule", "setperiodtask", {period: Ext.get('period_task').dom.value}, new Zarafa.plugins.autodelete.data.ResponseHandler({
                      	successCallback: this.openResponseDialog.createDelegate(this)
                }))
	},
	setPeriodAppointment: function(a)
	{
		container.getRequest().singleRequest("autodeletemodule", "setperiodappointment", {period: Ext.get('period_appointment').dom.value}, new Zarafa.plugins.autodelete.data.ResponseHandler({
                      	successCallback: this.openResponseDialog.createDelegate(this)
                }))
	},
	openResponseDialog: function(a)
	{
		if (a.isPeriodOK) {
		  this.updateSettings(this.settingsModel);
		  Ext.Msg.alert('Einstellung gespeichert', 'Die Einstellung wurde gespeichert.');
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
	},

  /**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function(settingsModel)
	{
		this.updating = true;
		this.settingsModel = settingsModel;

		Ext.get('period_email').dom.value = settingsModel.get('zarafa/v1/plugins/autodelete/period_email');
		Ext.get('period_task').dom.value = settingsModel.get('zarafa/v1/plugins/autodelete/period_task');
		Ext.get('period_appointment').dom.value = settingsModel.get('zarafa/v1/plugins/autodelete/period_appointment');
		Ext.get('purge_empty').dom.checked = settingsModel.get('zarafa/v1/plugins/autodelete/purge_empty');

		this.updating = false;
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		settingsModel.set('zarafa/v1/plugins/autodelete/period_email', Ext.get('period_email').dom.value);
		settingsModel.set('zarafa/v1/plugins/autodelete/period_taks', Ext.get('period_task').dom.value);
		settingsModel.set('zarafa/v1/plugins/autodelete/period_appointment', Ext.get('period_appointment').dom.value);
		settingsModel.set('zarafa/v1/plugins/autodelete/purge_empty', Ext.get('purge_empty').dom.checked);
	}
});
Ext.reg("Zarafa.plugins.autodelete.settingsautodeletewidget", Zarafa.plugins.autodelete.settings.SettingsAutodeleteWidget);
