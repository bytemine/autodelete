Ext.namespace("Zarafa.plugins.autodelete.data");
/**
 * @class Zarafa.plugins.autodelete.data.Configuration
 * @extends Object
 *
 * @author Daniel Rauer, bytemine GmbH
 * @copyright 2018 bytemine GmbH
 * @license http://www.gnu.org/licenses/ GNU Affero General Public License
 * @link https://www.bytemine.net/
 *
 * Manage the inital settings if settings is loading
 */
Zarafa.plugins.autodelete.data.Configuration = Ext.extend(Object, 
{
	activate: undefined,
	init: function() 
	{
		var a = new Zarafa.plugins.autodelete.data.ResponseHandler({
			successCallback: this.gotIsActivated.createDelegate(this)
		});
		container.getRequest().singleRequest("autodeletemodule", "isactivated", {}, a)
	},
	gotIsActivated: function(a) 
	{
		this.activate = a.isActivated
	},
	isActivated: function(a) 
	{
		return this.activate
	}
});
Zarafa.plugins.autodelete.data.Configuration = new Zarafa.plugins.autodelete.data.Configuration;
