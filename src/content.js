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
]
