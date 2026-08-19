// 内容工具：slug 生成、Markdown 极简渲染、HTML 转义、时间格式化、SEO 元信息

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function slugify(text) {
  const s = String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    // 去重音符号 + 只保留 ASCII 字母数字（URL 安全；中文名取英文部分）
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  if (s) return s
  // 纯中文/无英文名：用确定性短哈希兜底，保证唯一且 URL 安全
  let h = 0
  for (const ch of String(text || '')) h = (h * 31 + ch.codePointAt(0)) >>> 0
  return `item-${h.toString(36).slice(0, 8)}`
}

/**
 * 极简 Markdown 渲染（无依赖，Worker 安全）：
 * 支持 #/##/### 标题、- 无序列表、1. 有序列表、**加粗**、`行内代码`、[链接](url)、
 * 空行分段、> 引用。其余按段落输出（HTML 已转义，防 XSS）。
 */
export function renderMarkdown(md) {
  if (!md) return ''
  const lines = String(md).replace(/\r\n/g, '\n').split('\n')
  const html = []
  let inList = false
  let listType = 'ul'

  const closeList = () => {
    if (inList) {
      html.push(`</${listType}>`)
      inList = false
    }
  }

  const inline = (text) =>
    escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener nofollow" target="_blank">$1</a>')

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      closeList()
      continue
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      closeList()
      const level = h[1].length
      html.push(`<h${level}>${inline(h[2])}</h${level}>`)
      continue
    }
    const quote = line.match(/^>\s?(.*)$/)
    if (quote) {
      closeList()
      html.push(`<blockquote>${inline(quote[1])}</blockquote>`)
      continue
    }
    const ul = line.match(/^[-*]\s+(.*)$/)
    if (ul) {
      if (!inList) {
        inList = true
        listType = 'ul'
        html.push('<ul>')
      }
      html.push(`<li>${inline(ul[1])}</li>`)
      continue
    }
    const ol = line.match(/^\d+[.)]\s+(.*)$/)
    if (ol) {
      if (!inList || listType !== 'ol') {
        closeList()
        inList = true
        listType = 'ol'
        html.push('<ol>')
      }
      html.push(`<li>${inline(ol[1])}</li>`)
      continue
    }
    closeList()
    html.push(`<p>${inline(line)}</p>`)
  }
  closeList()
  return html.join('\n')
}

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(String(iso).includes('T') ? iso : iso.replace(' ', 'T') + 'Z')
  if (Number.isNaN(d.getTime())) return iso
  return d.toISOString().slice(0, 10)
}

/** 截断文本到 n 个字符 */
export function excerpt(text, n = 120) {
  const t = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length > n ? t.slice(0, n) + '…' : t
}

/** 站点基地址（供 canonical / sitemap 使用） */
export function siteUrl(env) {
  return (env.SITE_URL || '').replace(/\/+$/, '')
}

export function siteTitle() {
  return 'FreeTokenBox · 免费送 Token 合集'
}

export function siteDescription() {
  return 'FreeTokenBox 是一个收集所有免费赠送 AI Token / API 额度 / 算力的网站合集。收录 DeepSeek、OpenRouter、Google Gemini、Groq、Cloudflare Workers AI、Mistral 等平台免费 API 额度活动，一站式发现并领取免费 AI 资源。'
}

/** 网站 JSON-LD（WebSite + SearchAction） */
export function websiteJsonLd(env) {
  const base = siteUrl(env)
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FreeTokenBox',
    alternateName: '免费送 Token 合集',
    url: base || '/',
    description: siteDescription(),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${base}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/** 面包屑 JSON-LD */
export function breadcrumbJsonLd(items, env) {
  const base = siteUrl(env)
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url ? `${base}${item.url}` : undefined,
    })),
  }
}

/** ItemList JSON-LD（用于列表页） */
export function itemListJsonLd(items, env) {
  const base = siteUrl(env)
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '免费送 Token 合集',
    description: '收集所有免费赠送 AI Token / API 额度的网站与活动',
    itemListElement: items.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      url: `${base}/token/${t.slug}`,
      description: t.description,
    })),
  }
}

/** 根据 token 生成 JSON-LD（SEO / 广告投放友好） */
export function tokenJsonLd(token, env) {
  const base = siteUrl(env)
  const url = `${base}/token/${token.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: token.name,
    description: token.description,
    datePublished: token.created_at,
    dateModified: token.updated_at,
    author: { '@type': 'Organization', name: 'FreeTokenBox' },
    publisher: {
      '@type': 'Organization',
      name: 'FreeTokenBox',
      url: base || undefined,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(token.provider ? { provider: { '@type': 'Organization', name: token.provider } } : {}),
    ...(token.url ? { isBasedOn: token.url } : {}),
    ...(token.tags && token.tags.length ? { keywords: token.tags.join(', ') } : {}),
  }
}

/** FAQ JSON-LD（详情页自动生成常见问题） */
export function faqJsonLd(token) {
  const faqs = [
    {
      q: `${token.name} 是免费的吗？`,
      a: `是的，${token.name} 是完全免费的。${token.description} 你可以直接前往${token.provider || '官方'}页面领取。`,
    },
    {
      q: `如何领取 ${token.name}？`,
      a: `点击本页面上的"前往领取"按钮，即可跳转到${token.provider || '官方'}页面获取免费额度。整个过程无需付费。`,
    },
    ...(token.expiry_date
      ? [{
          q: `${token.name} 的活动截止时间是什么时候？`,
          a: `${token.name} 的活动截止日期为 ${formatDate(token.expiry_date)}，建议尽早领取。`,
        }]
      : []),
  ]
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

/** 第一批种子数据（手动录入示例）。真实线上条目请通过后台/接口核对更新。 */
export const SEED_TOKENS = [
  {
    name: 'DeepSeek-V4-Flash API 限时免费开放',
    slug: 'deepseek-v4-flash-api-free',
    description: 'DeepSeek-V4-Flash 模型 API 限时免费开放，调用积分消耗直接为 0，配合 BaiClaw / chat.b.ai 可零成本搭建 AI Agent。',
    provider: 'DeepSeek',
    url: 'https://chat.b.ai/key',
    category: 'free-api',
    tags: ['api', 'llm', 'deepseek', 'free-token'],
    is_featured: 1,
    sort_weight: 100,
    content: `**DeepSeek-V4-Flash API 限时免费开放**，调用积分消耗直接为 0。

表姐二话不说把免费 API 用了起来：

1/ 首先在 [https://baiclaw.b.ai](https://baiclaw.b.ai) 下载 BaiClaw，这样就不用自己搭建 AI Agent。

2/ 到 [https://chat.b.ai/key](https://chat.b.ai/key) 里获取 API，把 API 配置好之后，在对话框里选择对应模型，然后就可以开始使用了。

几步就能 Get 一个自己的 AI Agent 助理：日常查资料、写内容、跑任务、处理工作流都可以直接交给它。

> 模型免费 + API 免费 + Agent 现成，这才是"孙学"的正确打开方式。
> 能免费解决的事情，绝不多花一个 Token！`,
  },
  {
    name: 'OpenRouter 免费模型额度',
    slug: 'openrouter-free-models',
    description: 'OpenRouter 提供大量免费模型（:free 后缀），不限量调用，支持 Gemini / DeepSeek / Llama 等多种开源模型。',
    provider: 'OpenRouter',
    url: 'https://openrouter.ai/models?q=free',
    category: 'free-api',
    tags: ['api', 'llm', 'aggregator', 'free-token'],
    is_featured: 1,
    sort_weight: 90,
    content: `**OpenRouter** 提供大量 \`:free\` 后缀的免费模型，无需绑定支付方式即可调用。

- 支持的模型包括：Google Gemini 系列、DeepSeek、Llama、Mistral、Phi 等开源模型
- 免费模型按分钟/按日有速率限制，适合学习与小流量应用
- 同一个 API Key 可访问全部模型，一个端点切换模型非常简单

**使用方法**：注册后前往 Models 页面筛选 \`Free\` 标签，复制模型 ID 直接调用即可。`,
  },
  {
    name: 'Google AI Studio 免费额度',
    slug: 'google-ai-studio-free',
    description: 'Google AI Studio（Gemini）提供慷慨的免费额度，无需付费即可调用 Gemini 系列模型 API。',
    provider: 'Google',
    url: 'https://aistudio.google.com/',
    category: 'free-plan',
    tags: ['api', 'llm', 'gemini', 'free-plan'],
    is_featured: 0,
    sort_weight: 80,
    content: `**Google AI Studio** 面向开发者提供 Gemini 模型 API 的免费额度，日限额足够原型开发与个人项目使用。

- 支持 Gemini 2.5 / 2.0 Flash 等模型
- 有网页版聊天 + API Key 两种使用方式
- 免费层无需绑定信用卡

**注意**：免费额度按日刷新，超出后需升级付费套餐。`,
  },
  {
    name: 'Groq Cloud 免费 API',
    slug: 'groq-cloud-free-api',
    description: 'Groq 以超快推理速度著称，提供免费 API 调用额度，支持 Llama 系列模型，适合实时对话应用。',
    provider: 'Groq',
    url: 'https://console.groq.com/',
    category: 'free-api',
    tags: ['api', 'llm', 'fast-inference'],
    is_featured: 0,
    sort_weight: 70,
    content: `**Groq Cloud** 提供免费 API 额度，主打极速推理（LPU 芯片）。

- 支持 Llama 3.x 系列、Gemma 等模型
- 注册即送额度，按速率限制计费
- 开发者控制台提供 API Key 管理

适合对响应速度要求高的实时对话、语音助手类应用。`,
  },
  {
    name: 'Cloudflare Workers AI 免费额度',
    slug: 'cloudflare-workers-ai-free',
    description: 'Cloudflare 免费计划每月赠送 10,000 次 Workers AI 神经元（GPU 推理），可调用多种开源模型。',
    provider: 'Cloudflare',
    url: 'https://developers.cloudflare.com/workers-ai/',
    category: 'free-plan',
    tags: ['api', 'llm', 'serverless'],
    is_featured: 0,
    sort_weight: 60,
    content: `**Cloudflare Workers AI** 在免费计划下每月提供 10,000 次神经元（Neurons，GPU 推理计费单位），可调用 Llama、DeepSeek 等开源模型。

- 与 Cloudflare Workers 无缝集成，无需自建服务器
- 文本生成、图像生成、嵌入向量等多种能力
- 超出免费额度后按量付费，成本可控

非常适合 serverless 场景下的 AI 应用。`,
  },
  {
    name: 'Mistral La Plateforme 免费额度',
    slug: 'mistral-la-plateforme-free',
    description: 'Mistral 官方平台提供免费试验额度，可调用 Mistral Small / Medium 等模型 API。',
    provider: 'Mistral',
    url: 'https://console.mistral.ai/',
    category: 'free-plan',
    tags: ['api', 'llm', 'europe'],
    is_featured: 0,
    sort_weight: 50,
    content: `**Mistral La Plateforme** 为新用户提供免费试验额度，可调用 Mistral 系列模型。

- 注册即送试验额度
- 支持 API 与 SDK 调用
- 提供丰富的模型选择（Mistral Small / Medium / Large）

适合欧洲数据合规要求高的场景。`,
  },
  {
    name: '智谱 AI 开放平台（GLM）新用户送 Tokens',
    slug: 'zhipu-glm-free-tokens',
    description: '智谱 AI 开放平台新用户注册赠送 token 额度，可调用 GLM 系列模型 API，另有长期免费的 Flash 模型。',
    provider: '智谱 AI',
    url: 'https://open.bigmodel.cn',
    category: 'free-api',
    tags: ['api', 'llm', 'glm', 'china', 'free-token'],
    is_featured: 0,
    sort_weight: 45,
    content: `**智谱 AI 开放平台**（bigmodel.cn）面向开发者提供 GLM 系列模型 API。

- 新用户注册即赠送 token 额度，可用于调用 GLM 系列模型
- 提供长期免费的 Flash 模型，适合学习与小流量应用
- 网页端（智谱清言）+ API Key 两种使用方式

**使用方法**：注册后在开放平台创建 API Key，按官方文档调用即可。具体赠送额度与免费模型以官方页面为准。`,
  },
  {
    name: 'Moonshot（Kimi）开放平台送新用户额度',
    slug: 'moonshot-kimi-free-credit',
    description: 'Moonshot AI 开放平台（Kimi）新用户注册赠送 API 调用额度，可调用 Kimi 系列长上下文模型。',
    provider: 'Moonshot AI',
    url: 'https://platform.moonshot.cn',
    category: 'free-plan',
    tags: ['api', 'llm', 'kimi', 'china', 'free-token'],
    is_featured: 0,
    sort_weight: 44,
    content: `**Moonshot AI**（Kimi）开放平台面向开发者提供 Kimi 系列模型 API。

- 新用户注册赠送 API 调用额度
- Kimi 模型以超长上下文（128K+）见长，适合长文档处理
- 提供 OpenAI 兼容接口，迁移成本低

**使用方法**：注册后在控制台创建 API Key，按文档调用。赠送额度与规则以官方页面为准。`,
  },
  {
    name: '阿里云百炼（通义千问 Qwen）免费额度',
    slug: 'aliyun-bailian-qwen-free',
    description: '阿里云百炼平台新用户赠送 tokens，可调用通义千问 Qwen 系列模型，含长期免费额度。',
    provider: '阿里云',
    url: 'https://bailian.console.aliyun.com',
    category: 'free-plan',
    tags: ['api', 'llm', 'qwen', 'china', 'free-token'],
    is_featured: 0,
    sort_weight: 43,
    content: `**阿里云百炼**（通义千问 Qwen）是阿里云的一站式大模型服务平台。

- 新用户注册赠送 tokens，可调用 qwen-turbo / qwen-plus 等模型
- 提供长期免费额度与免费模型，适合个人开发者与学习
- 支持 OpenAI 兼容接口与多语言 SDK

**使用方法**：注册阿里云并开通百炼，获取 API Key 即可调用。具体赠送与免费规则以官方页面为准。`,
  },
  {
    name: '百度智能云千帆（文心一言）免费额度',
    slug: 'baidu-qianfan-free',
    description: '百度智能云千帆平台新用户赠送免费调用额度，可调用文心（ERNIE）系列大模型 API。',
    provider: '百度智能云',
    url: 'https://qianfan.cloud.baidu.com',
    category: 'free-plan',
    tags: ['api', 'llm', 'ernie', 'china', 'free-token'],
    is_featured: 0,
    sort_weight: 42,
    content: `**百度智能云千帆** 是百度的一站式大模型平台，提供文心（ERNIE）系列模型 API。

- 新用户注册赠送免费调用额度
- 提供文心一言等模型接口，以及模型训练/部署能力
- 支持多种编程语言 SDK

**使用方法**：注册百度智能云并开通千帆，创建应用获取 API Key 即可调用。赠送额度以官方页面为准。`,
  },
  {
    name: '讯飞星火（Spark）开放平台送 Tokens',
    slug: 'iflytek-spark-free-tokens',
    description: '讯飞星火认知大模型开放平台新用户注册赠送 tokens，可调用星火系列模型 API。',
    provider: '讯飞',
    url: 'https://xinghuo.xfyun.cn',
    category: 'free-api',
    tags: ['api', 'llm', 'spark', 'china', 'free-token'],
    is_featured: 0,
    sort_weight: 41,
    content: `**讯飞星火开放平台** 提供星火认知大模型 API。

- 新用户注册赠送 tokens，可调用星火系列模型
- 覆盖文本生成、语音识别/合成等多模态能力
- 提供网页端 + API 两种使用方式

**使用方法**：注册开放平台，创建应用获取 API Key 后按文档调用。赠送额度以官方页面为准。`,
  },
  {
    name: 'GitHub Models 免费体验多家模型',
    slug: 'github-models-free',
    description: 'GitHub Models 提供 OpenAI、Anthropic、Google、Meta 等多家前沿模型的免费限速体验，适合原型开发与学习。',
    provider: 'GitHub',
    url: 'https://github.com/marketplace/models',
    category: 'free-plan',
    tags: ['api', 'llm', 'github', 'multi-model', 'free-token'],
    is_featured: 0,
    sort_weight: 40,
    content: `**GitHub Models**（github.com/marketplace/models）让开发者免费体验多家前沿大模型。

- 覆盖 OpenAI、Anthropic、Google、Meta（Llama）、Mistral、DeepSeek 等
- 在 Playground 网页体验，或生成 API Key 接入自己的应用
- 免费额度受速率限制，适合原型开发、学习与测试

**使用方法**：登录 GitHub，进入 Models 市场选择模型，生成令牌即可调用。额度与限制以官方页面为准。`,
  },
  {
    name: 'Together AI 免费额度与免费模型',
    slug: 'together-ai-free',
    description: 'Together AI 新用户注册赠送 credits，并提供免费模型额度（限速），可调用 Llama 等开源模型 API。',
    provider: 'Together AI',
    url: 'https://www.together.ai',
    category: 'free-api',
    tags: ['api', 'llm', 'together', 'open-source'],
    is_featured: 0,
    sort_weight: 39,
    content: `**Together AI** 提供开源大模型的托管推理服务。

- 新用户注册赠送 credits
- 提供免费模型额度（带速率限制），可调用 Llama、DeepSeek 等
- 支持 OpenAI 兼容接口，部署与扩展简单

**使用方法**：注册后在控制台获取 API Key，选择免费模型调用即可。具体额度以官方页面为准。`,
  },
  {
    name: 'Replicate 新用户送 Credits',
    slug: 'replicate-free-credit',
    description: 'Replicate 新用户注册赠送 credits，可调用图像、视频、音频、文本等多种开源模型。',
    provider: 'Replicate',
    url: 'https://replicate.com',
    category: 'free-plan',
    tags: ['api', 'image', 'video', 'open-source'],
    is_featured: 0,
    sort_weight: 38,
    content: `**Replicate** 是一个开源模型托管平台，一行代码即可调用社区模型。

- 新用户注册赠送 credits
- 覆盖图像生成（Stable Diffusion 等）、视频、音频、文本模型
- 支持 Python / Node.js / cURL 调用

**使用方法**：注册后在账号设置生成 API Token 即可调用。赠送 credits 以官方页面为准。`,
  },
  {
    name: 'Pollinations 完全免费生成式 AI API',
    slug: 'pollinations-free-api',
    description: 'Pollinations 提供完全免费、无需 API Key 的文本与图像生成 API，适合学习、原型与低流量应用。',
    provider: 'Pollinations',
    url: 'https://pollinations.ai',
    category: 'free-api',
    tags: ['api', 'image', 'text', 'no-key'],
    is_featured: 0,
    sort_weight: 37,
    content: `**Pollinations** 提供无需注册、无需 API Key 的生成式 AI API。

- 文本生成与图像生成接口，直接 HTTP 调用即可
- 完全免费（按公平使用策略），适合学习与原型
- 提供多种模型可选

**使用方法**：直接拼接 URL 调用（如 \`https://image.pollinations.ai/prompt/...\`），详见官方文档。免费策略可能调整，请以官方页面为准。`,
  },
  {
    name: 'Cohere 免费试用 API',
    slug: 'cohere-free-trial',
    description: 'Cohere 提供免费试用 API（有限 token），可调用 Command 系列大模型，支持多语言与检索增强。',
    provider: 'Cohere',
    url: 'https://cohere.com',
    category: 'free-plan',
    tags: ['api', 'llm', 'cohere', 'enterprise'],
    is_featured: 0,
    sort_weight: 36,
    content: `**Cohere** 面向企业提供多语言大模型 API。

- 注册即获得免费试用 API（有限 token 额度）
- 主打 Command 系列模型、RAG（检索增强）与企业级能力
- 提供多种语言 SDK

**使用方法**：注册后在 Dashboard 获取 Trial Key 调用。免费试用额度与规则以官方页面为准。`,
  },
  {
    name: 'MiniMax 开放平台送 Tokens',
    slug: 'minimax-free-tokens',
    description: 'MiniMax 开放平台新用户注册赠送 tokens，可调用 MiniMax 文本、语音等多模态模型 API。',
    provider: 'MiniMax',
    url: 'https://platform.minimaxi.com',
    category: 'free-api',
    tags: ['api', 'llm', 'minimax', 'multimodal', 'free-token'],
    is_featured: 0,
    sort_weight: 35,
    content: `**MiniMax** 开放平台提供文本、语音等多模态大模型 API。

- 新用户注册赠送 tokens
- 覆盖文本生成、语音合成/识别等能力
- 提供 OpenAI 兼容接口与多语言 SDK

**使用方法**：注册后创建 API Key 调用。赠送额度以官方页面为准。`,
  },
]
