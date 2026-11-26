# 🎁 FreeTokenBox · AI 免费额度核查目录与工程工具箱

在线访问：**[https://freetokenbox.com](https://freetokenbox.com)**（中文）· **[https://freetokenbox.com/en](https://freetokenbox.com/en)**（English）

FreeTokenBox 面向 AI 开发者与独立创作者，提供**经过官方来源核查的免费 AI API / 算力 / 多媒体额度目录**、**纯前端交互式工具**与**双语工程实践指南**。所有免费资源均标注核查日期、额度周期、绑卡要求与数据条款，拒绝过期货架与夸大宣传。

> 能免费解决的事情，绝不多花一个 Token！

## 🛠️ 核心交互工具（免登录 · 纯浏览器计算）

| 工具 | 中文入口 | English | 说明 |
|---|---|---|---|
| **AI Token & 免费额度估算器** | [`/calculator`](https://freetokenbox.com/calculator) | [`/en/calculator`](https://freetokenbox.com/en/calculator) | 内置多轮上下文膨胀公式与重试倍率，支持粘贴真实文本估算中英文 Token，测算免费层是否够用及付费月预算 |
| **本地离线免费 AI 模型选型器** | [`/local`](https://freetokenbox.com/local) | [`/en/local`](https://freetokenbox.com/en/local) | 按 8GB / 16GB / 24GB / 32–48GB / 64GB+ 内存或显存与用途（对话/编程/推理/识图）筛选 20 个主流开源权重，一键复制 `ollama run` 命令（同时提供 [`/local.json`](https://freetokenbox.com/local.json) 与 [`/local.md`](https://freetokenbox.com/local.md)） |
| **双语工程实践指南（10 篇）** | [`/guides`](https://freetokenbox.com/guides) | [`/en/guides`](https://freetokenbox.com/en/guides) | 涵盖 Token 计费数学、Ollama 本地部署、多平台 Fallback 路由、API Key 安全与防刷、Cursor/Cline/Roo Code 接入、零成本 RAG 栈与 429 排查 |

## ✨ 功能

- **核查驱动的资源目录**：首页精选 + 详情页（JSON-LD 结构化数据 + 官方来源与核查日期）+ 分类页 + 历史待复核归档（`/directory`），全部服务端渲染（SSR），中英双语。
- **实用工程工具与深度指南**：内置 `/calculator`、`/local` 与 10 篇原创双语技术指南，覆盖免费 API 选型、本地推理与防刷安全。
- **AI / GEO 友好接口**：`/llms.txt`、`/llms-full.txt`、`/ai.json`、`/local.json`、`/local.md`、`/tokens.md`、`sitemap.xml`、`robots.txt`、`rss.xml`。
- **后台录入**：`/admin` 密码登录后手动录入 / 编辑 / 删除 / 精选 / 导入种子数据。
- **开放 API**：`/api/tokens` 只读公开接口（支持分页 / 分类 / 标签 / 搜索）+ 带鉴权的写接口（`X-API-Key` 或后台 Cookie）。
- **Agent 录入 Skill**：`skills/freetokenbox-submit/`，让 AI Agent 通过接口自动录入条目。
- **Google AdSense**：发布商 `ca-pub-1530405841616000` 的脚本仅在合适的公开内容页加载；搜索、后台、错误页和未核查历史条目不加载广告。根目录提供 `ads.txt`。审核与 CMP 等账户配置需在 AdSense 后台核对。

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

站点在首页、已核查的资源详情、指南和本地模型选型页加载 AdSense 脚本，并在 `/ads.txt` 提供同一个发布商 ID。Token 计算器、搜索结果和普通列表分页不加载广告脚本。

在 [Google AdSense](https://adsense.google.com) 提交前，先核对线上首页、Sitemap、内容详情和工具能否打开。详情见 [Google 对网站内容和用户体验的说明](https://support.google.com/adsense/answer/7299563)。

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

## 2026-11-03 内容与 SEO 更新

- `content/reviews.json` 记录十条资源的中英文核查内容，`src/reviews.js` 为运行时内容与状态数据。修改时应同步两者，保留来源与真实核查日期。
- `src/guides.js` 包含三篇中英文指南；`src/editorial.js` 提供指南、关于、隐私、条款、核查原则和纠错页面。
- 首页推荐八条当前已核查资源；Hugging Face 和 GitHub Models 原 URL 保留规则更正，其他旧收录保留在 `/directory` 并标记待复核。
- 公开接口新增 `review`、`checked_at`、`official_source` 和 `content_notice`。不要把 pending 或 changed 当作有效免费活动；公开导出不包含草稿。
- `npm test` 验证鉴权、草稿隔离、SEO、指南与广告加载范围。`wrangler deploy --dry-run --keep-vars` 做发布检查；正常发布保留远程 secrets。
- `scripts/prepare-content-update.mjs` 从快照生成带更新时间条件的 D1 内容更新与对应回滚 SQL；不要无条件覆盖线上编辑。
- 研究依据和限制见 [官方资料核查记录](docs/content-research-2026-11-03.md)。本地代码尚未推送 GitHub。

### 多媒体资源维护（2026-11-03）

`content/media-*-resources.json` 保存图片、语音/音乐、视频、3D 和共享算力条目的中英文内容及核查元数据。新增字段 `access` 区分 `web` / `api` / `web-api`，`renewal` 区分每日、每月、一次性及限时活动。`web-api` 不表示两边钱包互通，正文需分别说明。已知截止日填写 `expiry_date`，到期后从当前资源列表移除。

修改资料后运行 `node scripts/build-reviewed-content.mjs`，生成 `src/reviews.js` 与 `src/media-resources.js`。原有文本/API 资料仍在 `content/reviews.json`。不要直接修改生成文件。

发布前获取完整公开记录快照并备份远程 D1，再运行：

```sh
node scripts/prepare-media-update.mjs snapshot.json update.sql
npm test
wrangler deploy --dry-run --keep-vars
```

SQL 仅更新对应条目，现有记录用 `updated_at` 防止覆盖并发修改；新记录通过 slug 防重复。脚本同时生成回滚 SQL 和用于本地预览的数据。核对后通过 D1 执行 SQL，再 `wrangler deploy --keep-vars`。发布后逐条核对数量、正文、分类、翻译与 sitemap。研究依据见 `docs/multimedia-*-research-2026-11-03.md`。所有“已核查”均指公开资料核查，不表示注册或生成实测。
