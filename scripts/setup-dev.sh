#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

chmod +x scripts/*.sh start-dev.sh start-servers.sh install-wp.sh
bash ./scripts/ensure-storage-link.sh

echo "Development setup complete: script permissions are configured."
