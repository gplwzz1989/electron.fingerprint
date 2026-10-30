#!/usr/bin/env sh
set -eu
server_environment="${1:-prod}"
case "$server_environment" in dev|test|prod) ;; *) printf '%s\n' '请选择 dev、test 或 prod 环境。' >&2; exit 1 ;; esac
server_directory="$(CDPATH= cd -- "$(dirname -- "$0")/saas-server" && pwd)"
if [ ! -f "$server_directory/.env.$server_environment" ]; then
  printf '%s\n' "请先将 saas-server/.env.example 复制为 .env.$server_environment，并填写数据库与邮件配置。" >&2
  exit 1
fi
export SAAS_ENV="$server_environment"
cd "$server_directory"
exec node server/index.js
