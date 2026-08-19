// FreeTokenBox —— 免费送 Token 合集
// Cloudflare Workers + Hono + D1
import { Hono } from 'hono'
import { html } from 'hono/html'
import {
  listTokens,
  getTokenBySlug,
  getTokenById,
  createToken,
  updateToken,
  deleteToken,
  listCategories,
} from './db.js'
import {
  slugify,
  escapeHtml,
  formatDate,
  excerpt,
  siteUrl,
  siteTitle,
  siteDescription,
  SEED_TOKENS,
} from './content.js'
import {
  issueSession,
  verifySession,
  checkPassword,
  isApiKeyValid,
  cookieHeaderFor,
  clearCookieHeader,
} from './auth.js'
import {
  layout,
  homePage,
  listPage,
  tokenPage,
  adminLoginPage,
  adminPage,
  adminFormPage,
} from './templates.js'
import { T, lp, langFromPath } from './i18n.js'

const app = new Hono()

// ---------- 域名规范化中间件（SEO）----------
// 仅对线上域名：1) www→裸域 2) workers.dev 预览域→裸域 3) http→https（301）
// localhost 本地开发直通，不做任何跳转
const CANONICAL_HOST = 'freetokenbox.com'
const DEV_HOST = 'freetokenbox.mergedao.workers.dev'
const isProdHost = (host) =>
  host === CANONICAL_HOST || host === `www.${CANONICAL_HOST}` || host === DEV_HOST

app.use('*', async (c, next) => {
  const url = new URL(c.req.url)
  const host = (c.req.header('host') || url.host).toLowerCase().split(':')[0]
  const proto = (c.req.header('x-forwarded-proto') || url.protocol.replace(':', '')).toLowerCase()

  if (!isProdHost(host)) return next()

  let target = null
  if (host === `www.${CANONICAL_HOST}`) target = CANONICAL_HOST
  else if (host === DEV_HOST) target = CANONICAL_HOST

  if (target) return c.redirect(`https://${target}${url.pathname}${url.search}`, 301)
  if (proto === 'http') return c.redirect(`https://${host}${url.pathname}${url.search}`, 301)
  await next()
})

// ---------- 缓存与安全头中间件（SEO / 性能）----------
// - HTML 页面：短缓存 + stale-while-revalidate，利于爬虫与回访
// - /api/* 与 /admin/*：no-store（动态数据）+ X-Robots-Tag noindex
// - 静态/机器可读文件（sitemap/robots/llms/ai.json/rss/tokens.md）：较长缓存
app.use('*', async (c, next) => {
  const path = c.req.path
  const isApi = path.startsWith('/api/')
  const isAdmin = path.startsWith('/admin')
  const isStatic =
    path === '/sitemap.xml' || path === '/robots.txt' || path === '/rss.xml' ||
    path === '/llms.txt' || path === '/llms-full.txt' || path === '/ai.json' ||
    path === '/tokens.md' || path === '/.well-known/ai-plugin.json'
  const isAsset = /\.(txt|xml|json|md|rss|png|svg|ico|webp|css|js)$/.test(path)

  // 安全头（所有响应）
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('X-Frame-Options', 'DENY')

  if (isApi || isAdmin) {
    c.header('Cache-Control', 'no-store, max-age=0')
    c.header('X-Robots-Tag', 'noindex, nofollow')
  } else if (isStatic || isAsset) {
    c.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  } else {
    c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400')
  }
  await next()
})

// ---------- 工具 ----------
const isAdminAuthed = async (c) => {
  if (await verifySession(c.env, c.req.header('Cookie'))) return true
  if (isApiKeyValid(c.env, c.req.header('X-API-Key'))) return true
  return false
}

async function readForm(c) {
  const body = await c.req.parseBody()
  const str = (v) => (typeof v === 'string' ? v.trim() : '')
  const tags = str(body.tags)
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
  return {
    name: str(body.name),
    slug: str(body.slug) || slugify(str(body.name)),
    description: str(body.description),
    content: str(body.content),
    provider: str(body.provider),
    url: str(body.url),
    category: str(body.category) || 'free-api',
    tags,
    expiry_date: str(body.expiry_date) || null,
    status: str(body.status) || 'published',
    is_featured: str(body.is_featured) === '1',
    sort_weight: Number(str(body.sort_weight)) || 0,
  }
}

// ---------- 公开页面（zh 原路径 + /en 前缀镜像） ----------
const renderHome = async (c, lang) => {
  const page = Math.max(1, Number(c.req.query('page')) || 1)
  const pageSize = 12
  const searchQuery = c.req.query('q') || ''
  const [result, featured, categories, statsResult] = await Promise.all([
    listTokens(c.env, { status: 'published', page, pageSize, query: searchQuery || undefined }),
    listTokens(c.env, { status: 'published', includeAll: false, pageSize: 100 }).then((r) =>
      r.items.filter((t) => t.is_featured)
    ),
    listCategories(c.env),
    listTokens(c.env, { status: 'published', includeAll: true, pageSize: 1 }),
  ])
  const stats = {
    total: statsResult.total,
    categories: categories.length,
    featured: featured.length,
  }
  const query = c.req.raw.url.split('?')[1] || ''
  return c.html(
    homePage({
      featured: searchQuery ? [] : featured,
      items: result.items,
      categories,
      page,
      totalPages: result.totalPages,
      env: c.env,
      query,
      searchQuery,
      stats,
      lang,
    })
  )
}

app.get('/', (c) => renderHome(c, 'zh'))
app.get('/en', (c) => renderHome(c, 'en'))
app.get('/en/', (c) => renderHome(c, 'en'))

const renderToken = async (c, lang) => {
  const token = await getTokenBySlug(c.env, c.req.param('slug'))
  if (!token || token.status !== 'published') {
    return c.notFound()
  }
  // 获取相关推荐：同分类的其他条目
  let related = []
  if (token.category) {
    const relResult = await listTokens(c.env, { status: 'published', category: token.category, pageSize: 5 })
    related = relResult.items.filter((t) => t.slug !== token.slug).slice(0, 4)
  }
  // 如果同分类不够，补充其他精选
  if (related.length < 4) {
    const more = await listTokens(c.env, { status: 'published', pageSize: 10 })
    for (const t of more.items) {
      if (t.slug !== token.slug && !related.find((r) => r.slug === t.slug)) {
        related.push(t)
        if (related.length >= 4) break
      }
    }
  }
  return c.html(tokenPage(token, c.env, related, lang))
}

app.get('/token/:slug', (c) => renderToken(c, 'zh'))
app.get('/en/token/:slug', (c) => renderToken(c, 'en'))

const renderCategory = async (c, lang) => {
  const category = c.req.param('category')
  const s = T(lang)
  const page = Math.max(1, Number(c.req.query('page')) || 1)
  const result = await listTokens(c.env, { status: 'published', category, page, pageSize: 24 })
  const query = c.req.raw.url.split('?')[1] || ''
  return c.html(
    listPage({
      title: s.categoryTitle(category),
      description: s.categoryDesc(category, result.total),
      items: result.items,
      categories: [],
      page,
      totalPages: result.totalPages,
      env: c.env,
      lang,
      path: `/category/${category}`,
      query,
      breadcrumbs: [
        { name: s.crumbHome, url: '/' },
        { name: category, url: `/category/${category}` },
      ],
    })
  )
}

app.get('/category/:category', (c) => renderCategory(c, 'zh'))
app.get('/en/category/:category', (c) => renderCategory(c, 'en'))

const renderTag = async (c, lang) => {
  const tag = c.req.param('tag')
  const s = T(lang)
  const page = Math.max(1, Number(c.req.query('page')) || 1)
  const result = await listTokens(c.env, { status: 'published', tag, page, pageSize: 24 })
  const query = c.req.raw.url.split('?')[1] || ''
  return c.html(
    listPage({
      title: s.tagTitle(tag),
      description: s.tagDesc(tag, result.total),
      items: result.items,
      categories: [],
      page,
      totalPages: result.totalPages,
      env: c.env,
      lang,
      path: `/tags/${tag}`,
      query,
      breadcrumbs: [
        { name: s.crumbHome, url: '/' },
        { name: `#${tag}`, url: `/tags/${tag}` },
      ],
    })
  )
}

app.get('/tags/:tag', (c) => renderTag(c, 'zh'))
app.get('/en/tags/:tag', (c) => renderTag(c, 'en'))

const renderAbout = (lang) => (c) => {
  const s = T(lang)
  const isEn = lang === 'en'
  const body = isEn
    ? html`<article class="article">
        <h1>About FreeTokenBox</h1>
        <div class="body">
          <p><strong>FreeTokenBox</strong> is a directory of every site and campaign giving away <strong>AI tokens, API credits, compute and coupons</strong> for free.</p>
          <p>Platforms we track include:</p>
          <ul>
            <li><strong>DeepSeek</strong> — DeepSeek-V4-Flash API free for a limited time</li>
            <li><strong>OpenRouter</strong> — many free models (<code>:free</code> suffix), incl. Gemini / DeepSeek / Llama</li>
            <li><strong>Google AI Studio</strong> — free Gemini API credits</li>
            <li><strong>Groq</strong> — free API with blazing-fast inference</li>
            <li><strong>Cloudflare Workers AI</strong> — 10,000 free neurons per month</li>
            <li><strong>Mistral</strong> — free trial credits for European open models</li>
          </ul>
          <h2>What makes us different</h2>
          <ul>
            <li>Every entry is a <strong>free resource</strong>, with the provider and official claim link attached</li>
            <li>Curated by hand via the admin panel; an <strong>open API</strong> and Agent Skill support automatic submissions</li>
            <li>SEO-friendly with rich structured data — easy for search engines and AI crawlers to index</li>
            <li>Content is for reference only; always check the official page</li>
          </ul>
          <h2>Open API</h2>
          <ul>
            <li><code>GET /api/tokens</code> — list all published free token offers</li>
            <li><code>GET /api/tokens/:slug</code> — get a single offer</li>
            <li><code>GET /api/stats</code> — site statistics</li>
          </ul>
          <h2>AI friendly</h2>
          <p>We publish <code>/llms.txt</code> and <code>/llms-full.txt</code> for AI crawlers and LLM tools, and every page ships with JSON-LD structured data.</p>
          <p>Never spend a token on what you can get for free.</p>
        </div>
      </article>`
    : html`<article class="article">
        <h1>关于 FreeTokenBox</h1>
        <div class="body">
          <p><strong>FreeTokenBox</strong>（免费送 Token 合集）致力于收集所有免费赠送 <strong>AI Token / API 额度 / 算力 / 优惠券</strong> 的网站与活动。</p>
          <p>我们收录的平台包括但不限于：</p>
          <ul>
            <li><strong>DeepSeek</strong> — DeepSeek-V4-Flash API 限时免费开放</li>
            <li><strong>OpenRouter</strong> — 大量免费模型（:free 后缀），支持 Gemini / DeepSeek / Llama 等</li>
            <li><strong>Google AI Studio</strong> — Gemini 模型免费 API 额度</li>
            <li><strong>Groq</strong> — 超快推理速度的免费 API</li>
            <li><strong>Cloudflare Workers AI</strong> — 每月 10,000 次免费神经元</li>
            <li><strong>Mistral</strong> — 欧洲开源模型免费试验额度</li>
          </ul>
          <h2>我们的特色</h2>
          <ul>
            <li>所有条目均为<strong>免费资源</strong>，标注提供方与官方领取地址</li>
            <li>支持通过后台手工录入，也提供<strong>开放 API</strong> 与 Agent Skill 自动录入</li>
            <li>SEO 友好，结构化数据完善，方便搜索引擎和 AI 爬虫索引</li>
            <li>站内内容仅供学习参考，请以官方页面为准</li>
          </ul>
          <h2>开放 API</h2>
          <p>我们提供 RESTful API 供开发者使用：</p>
          <ul>
            <li><code>GET /api/tokens</code> — 获取所有已发布的免费 Token 列表</li>
            <li><code>GET /api/tokens/:slug</code> — 获取单个 Token 详情</li>
            <li><code>GET /api/stats</code> — 获取统计数据</li>
          </ul>
          <h2>AI 友好</h2>
          <p>本站提供 <code>/llms.txt</code> 和 <code>/llms-full.txt</code> 供 AI 爬虫和 LLM 工具索引，所有内容均有 JSON-LD 结构化数据标注。</p>
          <p>能免费解决的事情，绝不多花一个 Token！</p>
        </div>
      </article>`
  return c.html(
    layout({
      title: isEn ? 'About FreeTokenBox · Free AI Tokens & API Credits' : '关于 FreeTokenBox · 免费 AI Token 聚合平台',
      description: isEn
        ? 'FreeTokenBox is a public directory of free AI tokens, API credits and compute — free resources from DeepSeek, OpenRouter, Google Gemini, Groq, Cloudflare Workers AI and more.'
        : 'FreeTokenBox 是一个收集所有免费赠送 AI Token / API 额度 / 算力的网站合集公益项目。收录 DeepSeek、OpenRouter、Google Gemini、Groq、Cloudflare Workers AI 等平台免费资源。',
      path: '/about',
      env: c.env,
      lang,
      breadcrumbs: [
        { name: s.crumbHome, url: '/' },
        { name: isEn ? 'About' : '关于', url: '/about' },
      ],
      body,
    })
  )
}

app.get('/about', renderAbout('zh'))
app.get('/en/about', renderAbout('en'))

const staticTextPage = (path, zh, en) => (c) => {
  const lang = langFromPath(c.req.path)
  const p = lang === 'en' ? en : zh
  return c.html(
    layout({
      title: `${p.title} · FreeTokenBox`,
      description: p.title,
      path,
      env: c.env,
      lang,
      breadcrumbs: [
        { name: T(lang).crumbHome, url: '/' },
        { name: p.title, url: path },
      ],
      body: html`<article class="article"><h1>${p.title}</h1><div class="body">${p.lines.map((l) => html`<p>${l}</p>`)}</div></article>`,
    })
  )
}

app.get('/privacy', staticTextPage('/privacy', {
  title: '隐私政策',
  lines: [
    'FreeTokenBox 尊重并保护访客隐私。',
    '本站不主动收集个人身份信息；如未来接入 Google AdSense，广告服务可能使用 Cookie 提供个性化广告，详情见 Google 隐私政策。',
    '本政策如有更新，将在本页面发布。',
  ],
}, {
  title: 'Privacy Policy',
  lines: [
    'FreeTokenBox respects and protects visitor privacy.',
    'We do not collect personal information. If Google AdSense is enabled in the future, the ad service may use cookies for personalized ads — see Google\'s privacy policy for details.',
    'Any update to this policy will be published on this page.',
  ],
}))
app.get('/terms', staticTextPage('/terms', {
  title: '使用条款',
  lines: [
    'FreeTokenBox 收录的信息来自公开渠道，仅供学习参考，不构成任何建议。',
    '各平台免费额度与活动规则可能随时变化，请以官方页面为准。',
    '本站对链接指向的第三方内容不承担责任。',
  ],
}, {
  title: 'Terms of Use',
  lines: [
    'Information on FreeTokenBox comes from public sources and is for reference only; it does not constitute advice of any kind.',
    'Free quotas and campaign rules may change at any time — always check the official page.',
    'We are not responsible for content on third-party sites we link to.',
  ],
}))
app.get('/en/privacy', staticTextPage('/privacy', {
  title: '隐私政策',
  lines: [
    'FreeTokenBox 尊重并保护访客隐私。',
    '本站不主动收集个人身份信息；如未来接入 Google AdSense，广告服务可能使用 Cookie 提供个性化广告，详情见 Google 隐私政策。',
    '本政策如有更新，将在本页面发布。',
  ],
}, {
  title: 'Privacy Policy',
  lines: [
    'FreeTokenBox respects and protects visitor privacy.',
    'We do not collect personal information. If Google AdSense is enabled in the future, the ad service may use cookies for personalized ads — see Google\'s privacy policy for details.',
    'Any update to this policy will be published on this page.',
  ],
}))
app.get('/en/terms', staticTextPage('/terms', {
  title: '使用条款',
  lines: [
    'FreeTokenBox 收录的信息来自公开渠道，仅供学习参考，不构成任何建议。',
    '各平台免费额度与活动规则可能随时变化，请以官方页面为准。',
    '本站对链接指向的第三方内容不承担责任。',
  ],
}, {
  title: 'Terms of Use',
  lines: [
    'Information on FreeTokenBox comes from public sources and is for reference only; it does not constitute advice of any kind.',
    'Free quotas and campaign rules may change at any time — always check the official page.',
    'We are not responsible for content on third-party sites we link to.',
  ],
}))

// ---------- 品牌标识（logo.svg，ai-plugin.json 引用） ----------
app.get('/logo.svg', (c) =>
  c.text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8.7" fill="#059669"/><circle cx="16" cy="7.9" r="2.4" fill="#fff"/><path d="M7.6 13.3h16.8" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><rect x="9.9" y="13.3" width="12.2" height="10.1" rx="2.1" fill="none" stroke="#fff" stroke-width="2.5"/></svg>',
    200,
    { 'Content-Type': 'image/svg+xml' }
  )
)

// ---------- SEO 文件 ----------
app.get('/robots.txt', async (c) => {
  const base = siteUrl(c.env)
  const sitemap = base ? `Sitemap: ${base}/sitemap.xml` : ''
  return c.text(`User-agent: *
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /ai.json
Allow: /tokens.md
Allow: /api/docs
Allow: /api/openapi.json
Disallow: /admin
Disallow: /api/tokens
Disallow: /api/stats

${sitemap}
`)
})

// ---------- llms.txt — AI 爬虫友好 ----------
app.get('/llms.txt', async (c) => {
  const base = siteUrl(c.env)
  const result = await listTokens(c.env, { status: 'published', includeAll: true, pageSize: 500 })
  const items = result.items
  const lines = [
    `# FreeTokenBox`,
    ``,
    `> FreeTokenBox 是一个收集所有免费赠送 AI Token / API 额度 / 算力的网站合集。收录 DeepSeek、OpenRouter、Google Gemini、Groq、Cloudflare Workers AI、Mistral 等平台免费 API 额度活动。`,
    ``,
    `## 主要页面`,
    ``,
    `- [首页](${base}/): 免费送 Token 合集首页，浏览全部免费条目`,
    `- [关于页面](${base}/about): 项目介绍与开放 API 说明`,
    `- [API 文档](${base}/api/docs): RESTful API 文档（含字段说明）`,
    ``,
    `## 机器可读接口（Agent / LLM 推荐）`,
    ``,
    `- [JSON 数据](${base}/ai.json): 全部条目结构化 JSON`,
    `- [OpenAPI 规范](${base}/api/openapi.json): 标准 OpenAPI 3.0 规范`,
    `- [Markdown 导出](${base}/tokens.md): 全部条目 Markdown 文本`,
    `- [REST API](${base}/api/tokens): 分页/分类/标签/搜索 JSON 接口`,
    ``,
    `## 免费 Token 列表`,
    ``,
    ...items.map((t) => `- [${t.name}](${base}/token/${t.slug}): ${excerpt(t.description, 100)}`),
    ``,
    `## 分类`,
    ``,
    ...items
      .reduce((acc, t) => {
        if (t.category && !acc.includes(t.category)) acc.push(t.category)
        return acc
      }, [])
      .map((cat) => `- [${cat} 分类](${base}/category/${cat})`),
    ``,
    `## 链接`,
    ``,
    `- [Sitemap XML](${base}/sitemap.xml)`,
    `- [RSS Feed](${base}/rss.xml)`,
    `- [完整 llms.txt](${base}/llms-full.txt)`,
  ]
  return c.text(lines.join('\n'), 200, { 'Content-Type': 'text/plain; charset=utf-8' })
})

// ---------- llms-full.txt — 详细内容供 AI 训练/索引 ----------
app.get('/llms-full.txt', async (c) => {
  const base = siteUrl(c.env)
  const result = await listTokens(c.env, { status: 'published', includeAll: true, pageSize: 500 })
  const items = result.items
  const sections = [
    `# FreeTokenBox — 免费送 Token 合集完整内容`,
    ``,
    `> 站点: ${base}`,
    `> 描述: ${siteDescription()}`,
    `> 条目总数: ${result.total}`,
    `> 更新时间: ${new Date().toISOString()}`,
    ``,
    `---`,
    ``,
  ]
  for (const t of items) {
    sections.push(`## ${t.name}`)
    sections.push(``)
    sections.push(`- URL: ${base}/token/${t.slug}`)
    if (t.provider) sections.push(`- 提供方: ${t.provider}`)
    if (t.url) sections.push(`- 领取地址: ${t.url}`)
    if (t.category) sections.push(`- 分类: ${t.category}`)
    if (t.tags && t.tags.length) sections.push(`- 标签: ${t.tags.join(', ')}`)
    if (t.expiry_date) sections.push(`- 截止日期: ${formatDate(t.expiry_date)}`)
    sections.push(``)
    sections.push(`### 简介`)
    sections.push(t.description)
    sections.push(``)
    if (t.content) {
      // 去除 markdown 格式符号，保留纯文本
      const plainContent = t.content
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1 ($2)')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^#{1,3}\s+/gm, '')
        .replace(/^>\s?/gm, '')
      sections.push(`### 详细内容`)
      sections.push(plainContent)
      sections.push(``)
    }
    sections.push(`---`)
    sections.push(``)
  }
  return c.text(sections.join('\n'), 200, { 'Content-Type': 'text/plain; charset=utf-8' })
})

// ---------- AI 友好 JSON 接口 ----------
app.get('/ai.json', async (c) => {
  const base = siteUrl(c.env)
  const result = await listTokens(c.env, { status: 'published', includeAll: true, pageSize: 500 })
  const items = result.items
  return c.json({
    site: 'FreeTokenBox',
    description: siteDescription(),
    url: base,
    total: result.total,
    updated: new Date().toISOString(),
    tokens: items.map((t) => ({
      name: t.name,
      slug: t.slug,
      url: `${base}/token/${t.slug}`,
      claim_url: t.url,
      provider: t.provider,
      category: t.category,
      tags: t.tags,
      description: t.description,
      expiry_date: t.expiry_date,
      is_free: true,
      created_at: t.created_at,
      updated_at: t.updated_at,
    })),
  })
})

// ---------- AI Agent 插件清单（OpenAI plugin manifest，便于 Agent 发现 API） ----------
app.get('/.well-known/ai-plugin.json', async (c) => {
  const base = siteUrl(c.env)
  const result = await listTokens(c.env, { status: 'published', includeAll: true, pageSize: 1 })
  return c.json({
    schema_version: 'v1',
    name_for_human: 'FreeTokenBox',
    name_for_model: 'freetokenbox',
    description_for_human: '免费送 Token 合集：查找并录入免费 AI token / API 额度。',
    description_for_model:
      'FreeTokenBox is a directory of free AI tokens, API credits and compute offers. ' +
      'Use GET /api/tokens to list free offers, GET /api/tokens/:slug for details. ' +
      'Admins can POST/PATCH/DELETE /api/tokens with X-API-Key to add, update or remove entries. ' +
      'Fetched data may help answer questions about free AI API offers.',
    auth: { type: 'none' },
    api: { type: 'openapi', url: `${base}/api/openapi.json`, has_user_authentication: false },
    logo_url: `${base}/logo.svg`,
    contact_email: 'admin@freetokenbox.com',
    legal_info_url: `${base}/terms`,
  })
})

// ---------- OpenAPI 规范（Agent / 工具自动发现） ----------
app.get('/api/openapi.json', async (c) => {
  const base = siteUrl(c.env)
  return c.json({
    openapi: '3.0.0',
    info: { title: 'FreeTokenBox API', version: '1.0.0', description: '免费送 Token 合集开放接口' },
    servers: [{ url: base }],
    paths: {
      '/api/tokens': {
        get: {
          summary: '列出免费 Token 条目',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'tag', in: 'query', schema: { type: 'string' } },
            { name: 'q', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { '200': { description: 'OK' } },
        },
        post: {
          summary: '新增条目（需 X-API-Key）',
          security: [{ apiKey: [] }],
          responses: { '201': { description: 'Created' }, '401': { description: 'Unauthorized' } },
        },
      },
      '/api/tokens/{slug}': {
        get: { summary: '获取单条详情', parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
        patch: { summary: '更新条目（需 X-API-Key）', security: [{ apiKey: [] }], responses: { '200': { description: 'OK' } } },
        delete: { summary: '删除条目（需 X-API-Key）', security: [{ apiKey: [] }], responses: { '200': { description: 'OK' } } },
      },
      '/api/stats': { get: { summary: '站点统计', responses: { '200': { description: 'OK' } } } },
    },
    components: { securitySchemes: { apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' } } },
  })
})

// ---------- API 文档页（人类 + Agent 友好） ----------
app.get('/api/docs', async (c) => {
  const base = siteUrl(c.env)
  const body = html`<article class="article">
    <h1>API 文档</h1>
    <div class="body">
      <p>FreeTokenBox 开放接口，供第三方与 AI Agent 消费。所有读接口无需鉴权；写接口需 <code>X-API-Key</code>（环境变量 <code>API_KEYS</code> 中的任意一个）。</p>
      <h2>读取</h2>
      <pre><code>GET ${base}/api/tokens?category=free-api&tag=llm&q=deepseek&page=1&pageSize=50
GET ${base}/api/tokens/:slug
GET ${base}/api/stats
GET ${base}/ai.json</code></pre>
      <h2>写入（需鉴权）</h2>
      <pre><code>POST   ${base}/api/tokens          # 新增
PATCH  ${base}/api/tokens/:slug     # 更新（部分字段）
DELETE ${base}/api/tokens/:slug     # 删除</code></pre>
      <h2>字段</h2>
      <table class="list">
        <thead><tr><th>字段</th><th>说明</th></tr></thead>
        <tbody>
          <tr><td>name</td><td>名称（必填）</td></tr>
          <tr><td>description</td><td>一句话简介（必填）</td></tr>
          <tr><td>content</td><td>Markdown 长文</td></tr>
          <tr><td>provider / url</td><td>提供方 / 领取地址</td></tr>
          <tr><td>category</td><td>free-api | free-plan | giveaways | coupons | other</td></tr>
          <tr><td>tags</td><td>字符串数组</td></tr>
          <tr><td>status</td><td>published | draft</td></tr>
          <tr><td>is_featured</td><td>是否精选</td></tr>
        </tbody>
      </table>
      <h2>机器可读</h2>
      <ul>
        <li><a href="${base}/api/openapi.json">OpenAPI 规范（/api/openapi.json）</a></li>
        <li><a href="${base}/.well-known/ai-plugin.json">AI 插件清单</a></li>
        <li><a href="${base}/tokens.md">Markdown 导出（/tokens.md）</a></li>
        <li><a href="${base}/llms.txt">llms.txt</a></li>
      </ul>
    </div>
  </article>`
  return c.html(layout({ title: 'API 文档 · FreeTokenBox', description: 'FreeTokenBox 开放接口文档', path: '/api/docs', env: c.env, body }))
})

// ---------- 全量 Markdown 导出（LLM / Agent 友好） ----------
app.get('/tokens.md', async (c) => {
  const base = siteUrl(c.env)
  const result = await listTokens(c.env, { status: 'published', includeAll: true, pageSize: 500 })
  const items = result.items
  const lines = [
    '# FreeTokenBox — 免费送 Token 合集（Markdown 导出）',
    '',
    `共 ${result.total} 条免费资源，更新时间：${new Date().toISOString().slice(0, 10)}。`,
    '',
    ...items.map((t) => {
      const tags = (t.tags || []).join(', ')
      return [
        `## ${t.name}`,
        '',
        `- 提供方：${t.provider || '-'}`,
        `- 领取地址：${t.url || '-'}`,
        `- 分类：${t.category}${tags ? `｜标签：${tags}` : ''}${t.expiry_date ? `｜截止：${t.expiry_date}` : ''}`,
        `- 详情页：${base}/token/${t.slug}`,
        '',
        t.description || '',
        '',
      ].join('\n')
    }),
  ]
  return c.text(lines.join('\n'), 200, { 'Content-Type': 'text/markdown; charset=utf-8' })
})

app.get('/sitemap.xml', async (c) => {
  const base = siteUrl(c.env)
  const [result, categories] = await Promise.all([
    listTokens(c.env, { status: 'published', includeAll: true, pageSize: 1000 }),
    listCategories(c.env),
  ])
  const items = result.items
  // 收集所有标签
  const allTags = new Set()
  items.forEach((t) => (t.tags || []).forEach((tag) => allTags.add(tag)))

  const urls = [
    { loc: `${base}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${base}/about`, priority: '0.6', changefreq: 'monthly' },
    { loc: `${base}/privacy`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${base}/terms`, priority: '0.3', changefreq: 'yearly' },
    ...categories.map((c2) => ({ loc: `${base}/category/${c2.name}`, priority: '0.7', changefreq: 'daily' })),
    ...[...allTags].map((tag) => ({ loc: `${base}/tags/${tag}`, priority: '0.5', changefreq: 'weekly' })),
    ...items.map((t) => ({ loc: `${base}/token/${t.slug}`, priority: '0.8', changefreq: 'weekly', lastmod: formatDate(t.updated_at) })),
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeHtml(u.loc)}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : `<lastmod>${formatDate(new Date().toISOString())}</lastmod>`}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`
  return c.text(xml, 200, { 'Content-Type': 'application/xml' })
})

app.get('/rss.xml', async (c) => {
  const base = siteUrl(c.env)
  const result = await listTokens(c.env, { status: 'published', includeAll: true, pageSize: 50 })
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${siteTitle()}</title>
  <link>${base}/</link>
  <description>免费送 Token 合集 — 收集所有免费赠送 AI Token / API 额度的网站与活动</description>
  <language>zh-cn</language>
  <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${result.items
  .map(
    (t) => `  <item>
    <title>${escapeHtml(t.name)}</title>
    <link>${base}/token/${t.slug}</link>
    <guid isPermaLink="true">${base}/token/${t.slug}</guid>
    <description>${escapeHtml(t.description)}</description>
    ${t.category ? `<category>${escapeHtml(t.category)}</category>` : ''}
    <pubDate>${new Date(t.created_at && t.created_at.includes('T') ? t.created_at : (t.created_at || '').replace(' ', 'T') + 'Z').toUTCString()}</pubDate>
  </item>`
  )
  .join('\n')}
</channel>
</rss>`
  return c.text(rss, 200, { 'Content-Type': 'application/rss+xml' })
})

// ---------- 开放 API ----------
app.get('/api/tokens', async (c) => {
  const page = Math.max(1, Number(c.req.query('page')) || 1)
  const category = c.req.query('category')
  const tag = c.req.query('tag')
  const query = c.req.query('q')
  const pageSize = Math.min(Number(c.req.query('pageSize')) || 50, 200)
  const result = await listTokens(c.env, { status: 'published', category, tag, query, page, pageSize })
  return c.json(result)
})

app.get('/api/tokens/:slug', async (c) => {
  const token = await getTokenBySlug(c.env, c.req.param('slug'))
  if (!token) return c.json({ error: 'not_found' }, 404)
  return c.json({ item: token })
})

app.get('/api/stats', async (c) => {
  const [total, categories] = await Promise.all([
    listTokens(c.env, { status: 'published', includeAll: true, pageSize: 1 }),
    listCategories(c.env),
  ])
  return c.json({ total: total.total, categories })
})

// ---------- 写接口（管理员：Cookie 或 X-API-Key） ----------
app.post('/api/tokens', async (c) => {
  if (!(await isAdminAuthed(c))) return c.json({ error: 'unauthorized' }, 401)
  try {
    const body = await c.req.json()
    if (!body.name) return c.json({ error: 'name_required' }, 400)
    const data = {
      name: String(body.name),
      slug: body.slug ? String(body.slug) : slugify(String(body.name)),
      description: String(body.description || ''),
      content: String(body.content || ''),
      provider: String(body.provider || ''),
      url: String(body.url || ''),
      category: String(body.category || 'free-api'),
      tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
      expiry_date: body.expiry_date ? String(body.expiry_date) : null,
      status: body.status === 'draft' ? 'draft' : 'published',
      is_featured: !!body.is_featured,
      sort_weight: Number(body.sort_weight) || 0,
    }
    const token = await createToken(c.env, data)
    return c.json({ ok: true, item: token }, 201)
  } catch (err) {
    return c.json({ error: 'invalid_json', detail: String(err && err.message || err) }, 400)
  }
})

app.patch('/api/tokens/:slug', async (c) => {
  if (!(await isAdminAuthed(c))) return c.json({ error: 'unauthorized' }, 401)
  const body = await c.req.json().catch(() => ({}))
  const token = await updateToken(c.env, c.req.param('slug'), body)
  if (!token) return c.json({ error: 'not_found' }, 404)
  return c.json({ ok: true, item: token })
})

app.delete('/api/tokens/:slug', async (c) => {
  if (!(await isAdminAuthed(c))) return c.json({ error: 'unauthorized' }, 401)
  const ok = await deleteToken(c.env, c.req.param('slug'))
  if (!ok) return c.json({ error: 'not_found' }, 404)
  return c.json({ ok: true })
})

// ---------- 后台 ----------
app.get('/admin/login', (c) => {
  return c.html(adminLoginPage({ env: c.env }))
})

app.post('/admin/login', async (c) => {
  const body = await c.req.parseBody()
  const password = typeof body.password === 'string' ? body.password : ''
  if (!c.env.ADMIN_PASSWORD) {
    return c.html(adminLoginPage({ error: '服务端未配置 ADMIN_PASSWORD，无法登录。', env: c.env }), 500)
  }
  if (!checkPassword(c.env, password)) {
    return c.html(adminLoginPage({ error: '密码错误，请重试。', env: c.env }), 401)
  }
  const token = await issueSession(c.env)
  c.header('Set-Cookie', cookieHeaderFor(token))
  return c.redirect('/admin')
})

app.post('/admin/logout', (c) => {
  c.header('Set-Cookie', clearCookieHeader())
  return c.redirect('/admin/login')
})

// 后台保护中间件（页面类）
const adminGuard = async (c, next) => {
  if (await isAdminAuthed(c)) return next()
  return c.redirect('/admin/login')
}

app.get('/admin', adminGuard, async (c) => {
  const result = await listTokens(c.env, { includeAll: true, pageSize: 200 })
  const flash = c.get('flash') || null
  const categories = await listCategories(c.env)
  return c.html(adminPage({ tokens: result.items, flash, env: c.env, categories }))
})

app.get('/admin/new', adminGuard, (c) => c.html(adminFormPage({ isNew: true, env: c.env })))

app.post('/admin/new', adminGuard, async (c) => {
  const data = await readForm(c)
  if (!data.name) return c.html(adminFormPage({ isNew: true, env: c.env, flash: { type: 'err', msg: '名称不能为空' } }))
  try {
    await createToken(c.env, data)
  } catch (err) {
    const msg = String(err && err.message || err).includes('UNIQUE')
      ? 'Slug 已存在，请换一个 slug 或留空自动生成。'
      : `保存失败：${String(err && err.message || err)}`
    return c.html(adminFormPage({ isNew: true, env: c.env, flash: { type: 'err', msg } }))
  }
  return c.redirect('/admin')
})

app.get('/admin/edit/:slug', adminGuard, async (c) => {
  const token = await getTokenBySlug(c.env, c.req.param('slug'))
  if (!token) return c.notFound()
  return c.html(adminFormPage({ token, isNew: false, env: c.env }))
})

app.post('/admin/edit/:slug', adminGuard, async (c) => {
  const data = await readForm(c)
  if (!data.name) {
    return c.html(adminFormPage({ isNew: false, env: c.env, flash: { type: 'err', msg: '名称不能为空' } }))
  }
  const token = await updateToken(c.env, c.req.param('slug'), data)
  if (!token) return c.notFound()
  return c.redirect('/admin')
})

app.post('/admin/delete/:slug', adminGuard, async (c) => {
  await deleteToken(c.env, c.req.param('slug'))
  return c.redirect('/admin')
})

app.post('/admin/seed', adminGuard, async (c) => {
  let created = 0
  let skipped = 0
  for (const seed of SEED_TOKENS) {
    const existing = await getTokenBySlug(c.env, seed.slug)
    if (existing) {
      skipped++
      continue
    }
    await createToken(c.env, {
      ...seed,
      slug: seed.slug || slugify(seed.name),
      tags: seed.tags || [],
    })
    created++
  }
  c.set('flash', { type: 'ok', msg: `导入完成：新增 ${created} 条，跳过 ${skipped} 条已存在。` })
  return c.redirect('/admin')
})

// ---------- 404 / 错误 ----------
app.notFound((c) =>
  c.html(
    layout({
      title: '404 · FreeTokenBox',
      description: '页面不存在',
      path: c.req.path,
      env: c.env,
      body: html`<div class="article" style="text-align:center"><h1>404</h1><p>页面不存在或已下线。</p><p><a class="btn" href="/">返回首页</a></p></div>`,
    }),
    404
  )
)

app.onError((err, c) => {
  console.error('FreeTokenBox error:', err)
  return c.json({ error: 'internal_error', detail: String(err && err.message || err) }, 500)
})

export default app
