// Original editorial guides for AI developers and creators.
// Each guide carries an explicit publication/review date and actionable engineering guidance.
export const CONTENT_DATE = '2026-11-26'

export const GUIDES = [
  {
    slug: 'choose-free-ai-api',
    date: '2026-11-03',
    category: 'selection',
    zh: {
      title: '免费 AI API 怎么选：免费层、试用赠额与算力额度的区别',
      description: '按任务、支付要求、额度周期和数据使用条款选择免费 AI API，避免把网页免费、开源模型和托管 API 免费混为一谈。',
      content: `看到“免费 AI”时，先不要急着复制 API Key。先确认免费的是哪一项：网页聊天界面、开源模型权重文件、托管推理 API，还是一个需要自己部署代码的计算账户。它们解决的问题不同，隐性运维成本和数据边界也不能直接比较。

## 先用四个问题筛选
1. **核心任务类型是什么？** 文本对话、代码补全、语音转录、向量检索，还是运行自定义权重？先排除不支持目标模态与工具调用的服务。
2. **能否接受支付方式验证？** 不少海外算力或推理平台要求绑卡验证（防刷机制），哪怕首月不扣费。如果不能绑卡，应优先锁定无卡免费层或直接本地运行开源模型。
3. **一次性评估还是长期日更任务？** 一次性赠额（如 30 天到期的 $5 Trial）非常适合做小样本评估，但绝不能当作长期自动化任务的免费基础设施。
4. **提示词中是否包含敏感数据？** 免费层与付费层的数据保留和训练条款往往完全不同。选择模型前先读数据条款，首轮实验一律使用脱敏或公开样本。

## 三类额度不能直接相比
- **长期免费层（Recurring Free Tier）**：通常按分钟/每天/每月重置，受 RPM/RPD 与 TPM/TPD 双重限制，持续性取决于平台政策。
- **限时试用赠额（One-time Trial Credit）**：一笔有有效期与资格限制的预算，耗尽或到期即停服。
- **通用算力赠额（Compute Credit）**：用于 GPU/CPU 容器计费，需要自行处理模型拉取、冷启动时间与闲置保活成本。

例如，Cloudflare Workers AI 用 Neurons 计量并按 UTC 每日重置；Modal 的 Starter 月度 $30 计算赠额自 2026-09-01 起不包含 Shared Endpoints；Cerebras 当前则是验证支付方式后发放 30 天有效的 $5 试用额度。把这些统一写成“免费 Token”会掩盖最关键的工程差异。

## 按现有技术栈选择，而不是只看模型列表
只想快速横向比较多个文本模型时，聚合平台（如 OpenRouter）最省集成代码；已有 Cloudflare Workers 应用时，直接使用 AI binding 省去了密钥管理与额外网络跳数；需要强隐私或零限流时，直接通过 [本地免费模型选型器](/local) 匹配本机内存运行 Ollama 往往更稳妥。每多接入一家供应商，都会增加鉴权、账单监控与异常兜底成本。

## 建立你自己的平台评估决策表
在正式写业务代码前，建议为每个候选平台记录 8 个字段：目标模型 ID、是否支持结构化输出/函数调用、计量单位、重置周期、是否需绑卡、免费层数据条款、超额后的错误码/计费行为、核查日期。任何文档未明确写出的字段都标注“待确认”，切勿把空白当成“无限制”。

用同一组 10–20 个公开测试样本跑一遍小样本验证，同时记录返回格式稳定性、失败原因与延迟分布。也可以先用 [AI Token 与免费额度估算器](/calculator) 算清多轮上下文与重试后的真实月消耗。

## 免费额度不能替代运行预算
长文档摘要和 Agent 工具循环会成倍放大 Token 消耗。评估额度时必须按“一次完整业务任务（含多轮历史上下文和重试）”计算，而不是只看单次问答字数。对所有自动化任务强制设置最大请求数、超时上限与 \`max_tokens\`，免费额度用尽时优雅降级或暂停队列，切忌在没有预算上限的情况下自动切换到高价付费模型。

## 官方参考
[OpenRouter Limits](https://openrouter.ai/docs/api_reference/limits)、[Cloudflare Workers AI 定价](https://developers.cloudflare.com/workers-ai/platform/pricing/)、[Modal 计费范围](https://modal.com/pricing)、[Cerebras 试用规则](https://inference-docs.cerebras.ai/support/rate-limits)。`,
    },
    en: {
      title: 'Choosing a Free AI API: Recurring Tiers, Trials & Compute Credits',
      description: 'Choose free AI APIs by task, payment rules, reset cycle and data terms. Separate web chat interfaces from hosted inference and compute credits.',
      content: `Before copying an API key from any "free AI" landing page, verify what is actually free: a consumer web chat app, downloadable open weights, a hosted inference endpoint, or raw serverless GPU compute. Mixing these categories leads to broken prototypes and surprise bills.

## Four Filter Questions Before Writing Code
1. **What modality and capability do you need?** Separate chat completions, structured JSON output, tool calling, embeddings, speech-to-text and image generation. Drop providers that lack your required endpoint immediately.
2. **Is payment-method verification acceptable?** Several inference providers require a credit card to unlock trial credits as an anti-abuse measure. If you need a strictly card-free path, stick to card-free developer tiers or run open weights locally via our [Local AI Hardware Picker](/en/local).
3. **One-off prototype or recurring daily job?** An expiring $5 trial balance works well for a weekend benchmark, but it cannot serve as a permanent backend for a public side project.
4. **Will requests contain private or regulated data?** Free tiers frequently have different retention and model-improvement terms than paid plans. Read the data-usage policy first and run initial experiments exclusively with public or synthetic prompts.

## Why Headline Free Numbers Are Not Comparable
- **Recurring Free Tiers** reset daily or monthly under strict requests-per-minute (RPM), requests-per-day (RPD) and tokens-per-minute (TPM) caps.
- **One-Time Trials** grant a fixed dollar or credit balance that expires after a set window (for example, Cerebras documents a 30-day $5 trial after card verification).
- **Compute Credits** cover container execution rather than per-token API endpoints. For instance, Cloudflare Workers AI bills in daily Neurons, while Modal Starter's $30 monthly compute credit excludes Shared Endpoints starting September 1, 2026.

## Build a Repeatable Evaluation Matrix
Track eight concrete fields for every candidate provider: exact model ID, tool/JSON support, billing unit, reset schedule, card requirement, free-tier data policy, overage behavior and documentation check date. Treat missing documentation as "unknown", never as "unlimited".

Before writing application logic, run your expected daily session volume through the [AI Token & Free Quota Calculator](/en/calculator) to account for multi-turn context growth and retry overhead. Always cap max retries, request timeouts and output length, and never auto-failover to an uncapped paid model without an explicit hard budget.

## Official References
[OpenRouter limits](https://openrouter.ai/docs/api_reference/limits), [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [Modal pricing](https://modal.com/pricing), [Cerebras trial limits](https://inference-docs.cerebras.ai/support/rate-limits).`,
    },
  },
  {
    slug: 'first-api-request',
    date: '2026-11-04',
    category: 'setup',
    zh: {
      title: '第一次调用 AI API：从环境变量到检查响应',
      description: '用一条最小请求验证 API 端点、密钥、模型 ID、状态码与 usage 用量，并划清 OpenAI 兼容接口与前端密钥安全的边界。',
      content: `第一次接入新的 AI API 时，先让一条最小 \`curl\` 请求跑通，再接到编辑器、Agent 或 Web 应用里。这个习惯可以立刻把“账号权限问题”、“模型 ID 拼写错误”和“客户端 SDK 配置问题”三类故障彻底隔离。

## 准备四项基础参数
任何大模型接口都离不开四个核心输入：API 基地址（Base URL）、密钥（API Key）、精确的模型 ID，以及具体任务路径（如 \`/chat/completions\`）。需要特别注意：**“OpenAI 兼容”通常只代表基础对话请求格式一致**，并不代表所有参数（如 \`response_format\`、\`reasoning_effort\`、多模态图片输入、并行工具调用）都与 OpenAI 官方完全一致。

下面以 Groq 官方公开的 OpenAI 兼容端点为例展示最小请求结构（请先在对应控制台确认当前可用模型 ID 与账号权限）：

## 用环境变量安全读取密钥
在终端通过交互式 \`read -r -s\` 读取密钥，可以避免把真实 API Key 写进 Shell 历史记录（\`.zsh_history\` / \`.bash_history\`）。严禁把密钥硬编码进 Git 仓库、截屏或公开工单。

\`\`\`sh
read -r -s GROQ_API_KEY
export GROQ_API_KEY
export MODEL_ID='填写控制台中当前可用的模型ID'
curl --fail-with-body --max-time 30 \\
  https://api.groq.com/openai/v1/chat/completions \\
  -H "Authorization: Bearer $GROQ_API_KEY" \\
  -H 'Content-Type: application/json' \\
  -d "{\\"model\\":\\"$MODEL_ID\\",\\"messages\\":[{\\"role\\":\\"user\\",\\"content\\":\\"Say hello in one sentence.\\"}],\\"max_tokens\\":64}"
\`\`\`

## 成功响应不只看有没有返回文字
拿到返回后，按顺序检查四项内容：
1. **HTTP 状态码**是否为 \`200\`；
2. **JSON 结构**中的 \`choices[0].message.content\` 与 \`finish_reason\`（如果是 \`length\` 说明输出被 \`max_tokens\` 截断）；
3. **\`usage\` 字段**（\`prompt_tokens\`、\`completion_tokens\`、\`total_tokens\`），用于核对真实消耗与估算是否一致；
4. **限流响应头**（如 \`x-ratelimit-remaining-requests\`、\`x-ratelimit-reset-tokens\`），提前摸清当前账号的实际配额水位。

## 按错误码分层排查
- **HTTP 401 / 403**：优先检查 \`Authorization: Bearer ...\` 前缀、多余换行符、密钥是否已吊销或所在地区受限。
- **HTTP 400 / 404**：绝大多数情况是复制了旧教程里已下线的模型名，或传入了该模型不支持的参数。
- **HTTP 429**：立刻看响应头里的 \`retry-after\`，区分分钟级速率限制还是当日额度耗尽，详见 [429 限流排查指南](/guides/rate-limits-and-budget)。
- **超时 / 连接重置**：先脱离客户端与代理，在终端单跑最小 \`curl\` 定位网络层还是 SDK 层问题。

## 接入网页应用的红线
切勿把长期 API Key 放进前端 HTML/JavaScript 或静态打包产物中。任何浏览器请求都可以被访客在 DevTools 中直接抓取并盗刷额度。公开网站必须由服务端（如 Cloudflare Workers / Node.js 后端）代发请求，并在服务端做好单 IP 限流、输入长度校验、超时控制和每日总额度熔断。

## 官方参考
[Groq Quickstart](https://console.groq.com/docs/quickstart) 与 [Groq OpenAI Compatibility](https://console.groq.com/docs/openai)。`,
    },
    en: {
      title: 'Your First AI API Request: Keys, Endpoints, curl & Response Checks',
      description: 'Verify endpoints, keys, exact model IDs, HTTP status codes and token usage with one minimal curl request before connecting an IDE or web app.',
      content: `Before wiring a new provider into an editor, AI agent, or web backend, send a single minimal terminal request. Isolating the raw HTTP layer immediately separates account permissions, retired model IDs, and client SDK misconfigurations.

## Four Inputs Required by Every Provider
You need a base URL, an API key, an exact active model ID, and the task endpoint path. Remember that "OpenAI-compatible" typically covers basic chat completions, not necessarily every parameter such as structured JSON schemas, tool calling, vision payloads, or streaming usage chunks.

## Read Your API Key Without Polluting Shell History
Use interactive silent input (\`read -r -s\`) rather than pasting the key inline so your credentials never land in \`.bash_history\`, \`.zsh_history\`, screenshots, or Git commits:

\`\`\`sh
read -r -s GROQ_API_KEY
export GROQ_API_KEY
export MODEL_ID='paste-active-model-id-from-console'
curl --fail-with-body --max-time 30 \\
  https://api.groq.com/openai/v1/chat/completions \\
  -H "Authorization: Bearer $GROQ_API_KEY" \\
  -H 'Content-Type: application/json' \\
  -d "{\\"model\\":\\"$MODEL_ID\\",\\"messages\\":[{\\"role\\":\\"user\\",\\"content\\":\\"Say hello in one sentence.\\"}],\\"max_tokens\\":64}"
\`\`\`

## Four Things to Inspect in the Response
1. **HTTP Status**: Confirm a \`2xx\` status before parsing JSON.
2. **Finish Reason**: Check \`choices[0].finish_reason\` — \`length\` means your \`max_tokens\` ceiling cut off the answer.
3. **Token Usage**: Log \`prompt_tokens\` and \`completion_tokens\` and compare them against the [AI Token Calculator](/en/calculator) to validate your workload model.
4. **Rate-Limit Headers**: Inspect headers such as \`x-ratelimit-remaining-requests\` and \`x-ratelimit-reset-tokens\` to observe your real account ceiling.

## Layered Troubleshooting Checklist
- **401 / 403**: Check the \`Bearer \` prefix, accidental whitespace, expired keys, or regional availability.
- **400 / 404**: Verify the model ID directly in the provider console — older blog posts frequently reference deprecated model names.
- **429**: Read \`retry-after\` and follow our [429 Rate-Limit & Budget Playbook](/en/guides/rate-limits-and-budget).

## Server-Side Boundary for Public Web Apps
Never embed a provider API key in browser JavaScript. Any visitor can extract it from DevTools and drain your quota within minutes. Proxy all public requests through a backend worker or API server with strict per-IP rate limiting, payload size caps, timeouts, and a daily spending kill switch.

## References
[Groq Quickstart](https://console.groq.com/docs/quickstart), [OpenAI Compatibility Notes](https://console.groq.com/docs/openai).`,
    },
  },
  {
    slug: 'rate-limits-and-budget',
    date: '2026-11-05',
    category: 'reliability',
    zh: {
      title: '免费 API 遇到 429：配额、并发与费用排查清单',
      description: '区分请求数、Token 吞吐、每日余额与上游容量，给免费 API 增加有限重试、业务幂等和明确的费用边界。',
      content: `同样返回 HTTP 429，有时等十几秒就能恢复，有时要等到次日 UTC 00:00 重置，有时则是聚合平台的上游模型节点满载。如果不分原因盲目重试，只会把轻度限流放大成整条队列雪崩。

## 第一步：分清四类限制单位
- **RPM / RPD**（每分钟/每日请求数）：高频小请求（例如逐行翻译、聊天机器人心跳）最先触碰。
- **TPM / TPD**（每分钟/每日 Token 数）：长文档或未裁剪的多轮历史，哪怕只发 2 次请求也会瞬间打穿 TPM。
- **并发连接数（Concurrency）**：部分免费层只允许 1–5 个并发流，开多标签页或 Promise.all 并发批处理立刻报 429。
- **特殊计量单位**：语音按音频时长秒数、Cloudflare 按 Neurons、生图/视频按积分或任务并发数计算。

## 第二步：打一条真正能排错的脱敏日志
记录以下 6 个字段即可快速定位：时间戳、提供方、模型 ID、HTTP 状态码、错误 \`type/code\`、以及 \`retry-after\` / \`x-ratelimit-*\` 响应头。日志中务必剥离 \`Authorization\` 头、Cookie、API Key 和用户原始提示词。如果链路经过聚合网关，要区分限流来自网关配额还是上游模型商。

## 第三步：按 429 类型执行不同策略
- **分钟速率上限（RPM/TPM）**：立刻降低并发度（如切到串行队列），裁剪多余上下文，严格等待 \`Retry-After\` 指定秒数后再试。
- **日/月免费额度耗尽（RPD/TPD）**：**停止重试**，将该通道标记为冷却直至重置时间点，提示用户或路由到已预设的其他免费/本地模型。
- **上游临时拥堵（Capacity / Overloaded）**：允许 2–3 次带随机抖动的指数退避（Exponential Backoff with Full Jitter），或切到备选模型。
- **余额/预算不足（Insufficient Quota）**：重发永远不会成功，严禁自动切到无上限的付费线路。

## 有限重试与业务幂等设计
\`\`\`js
async function callWithBoundedRetry(fn, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fn()
    if (res.ok) return res
    if (res.status !== 429 && res.status < 500) throw new Error('Non-retryable: ' + res.status)
    const retryAfter = Number(res.headers.get('retry-after')) || 0
    if (retryAfter > 60) throw new Error('Quota exhausted; stop retrying')
    const baseMs = retryAfter > 0 ? retryAfter * 1000 : Math.min(1000 * 2 ** attempt, 8000)
    const jitterMs = Math.floor(Math.random() * 400)
    if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, baseMs + jitterMs))
  }
  throw new Error('Retry budget exhausted')
}
\`\`\`
如果请求已经在服务端执行完毕但网络在回传时超时断开，直接重试可能导致重复发消息或重复写库。涉及副作用的 Agent 工具调用必须先实现业务级幂等键（Idempotency Key）。

## 上线前本地演练
用本地 Mock Server 模拟三种异常：短时 429（带 \`Retry-After: 2\`）、日额度耗尽（带 \`Retry-After: 3600\`）、以及 30 秒超时。确认前端给出了清晰提示、重试次数严格受控、用户点取消后能立刻中止后台请求。

## 官方参考
[Groq Rate Limits](https://console.groq.com/docs/rate-limits)、[OpenRouter Limits](https://openrouter.ai/docs/api_reference/limits)。`,
    },
    en: {
      title: 'Handling Free AI API 429 Errors Without Runaway Retries',
      description: 'Separate request rate, token throughput, exhausted daily quotas and upstream congestion; build bounded retries with jitter and hard budget caps.',
      content: `An HTTP 429 status can mean four very different things: a short per-minute spike, an exhausted daily allowance, exceeded concurrent streams, or temporary upstream congestion on an aggregator. Blindly retrying every 429 turns a minor pause into a cascading failure.

## Step 1: Identify Which Limit You Hit
- **RPM / RPD (Requests per Minute / Day)**: Frequent small calls such as webhooks or line-by-line classifiers hit this ceiling first.
- **TPM / TPD (Tokens per Minute / Day)**: Long documents and unpruned chat histories can saturate TPM in two requests.
- **Concurrency Limits**: Many free tiers cap simultaneous in-flight streams to 1–5; firing \`Promise.all\` across 20 chunks triggers immediate rejections.
- **Non-Token Units**: Audio APIs count seconds, Cloudflare counts Neurons, and multimedia tools count credits or job slots.

## Step 2: Log Actionable, Redacted Diagnostics
Capture timestamp, provider, model ID, HTTP status, provider error code, and rate-limit headers (\`retry-after\`, \`x-ratelimit-remaining-*\`). Strip all \`Authorization\` headers, cookies, API keys, and raw user text.

## Step 3: Match the Recovery Strategy to the Error Type
- **Short Rate Window**: Drop concurrency, trim prompt context, and wait for \`Retry-After\`.
- **Daily / Monthly Quota Exhausted**: Stop retrying immediately, put the provider in cooldown until the reset timestamp, and fall back to a pre-approved alternative or local Ollama model.
- **Upstream Congestion**: Apply bounded exponential backoff with jitter (2–3 attempts max).
- **Zero Balance / Hard Budget Cap**: Never retry; alert the operator instead of silently switching to an uncapped paid tier.

## Bounded Retry Pattern (JavaScript)
\`\`\`js
async function callWithBoundedRetry(fn, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fn()
    if (res.ok) return res
    if (res.status !== 429 && res.status < 500) throw new Error('Non-retryable: ' + res.status)
    const retryAfter = Number(res.headers.get('retry-after')) || 0
    if (retryAfter > 60) throw new Error('Daily quota exhausted; aborting retries')
    const waitMs = (retryAfter > 0 ? retryAfter * 1000 : Math.min(1000 * 2 ** attempt, 8000)) + Math.floor(Math.random() * 400)
    if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, waitMs))
  }
  throw new Error('Retry budget exhausted')
}
\`\`\`
For agent workflows that send emails or write database records, enforce business-level idempotency keys before retrying timed-out requests.

## References
[Groq Rate Limits](https://console.groq.com/docs/rate-limits), [OpenRouter Limits](https://openrouter.ai/docs/api_reference/limits).`,
    },
  },
  {
    slug: 'free-multimedia-ai-credits',
    date: '2026-11-06',
    category: 'multimedia',
    zh: {
      title: '免费图片、音视频与 3D 怎么选：额度、下载和商用检查表',
      description: '按生图、配音、转录、音乐、视频和 3D 任务挑选免费服务，识别一次性额度、隐藏下载门槛与 API 计费边界。',
      content: `能免费“生成一次”，并不等于能拿到可商用的成品文件。多媒体 AI 服务必须同时核对三个维度：**生成额度、导出/下载权限、以及商用与署名许可**。只看宣传页送了多少积分，往往做到最后一步导出时才发现必须升级订阅。

## 先按最终交付文件选工具
- **图片生成（Image）**：核对分辨率上限、透明背景（PNG）、文字渲染准确度与是否允许原图下载。原型草图与电商主图对高清无水印的要求截然不同。
- **语音合成（TTS）**：检查中文自然度、单次字符上限、音色授权范围以及输出音频格式（MP3/WAV）。注意区分 TTS 字符数与 ASR 转录时长。
- **语音转录（STT）**：分清离线文件上传与实时流式接口，重点检查中英混说准确度、说话人分离（Diarization）与词级时间戳。
- **音乐生成（Audio/Music）**：生成、在线试听、MP3/WAV 下载、分轨（Stems）和商用版权往往被拆成四档权限，免费层可听但不可商用的情况极其普遍。
- **视频生成（Video）**：核对单段秒数、帧率/清晰度、平台水印与排队等待时长；图片积分不一定能直接用于视频模型。
- **3D 资产（3D）**：先明确需要 GLB/OBJ/FBX 哪种格式，是否要求 PBR 贴图与骨骼绑定。很多平台允许网页免费预览，但导出带贴图模型需订阅。

## 用小预算跑通端到端验证
不同平台的 Credits 购买力完全不可横向换算（有的 1 积分出一张图，有的 25 积分出一段 4 秒视频）。开始正式创作前，先做 1 个最小测试任务，记录：单次扣分、失败任务是否退分、重置周期（日/月/一次性），以及最终能否顺利下载到目标格式。

## 下载与上线前的三项合规自检
1. **文件导出门槛**：免费版能否无阻导出所需分辨率、贴图和无水印版本？
2. **版权与商用边界**：是否允许商业用途？是否强制署名（如 CC BY 4.0）？免费生成的作品是否默认公开展示？特别注意：**之后开通付费订阅，通常不会追溯改变此前在免费层生成作品的商用许可**。
3. **输入素材授权**：平台条款只涵盖生成环节，不免除你上传第三方受版权保护图片、商标或他人声音肖像的法律责任。

例如，Meshy 免费层每月提供 100 积分与 10 次未贴图 Meshy 6 Lite 下载且商用需按 CC BY 4.0 署名；Tripo Studio 免费层明确标注仅限非商用；Runway 免费层则是 125 积分一次性额度且带水印。提前查清这些边界，能省下大量返工时间。

## 网页免费与开发者 API 是两套钱包
绝大多数多媒体产品的网页端免费额度不能直接通过 API 消耗。准备做自动化生成管线时，请单独核对开发者平台的 API 单价、异步轮询（Webhook）机制与失败重试扣费规则。

## 官方参考
[Meshy 免费方案](https://help.meshy.ai/en/articles/15696428-what-is-included-on-the-free-plan)、[Tripo Studio 定价](https://www.tripo3d.ai/pricing)、[Runway 积分规则](https://help.runwayml.com/hc/en-us/articles/15124877443219-How-do-credits-work)、[Replicate 免费体验](https://replicate.com/collections/try-for-free)。`,
    },
    en: {
      title: 'Free AI Image, Audio, Video & 3D Credits: Quotas, Exports & Licenses',
      description: 'Evaluate free multimedia AI tools by actual downloadable file formats, watermarks, commercial licenses and API billing boundaries.',
      content: `A free generation is only useful if you can export the file in the format you need under a license that matches your project. Always inspect three separate gates before investing creative time: generation allowance, export/download permissions, and commercial usage rights.

## Match the Tool to Your Final Deliverable
- **Images**: Check resolution ceilings, transparent PNG support, text legibility, and full-size downloads.
- **Text-to-Speech (TTS)**: Verify language quality, character limits per request, voice licensing, and audio export formats (MP3/WAV).
- **Speech-to-Text (STT)**: Separate batch file uploads from live WebSocket streaming, and verify timestamps and speaker diarization on realistic noisy audio.
- **Music**: Generation, streaming playback, audio download, stem separation, and commercial licensing are frequently gated at different tiers.
- **Video**: Confirm clip duration, resolution, watermark placement, queue priority, and whether image credits can be spent on video models.
- **3D Assets**: Check required formats (GLB, OBJ, FBX), PBR textures, and rigging. Browser previews do not guarantee textured exports.

## Validate End-to-End With One Small Asset
Credit numbers cannot be compared across platforms. Run a single minimal test first and verify: exact credits spent, whether failed jobs refund credits, reset cadence (daily, monthly, or one-time), and whether the exported file imports cleanly into your target editor or game engine.

## Three Pre-Delivery Compliance Checks
1. **Export Gate**: Can you download the resolution, textures, and unwatermarked file you need without upgrading?
2. **Commercial Rights & Attribution**: Is commercial use allowed? Is attribution (such as CC BY 4.0) mandatory? Are free creations published publicly? Note that upgrading to a paid plan later often does not retroactively grant commercial rights to earlier free-tier outputs.
3. **Input Rights**: Provider output terms never clear third-party copyrights, trademarks, or cloned voices/likenesses you upload.

For concrete examples, Meshy limits free downloads to 10 untextured Meshy 6 Lite models per month under CC BY 4.0; Tripo Studio marks its free tier non-commercial; Runway's 125 free credits are one-time and watermarked.

## Web Allowances vs. Developer APIs
Consumer web credits rarely transfer to developer API wallets. Before automating generation pipelines, verify API pricing, async job webhooks, and failed-job billing independently.

## References
[Meshy Free Plan](https://help.meshy.ai/en/articles/15696428-what-is-included-on-the-free-plan), [Tripo Pricing](https://www.tripo3d.ai/pricing), [Runway Credits](https://help.runwayml.com/hc/en-us/articles/15124877443219-How-do-credits-work), [Replicate Try-for-Free](https://replicate.com/collections/try-for-free).`,
    },
  },
  {
    slug: 'token-pricing-and-context-math',
    date: '2026-11-26',
    category: 'cost',
    zh: {
      title: 'Token 怎么计费？多轮对话用量与账单复算',
      description: '通过可手算的示例拆分输入、输出和多轮历史用量，用实际请求对照模型计数与价格。',
      content: `## 从你真正发送的请求开始计数

一条请求的输入可能包括系统指令、历史消息、工具定义、检索片段和当前问题。即使网页上只看到一小段输入，API 调用也可能带着完整历史。分词器、消息封装和文件支持随模型而变。用 [AI Token 计算器](/calculator) 粗估公开样本，正式预算以目标模型的计数接口和实际调用的 usage 为准。

## 复算保留全部历史的成本

设首轮输入为 A，后续每轮比前一轮多 G，共发 N 次。整次会话的输入为 N × A + G × N × (N − 1) ÷ 2。以 A = 600、G = 400、N = 4 为例，四轮输入分别是 600、1,000、1,400、1,800，合计 4,800。如果只保留最近一轮历史，让第 2–4 轮都为 1,000，则合计 3,600。在这个示例里输入减少 1,200 Token。摘要本身的调用及其 Token 应单独计入，并用真实任务检查截断后是否丢了重要信息。

## 把接口用量变成预算

假设四轮各输出 400 Token，每次会话共输出 1,600。以示例单价每百万输入 0.25 美元、每百万输出 1 美元，发送 1,000 次这样的会话，费用为 4.8 × 0.25 + 1.6 × 1 = 2.80 美元。把示例单价替换为所用模型的报价，按实际计费方式另计缓存读取或写入、工具费和推理用量。

## 用真实调用校准

1. 用同一个模型跑一小批代表性请求，记录首轮和末轮的 usage 以及错误次数。
2. 改用滑动窗口或更短的工具定义，保留相同输入样本，比较输入用量和任务结果。
3. 分别核对分钟请求量、分钟 Token 和日额度。如果控制台只公布部分指标，就按已知指标判断，剩余预算通过小规模测试估算。

参考资料：[Gemini Token 计数](https://ai.google.dev/gemini-api/docs/tokens)、[OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching)。`,
    },
    en: {
      title: 'How AI Token Billing Works: Reproduce a Multi-Turn Cost Estimate',
      description: 'Work through input, output and retained history, then calibrate the estimate with your model’s usage and prices.',
      content: `## Count the request you actually send

Input can include system instructions, retained messages, tool schemas, retrieved passages and the latest question. A short message in a UI can still generate a request with a long history. Tokenization, message formatting and attachment handling vary by model. Use the [AI Token Calculator](/en/calculator) for rough estimates with public samples. Plan your budget with the model’s counting endpoint and actual usage data.

## Reproduce the cost of retaining history

Let the first request contain A input tokens and each successive turn add G. Across N requests, total input is N × A + G × N × (N − 1) ÷ 2. With A = 600, G = 400 and N = 4, the four requests contain 600, 1,000, 1,400 and 1,800 tokens, for 4,800 total. Keeping only the most recent turn of history could cap requests 2–4 at 1,000 each, for 3,600 total. That saves 1,200 input tokens in this example. Include the cost of generating any summary and check that truncation preserves the information needed to finish real tasks.

## Translate usage into a bill

At 400 output tokens per turn, each conversation produces 1,600 output tokens. With illustrative prices of $0.25 per million input tokens and $1 per million output tokens, 1,000 such conversations cost 4.8 × $0.25 + 1.6 × $1 = $2.80. Use your model’s rates and account separately for cache reads or writes, tool fees and reasoning usage where applicable.

## Calibrate with real calls

1. Run a small sample of representative requests with the same model. Record first- and last-turn usage and error counts.
2. Try a sliding window or shorter tool descriptions on the same requests. Compare input tokens and task quality.
3. Compare per-minute requests, per-minute tokens and daily volume with your dashboard. Use a small load test for limits the dashboard omits.

References: [Gemini token counting](https://ai.google.dev/gemini-api/docs/tokens) and [OpenAI prompt caching](https://platform.openai.com/docs/guides/prompt-caching).`,
    },
  },
  {
    slug: 'ollama-local-ai-setup-guide',
    date: '2026-11-12',
    category: 'local',
    zh: {
      title: '零费用本地运行大模型完整指南：Ollama 安装、量化选择与 API 接入',
      description: '从 8GB 笔记本到 64GB 工作站，详解 Ollama 部署、Q4_K_M 与 Q8_0 量化权衡、上下文显存计算以及无缝替换 OpenAI API。',
      content: `当云端免费 API 频频触发 429 限流、或者你需要处理绝对不能出内网的私有代码和财务文档时，**本地运行开源权重模型**是最彻底的零费用方案——无需绑卡、没有每日次数限制、断网也能用。

## 1. 先按内存/显存选对参数量（避免爆内存卡死）
本地推理的头号瓶颈不是 CPU 算力，而是**可用内存/显存带宽与容量**。采用主流 4-bit 量化（\`Q4_K_M\`）时，模型权重体积大致为 **参数量（B）× 0.6 GB**，再叠加操作系统的占用和上下文 KV Cache（长上下文会额外吃掉 1–4 GB）：
- **8 GB 内存/显存**：首选 3B–8B 模型（如 \`qwen2.5-coder:7b\`、\`gemma3:4b\`、\`deepseek-r1:8b\`）。
- **16 GB 内存/显存**：黄金甜点档，可流畅运行 12B–14B（如 \`qwen2.5-coder:14b\`、\`gemma3:12b\`、\`deepseek-r1:14b\`）。
- **24 GB–32 GB**：可驾驭 27B–32B 旗舰级开源模型（\`qwen2.5-coder:32b\`、\`deepseek-r1:32b\`），代码与推理质量逼近商用中型模型。
- **64 GB+ 统一内存（Apple Silicon）**：可跑 70B 级别模型。

可直接打开 [本地免费模型选型器](/local) 按你的硬件一键筛选并复制运行命令。

## 2. 量化等级怎么选：Q4_K_M vs Q6_K vs Q8_0
- **\`Q4_K_M\`（Ollama 默认）**：综合性价比最高，体积比 FP16 缩小近 70%，大多数对话、总结和代码任务几乎感知不到精度损失。
- **\`Q6_K\` / \`Q8_0\`**：体积增加 40%–85%，但在严苛的数学推导、小众编程语言和严格 JSON 格式遵循上更稳；若显存充裕，优先给 7B–14B 升级到 Q8 而不是硬塞一个爆内存换页的 32B Q4 模型。

## 3. 三步启动 OpenAI 兼容本地接口
安装 [Ollama](https://ollama.com/) 后，仅需三条命令即可让所有支持 OpenAI SDK 的工具零成本切到本地：

\`\`\`sh
# 1. 拉取并测试模型
ollama pull qwen2.5-coder:7b

# 2. 确认本地服务已监听 11434 端口（默认提供 /v1 OpenAI 兼容端点）
curl http://localhost:11434/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model":"qwen2.5-coder:7b","messages":[{"role":"user","content":"Write a Python function to debounce calls."}]}'
\`\`\`

在 Python / Node.js 的 OpenAI SDK 中，只需把 \`baseURL\` 改为 \`http://localhost:11434/v1\`、\`apiKey\` 填任意占位符（如 \`'ollama'\`）即可完全复用原有业务代码。

## 4. 实战避坑与提速技巧
- **合理设置 \`num_ctx\`**：Ollama 默认上下文常为 2048 或 4096；用于代码库分析时可显式调至 \`16384\` 或 \`32768\`，但调大前务必留意显存增长，一旦溢出到普通内存（Offload），生成速度会骤降 5–10 倍。
- **开启 Flash Attention 与 KV Cache 量化**：在环境变量中配置 \`OLLAMA_FLASH_ATTENTION=1\` 和 \`OLLAMA_KV_CACHE_TYPE=q8_0\`，可在长上下文场景下显著省显存并提速。
- **别把本地接口暴露到公网**：默认绑定 \`127.0.0.1\` 是安全设计；若需局域网访问，务必加反向代理与鉴权，避免被局域网或公网扫描器白嫖算力。`,
    },
    en: {
      title: 'Zero-Cost Local LLMs With Ollama: Sizing, Quantization & OpenAI API Setup',
      description: 'Run open-weight AI models offline from 8GB laptops to 64GB workstations: VRAM sizing, Q4 vs Q8 quantization, and drop-in OpenAI SDK integration.',
      content: `When cloud free tiers hit 429 rate limits or your workload involves private repositories and sensitive customer records, running open-weight models locally gives you **$0 API billing, zero rate limits, and complete data privacy**.

## 1. Size the Model to Your RAM / VRAM First
Local inference speed is primarily limited by memory capacity and memory bandwidth. At standard 4-bit quantization (\`Q4_K_M\`), model weights take roughly **0.6 GB per billion parameters**, plus 1–4 GB of headroom for the operating system and KV cache:
- **8 GB RAM/VRAM**: Stick to 3B–8B models (\`qwen2.5-coder:7b\`, \`gemma3:4b\`, \`deepseek-r1:8b\`).
- **16 GB RAM/VRAM**: The developer sweet spot for 12B–14B models (\`qwen2.5-coder:14b\`, \`gemma3:12b\`).
- **24–32 GB**: Smoothly runs 27B–32B heavyweights (\`qwen2.5-coder:32b\`, \`deepseek-r1:32b\`).
- **64 GB+ Unified Memory**: Capable of running 70B-class models offline.

Use our [Local AI Hardware Picker](/en/local) to filter verified Ollama commands by your exact RAM tier and task.

## 2. Choosing Quantization: Q4_K_M vs. Q8_0
\`Q4_K_M\` (Ollama's default) cuts memory footprint by ~70% relative to FP16 with minimal quality degradation for coding and everyday chat. Upgrading a 7B–14B model to \`Q6_K\` or \`Q8_0\` improves strict JSON adherence and math reliability — and is almost always faster and more usable than cramming a 32B model that spills onto slow CPU swap.

## 3. Drop-In OpenAI-Compatible Local Endpoint
Ollama exposes an OpenAI-compatible endpoint at \`http://localhost:11434/v1\` out of the box:

\`\`\`sh
ollama pull qwen2.5-coder:7b
curl http://localhost:11434/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model":"qwen2.5-coder:7b","messages":[{"role":"user","content":"Write a TypeScript debounce helper."}]}'
\`\`\`

Point any OpenAI SDK client to \`baseURL: 'http://localhost:11434/v1'\` with any placeholder key (\`'ollama'\`) to switch between local and cloud providers without rewriting your app.

## 4. Practical Performance & Security Tips
- **Tune \`num_ctx\` carefully**: Raising context length from 4K to 32K increases KV cache memory substantially. If VRAM overflows into system RAM, token generation speed drops dramatically.
- **Enable Flash Attention**: Setting \`OLLAMA_FLASH_ATTENTION=1\` and \`OLLAMA_KV_CACHE_TYPE=q8_0\` reduces long-context memory usage on supported GPUs.
- **Keep localhost private**: Keep Ollama bound to \`127.0.0.1\` unless you place authentication in front of it.`,
    },
  },
  {
    slug: 'multi-provider-fallback-router',
    date: '2026-11-16',
    category: 'architecture',
    zh: {
      title: '免费 API 额度不够用？多平台路由降级与高可用网关设计实战',
      description: '用不到 80 行 TypeScript 构建带健康熔断、按任务分流与本地兜底的多提供方 AI 路由器，告别单平台限流宕机。',
      content: `任何单一免费 AI API 都不提供 SLA：高峰期上游拥堵、日配额提前耗尽或模型临时下线都是常态。与其在业务代码里到处写 \`try/catch\`，不如在应用入口抽象一层轻量的**多提供方路由降级器（Fallback Router）**。

## 核心设计原则（三条红线）
1. **能力对等分组**：把具备相同能力的模型归入同一个逻辑档位（例如 \`fast-json\` 档位放 Groq / Gemini Flash / 本地 Qwen 7B，\`deep-reason\` 档位放高推理模型），避免降级后返回格式不兼容把上游解析器炸掉。
2. **熔断冷却而非盲目轮询**：一旦某提供方返回“日额度耗尽”或连续 3 次 5xx/超时，立刻把它放进内存/KV 冷却表（例如 5 分钟或到 UTC 00:00），后续请求直接跳过它，避免每个用户都白白多等一次超时。
3. **显式成本护栏**：**绝不把无上限的付费通道静默排在免费通道后面**；如果确实需要付费兜底，必须附带每日硬性 Token 预算计数器。

## 最小可运行的多提供方路由器（JavaScript / Workers 适用）

\`\`\`js
const cooldownUntil = new Map()

export async function routeChat(providers, payload) {
  const now = Date.now()
  const errors = []

  for (const p of providers) {
    if ((cooldownUntil.get(p.id) || 0) > now) continue
    try {
      const res = await fetch(p.endpoint, {
        method: 'POST',
        signal: AbortSignal.timeout(p.timeoutMs || 15000),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${p.apiKey}\`,
        },
        body: JSON.stringify({ ...payload, model: p.model }),
      })
      if (res.ok) return { provider: p.id, data: await res.json() }

      if (res.status === 429) {
        const retrySec = Number(res.headers.get('retry-after')) || 60
        cooldownUntil.set(p.id, now + Math.min(retrySec, 3600) * 1000)
      } else if (res.status >= 500) {
        cooldownUntil.set(p.id, now + 60_000)
      }
      errors.push(\`\${p.id}:HTTP_\${res.status}\`)
    } catch (err) {
      cooldownUntil.set(p.id, now + 45_000)
      errors.push(\`\${p.id}:\${err.name || 'ERR'}\`)
    }
  }
  throw new Error('All providers unavailable: ' + errors.join(', '))
}
\`\`\`

## 按任务类型分流，进一步把免费额度拉长 3 倍
不要让所有流量都走同一条顺序链：
- **高频轻量任务**（分类、提取关键词、翻译短句）→ 优先走 Cloudflare Workers AI（每日 10,000 Neurons）或 Groq 轻量模型；
- **长上下文总结**（1 万字以上文档）→ 优先走支持大窗口的 Gemini Flash 免费层；
- **开发期与敏感内部脚本** → 优先走本机 Ollama，失败时再按需提示切换云端。

## 可观测性：记录“哪一层接住了流量”
在每次响应的日志中记录实际命中的 \`provider\`、耗时（ms）、输入输出 Token 与是否发生降级。运行一周后，你就能清楚看到瓶颈究竟出在 RPM、TPM 还是单次上下文过长，再针对性优化提示词或扩容对应档位。`,
    },
    en: {
      title: 'Multi-Provider AI Fallback Router: High Availability on Free Tiers',
      description: 'Build a lightweight TypeScript/JS router with cooldown circuit breakers, capability tiers, and local fallbacks so a single 429 never breaks your app.',
      content: `No free AI API comes with a production SLA. Upstream congestion, exhausted daily allowances, and sudden model deprecations happen routinely. Rather than scattering ad-hoc \`try/catch\` blocks across your codebase, centralize calls behind a compact **Multi-Provider Fallback Router**.

## Three Architecture Rules
1. **Group by Equivalent Capability**: Put models with matching JSON/tool-calling reliability in the same tier (for example, a \`fast-json\` tier combining Groq, Gemini Flash, and local Qwen 7B). Never fall back from a strict structured-output model to one that ignores JSON constraints.
2. **Use Cooldown Circuit Breakers**: When a provider reports a 429 or repeated 5xx timeouts, mark it in cooldown (for 60 seconds or until its reset window) so subsequent users do not suffer stacked timeouts.
3. **Hard Budget Guardrails**: Never silently place an uncapped paid provider at the end of a free fallback chain. Gate any paid fallback behind a strict daily token counter.

## Minimal Router Implementation (Node.js / Cloudflare Workers)
\`\`\`js
const cooldownUntil = new Map()

export async function routeChat(providers, payload) {
  const now = Date.now()
  const errors = []

  for (const p of providers) {
    if ((cooldownUntil.get(p.id) || 0) > now) continue
    try {
      const res = await fetch(p.endpoint, {
        method: 'POST',
        signal: AbortSignal.timeout(p.timeoutMs || 15000),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${p.apiKey}\`,
        },
        body: JSON.stringify({ ...payload, model: p.model }),
      })
      if (res.ok) return { provider: p.id, data: await res.json() }
      const coolMs = res.status === 429
        ? Math.min((Number(res.headers.get('retry-after')) || 60) * 1000, 3600_000)
        : 60_000
      cooldownUntil.set(p.id, now + coolMs)
      errors.push(\`\${p.id}:HTTP_\${res.status}\`)
    } catch (err) {
      cooldownUntil.set(p.id, now + 45_000)
      errors.push(\`\${p.id}:\${err.name || 'ERR'}\`)
    }
  }
  throw new Error('All providers unavailable: ' + errors.join(', '))
}
\`\`\`

## Task-Based Routing Multiplies Effective Free Capacity
Route short classification calls to high-RPM or edge tiers (Groq, Cloudflare Workers AI), long-context summaries to wide-window tiers (Gemini Flash), and sensitive internal batch jobs to a local [Ollama](/en/local) instance. Log the winning provider ID, latency, and fallback reason on every call so you can spot quota bottlenecks early.`,
    },
  },
  {
    slug: 'ai-api-security-key-management',
    date: '2026-11-20',
    category: 'security',
    zh: {
      title: 'AI API Key 安全与防刷账单指南：服务端代理、限流与熔断',
      description: '防止免费试用变天价账单：API Key 泄露排查、前端零密钥架构、单 IP 速率限制、每日消费熔断与隐私脱敏清单。',
      content: `很多独立开发者上线 AI 小工具的第一周，不是因为流量大爆而宕机，而是因为 API Key 泄露到前端或 GitHub，几分钟内被自动化扫描脚本刷光免费额度——如果账号绑定了信用卡，甚至会在半小时内产生数百美元异常账单。

## 1. 最常见的 4 种密钥泄露途径
1. **前端构建变量误打进浏览器**：在 Vite（\`VITE_*\`）或 Next.js（\`NEXT_PUBLIC_*\`）中给密钥加了公开前缀，导致打包后的 JS 文件直接包含明文 Key。
2. **Git 历史残留**：虽然在最新提交删掉了 \`.env\`，但旧 Commit 里依然躺着真实密钥——公开仓库上的扫描机器人通常在推送后 **30 秒内** 就会抓取完毕。
3. **截图与报错日志回传**：把包含请求头的 cURL 截图发到社区提问，或在后端 500 错误响应里把下游原始请求配置原样吐给了前端。
4. **公用共享 Key**：团队多人共用一把主账号 Admin Key，离职或单端泄露后无法精准吊销。

## 2. 公开 Web 应用的标准安全架构
永远坚持 **Browser → 你的后端代理（Workers / API）→ AI 提供方** 三层结构，并在后端代理层同时落齐四道防线：
- **单 IP / 单会话限流**：例如每分钟最多 10 次请求、每天最多 50 次；
- **输入体大小硬限制**：拒绝超过指定字节（如 8 KB）的请求体，防止攻击者用超长文本一次性打爆你的 TPM 配额；
- **固定允许的模型白名单**：绝不把前端传来的 \`model\` 字段直接透传给上游，否则恶意用户会把它改成最贵的推理模型；
- **每日全局 Token 熔断开关**：每次请求累加 \`usage.total_tokens\` 到轻量存储，达到日预算直接返回 \`503 Service Temporarily Paused\`。

## 3. 平台控制台必开的两项账单保护
即使你目前只用免费层，只要账号绑过卡，务必在控制台立刻做两件事：
1. **设置 Hard Spend Limit（硬性支出上限）**，而不是只开 Email 邮件提醒（邮件提醒往往延迟数小时，且不会自动停服）；
2. **按项目/环境拆分独立 API Key**（本地开发、测试环境、线上生产各用一把，并限制最小权限与到期时间），一旦发现异常可秒级吊销而不影响其他环境。

## 4. 免费层数据隐私自查
在把业务数据送进任何免费 API 或第三方中转站前，先对照以下三不原则：
- **不上传个人身份信息（PII）**：姓名、手机号、身份证号、银行卡号在调用前做占位符脱敏（如 \`[USER_PHONE_1]\`），拿到模型输出后再在本地还原；
- **不上传生产密钥与内部源码**：私有核心算法与配置文件请优先使用本地离线模型（见 [本地开源模型指南](/guides/ollama-local-ai-setup-guide)）；
- **核对保留政策**：仔细查看提供方文档中免费层是否开启 Prompt Logging 或用于模型训练。`,
    },
    en: {
      title: 'AI API Key Security & Anti-Abuse Guide: Proxies, Rate Limits & Spend Caps',
      description: 'Protect free tiers and billed accounts from credential leaks with server-side proxies, model allowlists, per-IP rate limits, and hard spend caps.',
      content: `Automated bots continuously scan public Git repositories and client-side JavaScript bundles for leaked AI API keys. Within minutes of exposure, a free quota is wiped out — and if a credit card is attached for trial verification, an attacker can run up hundreds of dollars in unauthorized completions.

## 1. Four Most Common Credential Leak Paths
1. **Public Frontend Env Prefixes**: Putting a secret in \`VITE_*\` or \`NEXT_PUBLIC_*\` compiles the plaintext key directly into browser bundles.
2. **Git Commit History**: Deleting \`.env\` in a follow-up commit does not erase it from earlier commits; scanners index public pushes within seconds.
3. **Unredacted Logs & Error Responses**: Echoing upstream request headers in HTTP 500 error responses or sharing unredacted curl commands in public issues.
4. **Shared Master Keys**: Reusing one root key across local dev, CI, and production prevents isolated revocation.

## 2. Standard Security Architecture for Public Apps
Always route traffic through **Browser → Your Backend Proxy → AI Provider** and enforce four checks on your server:
- **Per-IP / Per-Session Rate Limits**: Cap burst and daily calls per visitor.
- **Strict Payload Caps**: Reject oversized request bodies (e.g., > 8 KB) before forwarding to prevent TPM exhaustion attacks.
- **Server-Side Model Allowlist**: Never forward a client-supplied \`model\` string verbatim — an attacker can swap a free Flash model for an expensive frontier model.
- **Global Daily Kill Switch**: Track cumulative \`usage.total_tokens\` and gracefully pause public access when the daily cap is reached.

## 3. Mandatory Provider Console Safeguards
On any account with a payment method on file, configure a **hard monthly spend limit** (not just email alerts, which do not stop traffic) and issue separate scoped keys per environment.

## 4. Free-Tier Data Privacy Checklist
Before sending prompts to a free tier or third-party relay, scrub customer PII (replace emails, phone numbers, and IDs with reversible placeholders locally), never upload private credentials, and move confidential codebases to offline [local Ollama models](/en/local).`,
    },
  },
  {
    slug: 'free-ai-for-coding-ides',
    date: '2026-11-23',
    category: 'coding',
    zh: {
      title: 'Cursor / Cline / Roo Code / Continue 接入免费大模型与本地模型配置实战',
      description: '主流 AI 编程插件如何配置 OpenAI 兼容免费 API 与本机 Ollama，拆分补全模型与对话重构模型，大幅降低编码成本。',
      content: `AI 编程是最消耗 Token 的个人开发场景之一：一次仓库级上下文检索动辄带入 8,000–25,000 输入 Token。如果把所有操作都塞给单一付费订阅，额度很快见底。更高效的做法是在 IDE 插件中**把「行内自动补全」与「多文件推理重构」拆开配置**。

## 1. 最佳实践：双模型分层配置
- **行内自动补全（FIM / Autocomplete）**：要求极低延迟（< 300ms）、高频调用、上下文短 → **最适合本机 Ollama 运行 \`qwen2.5-coder:7b\` 或 \`qwen2.5-coder:1.5b\`**，完全免费且零限流。
- **代码问答与小文件重构（Chat / Edit）**：需要较强指令跟随与上下文窗口 → 可接入 **Gemini API 免费层、OpenRouter 免费变体、Groq 或 16GB 本机 \`qwen2.5-coder:14b\`**。
- **跨模块复杂架构与排错**：遇到棘手 Bug 时再按需切换到高推理模型，不浪费日常额度。

## 2. Continue 插件混合配置示例（本地补全 + 云端免费对话）
Continue 支持在同一个配置文件中为补全与对话分别指定不同提供方，且密钥统一从环境变量读取：

\`\`\`yaml
name: FreeTokenBox Hybrid Coding Stack
version: 1.0.0
schema: v1
models:
  - name: Local Qwen Coder 7B (Autocomplete)
    provider: ollama
    model: qwen2.5-coder:7b
    roles:
      - autocomplete
  - name: Cloud Free Chat (OpenAI Compatible)
    provider: openai
    apiBase: https://openrouter.ai/api/v1
    apiKey: \${{ secrets.OPENROUTER_API_KEY }}
    model: 选择官方目录中当前可用的免费模型ID
    roles:
      - chat
      - edit
\`\`\`

## 3. Cline / Roo Code / Aider 省额度关键设置
这类 Agent 型编程工具会自动循环执行“读文件 → 改代码 → 跑测试 → 再读报错”，**如果不加约束，一个循环就能烧掉 10 万+ Token**：
1. **配置 \`.clineignore\` / \`.aiderignore\`**：第一时间排除 \`node_modules/\`、\`dist/\`、\`build/\`、\`package-lock.json\`、大体积 JSON 和二进制资源目录；
2. **开启只读范围控制**：先手动 \`@\` 指定 2–3 个相关文件，而不是让 Agent 满仓库全文搜索；
3. **单任务开新会话**：修完一个独立功能后立刻 \`/new\` 或新开对话，防止旧任务的几万 Token 历史跟着后续每个问题重复计费；
4. **设置自动审批步数上限**：限制连续自动调用不超过 5–8 步，防止卡在编译错误里无限重试打穿 429。

## 4. 隐私与协议提醒
使用任何免费云端 API 写代码前，先确认公司代码合规要求与提供方免费层的数据使用条款；涉及商业闭源代码，请全程使用本机 Ollama 离线模型（参考 [本地模型硬件对照表](/local)）。`,
    },
    en: {
      title: 'Configuring Free Cloud APIs & Local Models in Cursor, Cline, Roo Code & Continue',
      description: 'Split fast local autocomplete from free cloud chat/refactoring in popular AI coding extensions, and prevent agent loops from burning quotas.',
      content: `AI-assisted coding is one of the fastest ways to exhaust API quotas because repository context easily injects 8,000–25,000 input tokens per turn. The cleanest way to stay free or low-cost is a **two-tier hybrid setup** inside your IDE.

## 1. Split Autocomplete From Heavy Refactoring
- **Inline Autocomplete (FIM)**: Needs sub-300ms latency and fires dozens of times per minute with short local context — run **\`qwen2.5-coder:7b\` locally on Ollama** for zero cost and zero rate limits.
- **Chat & Targeted Edits**: Needs larger context windows and stronger instruction following — route to a free cloud tier (Gemini Flash, OpenRouter free variants, Groq) or a 14B–32B local model on 16GB–32GB machines.

## 2. Example Hybrid Config for Continue
\`\`\`yaml
name: FreeTokenBox Hybrid Coding Stack
version: 1.0.0
schema: v1
models:
  - name: Local Qwen Coder 7B (Autocomplete)
    provider: ollama
    model: qwen2.5-coder:7b
    roles:
      - autocomplete
  - name: Cloud Free Chat (OpenAI Compatible)
    provider: openai
    apiBase: https://openrouter.ai/api/v1
    apiKey: \${{ secrets.OPENROUTER_API_KEY }}
    model: paste-active-free-model-id
    roles:
      - chat
      - edit
\`\`\`

## 3. Four Settings That Stop Agent Tools From Draining Quotas
Autonomous extensions like Cline, Roo Code, and Aider loop through file reads, edits, and test runs automatically:
1. **Add ignore files immediately**: Exclude \`node_modules/\`, \`dist/\`, lockfiles, and large generated assets in \`.clineignore\` / \`.aiderignore\`.
2. **Scope context explicitly**: Reference the exact 2–3 relevant files instead of letting the agent scan the entire repository.
3. **Reset threads per task**: Start a fresh session once a bug or feature is complete so stale diffs are not resent on every turn.
4. **Cap auto-approved steps**: Limit unattended retries to 5–8 steps so a stubborn build error does not trigger a 429 storm.

## 4. Code Privacy Reminder
Always verify your employer's policy and the provider's free-tier data-usage terms before sending proprietary code to a cloud API. For confidential repositories, stick to an offline [Ollama model](/en/local).`,
    },
  },
  {
    slug: 'rag-embedding-rerank-free-stack',
    date: '2026-11-26',
    category: 'rag',
    zh: {
      title: '零成本搭建 RAG 知识库：免费 Embedding、向量检索、Rerank 与生成组合方案',
      description: '拆解 RAG 管线的四个模块，对比全云端免费层与本地混合栈的分块大小、Top-K 召回与 Rerank 精排实践。',
      content: `想要让大模型基于你自己的文档、产品手册或私有笔记准确回答问题，RAG（检索增强生成）是比微调更轻量、也更容易零成本落地的方案。一套完整的 RAG 管线可以拆成四个独立组件，每一环都有可靠的免费实现。

## 1. 四层零成本技术栈选型

| 环节 | 推荐免费云端方案 | 推荐零费用本地/边缘方案 | 关键注意点 |
|---|---|---|---|
| **文本向量化（Embedding）** | Cloudflare Workers AI（BGE 系列，消耗 Neurons 极低） | Ollama 本地运行 \`bge-m3\` / \`nomic-embed-text\` | 建库与查询**必须使用同一个向量模型** |
| **向量存储（Vector DB）** | Cloudflare Vectorize / Supabase pgvector 免费层 | SQLite-vec / LanceDB（单文件零运维） | 10 万条以下文档无需重型分布式集群 |
| **重排精排（Rerank）** | Cohere Evaluation API（每月 1,000 次免费调用） | 本地轻量 Cross-Encoder 或 BM25 + 向量混合打分 | Rerank 能把 Top-20 粗排压成高质量 Top-4，直接省 60% 生成输入 Token |
| **最终生成（LLM）** | Gemini API 免费层 / OpenRouter / Groq | Ollama 本地 \`qwen2.5:7b\` 或 \`gemma3:12b\` | 强制要求“仅依据检索片段作答，未命中则明确说明” |

## 2. 决定 RAG 准确率的三个工程参数
很多免费 RAG 原型回答胡说八道，**80% 的原因不在生成模型不够强，而在分块与检索粗糙**：
1. **分块大小（Chunk Size）与重叠（Overlap）**：中文技术文档建议 **400–600 字 / 块**，重叠 **60–100 字**；优先按 Markdown 标题（\`##\` / \`###\`）和段落边界切分，绝不要把代码块或表格从正中间腰斩。
2. **混合检索（Hybrid Search = BM25 + Vector）**：纯向量检索对精确的错误码、函数名、型号（如 \`HTTP 429\`、\`RTX 4060\`）容易漏召回；加上关键词倒排（FTS5 / BM25）用 RRF 融合排序，准确率立竿见影提升。
3. **控制送入 LLM 的最终片段数**：粗排召回 15–20 条，经 Rerank 精选 **Top 3–5 条**（总计约 1,500–2,500 Token）再送给生成模型，既减少幻觉干扰，又避免把免费层 TPM 打爆。

## 3. 上线前必须做的最小离线评估
准备 15–20 个你最关心的真实问题（含 3 个“知识库里根本没有答案”的负样本）：
- **先测召回率（Recall@5）**：正确答案所在的文档块有没有进入 Top-5？如果没进，先调分块与混合检索，不要急着换大模型。
- **再测忠实度（Groundedness）**：针对 3 个负样本，模型是否老老实实回答“资料中未提及”，而不是自行编造。

用 [AI Token 额度估算器](/calculator) 切换到「RAG 知识库」预设，即可提前算出每日问答量对应的免费额度消耗。`,
    },
    en: {
      title: 'Zero-Cost RAG Stack: Combining Free Embeddings, Vector Search, Rerank & LLMs',
      description: 'Design a four-stage Retrieval-Augmented Generation pipeline using free cloud tiers or local models, with chunking, hybrid search, and offline evaluation tips.',
      content: `Retrieval-Augmented Generation (RAG) lets an LLM answer questions accurately over your own documentation and notes without expensive fine-tuning. Breaking RAG into four decoupled stages makes it straightforward to assemble a zero-cost stack.

## 1. Four-Stage Zero-Cost Architecture

| Stage | Free Cloud Option | Local / Edge Zero-Cost Option | Key Constraint |
|---|---|---|---|
| **Embeddings** | Cloudflare Workers AI (BGE models, very low Neuron cost) | Ollama \`nomic-embed-text\` or \`bge-m3\` | Indexing and queries must use the exact same embedding model |
| **Vector Store** | Cloudflare Vectorize or Supabase \`pgvector\` free tier | \`sqlite-vec\` or LanceDB (single-file) | Under 100K chunks, a single-node store is plenty |
| **Reranking** | Cohere Evaluation API (1,000 calls/month free) | Hybrid BM25 + Vector RRF or local cross-encoder | Compressing Top-20 to Top-4 cuts LLM input tokens by 60%+ |
| **Generation** | Gemini API Free Tier, OpenRouter, or Groq | Local Ollama \`qwen2.5:7b\` or \`gemma3:12b\` | Instruct the model to cite chunks and abstain when evidence is missing |

## 2. Three Parameters That Matter More Than Model Size
Most inaccurate RAG prototypes fail at retrieval rather than generation:
1. **Structure-Aware Chunking**: Split along Markdown headings and paragraphs at roughly **350–500 tokens per chunk** with **10%–15% overlap**. Never slice code blocks or tables in half.
2. **Hybrid Search (BM25 + Dense Vectors)**: Pure dense embeddings miss exact error codes, SKU strings, and symbol names. Combine full-text search (SQLite FTS5 / BM25) with vector similarity via Reciprocal Rank Fusion (RRF).
3. **Tight Final Context Budget**: Retrieve 15–20 candidates, rerank down to the best **3–5 chunks (~1,500–2,500 tokens)**, and keep generation prompts lean so you stay comfortably inside free TPM caps.

## 3. Minimal Offline Evaluation Before Launch
Maintain a fixed set of 15–20 realistic questions — including 3 unanswerable questions not present in your corpus. First verify **Recall@5** (did the right chunk get retrieved?), then verify **Groundedness** (does the model refuse cleanly on the 3 unanswerable queries?). Model your expected daily volume with the **RAG Docs** preset in our [AI Token Calculator](/en/calculator).`,
    },
  },
]
