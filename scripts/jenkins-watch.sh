#!/usr/bin/env bash
set -euo pipefail

JENKINS_URL="${JENKINS_URL:-https://build.getkenka.com}"
JENKINS_JOB="${JENKINS_JOB:-kenfinly-staging}"
TIMEOUT_SECONDS="${JENKINS_WATCH_TIMEOUT:-300}"
POLL_SECONDS="${JENKINS_WATCH_POLL_SECONDS:-3}"
SINCE_BUILD=""
PRINT_LAST_BUILD=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --since-build)
      SINCE_BUILD="${2:-}"
      shift 2
      ;;
    --print-last-build)
      PRINT_LAST_BUILD=1
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
  esac
done

AUTH_ARGS=()
if [[ -n "${JENKINS_USER:-}" && -n "${JENKINS_API_TOKEN:-}" ]]; then
  AUTH_ARGS=(-u "${JENKINS_USER}:${JENKINS_API_TOKEN}")
fi

api_get() {
  curl --fail --silent --show-error "${AUTH_ARGS[@]}" "$1"
}

json_field() {
  python3 -c 'import json,sys; data=json.load(sys.stdin); print(data'"$1"')'
}

job_url="${JENKINS_URL%/}/job/${JENKINS_JOB}/"

if [[ "$PRINT_LAST_BUILD" -eq 1 ]]; then
  api_get "${job_url}api/json?tree=lastBuild[number]" | json_field "['lastBuild']['number'] if data.get('lastBuild') else 0"
  exit 0
fi

if [[ -n "$SINCE_BUILD" ]]; then
  start_number="$SINCE_BUILD"
else
  start_number="$(api_get "${job_url}api/json?tree=lastBuild[number]" | json_field "['lastBuild']['number'] if data.get('lastBuild') else 0")"
fi

echo "Waiting for Jenkins job '${JENKINS_JOB}' to start after build #${start_number}..."

deadline=$((SECONDS + TIMEOUT_SECONDS))
build_number=""
build_url=""

while (( SECONDS < deadline )); do
  job_json="$(api_get "${job_url}api/json?tree=lastBuild[number,url,building,result]")"
  number="$(printf '%s' "$job_json" | json_field "['lastBuild']['number'] if data.get('lastBuild') else 0")"
  building="$(printf '%s' "$job_json" | json_field "['lastBuild']['building'] if data.get('lastBuild') else False")"
  url="$(printf '%s' "$job_json" | json_field "['lastBuild']['url'] if data.get('lastBuild') else ''")"

  if [[ "$number" -gt "$start_number" || "$building" == "True" ]]; then
    build_number="$number"
    build_url="$url"
    break
  fi

  sleep "$POLL_SECONDS"
done

if [[ -z "$build_number" ]]; then
  echo "Timed out waiting for Jenkins to start. Check the GitHub webhook delivery and Jenkins GitHub Hook Log."
  exit 1
fi

echo "Streaming Jenkins build #${build_number}: ${build_url}"

offset=0
while :; do
  headers="$(mktemp)"
  body="$(mktemp)"
  curl --fail --silent --show-error "${AUTH_ARGS[@]}" \
    -D "$headers" \
    -o "$body" \
    "${build_url}logText/progressiveText?start=${offset}"

  cat "$body"

  next_offset="$(awk 'tolower($1) == "x-text-size:" { gsub("\r", "", $2); print $2 }' "$headers")"
  more_data="$(awk 'tolower($1) == "x-more-data:" { gsub("\r", "", $2); print tolower($2) }' "$headers")"
  rm -f "$headers" "$body"

  [[ -n "$next_offset" ]] && offset="$next_offset"
  [[ "$more_data" == "true" ]] || break

  sleep "$POLL_SECONDS"
done

result="$(api_get "${build_url}api/json?tree=result" | json_field "['result']")"

if [[ "$result" == "SUCCESS" ]]; then
  echo "Jenkins build #${build_number} finished successfully."
  exit 0
fi

echo "Jenkins build #${build_number} finished with result: ${result}"
exit 1
