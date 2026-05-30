#!/usr/bin/env bash
set -euo pipefail

if [[ $# -eq 0 ]]; then
    echo "Usage: scripts/composer.sh <composer-args...>" >&2
    exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
composer_bin="${COMPOSER_BIN:-}"

if [[ -z "$composer_bin" ]]; then
    if [[ -x /opt/homebrew/bin/composer ]]; then
        composer_bin="/opt/homebrew/bin/composer"
    elif command -v brew >/dev/null 2>&1; then
        brew_composer="$(brew --prefix composer 2>/dev/null)/bin/composer"
        if [[ -x "$brew_composer" ]]; then
            composer_bin="$brew_composer"
        fi
    fi
fi

if [[ -z "$composer_bin" ]]; then
    composer_bin="$(command -v composer || true)"
fi

if [[ -z "$composer_bin" ]]; then
    echo "Composer was not found in PATH. Install Composer or set COMPOSER_BIN." >&2
    exit 1
fi

exec bash "$repo_root/scripts/php.sh" "$composer_bin" "$@"