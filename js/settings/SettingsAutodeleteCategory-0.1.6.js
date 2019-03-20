Ext.namespace("Zarafa.plugins.autodelete.settings");

/**
 * @class Zarafa.plugins.autodelete.settings.SettingsAutodeleteCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 *
 * @author Daniel Rauer, bytemine GmbH
 * @copyright 2018 bytemine GmbH
 * @license http://www.gnu.org/licenses/ GNU Affero General Public License
 * @link https://www.bytemine.net/
 *
 * Category view for two-factor authentication in settings
 */
Zarafa.plugins.autodelete.settings.SettingsAutodeleteCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	constructor: function(a) 
	{
  	a = a || {};
		Ext.applyIf(a, {
			title: dgettext("plugin_autodelete", "category_title"),
			categoryIndex: 1,
			iconCls: "icon_autodelete_category",
			items: [{
				xtype: "Zarafa.plugins.autodelete.settingsautodeletewidget"
			}, container.populateInsertionPoint("context.settings.category.autodelete", this)]
		});
		Zarafa.plugins.autodelete.settings.SettingsAutodeleteCategory.superclass.constructor.call(this, a)
	}
});

Ext.reg("Zarafa.plugins.autodelete.settingsautodeletecategory", Zarafa.plugins.autodelete.settings.SettingsAutodeleteCategory);
