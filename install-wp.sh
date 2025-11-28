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
STORAGE_DIR="storage/wordpress"

# Check if WordPress was downloaded via Composer
if [ ! -d "$WP_DIR" ]; then
    echo "Error: WordPress not found in $WP_DIR"
    echo "Please run 'composer install' first to download WordPress"
    exit 1
fi

echo ""
echo "Step 1: Creating required directories..."

# Create storage directory for SQLite database
mkdir -p "$STORAGE_DIR"
chmod 755 "$STORAGE_DIR"
echo "  - Created $STORAGE_DIR"

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
    echo "  - Deployed wp-config.php"
else
    echo "  - Warning: Custom wp-config.php not found, creating default..."
    cat > "$WP_DIR/wp-config.php" << 'WPCONFIG'
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
WPCONFIG
    echo "  - Created default wp-config.php"
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
echo "Step 7: Verifying SQLite database integration..."

# Check if SQLite plugin is available (from Composer)
if [ -d "$WP_DIR/wp-content/plugins/sqlite-database-integration" ]; then
    # Copy db.php to wp-content if it exists
    if [ -f "$WP_DIR/wp-content/plugins/sqlite-database-integration/db.copy" ]; then
        cp "$WP_DIR/wp-content/plugins/sqlite-database-integration/db.copy" "$WP_DIR/wp-content/db.php"
        echo "  - SQLite db.php installed"
    fi
fi

echo ""
echo "========================================"
echo "WordPress Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Start the development server: php -S 0.0.0.0:5000 server.php"
echo "2. Access WordPress admin: http://localhost:5000/wordpress/wp-admin/"
echo "3. Complete WordPress installation wizard"
echo "4. Activate plugins in WordPress admin"
echo ""
echo "WordPress location: $WP_DIR"
echo "Database location: $STORAGE_DIR/.ht.sqlite"
echo ""
