#!/usr/bin/env bash
# Re-encrypt plain-text values in transactions.notes that were inserted before
# the `notes => encrypted` cast was added.
#
# Usage:
#   scripts/reencrypt-transaction-notes.sh            # dump backup + dry-run + prompt + apply
#   scripts/reencrypt-transaction-notes.sh --yes      # skip prompt
#   scripts/reencrypt-transaction-notes.sh --dry-run  # report only, no write
#
# Requires: php, mysqldump, .env populated with DB_* and APP_KEY.

set -euo pipefail

API_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$API_DIR"

AUTO_YES=0
DRY_ONLY=0
for arg in "$@"; do
    case "$arg" in
        --yes|-y) AUTO_YES=1 ;;
        --dry-run) DRY_ONLY=1 ;;
        *) echo "Unknown argument: $arg" >&2; exit 64 ;;
    esac
done

if [[ ! -f .env ]]; then
    echo "ERROR: .env not found in $API_DIR" >&2
    exit 1
fi

# shellcheck disable=SC1091
set -a
source <(grep -E '^(DB_CONNECTION|DB_HOST|DB_PORT|DB_DATABASE|DB_USERNAME|DB_PASSWORD)=' .env | sed 's/\r$//')
set +a

: "${DB_DATABASE:?DB_DATABASE not set in .env}"
: "${DB_USERNAME:?DB_USERNAME not set in .env}"

# 1) Backup
if [[ "$DRY_ONLY" -eq 0 ]]; then
    BACKUP_DIR="storage/backups"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/transactions-notes-$(date +%Y%m%d-%H%M%S).sql"
    echo "==> Backing up transactions table to $BACKUP_FILE"
    MYSQL_PWD="${DB_PASSWORD:-}" mysqldump \
        --host="${DB_HOST:-127.0.0.1}" \
        --port="${DB_PORT:-3306}" \
        --user="$DB_USERNAME" \
        --single-transaction \
        --no-tablespaces \
        "$DB_DATABASE" transactions > "$BACKUP_FILE"
    echo "    backup size: $(wc -c < "$BACKUP_FILE") bytes"
fi

# 2) Dry-run
echo "==> Dry-run report"
php artisan transactions:reencrypt-notes --dry-run

if [[ "$DRY_ONLY" -eq 1 ]]; then
    echo "==> --dry-run set; exiting without writing."
    exit 0
fi

# 3) Confirm
if [[ "$AUTO_YES" -ne 1 ]]; then
    read -r -p "Proceed and re-encrypt the rows shown above? [y/N] " reply
    case "$reply" in
        y|Y|yes|YES) ;;
        *) echo "Aborted."; exit 0 ;;
    esac
fi

# 4) Apply
echo "==> Encrypting plain-text notes"
php artisan transactions:reencrypt-notes

echo "==> Done."
