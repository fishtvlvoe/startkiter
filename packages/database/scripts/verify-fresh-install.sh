#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL 未設定" >&2
  exit 1
fi

TEMP_DB="startkiter_fresh_verify_$(date +%s)"
ADMIN_URL="$DATABASE_URL"

PROTO_AND_HOST="${DATABASE_URL%/*}"
TEMP_URL="$PROTO_AND_HOST/$TEMP_DB"

cleanup() {
  psql "$ADMIN_URL" -c "DROP DATABASE IF EXISTS \"$TEMP_DB\" WITH (FORCE);" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "建立臨時資料庫 $TEMP_DB..."
psql "$ADMIN_URL" -c "CREATE DATABASE \"$TEMP_DB\";" >/dev/null

echo "執行全部遷移..."
DATABASE_URL="$TEMP_URL" pnpm exec prisma migrate deploy

echo "檢查 course_welcome_email 欄位..."
HAS_CONTENT_JSON=$(psql "$TEMP_URL" -t -A -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'course_welcome_email' AND column_name = 'content_json';")
HAS_CONTENT_JSON_CAMEL=$(psql "$TEMP_URL" -t -A -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'course_welcome_email' AND column_name = 'contentJson';")

if [ "$HAS_CONTENT_JSON" != "0" ]; then
  echo "驗證失敗：course_welcome_email 仍存在 content_json 欄位" >&2
  exit 1
fi

if [ "$HAS_CONTENT_JSON_CAMEL" != "1" ]; then
  echo "驗證失敗：course_welcome_email 缺少 contentJson 欄位" >&2
  exit 1
fi

echo "fresh install OK"
