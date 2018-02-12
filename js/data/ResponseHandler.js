Ext.namespace("Zarafa.plugins.autodelete.data");

/**
 * @class Zarafa.plugins.autodelete.data.ResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 *
 * @author Daniel Rauer, bytemine GmbH
 * @copyright 2018 bytemine GmbH
 * @license http://www.gnu.org/licenses/ GNU Affero General Public License
 * @link https://www.bytemine.net/
 *
 * Response handler for communication with server
 */
Zarafa.plugins.autodelete.data.ResponseHandler = Ext.extend(Zarafa.core.data.AbstractResponseHandler, 
{
	successCallback: null,
	failureCallback: null,
	doActivate: function(a) 
	{
		this.successCallback(a)
	},
	doIsactivated: function(a) 
	{
		this.successCallback(a)
	},
	doSetperiod: function(a) 
	{
		this.successCallback(a)
	},
	doError: function(a) 
	{
		a.error ? Zarafa.common.dialogs.MessageBox.show(
		{
			title: "Error",
			msg: a.error.info.original_message,
			icon: Zarafa.common.dialogs.MessageBox.ERROR,
			buttons: Zarafa.common.dialogs.MessageBox.OK
		}) : Zarafa.common.dialogs.MessageBox.show({
			title: "Error",
			msg: a.info.original_message,
			icon: Zarafa.common.dialogs.MessageBox.ERROR,
			buttons: Zarafa.common.dialogs.MessageBox.OK
		})
	}
});
Ext.reg("zarafa.autodeleteresponsehandler", Zarafa.plugins.autodelete.data.ResponseHandler);
