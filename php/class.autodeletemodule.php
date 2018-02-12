<?php

/**
 * WebApp plugin module for interaction with JS-GUI
 *
 * @class AutodeleteModule
 * @extends Module
 * @author Daniel Rauer, bytemine GmbH
 * @copyright 2018 bytemine GmbH
 * @license http://www.gnu.org/licenses/ GNU Affero General Public License
 * @link https://www.bytemine.net/
 */
class AutodeleteModule extends Module {

	/**
	 * @constructor
         * @access public
	 * @param int $id unique id of the class
	 * @param array $data list of all actions, which is received from the client
	 */
	public function __construct($id, $data) {
		# in Kopano WebApp the construct method is used explicitely
		if(is_callable('parent::__construct')) {
			parent::__construct($id, $data);
		} else {
			parent::Module($id, $data);	
		}
	}

	/**
	 * Executes all the actions in the $data variable.
	 *
         * @access public
	 * @return boolean true on success or false on failure.
	 */
	public function execute() {
		$result = false;
		foreach($this->data as $actionType => $actionData) {
			if(isset($actionType)) {
				try {
					switch($actionType) {
						case "activate":
							$result = $this->activate();
							break;
						case "isactivated":
							$result = $this->isActivated();
							break;
						case "setperiod":
							$result = $this->setPeriod($actionData);
							break;
						default:
							$this->handleUnknownActionType($actionType);
					}
				} catch (Exception $e) {
					$mess = $e->getFile() . ":" . $e->getLine() . "<br />" . $e->getMessage();
					error_log("[autodelete]: " . $mess);
					$this->sendFeedback(false, array(
						'type' => ERROR_GENERAL,
						'info' => array('original_message' => $mess, 'display_message' => $mess)
		              		));
				}
			}
		}
		return $result;
	}


  /**
   * Toggle activate/deactivate two-factor authentication
   *
   * @access private
   * @return boolean
   */
	private function activate() {
		$isActivated = AutodeleteData::isActivated();
		AutodeleteData::setActivate(!$isActivated);
		$response = array();
		$response['isActivated'] = !$isActivated;
		$this->addActionData("activate", $response);
    $GLOBALS["bus"]->addData($this->getResponseData());
		return true;
	}

        /**
         * Send if two-factor authentication is activated
         *
         * @access private
         * @return boolean
         */
	private function isActivated() {
		$isActivated = AutodeleteData::isActivated();
		$response = array();
		$response['isActivated'] = $isActivated;
		$this->addActionData("isactivated", $response);
		$GLOBALS["bus"]->addData($this->getResponseData());
		return true;
  }

  /**
   * Verify code
   *
   * @access private
   * @return boolean
   */
	private function setPeriod($actionData) {
		$period = $actionData['period'];
    $isPeriodOK = false;
		if (is_numeric($period) && intval($period) < PLUGIN_AUTODELETE_MAX_PERIOD && intval($period) > 0) {
		  AutodeleteData::setPeriod($period);
		  $isPeriodOK = true;
		}
		$response['isPeriodOK'] = $isPeriodOK;
		$response['period'] = $period;
		$this->addActionData("setperiod", $response);
		$GLOBALS["bus"]->addData($this->getResponseData());
		return true;
	}
}

?>
