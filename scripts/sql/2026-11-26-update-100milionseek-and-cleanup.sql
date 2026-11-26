-- 2026-11-26 D1 清理与更新：
-- 1) 更新 100milionseek-free-api 为 2026-11-26 实时核查内容，取消首页精选并下沉权重（95 -> 68），让官方稳定服务排在前面
-- 2) 将已过期的限时活动（expiry_date < '2026-11-26'，如 gmicloud-minimax-free-14days 2026-09-06）转为 draft 下线

UPDATE tokens
SET
  name = '100milionseek：邮箱领 API Key，每天 1 亿 Token（分时段放号）',
  description = '第三方推理中转，邮箱加人机验证领取 OpenAI 兼容 Key，基础每账号每天 1 亿 Token（00:00 UTC 重置）；1T 里程碑活动至 2026-12-03 提升至 5 亿/天，当前每小时限 200 个免费注册名额。',
  content = '## 免费的是什么
100milionseek 是一个第三方推理中转服务：注册后拿到一个 `hms-` 前缀的 API Key，就能调用它部署的 `deepseek-v4.1-flash-free`，公开参数是 198K 上下文、64K 最大输出、5 并发，支持流式与工具调用。端点是 OpenAI 兼容的 `https://100milionseek.top/v1`，任何支持自定义 base URL 的客户端都可接入。

## 额度怎么算
- 基础额度为每账号每 UTC 日 100,000,000 tokens，prompt 和 completion 合并计入，按模型回报的用量计算。
- 每天 00:00 UTC 重置（北京时间 08:00），不是按注册满 24 小时循环。
- **里程碑加码（2026-11-26 核查）**：此前的 100B 档（4 亿/天）已于 2026-11-20 结束；站方已于 2026-11-26 02:14 UTC 达成 1T 累计用量，开启 **5 亿 tokens/天 × 7 天** 窗口，至 **2026-12-03 02:14 UTC（北京时间 12-03 10:14）** 结束，届时自动回落至基础 1 亿/天，当天已用部分仍计入。
- 打满会返回 HTTP 429 并给出重置时间；响应头提供 `x-quota-limit`、`x-quota-used`、`x-quota-remaining`、`x-quota-reset`，可在代码中读取余量。

## 领取步骤与注册状态
1. 打开 [https://100milionseek.top/signup](https://100milionseek.top/signup)，填写有正常邮件服务器（MX）的真实邮箱；一次性邮箱会被拒，Gmail `+tag` 与加点别名视为同一邮箱，一邮箱一号。
2. 通过 Cloudflare Turnstile 人机验证并创建 Key（仅展示一次，需立即保存）。
3. 进后台查看当日剩余额度与状态。
> **2026-11-26 复查状态**：站方已从完全暂停转为**分时段逐步放号（每小时 200 个免费名额，滚动态释放）**；若当前小时名额已满可等页面提示的下一个释放时间点刷新（站方也提供了免排队的付费 pass，非必需）。同时 `/api/status` 显示当前负载较高、状态为 `degraded`（近 24 小时成功率约 94.6%，首字延迟中位数约 14.5 秒），体验波动较大。

## 接到客户端
- **OpenAI SDK / Python / TypeScript / curl**：将 `base_url` 设为 `https://100milionseek.top/v1`，`model` 填 `deepseek-v4.1-flash-free`。
- **Cursor / Cline / Aider / Continue / OpenCode / Roo Code / LibreChat**：在模型设置里选 OpenAI Compatible，填入上述 Base URL 和 Key。
- **Claude Code**：走 Anthropic Messages 协议，需通过 `claude-code-router` 等转换层接入。
- 务必将 Key 放入环境变量（如 `export HMS_API_KEY=hms-xxx`），不要写入源码或公开截图。

## 有哪些限制与风险
- 仅主推 `deepseek-v4.1-flash-free` 单模型，不是多模型聚合平台。
- **第三方中转隐私边界**：prompt 与响应均经过其服务器（站方声明不落盘、不出售，仅存邮箱、Key 哈希和每日计数器）。**严禁发送客户资料、隐私凭证、内部源码或密钥。**
- 非 DeepSeek 或 OpenAI 官方（页脚声明 "Not affiliated with DeepSeek or OpenAI"）。账号、额度和服务存续完全由第三方控制，随时可能限流、收紧注册或停服。
- 免费额度无 SLA，当前实时状态为降级（`degraded`）且高负载下偶发失败或长延迟：切勿作为生产唯一依赖，也不要对 429 无限重试。

## 核查依据
本站于 2026-11-26 复查官方首页、`/signup`、`/docs` 及 `/api/status`：确认 400M 窗口已结束、1T 里程碑 500M/天窗口有效期至 2026-12-03 02:14 UTC、注册已改为每小时 200 名额逐步开放，以及服务当前处于 `degraded` 负载状态。未注册账号、未发起真实调用，实际可用额度以本人后台为准。',
  is_featured = 0,
  sort_weight = 68,
  updated_at = datetime('now')
WHERE slug = '100milionseek-free-api';

UPDATE tokens
SET
  status = 'draft',
  is_featured = 0,
  updated_at = datetime('now')
WHERE expiry_date IS NOT NULL
  AND expiry_date != ''
  AND expiry_date < '2026-11-26'
  AND status = 'published';
