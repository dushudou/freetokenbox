-- 新增：100milionseek 免费 API（2026-11-17 核查）
-- 幂等：按 slug upsert，已存在时更新为最新核查内容
INSERT INTO tokens (name, slug, description, content, provider, url, category, tags, expiry_date, status, is_featured, sort_weight, created_at, updated_at)
VALUES ('100milionseek：邮箱领 API Key，每天 1 亿 Token', '100milionseek-free-api', '邮箱加人机验证即可领取 OpenAI 兼容 API Key，每账号每天 1 亿 Token（00:00 UTC 重置），里程碑活动期间最高 4 亿/天，无需绑卡。', '## 免费的是什么
100milionseek 是一个第三方推理中转服务：注册后拿到一个 `hms-` 前缀的 API Key，就能调用它部署的 `deepseek-v4.1-flash-free`，公开参数是 198K 上下文、64K 最大输出、5 并发，支持流式、工具调用和 JSON 模式。端点是 OpenAI 兼容的 `https://100milionseek.top/v1`，所以任何能填自定义 base URL 的客户端都能接。

## 额度怎么算
- 每账号每 UTC 日 100,000,000 tokens，prompt 和 completion 一起计入，按模型回报的用量计算。
- 每天 00:00 UTC 重置，即北京时间 08:00；不是按注册满 24 小时循环。
- 里程碑活动会临时抬高日额度：累计服务破 100B 时，每账号每天 4 亿 tokens，窗口到 2026-11-20 07:14 UTC（北京时间 11-20 15:14）；下一档 1T 对应 5 亿/天 × 7 天。窗口结束就回到 1 亿，当天已用掉的部分仍然计入。
- 打满会返回 HTTP 429 并给出重置时间；每个响应带 `x-quota-limit`、`x-quota-used`、`x-quota-remaining`、`x-quota-reset` 响应头，代码里可以直接读剩余额度。

## 领取步骤
1. 打开 [https://100milionseek.top/signup](https://100milionseek.top/signup)，用一个能收信的真实邮箱，一次性邮箱域名会被拒，一个邮箱只开一个账号。
2. 过 Cloudflare Turnstile 人机验证，通常不用点，浏览器自己通过。
3. 进后台复制 API Key（`hms-` 开头），页面会显示今天还剩多少额度。
> 2026-11-17 复查时，站方公告新注册暂停：一天内涌入 2 万+ 新用户，容量不足，只服务了一部分流量。等它恢复再注册，不要重复提交。

## 接到客户端
- **OpenAI SDK / Python / TypeScript / curl**：把 `base_url` 换成 `https://100milionseek.top/v1`，model 填 `deepseek-v4.1-flash-free`，其余不用改。
- **Cursor / Cline / Aider / Continue / OpenCode / Roo Code / LibreChat**：在模型设置里选 OpenAI Compatible，填上面的 base URL 和 key。
- **Claude Code**：它走 Anthropic Messages 格式，这个端点只讲 OpenAI chat completions，中间要挂 `claude-code-router` 之类的转换层（站方给的示例就是 `ccr code`）。
- 先把 key 放进环境变量，比如 `export HMS_API_KEY=hms-xxx`，别写进代码或截图。

## 有哪些限制
- 只有 `deepseek-v4.1-flash-free` 一个主模型，外加一个 JEV 概率接口，不是多模型聚合，别指望在上面切换 GPT / Claude。
- 第三方中转：prompt 和 response 都要经过它的服务器（站方声明不落盘、不出售，只留邮箱、key 哈希和每日计数器）。**别上传客户资料、身份证件、内部密钥或任何不能外发的内容。**
- 不是 DeepSeek 也不是 OpenAI 官方，页脚自己写着 "Not affiliated with DeepSeek or OpenAI"。账号、额度和服务连续性由这家第三方说了算，随时可能限流、暂停注册或直接停服。
- 免费额度不是 SLA：不要把它设成生产环境的唯一依赖，也不要把自动重试堆在 429 上。额度、模型名和活动窗口都以你的后台和官方页面为准。
- 这类站点生命周期通常很短，看到"每天 1 亿"就把长任务挂上去，容易在中途断掉。

## 核查依据
本站 2026-11-17 核对官方首页、`/docs`、`/status` 三个页面：每日 1 亿 tokens、400M 里程碑窗口、Turnstile 验证、一邮箱一账号、OpenAI 兼容端点与计费口径，均与页面描述一致。未注册账户、未发起真实调用；实际可用额度以你自己的后台为准。', '100milionseek', 'https://100milionseek.top', 'free-api', '["api", "llm", "free-token", "no-card", "openai-compatible", "deepseek"]', NULL, 'published', 1, 95, datetime('now'), datetime('now'))
ON CONFLICT(slug) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  content = excluded.content,
  provider = excluded.provider,
  url = excluded.url,
  category = excluded.category,
  tags = excluded.tags,
  status = excluded.status,
  is_featured = excluded.is_featured,
  sort_weight = excluded.sort_weight,
  updated_at = datetime('now');
