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
						case "setperiodemail":
							$result = $this->setPeriodEmail($actionData);
							break;
					  case "setperiodtask":
							$result = $this->setPeriodTask($actionData);
							break;
						case "setperiodappointment":
							$result = $this->setPeriodAppointment($actionData);
							break;
					  case "setpurgeempty":
							$result = $this->setPurgeEmpty($actionData);
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

  private function is_allowed($period, $max_period) {
    if (strpos($period, '.') === false && is_numeric($period) && is_int(intval($period)) && intval($period) <= $max_period && intval($period) > 0) {
	    return true;
	  }
	  return false;
  }

  /**
   * Set email period
   *
   * @access private
   * @return boolean
   */
	private function setPeriodEmail($actionData) {
    $isPeriodOK = false;
		$period = $actionData['period'];
		if($this->is_allowed($period, PLUGIN_AUTODELETE_MAX_PERIOD_EMAIL)) {
		  AutodeleteData::setPeriodEmail($period);
		  $isPeriodOK = true;
		}

		$response['isPeriodOK'] = $isPeriodOK;
		$response['period'] = $period;
		$response['type'] = "email";
		$this->addActionData("setperiod", $response);
		$GLOBALS["bus"]->addData($this->getResponseData());
		return true;
	}

  /**
   * Set task period
   *
   * @access private
   * @return boolean
   */
	private function setPeriodTask($actionData) {
    $isPeriodOK = false;
		$period = $actionData['period'];
		if($this->is_allowed($period, PLUGIN_AUTODELETE_MAX_PERIOD_TASK)) {
		  AutodeleteData::setPeriodTask($period);
		  $isPeriodOK = true;
		}

		$response['isPeriodOK'] = $isPeriodOK;
		$response['period'] = $period;
		$response['type'] = "task";
		$this->addActionData("setperiod", $response);
		$GLOBALS["bus"]->addData($this->getResponseData());
		return true;
	}

  /**
   * Set appointment period
   *
   * @access private
   * @return boolean
   */
	private function setPeriodAppointment($actionData) {
    $isPeriodOK = false;
		$period = $actionData['period'];
		if($this->is_allowed($period, PLUGIN_AUTODELETE_MAX_PERIOD_APPOINTMENT)) {
		  AutodeleteData::setPeriodAppointment($period);
		  $isPeriodOK = true;
		}

		$response['isPeriodOK'] = $isPeriodOK;
		$response['period'] = $period;
		$response['type'] = "appointment";
		$this->addActionData("setperiod", $response);
		$GLOBALS["bus"]->addData($this->getResponseData());
		return true;
	}

  /**
   * Enable or disable the deletion of empty subfolders
   *
   * @access private
   * @return boolean
   */
	private function setPurgeEmpty($actionData) {
	  $purge_empty = true;
	  if ($actionData['purge_empty']=="false") {
	    $purge_empty = false;
	  }
	  AutodeleteData::setPurgeEmpty($purge_empty);

    $response = array();
		$response['purge_empty'] = $purge_empty;
		$response['isPeriodOK'] = true;
		$response['type'] = "purge_empty";
		$this->addActionData("setpurgeempty", $response);
		$GLOBALS["bus"]->addData($this->getResponseData());
		return true;
	}
}

?>
