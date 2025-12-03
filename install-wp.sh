#!/bin/bash

# WordPress Installation Script for Kenfinly
# This script sets up WordPress after composer install downloads the source code
# Run this script from the project root directory

set -e

echo "========================================"
echo "WordPress Installation Script for Kenfinly"
echo "========================================"

# Define directories
WP_DIR="public/wordpress"
CUSTOM_DIR="wordpress-custom"

# Check if WordPress was downloaded via Composer
if [ ! -d "$WP_DIR" ]; then
    echo "Error: WordPress not found in $WP_DIR"
    echo "Please run 'composer install' first to download WordPress"
    exit 1
fi

echo ""
echo "Step 1: Creating required directories..."

# Create wp-content directories if they don't exist
mkdir -p "$WP_DIR/wp-content/mu-plugins"
mkdir -p "$WP_DIR/wp-content/plugins"
mkdir -p "$WP_DIR/wp-content/themes"
mkdir -p "$WP_DIR/wp-content/uploads"
echo "  - Created wp-content subdirectories"

echo ""
echo "Step 2: Deploying custom wp-config.php..."

# Deploy wp-config.php
if [ -f "$CUSTOM_DIR/configs/wp-config.php" ]; then
    cp "$CUSTOM_DIR/configs/wp-config.php" "$WP_DIR/wp-config.php"
    echo "  - Deployed wp-config.php (MySQL configuration)"
else
    echo "  - Warning: Custom wp-config.php not found, creating default..."
    cat > "$WP_DIR/wp-config.php" << 'WPCONFIG'
<?php
/**
 * WordPress Headless CMS Configuration
 * Configured for MySQL database and REST API
 */

define( 'DB_NAME', getenv('WP_DB_NAME') ?: 'wordpress' );
define( 'DB_USER', getenv('WP_DB_USER') ?: 'root' );
define( 'DB_PASSWORD', getenv('WP_DB_PASSWORD') ?: '' );
define( 'DB_HOST', getenv('WP_DB_HOST') ?: 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

define( 'AUTH_KEY',         getenv('WP_AUTH_KEY') ?: 'J7#x!8K@mN^pQ2rS5tU8wZ$aB4cE6fH9jL3mO5pR7sT9vX' );
define( 'SECURE_AUTH_KEY',  getenv('WP_SECURE_AUTH_KEY') ?: 'aB4cE6fH9jL3mO5pR7sT9vXyZ$bC5dF7gI0kM2nQ4tV6' );
define( 'LOGGED_IN_KEY',    getenv('WP_LOGGED_IN_KEY') ?: 'cD5eG7hJ0lN2oQ4sU6wY9zA1bE3fI5kM7pR9tV1xZ3' );
define( 'NONCE_KEY',        getenv('WP_NONCE_KEY') ?: 'eF7gI9kL1nP3rT5vX7zA9cE1fH3jM5oQ7sU9wY1bD3' );
define( 'AUTH_SALT',        getenv('WP_AUTH_SALT') ?: 'gH9jL1mO3qS5uW7yA9cE1gI3kM5oQ7sU9wY1aD3fH5' );
define( 'SECURE_AUTH_SALT', getenv('WP_SECURE_AUTH_SALT') ?: 'iJ1lN3pR5tV7xZ9bD1fH3jL5nP7rT9vX1zA3cE5gI7' );
define( 'LOGGED_IN_SALT',   getenv('WP_LOGGED_IN_SALT') ?: 'kL3nP5rT7vX9zA1cE3gI5kM7oQ9sU1wY3aD5fH7jL9' );
define( 'NONCE_SALT',       getenv('WP_NONCE_SALT') ?: 'mN5pR7tV9xZ1bD3fH5jL7nP9rT1vX3zA5cE7gI9kM1' );

$table_prefix = getenv('WP_TABLE_PREFIX') ?: 'wp_';

define( 'WP_DEBUG', getenv('WP_DEBUG') === 'true' || getenv('APP_DEBUG') === 'true' );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );

$client_url = getenv('APP_URL') ?: (getenv('REPL_SLUG') ? 'https://' . getenv('REPL_SLUG') . '.' . getenv('REPL_OWNER') . '.repl.co' : 'http://localhost:5000');
define( 'HEADLESS_MODE_CLIENT_URL', $client_url );

define( 'WP_HOME', HEADLESS_MODE_CLIENT_URL . '/wordpress' );
define( 'WP_SITEURL', HEADLESS_MODE_CLIENT_URL . '/wordpress' );

define( 'DISABLE_WP_CRON', true );

define( 'JWT_AUTH_SECRET_KEY', getenv('WP_JWT_SECRET') ?: 'wp-headless-jwt-secret-key-2025-secure-token' );
define( 'JWT_AUTH_CORS_ENABLE', true );

define( 'ALLOW_UNFILTERED_UPLOADS', true );

define( 'FS_METHOD', 'direct' );

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
WPCONFIG
    echo "  - Created default wp-config.php (MySQL configuration)"
fi

echo ""
echo "Step 3: Deploying must-use plugins (mu-plugins)..."

# Deploy mu-plugins
if [ -d "$CUSTOM_DIR/mu-plugins" ]; then
    for file in "$CUSTOM_DIR/mu-plugins"/*.php; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            cp "$file" "$WP_DIR/wp-content/mu-plugins/$filename"
            echo "  - Deployed mu-plugin: $filename"
        fi
    done
else
    echo "  - No mu-plugins to deploy"
fi

echo ""
echo "Step 4: Deploying custom plugins..."

# Deploy custom plugins
if [ -d "$CUSTOM_DIR/plugins" ]; then
    for plugin_dir in "$CUSTOM_DIR/plugins"/*/; do
        if [ -d "$plugin_dir" ]; then
            plugin_name=$(basename "$plugin_dir")
            cp -r "$plugin_dir" "$WP_DIR/wp-content/plugins/$plugin_name"
            echo "  - Deployed plugin: $plugin_name"
        fi
    done
    
    # Also copy any single PHP files
    for file in "$CUSTOM_DIR/plugins"/*.php; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            cp "$file" "$WP_DIR/wp-content/plugins/$filename"
            echo "  - Deployed plugin file: $filename"
        fi
    done 2>/dev/null || true
else
    echo "  - No custom plugins to deploy"
fi

echo ""
echo "Step 5: Deploying custom themes..."

# Deploy custom themes
if [ -d "$CUSTOM_DIR/themes" ] && [ "$(ls -A "$CUSTOM_DIR/themes" 2>/dev/null)" ]; then
    for theme_dir in "$CUSTOM_DIR/themes"/*/; do
        if [ -d "$theme_dir" ]; then
            theme_name=$(basename "$theme_dir")
            cp -r "$theme_dir" "$WP_DIR/wp-content/themes/$theme_name"
            echo "  - Deployed theme: $theme_name"
        fi
    done
else
    echo "  - No custom themes to deploy (using default themes)"
fi

echo ""
echo "Step 6: Setting permissions..."

# Set proper permissions
chmod -R 755 "$WP_DIR/wp-content"
chmod 644 "$WP_DIR/wp-config.php"
echo "  - Permissions set for wp-content and wp-config.php"

echo ""
echo "========================================"
echo "WordPress Installation Complete!"
echo "========================================"
echo ""
echo "IMPORTANT: WordPress requires MySQL database configuration!"
echo ""
echo "Required environment variables:"
echo "  WP_DB_HOST     - MySQL server hostname"
echo "  WP_DB_NAME     - WordPress database name"
echo "  WP_DB_USER     - MySQL username"
echo "  WP_DB_PASSWORD - MySQL password"
echo ""
echo "Optional environment variables:"
echo "  WP_TABLE_PREFIX - Table prefix (default: wp_)"
echo "  WP_JWT_SECRET   - JWT authentication secret"
echo ""
echo "Next steps:"
echo "1. Set the required environment variables in your .env file"
echo "2. Create the WordPress database in MySQL"
echo "3. Start the development server: php -S 0.0.0.0:5000 server.php"
echo "4. Access WordPress admin: http://localhost:5000/wordpress/wp-admin/"
echo "5. Complete WordPress installation wizard"
echo "6. Activate plugins in WordPress admin"
echo ""
echo "WordPress location: $WP_DIR"
echo ""
