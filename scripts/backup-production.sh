#!/usr/bin/env bash
set -Eeuo pipefail

umask 077
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-15}"

if [[ -z "${SOURCE_DATABASE_URL:-}" ]]; then
  echo "SOURCE_DATABASE_URL is required." >&2
  exit 2
fi

if [[ -z "${AGE_RECIPIENT:-}" ]]; then
  echo "AGE_RECIPIENT is required. Store only the public recipient in CI." >&2
  exit 2
fi

if ! command -v age >/dev/null 2>&1; then
  echo "age is required." >&2
  exit 2
fi

output_dir="${BACKUP_OUTPUT_DIR:-backups}"
mkdir -p "$output_dir"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_name="summer-os-${timestamp}.dump.age"
output_path="${output_dir%/}/${backup_name}"
temporary_dir="$(mktemp -d)"
dump_path="${temporary_dir}/summer-os.dump"
encrypted_temporary_path="${temporary_dir}/${backup_name}"

cleanup() {
  rm -f -- "$dump_path" "$encrypted_temporary_path"
  rmdir -- "$temporary_dir" 2>/dev/null || true
  unset SOURCE_DATABASE_URL
}
trap cleanup EXIT INT TERM

if [[ -n "${PG_DUMP_IMAGE:-}" ]]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required when PG_DUMP_IMAGE is set." >&2
    exit 2
  fi

  docker run --rm --network host \
    -e SOURCE_DATABASE_URL \
    -e PGCONNECT_TIMEOUT \
    -v "${temporary_dir}:/backup" \
    "$PG_DUMP_IMAGE" \
    sh -eu -c 'pg_dump --dbname="$SOURCE_DATABASE_URL" --no-password --format=custom --compress=9 --no-owner --no-privileges --file=/backup/summer-os.dump'

  docker run --rm \
    -v "${temporary_dir}:/backup:ro" \
    "$PG_DUMP_IMAGE" \
    pg_restore --list /backup/summer-os.dump >/dev/null
elif command -v pg_dump >/dev/null 2>&1 && command -v pg_restore >/dev/null 2>&1; then
  PGDATABASE="$SOURCE_DATABASE_URL" pg_dump \
    --no-password \
    --format=custom \
    --compress=9 \
    --no-owner \
    --no-privileges \
    --file="$dump_path"
  pg_restore --list "$dump_path" >/dev/null
else
  echo "Install pg_dump/pg_restore or set PG_DUMP_IMAGE to a trusted PostgreSQL image." >&2
  exit 2
fi

if [[ ! -s "$dump_path" ]]; then
  echo "pg_dump produced an empty archive." >&2
  exit 1
fi

age --encrypt \
  --recipient "$AGE_RECIPIENT" \
  --output "$encrypted_temporary_path" \
  "$dump_path"

if [[ ! -s "$encrypted_temporary_path" ]]; then
  echo "Encryption produced an empty artifact." >&2
  exit 1
fi

if [[ -e "$output_path" ]]; then
  echo "Refusing to overwrite an existing backup: $output_path" >&2
  exit 1
fi

mv -- "$encrypted_temporary_path" "$output_path"

if command -v sha256sum >/dev/null 2>&1; then
  encrypted_sha256="$(sha256sum "$output_path" | awk '{print $1}')"
else
  encrypted_sha256="not-calculated"
fi

echo "Encrypted backup created: $output_path"
echo "Encrypted SHA-256: $encrypted_sha256"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "backup_name=$backup_name"
    echo "backup_path=$output_path"
    echo "encrypted_sha256=$encrypted_sha256"
  } >>"$GITHUB_OUTPUT"
fi
