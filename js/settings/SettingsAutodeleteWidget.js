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
		Ext.applyIf(a, {
			title: dgettext("plugin_autodelete", "Konfiguration zum automatischen Löschen"),
			layout: "form",
			items: [{
				xtype: "displayfield",
				hideLabel: true,
				value: dgettext("plugin_autodelete", "Maximaler Zeitraum: " + container.getSettingsModel().get("zarafa/v1/plugins/autodelete/max_period") + " Tage") + "<br />" + "<br />" +
					     dgettext("plugin_autodelete", "Aktuell eingesteller Zeitraum: ") + "<span id=\"autodelete_period\">" + container.getSettingsModel().get("zarafa/v1/plugins/autodelete/period") + "</span>" + " Tage"
			}, {
				xtype: "button",
				text: dgettext("plugin_autodelete", "Einstellung ändern"),
				handler: this.openSetPeriodDialog,
				scope: this,
				width: 250
			}]
		});
		Zarafa.plugins.autodelete.settings.SettingsAutodeleteWidget.superclass.constructor.call(this, a)
	},
	openSetPeriodDialog: function(a) 
	{
		Zarafa.common.dialogs.MessageBox.prompt(dgettext("plugin_autodelete", "neuer Zeitraum"), dgettext("plugin_autodelete", "Bitte einen Zeitraum angeben"), this.setPeriod, this)
	},
	setPeriod: function(a, b) 
	{
		if (a === "ok") {
			container.getRequest().singleRequest("autodeletemodule", "setperiod", {period: b}, new Zarafa.plugins.autodelete.data.ResponseHandler({
                        	successCallback: this.openResponseDialog.createDelegate(this)
	                }))
		}	
	},
	openResponseDialog: function(a) 
	{
		if (a.isPeriodOK)
		{
      document.getElementById("autodelete_period").textContent = a.period;
      document.getElementById("autodelete_period").innerHTML = a.period;

			Zarafa.common.dialogs.MessageBox.show({
                                title: dgettext("plugin_autodelete", "Bestätigung"),
                                msg: dgettext("plugin_autodelete", "Der neue Zeitraum von " + a.period + " Tagen wurde gespeichert."),
                                icon: Zarafa.common.dialogs.MessageBox.INFO,
                                buttons: Zarafa.common.dialogs.MessageBox.OK,
                                scope: this,
				width: 350
      })
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
