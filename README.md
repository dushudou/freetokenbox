# 🎁 FreeTokenBox · 免费送 Token 合集

收集所有**免费赠送 AI Token / API 额度 / 算力 / 优惠券**的网站与活动。一站式发现免费资源，直达官网领取。

> 能免费解决的事情，绝不多花一个 Token！

## ✨ 功能

- **SEO 友好的前台**：首页列表、Token 详情页（JSON-LD 结构化数据 + 相关推荐）、分类页、标签页、站内搜索、面包屑导航、`sitemap.xml`、`robots.txt`、`RSS`，全部服务端渲染。
- **AI 友好接口**：`/llms.txt`、`/llms-full.txt`（LLM/AI 爬虫索引）、`/ai.json`（结构化 JSON 数据导出），方便 AI 引擎收录。
- **后台录入**：`/admin` 密码登录后手动录入 / 编辑 / 删除 / 精选 / 导入种子数据。
- **开放 API**：`/api/tokens` 只读公开接口（支持分页 / 分类 / 标签 / 搜索）+ 带鉴权的写接口（`X-API-Key` 或后台 Cookie）。
- **Agent 录入 Skill**：`skills/freetokenbox-submit/`，让 AI Agent 通过接口自动录入条目。
- **Google AdSense 预留**：配置 `ADSENSE_CLIENT_ID` / `ADSENSE_AD_UNITS` 后自动在页脚 / 列表 / 文章底部输出真实广告位；未配置时显示占位框，不加载任何外部脚本。

## 🧱 技术栈

| 组件 | 说明 |
|---|---|
| Cloudflare Workers | 服务端运行时（免费额度足够个人站） |
| Hono | 轻量 Web 框架，SSR 渲染 HTML + REST API |
| Cloudflare D1 | 基于 SQLite 的无服务器数据库 |
| Wrangler | 本地开发 / 迁移 / 部署 CLI |

## 📁 项目结构

```
freetokenbox/
├── src/
│   ├── index.js        # 路由与业务（页面 / API / 后台）
│   ├── db.js           # D1 数据访问层
│   ├── auth.js         # 密码登录 + HMAC 签名 Cookie
│   ├── content.js      # Markdown 渲染、slug、SEO 工具、种子数据
│   ├── templates.js    # HTML 模板（hono/html）
├── migrations/
│   └── 0001_init.sql   # D1 schema
├── scripts/
│   ├── test-local.js   # 内存 mock D1 回归测试（npm test）
│   └── seed.js         # 命令行导入种子（可选）
├── skills/
│   └── freetokenbox-submit/   # Agent 录入 Skill + add-token.sh
├── wrangler.toml
└── .dev.vars.example
```

## 🚀 快速开始

### 1. 本地开发

```bash
npm install
cp .dev.vars.example .dev.vars   # 填入 ADMIN_PASSWORD / SESSION_SECRET / API_KEYS
npx wrangler d1 migrations apply freetokenbox --local
npx wrangler dev --local --port 8790
```

访问 `http://localhost:8790`，后台 `http://localhost:8790/admin`（密码为 `.dev.vars` 的 `ADMIN_PASSWORD`）。

跑回归测试：

```bash
npm test   # 内存 mock D1，无需 Cloudflare
```

### 2. 部署到 Cloudflare

```bash
# (a) 登录（需要浏览器授权或 CLOUDFLARE_API_TOKEN）
npx wrangler login

# (b) 创建 D1 数据库，把返回的 database_id 填进 wrangler.toml
npx wrangler d1 create freetokenbox

# (c) 应用远程迁移
npx wrangler d1 migrations apply freetokenbox --remote

# (d) 设置生产密钥
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put API_KEYS
npx wrangler secret put SITE_URL        # 如 https://freetokenbox.<你的子域>.workers.dev

# (e) 部署
npm run deploy
```

部署完成后：
- 前台：`https://<你的子域>.workers.dev`
- 后台：`https://<你的子域>.workers.dev/admin`
- API：`https://<你的子域>.workers.dev/api/tokens`

### 3. 接入 Google AdSense

1. 在 [Google AdSense](https://adsense.google.com) 注册并通过审核。
2. 创建广告单元，拿到 `ca-pub-...`（client id）和各单元 `data-ad-slot`。
3. 配置环境变量并重新部署：

```bash
npx wrangler secret put ADSENSE_CLIENT_ID     # ca-pub-xxxxxxxx
npx wrangler secret put ADSENSE_AD_UNITS      # {"footer":"<slot>","home-top":"<slot>","article-bottom":"<slot>"}
npm run deploy
```

未配置时站点不会加载任何 AdSense 脚本，纯静态占位。

### 4. 关联 GitHub（可选）

```bash
gh repo create freetokenbox --public --source=. --push
```

## 🔌 API 文档

公开接口（无需鉴权）：

```
GET /api/tokens?status=published&category=free-api&tag=llm&q=搜索词&page=1&pageSize=50
GET /api/tokens/:slug
GET /api/stats
GET /ai.json            # 全量结构化 JSON（AI 友好）
GET /llms.txt           # LLM 索引（精简）
GET /llms-full.txt      # LLM 索引（完整正文）
```

写接口（需 `X-API-Key: <API_KEYS 中的某个 key>`）：

```
POST   /api/tokens               # 新增
PATCH  /api/tokens/:slug         # 更新（可部分字段）
DELETE /api/tokens/:slug         # 删除
```

字段说明与完整示例见 [`skills/freetokenbox-submit/SKILL.md`](skills/freetokenbox-submit/SKILL.md)。

命令行录入示例：

```bash
export API_KEY=sk-xxx API_BASE=https://<你的子域>.workers.dev
./skills/freetokenbox-submit/add-token.sh \
  --name "DeepSeek-V4-Flash API 限时免费开放" \
  --desc "调用积分消耗直接为 0" \
  --url "https://chat.b.ai/key" --provider DeepSeek --category free-api \
  --tags api,llm,deepseek --content-file docs/deepseek-free.md
```

## 🤖 让 Agent 帮你录入

将 `skills/freetokenbox-submit/` 目录提供给你的 AI Agent（或作为 Skill 加载）。Agent 会按 `SKILL.md` 里的工作流，把素材整理成规范 Markdown，通过 `POST /api/tokens` 录入，并回帖给出前台地址 `/token/<slug>`。

## ⚠️ 内容声明

站内条目来自公开渠道，仅供学习参考，请以官方页面为准。免费额度与活动规则可能随时变化，建议定期核对并更新 `expiry_date`。

## 📄 License

MIT
