#!/usr/bin/env bash
set -Eeuo pipefail

umask 077
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-15}"

archive_path="${1:-}"
if [[ -z "$archive_path" || ! -f "$archive_path" ]]; then
  echo "Usage: AGE_IDENTITY_FILE=... TARGET_DATABASE_URL=... RESTORE_CONFIRMATION='RESTORE SUMMER_OS' $0 <backup.dump.age>" >&2
  exit 2
fi

if [[ -z "${AGE_IDENTITY_FILE:-}" || ! -f "$AGE_IDENTITY_FILE" ]]; then
  echo "AGE_IDENTITY_FILE must point to the offline private identity." >&2
  exit 2
fi

if [[ -z "${TARGET_DATABASE_URL:-}" ]]; then
  echo "TARGET_DATABASE_URL is required." >&2
  exit 2
fi

if [[ "${RESTORE_CONFIRMATION:-}" != "RESTORE SUMMER_OS" ]]; then
  echo "Set RESTORE_CONFIRMATION exactly to 'RESTORE SUMMER_OS'." >&2
  exit 2
fi

if ! command -v age >/dev/null 2>&1; then
  echo "age is required." >&2
  exit 2
fi

url_without_scheme="${TARGET_DATABASE_URL#*://}"
authority="${url_without_scheme%%/*}"
host_port="${authority##*@}"
host_port="${host_port%%\?*}"

case "$host_port" in
  localhost | localhost:* | 127.0.0.1 | 127.0.0.1:* | \[::1\] | \[::1\]:*)
    ;;
  *)
    if [[ "${ALLOW_REMOTE_RESTORE:-}" != "I_UNDERSTAND_THIS_DESTROYS_DATA" ]]; then
      echo "Refusing a non-local restore. Review the target and set ALLOW_REMOTE_RESTORE only for an approved disaster recovery operation." >&2
      exit 2
    fi
    ;;
esac

temporary_dir="$(mktemp -d)"
dump_path="${temporary_dir}/summer-os.dump"
cleanup() {
  rm -f -- "$dump_path"
  rmdir -- "$temporary_dir" 2>/dev/null || true
  unset TARGET_DATABASE_URL
}
trap cleanup EXIT INT TERM

age --decrypt \
  --identity "$AGE_IDENTITY_FILE" \
  --output "$dump_path" \
  "$archive_path"

if [[ ! -s "$dump_path" ]]; then
  echo "Decryption produced an empty archive." >&2
  exit 1
fi

if [[ -n "${PG_DUMP_IMAGE:-}" ]]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required when PG_DUMP_IMAGE is set." >&2
    exit 2
  fi
  docker run --rm \
    -v "${temporary_dir}:/backup:ro" \
    "$PG_DUMP_IMAGE" \
    pg_restore --list /backup/summer-os.dump >/dev/null
elif command -v pg_restore >/dev/null 2>&1; then
  pg_restore --list "$dump_path" >/dev/null
else
  echo "Install pg_restore or set PG_DUMP_IMAGE to a trusted PostgreSQL image." >&2
  exit 2
fi

echo "Archive decrypted and validated. Beginning the explicitly confirmed destructive restore."

if [[ -n "${PG_DUMP_IMAGE:-}" ]]; then
  docker run --rm --network host \
    -e TARGET_DATABASE_URL \
    -e PGCONNECT_TIMEOUT \
    -v "${temporary_dir}:/backup:ro" \
    "$PG_DUMP_IMAGE" \
    sh -eu -c 'pg_restore --dbname="$TARGET_DATABASE_URL" --no-password --clean --if-exists --no-owner --no-privileges --exit-on-error --single-transaction /backup/summer-os.dump'
elif command -v pg_restore >/dev/null 2>&1; then
  pg_restore \
    --dbname="$TARGET_DATABASE_URL" \
    --no-password \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --exit-on-error \
    --single-transaction \
    "$dump_path"
fi

echo "Restore command completed. Run schema, RLS, row-count, and application smoke checks before treating this database as recovered."
