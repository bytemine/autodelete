<?php

/**
 * Configuration for autodelete plugin
 *
 * @author Daniel Rauer, bytemine GmbH
 * @copyright 2018 bytemine GmbH
 * @license http://www.gnu.org/licenses/ GNU Affero General Public License
 * @link https://www.bytemine.net/
 */

/**
 * Enable plugin when plugin is loading, the user can't disable the plugin.
 */
define('PLUGIN_AUTODELETE_ACTIVATE', true);

/**
 * Default period after which emails are deleted
 */
define('PLUGIN_AUTODELETE_DEFAULT_PERIOD_EMAIL', 30);

/**
 * Maximum period after which emails are deleted
 */
define('PLUGIN_AUTODELETE_MAX_PERIOD_EMAIL', 60);

/**
 * Default period after which tasks are deleted
 */
define('PLUGIN_AUTODELETE_DEFAULT_PERIOD_TASK', 30);

/**
 * Maximum period after which tasks are deleted
 */
define('PLUGIN_AUTODELETE_MAX_PERIOD_TASK', 60);

/**
 * Default period after which appointments are deleted
 */
define('PLUGIN_AUTODELETE_DEFAULT_PERIOD_APPOINTMENT', 30);

/**
 * Maximum period after which appointments are deleted
 */
define('PLUGIN_AUTODELETE_MAX_PERIOD_APPOINTMENT', 60);

?>
