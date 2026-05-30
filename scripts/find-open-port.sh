#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
start_port="${1:-5000}"
host="${2:-0.0.0.0}"
max_attempts="${3:-50}"

for ((offset = 0; offset < max_attempts; offset++)); do
    port=$((start_port + offset))

    if bash "$repo_root/scripts/php.sh" -r '
        $host = $argv[1] ?? "127.0.0.1";
        $port = (int) ($argv[2] ?? 0);
        $server = @stream_socket_server("tcp://{$host}:{$port}", $errno, $errorMessage);

        if ($server === false) {
            exit(1);
        }

        fclose($server);
    ' "$host" "$port" >/dev/null 2>&1; then
        printf '%s\n' "$port"
        exit 0
    fi
done

echo "Unable to find an available TCP port after checking $max_attempts ports starting at $start_port." >&2
exit 1