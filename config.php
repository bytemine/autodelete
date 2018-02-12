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
 * Default period after which elements are deleted
 */
define('PLUGIN_AUTODELETE_DEFAULT_PERIOD', 30);

/**
 * Maximum period after which elements are deleted
 */
define('PLUGIN_AUTODELETE_MAX_PERIOD', 60);

?>
