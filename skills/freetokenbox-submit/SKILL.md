---
name: freetokenbox-submit
description: 往 FreeTokenBox（免费送 Token 合集）站点录入/更新免费 Token 条目。当用户提供"免费送 token / 免费 API / 限时免费开放"等素材，要求录入到 freetokenbox 项目，或引用本项目 API 添加条目时使用。
---

# FreeTokenBox 条目录入 Skill

FreeTokenBox 是一个收集「免费送 Token 网站/免费 API 额度/免费算力活动」的站点。本 Skill 帮助 AI Agent 通过站点 API 把新条目录入后台数据库（D1）。

## 录入前须知

- 站点 API 地址：`https://<你的站点域名>`（线上示例域名以实际部署为准；本地开发为 `http://localhost:8787`）
- 写接口需要管理员鉴权：**X-API-Key**（来自环境变量 `API_KEYS`）或后台登录 Cookie。
- 每条记录就是一个「免费送 Token 的活动或平台」。
- **内容必须真实可核对**：优先使用用户提供的原文素材；补充内容不要编造不存在的额度/链接。

## 字段说明

| 字段 | 必填 | 说明 |
|---|---|---|
| `name` | ✅ | 条目名称，如「DeepSeek-V4-Flash API 限时免费开放」 |
| `description` | ✅ | 一句话简介（列表页展示，<120 字） |
| `content` | 建议 | 长文内容，支持 Markdown：`#`/`##` 标题、`-` 列表、`1.` 有序列表、`**加粗**`、`` `代码` ``、`[文字](url)` 链接、`>` 引用、空行分段 |
| `provider` | 建议 | 提供方/公司名，如 DeepSeek、OpenRouter |
| `url` | ✅ | 领取/官方地址（https://） |
| `category` | 建议 | `free-api`（免费 API）\| `free-plan`（免费套餐）\| `giveaways`（抽奖赠送）\| `coupons`（优惠券）\| `other` |
| `tags` | 建议 | 标签数组，如 `["api","llm","deepseek"]` |
| `expiry_date` | 可选 | 免费活动截止日期 `YYYY-MM-DD` |
| `status` | 可选 | `published`（默认）\| `draft` |
| `is_featured` | 可选 | 是否精选 `true/false` |
| `sort_weight` | 可选 | 排序权重，越大越靠前 |
| `slug` | 可选 | 留空自动从 name 生成 URL 安全 slug |

## 接口

### 1. 新增条目

```
POST /api/tokens
Content-Type: application/json
X-API-Key: <KEY>
```

请求体：

```json
{
  "name": "DeepSeek-V4-Flash API 限时免费开放",
  "description": "DeepSeek-V4-Flash 模型 API 限时免费开放，调用积分消耗直接为 0。",
  "content": "**DeepSeek-V4-Flash API 限时免费开放**，调用积分消耗直接为 0。\n\n1/ 首先在 [https://baiclaw.b.ai](https://baiclaw.b.ai) 下载 BaiClaw。\n\n2/ 到 [https://chat.b.ai/key](https://chat.b.ai/key) 获取 API 并配置。\n\n> 能免费解决的事情，绝不多花一个 Token！",
  "provider": "DeepSeek",
  "url": "https://chat.b.ai/key",
  "category": "free-api",
  "tags": ["api", "llm", "deepseek", "free-token"],
  "is_featured": true
}
```

成功：`201 {"ok":true,"item":{...}}`；未鉴权：`401`；缺 `name`：`400`。

### 2. 查询列表（公开，无需鉴权）

```
GET /api/tokens?status=published&tag=llm&category=free-api&page=1
```

### 3. 更新条目

```
PATCH /api/tokens/:slug
X-API-Key: <KEY>
```
请求体可只含要改的字段（如 `{"description":"新简介"}`）。

### 4. 删除条目

```
DELETE /api/tokens/:slug
X-API-Key: <KEY>
```

## 推荐工作流（Agent 录入）

1. 阅读用户提供的素材，提取：名称、简介、领取链接、提供方、关键步骤。
2. 把素材原文整理进 `content`（Markdown），步骤用有序列表，重点用 `**加粗**`，来源链接用 `[文字](url)`。
3. 选择 `category` 与 `tags`（建议 2-4 个，尽量用已有标签：api / llm / free-token / free-plan / giveaway / deepseek / gemini / aggregator ...）。
4. 调用 `POST /api/tokens` 提交（用本仓库提供的 `add-token.sh` 或直接 curl）。
5. 校验返回的 `item.slug`，并在回复中给出该条目的前台地址 `/token/<slug>`。
6. 若返回 `409/UNIQUE` 错误，说明同名条目已存在，改用 `PATCH` 更新或告知用户去后台处理。

## 命令行助手

仓库自带 `skills/freetokenbox-submit/add-token.sh` 脚本，用法：

```bash
API_KEY=<KEY> API_BASE=https://<站点域名> ./skills/freetokenbox-submit/add-token.sh \
  --name "xxx" --desc "一句话简介" --url "https://..." \
  --provider "平台名" --category free-api --tags api,llm \
  --content "长文 Markdown（可用 --content-file 指定文件）"
```

示例：

```bash
export API_KEY=sk-xxx API_BASE=https://freetokenbox.example.com
./skills/freetokenbox-submit/add-token.sh \
  --name "DeepSeek-V4-Flash API 限时免费开放" \
  --desc "调用积分消耗直接为 0" \
  --url "https://chat.b.ai/key" --provider DeepSeek --category free-api \
  --tags api,llm,deepseek --content-file docs/deepseek-free.md
```

## 注意事项

- 不要伪造链接或额度；无法核实的信息放进 `content` 里说明来源。
- 免费活动常有截止时间，尽量标注 `expiry_date`。
- 提交成功后在回复里贴出前台 URL，方便用户核对。
