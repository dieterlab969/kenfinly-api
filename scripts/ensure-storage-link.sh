#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if [[ -L public/storage ]]; then
    exit 0
fi

if [[ -e public/storage ]]; then
    echo "public/storage exists but is not a symlink. Remove it manually before continuing." >&2
    exit 1
fi

bash "$repo_root/scripts/php.sh" artisan storage:link >/dev/null

if [[ ! -L public/storage ]]; then
    echo "Failed to create public/storage symlink." >&2
    exit 1
fi

echo "Created public/storage symlink."