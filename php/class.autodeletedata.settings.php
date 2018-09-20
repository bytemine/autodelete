<?php

/**
 * PHP Class for handling database communication (settings)
 *
 * @class AutodeleteData
 * @author Daniel Rauer, bytemine GmbH
 * @copyright 2018 bytemine GmbH
 * @license http://www.gnu.org/licenses/ GNU Affero General Public License
 * @link https://www.bytemine.net/
 */
class AutodeleteData {

	/**
	 * Two-factor authentication activated
	 *
	 * @return boolean
	 */
	public static function isActivated() {
		return $GLOBALS["settings"]->get("zarafa/v1/plugins/autodelete/activate");
	}

	/**
	 * Activate or deactivate two-factor authentication
	 *
	 * @param boolean $activate activation true/false
	 */
	public static function setActivate($activate) {
		$GLOBALS["settings"]->set("zarafa/v1/plugins/autodelete/activate", $activate);
		$GLOBALS["settings"]->saveSettings();
	}

	/**
	 * Set period
	 *
	 * @param boolean $period
	 */
	public static function setPeriodEmail($period) {
		$GLOBALS["settings"]->set("zarafa/v1/plugins/autodelete/period_email", $period);
		$GLOBALS["settings"]->saveSettings();
	}

	/**
	 * Set period
	 *
	 * @param boolean $period
	 */
	public static function setPeriodTask($period) {
		$GLOBALS["settings"]->set("zarafa/v1/plugins/autodelete/period_task", $period);
		$GLOBALS["settings"]->saveSettings();
	}

	/**
	 * Set period
	 *
	 * @param boolean $period
	 */
	public static function setPeriodAppointment($period) {
		$GLOBALS["settings"]->set("zarafa/v1/plugins/autodelete/period_appointment", $period);
		$GLOBALS["settings"]->saveSettings();
	}

	/**
	 * Set purge_empty setting
	 *
	 * @param boolean $purge_empty
	 */
	public static function setPurgeEmpty($purge_empty) {
		$GLOBALS["settings"]->set("zarafa/v1/plugins/autodelete/purge_empty", $purge_empty);
		$GLOBALS["settings"]->saveSettings();
	}

}

?>
