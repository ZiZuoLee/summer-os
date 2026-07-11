#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

archive_path="${1:-}"
if [[ -z "$archive_path" || ! -f "$archive_path" ]]; then
  echo "Usage: AGE_IDENTITY_FILE=/secure/key.agekey $0 <backup.dump.age>" >&2
  exit 2
fi

if [[ -z "${AGE_IDENTITY_FILE:-}" || ! -f "$AGE_IDENTITY_FILE" ]]; then
  echo "AGE_IDENTITY_FILE must point to the offline private identity." >&2
  exit 2
fi

if ! command -v age >/dev/null 2>&1; then
  echo "age is required." >&2
  exit 2
fi

temporary_dir="$(mktemp -d)"
dump_path="${temporary_dir}/summer-os.dump"
cleanup() {
  rm -f -- "$dump_path"
  rmdir -- "$temporary_dir" 2>/dev/null || true
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

if command -v pg_restore >/dev/null 2>&1; then
  entry_count="$(pg_restore --list "$dump_path" | wc -l | tr -d ' ')"
elif [[ -n "${PG_DUMP_IMAGE:-}" ]] && command -v docker >/dev/null 2>&1; then
  entry_count="$(docker run --rm -v "${temporary_dir}:/backup:ro" "$PG_DUMP_IMAGE" pg_restore --list /backup/summer-os.dump | wc -l | tr -d ' ')"
else
  echo "Install pg_restore or set PG_DUMP_IMAGE with Docker available." >&2
  exit 2
fi

if command -v sha256sum >/dev/null 2>&1; then
  encrypted_sha256="$(sha256sum "$archive_path" | awk '{print $1}')"
else
  encrypted_sha256="not-calculated"
fi

echo "Encrypted backup verified."
echo "Archive entries: $entry_count"
echo "Encrypted SHA-256: $encrypted_sha256"
