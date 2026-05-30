#!/usr/bin/env bash
set -euo pipefail

if [[ $# -eq 0 ]]; then
    echo "Usage: scripts/php.sh <php-args...>" >&2
    exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
wrapper_path="$repo_root/scripts/php.sh"

php_args=()

if [[ "${PHP_SHOW_DEPRECATIONS:-0}" != "1" ]]; then
    php_args+=("-d" "error_reporting=8191")
fi

php_bin=""
preferred_php_bins=()

if [[ -n "${PHP_BIN:-}" ]]; then
    preferred_php_bins+=("$PHP_BIN")
else
    if command -v brew >/dev/null 2>&1; then
        brew_php82_prefix="$(brew --prefix php@8.2 2>/dev/null || true)"
        if [[ -n "$brew_php82_prefix" ]]; then
            preferred_php_bins+=("$brew_php82_prefix/bin/php")
        fi
    fi

    preferred_php_bins+=(
        "/opt/homebrew/opt/php@8.2/bin/php"
        "/usr/local/opt/php@8.2/bin/php"
    )
fi

for candidate in "${preferred_php_bins[@]}"; do
    if [[ ! -x "$candidate" ]]; then
        continue
    fi

    candidate_version="$($candidate -r 'echo PHP_MAJOR_VERSION, ".", PHP_MINOR_VERSION;' 2>/dev/null || true)"

    if [[ "$candidate_version" == "8.2" ]]; then
        php_bin="$candidate"
        break
    fi
done

if [[ -z "$php_bin" ]]; then
    echo "PHP 8.2 was not found. Install it with Homebrew (brew install php@8.2) and optionally link it with 'brew link php@8.2 --force --overwrite', or set PHP_BIN to a PHP 8.2 binary." >&2
    exit 1
fi

if [[ -x "$wrapper_path" ]]; then
    export PHP_BINARY="$wrapper_path"
else
    export PHP_BINARY="$php_bin"
fi

exec "$php_bin" "${php_args[@]}" "$@"