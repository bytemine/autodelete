<?php
  global $max_period;
  $max_period = 60;
  $allowed_input = array("60", "1", "0000000000000000000000000000000005");
  $not_allowed_input = array("0", "34.3", "6,3", "44444444444444444444444444444444", "0xf4c3b00c", "61");

  function is_allowed($period) {
    if (strpos($period, '.') === false && is_numeric($period) && is_int(intval($period)) && intval($period) <= $GLOBALS["max_period"] && intval($period) > 0) {
	    return true;
	  }
	  return false;
  }

  echo "should all be true:\n";
  for ($i = 0; $i < count($allowed_input); $i++) {
    var_dump(is_allowed($allowed_input[$i]));
  }

  echo "should all be false:\n";
  for ($i = 0; $i < count($not_allowed_input); $i++) {
    var_dump(is_allowed($not_allowed_input[$i]));
  }
?>
