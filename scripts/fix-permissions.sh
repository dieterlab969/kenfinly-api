#!/bin/bash
# Set up colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to display error messages
error() {
    echo -e "${RED}ERROR:${NC} $1"
    exit 1
}

# Function to display success messages
success() {
    echo -e "${GREEN}SUCCESS:${NC} $1"
}

# Function to display warning messages
warning() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

# Check if running as root or with sudo
check_privileges() {
    # Skip privilege check in Replit environment
    if [ -n "$REPL_ID" ] || [ -n "$REPLIT_ENVIRONMENT" ]; then
        return
    fi

    if [ "$(id -u)" -ne 0 ]; then
        warning "This script should ideally be run with sudo for proper permission setting."
        read -p "Continue anyway? (y/n): " answer
        if [ "$answer" != "y" ]; then
            echo "Aborting."
            exit 0
        fi
    fi
}

# Detect web server user if not provided
detect_webserver_user() {
   # In Replit, we typically run as the current user
   if [ -n "$REPLIT_USER" ]; then
       echo "$USER"
       return
   fi

   if [ -f "/etc/apache2/envvars" ]; then
       echo "www-data"
   elif [ -f "/etc/nginx/nginx.conf" ]; then
       echo "nginx"
   else
       # Try to detect from running processes
       user=$(ps aux | grep -E "apache|nginx|php-fpm" | grep -v "grep" | head -1 | awk '{print $1}')
       if [ -z "$user" ]; then
           echo "www-data" # Default fallback
       else
           echo "$user"
       fi
   fi
}

# Main function to fix permissions
fix_permissions() {
    local path=$1
    local user=$2
    local group=$3

    # Validate path
    if [ ! -d "$path" ]; then
        error "The specified path '$path' does not exist or is not a directory."
    fi

    # Fix storage directory if it exists
    if [ -d "$path/storage" ]; then
        echo "Setting permissions for $path/storage..."
        # Ownership might fail in Replit, so we continue
        chown -R "$user:$group" "$path/storage" 2>/dev/null || warning "Could not change ownership of $path/storage (expected in Replit)"
        find "$path/storage" -type d -exec chmod 775 {} \; || error "Failed to set directory permissions"
        find "$path/storage" -type f -exec chmod 664 {} \; || error "Failed to set file permissions"
    fi

    # Fix bootstrap/cache directory if it exists
    if [ -d "$path/bootstrap/cache" ]; then
        echo "Setting permissions for $path/bootstrap/cache..."
        chown -R "$user:$group" "$path/bootstrap/cache" 2>/dev/null || warning "Could not change ownership (expected in Replit)"
        find "$path/bootstrap/cache" -type d -exec chmod 775 {} \; || error "Failed to set directory permissions"
        find "$path/bootstrap/cache" -type f -exec chmod 664 {} \; || error "Failed to set file permissions"
    fi

    # Fix public directory if it exists
    if [ -d "$path/public" ]; then
        echo "Setting permissions for $path/public..."
        chown -R "$user:$group" "$path/public" 2>/dev/null || warning "Could not change ownership (expected in Replit)"
        find "$path/public" -type d -exec chmod 775 {} \; || error "Failed to set directory permissions"
        find "$path/public" -type f -exec chmod 664 {} \; || error "Failed to set file permissions"
    fi

    success "All permissions have been set successfully!"
}

# Main script execution
main() {
    # Parse arguments
    local path=${1:-$(pwd)}  # Default to current directory
    local user=${2:-$(detect_webserver_user)}
    local group=${3:-$user}  # Default group to same as user

    echo "=== Permission Fixing Tool ==="
    echo "Path: $path"
    echo "Web server user: $user"
    echo "Web server group: $group"
    echo "=========================="

    # Check privileges before proceeding
    check_privileges

    # Fix permissions
    fix_permissions "$path" "$user" "$group"
}

# Run the main function with all arguments passed to the script
main "$@"
