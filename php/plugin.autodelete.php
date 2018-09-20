<?php

require "class.autodeletedata.settings.php";

/**
 * PHP Class plugin Autodelete for two-factor authentication
 *
 * @class PluginAutodelete
 * @extends Plugin
 * @author Daniel Rauer, bytemine GmbH
 * @copyright 2018 bytemine GmbH
 * @license http://www.gnu.org/licenses/ GNU Affero General Public License
 * @link https://www.bytemine.net/
 */
class PluginAutodelete extends Plugin {

	/**
	 * Constructor
	 */
	function PluginAutodelete() {
	}

	/**
	 * Function initializes the Plugin and registers all hooks
	 */
	function init() {
		$this->registerHook('server.core.settings.init.before');
		$this->registerHook('server.index.load.main.before');
	}

	/**
	 * Function is executed when a hook is triggered by the PluginManager
	 *
	 * @param string $eventID the id of the triggered hook
	 * @param mixed $data object(s) related to the hook
	 */
	function execute($eventID, &$data) {
		switch($eventID) {
      case 'server.core.settings.init.before' :
			        $this->injectPluginSettings($data);
				break;

			case 'server.index.load.main.before' : // don't use the logon trigger because we need the settings

				try {
					if (PLUGIN_AUTODELETE_ACTIVATE)
						AutodeleteData::setActivate(true);
				
				} catch (Exception $e) {
					$mess = $e->getFile() . ":" . $e->getLine() . "<br />" . $e->getMessage();
					error_log("[autodelete]: " . $mess);
                                        die($mess);
				}
                }
	}

	/**
	 * Inject default plugin settings
	 *
	 * @param Array $data Reference to the data of the triggered hook
	 */
	function injectPluginSettings(&$data) {
		$data['settingsObj']->addSysAdminDefaults(Array(
			'zarafa' => Array(
				'v1' => Array(
					'plugins' => Array(
						'autodelete' => Array(
							'activate' => PLUGIN_AUTODELETE_ACTIVATE,
							'period_email' => PLUGIN_AUTODELETE_DEFAULT_PERIOD_EMAIL,
							'period_task' => PLUGIN_AUTODELETE_DEFAULT_PERIOD_TASK,
							'period_appointment' => PLUGIN_AUTODELETE_DEFAULT_PERIOD_APPOINTMENT,
							'max_period_email' => PLUGIN_AUTODELETE_MAX_PERIOD_EMAIL,
							'max_period_task' => PLUGIN_AUTODELETE_MAX_PERIOD_TASK,
							'max_period_appointment' => PLUGIN_AUTODELETE_MAX_PERIOD_APPOINTMENT,
							'purge_empty' => PLUGIN_AUTODELETE_PURGE_EMPTY
						)
					)
				)
			)
		));
	}
}
?>
