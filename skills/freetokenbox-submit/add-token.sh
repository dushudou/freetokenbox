#!/usr/bin/env bash
# FreeTokenBox 条目录入脚本 —— 通过站点的 /api/tokens 接口提交/更新条目
#
# 用法:
#   API_KEY=<KEY> API_BASE=<站点地址> ./add-token.sh --name "..." --desc "..." --url "https://..." [--provider X] [--category free-api] [--tags a,b] [--content "markdown"] [--content-file ./file.md] [--featured] [--slug xxx] [--expiry 2025-12-31] [--update]
#
# 环境变量:
#   API_KEY   必填，写接口的 API Key（对应服务端 API_KEYS）
#   API_BASE  站点地址，默认 http://localhost:8787

set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8787}"
: "${API_KEY:?请设置 API_KEY 环境变量}"

# 本机地址直连（避免被全局代理劫持）；远程地址保持空数组
# 注意：空数组在 set -u 下展开需用 ${arr[@]+...} 惯用法
NOPROXY=()
case "$API_BASE" in
  *localhost*|*127.0.0.1*|*::1*) NOPROXY=(--noproxy '*') ;;
esac

NAME=""; DESC=""; URL=""; PROVIDER=""; CATEGORY="free-api"; TAGS=""; CONTENT=""; CONTENT_FILE=""
FEATURED="false"; SLUG=""; EXPIRY=""; UPDATE_MODE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name) NAME="$2"; shift 2 ;;
    --desc) DESC="$2"; shift 2 ;;
    --url) URL="$2"; shift 2 ;;
    --provider) PROVIDER="$2"; shift 2 ;;
    --category) CATEGORY="$2"; shift 2 ;;
    --tags) TAGS="$2"; shift 2 ;;
    --content) CONTENT="$2"; shift 2 ;;
    --content-file) CONTENT_FILE="$2"; shift 2 ;;
    --featured) FEATURED="true"; shift ;;
    --slug) SLUG="$2"; shift 2 ;;
    --expiry) EXPIRY="$2"; shift 2 ;;
    --update) UPDATE_MODE="true"; shift ;;
    *) echo "未知参数: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$NAME" || -z "$URL" ]]; then
  echo "错误: --name 和 --url 必填" >&2
  exit 1
fi

if [[ -n "$CONTENT_FILE" ]]; then
  CONTENT="$(cat "$CONTENT_FILE")"
fi

# 用 python3 构造 JSON，避免转义问题
PAYLOAD="$(python3 - "$NAME" "$DESC" "$CONTENT" "$PROVIDER" "$URL" "$CATEGORY" "$TAGS" "$FEATURED" "$SLUG" "$EXPIRY" <<'PYEOF'
import json, sys
name, desc, content, provider, url, category, tags, featured, slug, expiry = sys.argv[1:11]
tags = [t.strip() for t in tags.split(',') if t.strip()] if tags else []
body = {
  "name": name,
  "description": desc,
  "content": content,
  "provider": provider,
  "url": url,
  "category": category or "free-api",
  "tags": tags,
  "is_featured": featured == "true",
}
if slug: body["slug"] = slug
if expiry: body["expiry_date"] = expiry
print(json.dumps(body, ensure_ascii=False))
PYEOF
)"

if [[ "$UPDATE_MODE" == "true" ]]; then
  if [[ -z "$SLUG" ]]; then echo "错误: --update 模式需要 --slug" >&2; exit 1; fi
  echo ">>> PATCH /api/tokens/$SLUG"
  curl -sS ${NOPROXY[@]+"${NOPROXY[@]}"} -X PATCH "$API_BASE/api/tokens/$SLUG" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d "$PAYLOAD"
else
  echo ">>> POST /api/tokens"
  curl -sS ${NOPROXY[@]+"${NOPROXY[@]}"} -X POST "$API_BASE/api/tokens" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d "$PAYLOAD"
fi
echo
