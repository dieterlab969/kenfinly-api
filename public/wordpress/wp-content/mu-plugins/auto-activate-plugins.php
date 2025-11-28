<?php
/**
 * Plugin Name: Auto Activate Required Plugins
 * Description: Automatically activates required plugins for headless CMS
 */

add_action('plugins_loaded', function() {
    if (!function_exists('activate_plugin')) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }
    
    $required_plugins = array(
        'headless-cms-api/headless-cms-api.php',
        'jwt-authentication-for-wp-rest-api/jwt-auth.php'
    );
    
    foreach ($required_plugins as $plugin) {
        if (!is_plugin_active($plugin) && file_exists(WP_PLUGIN_DIR . '/' . $plugin)) {
            activate_plugin($plugin);
        }
    }
}, 0);

add_filter('rest_authentication_errors', function($result) {
    if (!empty($result)) {
        return $result;
    }
    return true;
});

add_action('send_headers', function() {
    if (!headers_sent()) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
    }
});
