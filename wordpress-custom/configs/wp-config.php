<?php
/**
 * WordPress Headless CMS Configuration
 * Configured for SQLite database and REST API
 */

define( 'DB_DIR', dirname(__DIR__, 2) . '/storage/wordpress/' );
define( 'DB_FILE', '.ht.sqlite' );

define( 'DB_NAME', 'wordpress' );
define( 'DB_USER', '' );
define( 'DB_PASSWORD', '' );
define( 'DB_HOST', '' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

define( 'AUTH_KEY',         'J7#x!8K@mN^pQ2rS5tU8wZ$aB4cE6fH9jL3mO5pR7sT9vX' );
define( 'SECURE_AUTH_KEY',  'aB4cE6fH9jL3mO5pR7sT9vXyZ$bC5dF7gI0kM2nQ4tV6' );
define( 'LOGGED_IN_KEY',    'cD5eG7hJ0lN2oQ4sU6wY9zA1bE3fI5kM7pR9tV1xZ3' );
define( 'NONCE_KEY',        'eF7gI9kL1nP3rT5vX7zA9cE1fH3jM5oQ7sU9wY1bD3' );
define( 'AUTH_SALT',        'gH9jL1mO3qS5uW7yA9cE1gI3kM5oQ7sU9wY1aD3fH5' );
define( 'SECURE_AUTH_SALT', 'iJ1lN3pR5tV7xZ9bD1fH3jL5nP7rT9vX1zA3cE5gI7' );
define( 'LOGGED_IN_SALT',   'kL3nP5rT7vX9zA1cE3gI5kM7oQ9sU1wY3aD5fH7jL9' );
define( 'NONCE_SALT',       'mN5pR7tV9xZ1bD3fH5jL7nP9rT1vX3zA5cE7gI9kM1' );

$table_prefix = 'wp_';

define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );

define( 'HEADLESS_MODE_CLIENT_URL', getenv('REPL_SLUG') ? 'https://' . getenv('REPL_SLUG') . '.' . getenv('REPL_OWNER') . '.repl.co' : 'http://localhost:5000' );

define( 'WP_HOME', HEADLESS_MODE_CLIENT_URL . '/wordpress' );
define( 'WP_SITEURL', HEADLESS_MODE_CLIENT_URL . '/wordpress' );

define( 'DISABLE_WP_CRON', true );

define( 'JWT_AUTH_SECRET_KEY', 'wp-headless-jwt-secret-key-2025-secure-token' );
define( 'JWT_AUTH_CORS_ENABLE', true );

define( 'ALLOW_UNFILTERED_UPLOADS', true );

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
