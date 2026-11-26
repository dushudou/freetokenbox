import { registerXiaodou, XIAODOU_LINKS_CHECKED, XIAODOU_PATH, XIAODOU_SOURCES } from './xiaodou.js'
import { registerCalculator, CALCULATOR_UPDATED } from './calculator.js'
import { categoryLabel } from './i18n.js'
import { OG_IMAGE_BASE64 } from './og-image.js'
import { registerEditorial } from './editorial.js'
import { registerLocalModels, LOCAL_MODELS, LOCAL_UPDATED } from './local-models.js'
import { REVIEWS, reviewFor, isCurrent } from './reviews.js'
import { GUIDES, CONTENT_DATE } from './guides.js'
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
import { MODEL_LOGOS } from './logos.js'
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
  const headerHost = (c.req.header('host') || url.host).toLowerCase().split(':')[0]
  const proto = (c.req.header('x-forwarded-proto') || url.protocol.replace(':', '')).toLowerCase()

  // wrangler dev 会把 Host 头和 c.req.url 都覆盖为 routes 里的域名（如 freetokenbox.com），
  // 无法通过 host 区分本地/线上 —— 用 DEV_MODE 环境变量（仅 .dev.vars 设置）跳过重定向
  if (c.env.DEV_MODE) return next()
  if (!isProdHost(headerHost)) return next()

  let target = null
  if (headerHost === `www.${CANONICAL_HOST}`) target = CANONICAL_HOST
  else if (headerHost === DEV_HOST) target = CANONICAL_HOST

  if (target) return c.redirect(`https://${target}${url.pathname}${url.search}`, 301)
  if (proto === 'http') return c.redirect(`https://${headerHost}${url.pathname}${url.search}`, 301)
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
    path === '/tokens.md' || path === '/local.md' || path === '/local.json' || path === '/.well-known/ai-plugin.json'
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

app.use('*', async (c, next) => {
  const u = new URL(c.req.url)
  if (u.pathname === '/en') return c.redirect('/en/' + u.search, 301)
  if (u.pathname.length > 1 && u.pathname !== '/en/' && u.pathname.endsWith('/') && !u.pathname.startsWith('/api/')) {
    return c.redirect(u.pathname.replace(/\/+$/, '') + u.search, 301)
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
const pageNumber = c => Math.max(1, Math.min(10000, Math.floor(Number(c.req.query('page')) || 1)))
async function currentListing(env, { page = 1, pageSize = 12, category, tag, query } = {}) {
  const all = await listTokens(env, { status: 'published', pageSize: 1000 })
  const q = (query || '').toLowerCase()
  const items = all.items.filter(isCurrent).filter(t => (!category || t.category === category) && (!tag || t.tags.includes(tag)) && (!q || `${t.name} ${t.description} ${t.provider} ${REVIEWS[t.slug]?.en?.name || ''} ${REVIEWS[t.slug]?.en?.description || ''} ${t.tags.join(' ')}`.toLowerCase().includes(q)))
    .sort((a,b) => b.sort_weight - a.sort_weight || b.id - a.id)
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize, totalPages: Math.max(1, Math.ceil(items.length / pageSize)) }
}
const renderHome = async (c, lang) => {
  const page = pageNumber(c), pageSize = 10, searchQuery = (c.req.query('q') || '').slice(0,200)
  const all = await currentListing(c.env, { pageSize: 1000 })
  const result = await currentListing(c.env, { page, pageSize, query: searchQuery })
  if (page > result.totalPages) return c.notFound()
  const featured = all.items.filter(t => t.is_featured).slice(0,2)
  const cats = new Map()
  for (const t of all.items) cats.set(t.category, (cats.get(t.category) || 0) + 1)
  const categories = [...cats].map(([name,count]) => ({name,count}))
  const stats = {total:all.total,categories:categories.length,featured:featured.length}
  const modelCounts = MODEL_LOGOS.map(m => all.items.filter(t => (m.keywords || []).some(k => `${t.name} ${t.description} ${t.provider} ${t.tags.join(' ')}`.toLowerCase().includes(k.toLowerCase()))).length)
  return c.html(homePage({ featured: searchQuery || page > 1 ? [] : featured, items:result.items, categories, page, totalPages:result.totalPages, env:c.env, query:c.req.raw.url.split('?')[1] || '', searchQuery, stats, latest:all.items.slice(0,8), modelCounts, lang }))
}

app.get('/', (c) => renderHome(c, 'zh'))
app.get('/en', (c) => renderHome(c, 'en'))
app.get('/en/', (c) => renderHome(c, 'en'))

const renderToken = async (c, lang) => {
  const token = await getTokenBySlug(c.env, c.req.param('slug'))
  if (!token || token.status !== 'published') {
    return c.notFound()
  }
  if (lang === 'en' && !reviewFor(token)) return c.redirect(`/token/${encodeURIComponent(token.slug)}`, 301)
  const rev = reviewFor(token)
  if (!rev || rev.status === 'changed' || rev.noAds) c.header('X-Robots-Tag', 'noindex, follow')
  // 获取相关推荐：同分类的其他条目
  let related = []
  if (token.category) {
    const relResult = await currentListing(c.env, { category: token.category, pageSize: 5 })
    related = relResult.items.filter((t) => t.slug !== token.slug).slice(0, 4)
  }
  // 如果同分类不够，补充其他精选
  if (related.length < 4) {
    const more = await currentListing(c.env, { pageSize: 10 })
    for (const t of more.items) {
      if (t.slug !== token.slug && !related.find((r) => r.slug === t.slug)) {
        related.push(t)
        if (related.length >= 4) break
      }
    }
  }
  return c.html(tokenPage(token, c.env, related.filter(isCurrent), lang))
}

registerXiaodou(app)

app.get('/token/:slug', (c) => renderToken(c, 'zh'))
app.get('/en/token/:slug', (c) => renderToken(c, 'en'))

const renderCategory = async (c, lang) => {
  const category = c.req.param('category')
  const s = T(lang)
  const page = pageNumber(c)
  const result = await currentListing(c.env, { category, page, pageSize: 24 })
  if (!result.total || page > result.totalPages) return c.notFound()
  const thinCategory = result.total < 4
  if (thinCategory) c.header('X-Robots-Tag', 'noindex, follow')
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
      noindex: thinCategory,
      path: `/category/${category}`,
      query,
      breadcrumbs: [
        { name: s.crumbHome, url: '/' },
        { name: categoryLabel(category, lang), url: `/category/${category}` },
      ],
    })
  )
}

app.get('/category/:category', (c) => renderCategory(c, 'zh'))
app.get('/en/category/:category', (c) => renderCategory(c, 'en'))

const renderTag = async (c, lang) => {
  const tag = c.req.param('tag')
  const s = T(lang)
  const page = pageNumber(c)
  let result = await currentListing(c.env, { tag, page, pageSize: 24 })
  if (!result.total) result = await listTokens(c.env, { status:'published', tag, page, pageSize:24 })
  if (!result.total || page > result.totalPages) return c.notFound()
  c.header('X-Robots-Tag', 'noindex, follow')
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

registerEditorial(app)
registerLocalModels(app)
registerCalculator(app)
for (const lang of ['zh', 'en']) {
  app.get(lp(lang, '/directory'), async c => {
    const result = await listTokens(c.env, { status:'published', pageSize:1000 })
    c.header('X-Robots-Tag','noindex, follow')
    return c.html(listPage({ title:lang === 'en' ? 'Historical listings and policy changes' : '历史收录与规则变更', description:lang === 'en' ? 'Old listings are retained for reference. Unreviewed offers are not current recommendations; inspect each status and official source.' : '保留旧条目便于查阅。待复核的旧说明不代表当前仍有免费额度；请查看各页状态及官方条件。',items:result.items.filter(t => !isCurrent(t)),categories:[],page:1,totalPages:1,env:c.env,path:'/directory',lang,noindex:true }))
  })
}
app.get('/ads.txt', c => c.text('google.com, pub-1530405841616000, DIRECT, f08c47fec0942fa0\n'))

// ---------- 品牌标识（logo.svg，ai-plugin.json 引用；内嵌明暗自适应） ----------
app.get('/og.png', c => new Response(Uint8Array.from(atob(OG_IMAGE_BASE64), ch => ch.charCodeAt(0)), { headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=86400'} }))

app.get('/logo.svg', (c) =>
  c.text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><style>.t{fill:#059669}@media (prefers-color-scheme: dark){.t{fill:#10b981}}</style><rect width="32" height="32" rx="8.7" class="t"/><circle cx="16" cy="16" r="9.9" fill="#fff"/><rect x="11.7" y="11.7" width="8.6" height="8.6" rx="1.7" class="t"/></svg>',
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
Allow: /local.md
Allow: /local.json
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
  const result = await listTokens(c.env, { status: 'published', includeAll: false, pageSize: 500 })
  const items = result.items.filter(t => reviewFor(t))
  const lines = [
    `# FreeTokenBox`,
    ``,
    `> FreeTokenBox 是一个收集所有免费赠送 AI Token / API 额度 / 算力的网站合集。涵盖文本 API、图片、音频、视频和 3D 资产生成；区分网页额度、API 免费层与一次性试用。`,
    ``,
    `## 主要页面`,
    ``,
    `- [首页](${base}/): 免费层与试用额度目录，浏览当前已核查资源`,
    `- [AI Token 与免费额度计算器](${base}/calculator): 估算提示词和多轮用量，按实际额度与单价核对预算`,
    `- [本地免费模型选型](${base}/local): 按 8GB–64GB 内存/显存匹配 ${LOCAL_MODELS.length} 个开源本地离线模型（含 Ollama 一键命令）`,
    `- [使用指南](${base}/guides): ${GUIDES.length} 篇选型、接入、路由降级、安全与限流排查深度指南`,
    `- [豆包小豆邀请码](${base}${XIAODOU_PATH}): 可复制的公开邀请码、原帖和 4 个社区入口对比`,
    `- [核查原则](${base}/editorial-policy): 来源、日期与状态说明`,
    `- [关于页面](${base}/about): 项目介绍与开放 API 说明`,
    `- [API 文档](${base}/api/docs): RESTful API 文档（含字段说明）`,
    ``,
    `## 机器可读接口（Agent / LLM 推荐）`,
    ``,
    `- [JSON 数据](${base}/ai.json): 全部条目结构化 JSON`,
    `- [OpenAPI 规范](${base}/api/openapi.json): 标准 OpenAPI 3.0 规范`,
    `- [Markdown 导出](${base}/tokens.md): 全部条目 Markdown 文本`,
    `- [本地模型 Markdown](${base}/local.md): 按硬件分档的本地开源模型速查表`,
    `- [本地模型 JSON](${base}/local.json): 本地开源模型结构化 JSON 数据`,
    `- [REST API](${base}/api/tokens): 分页/分类/标签/搜索 JSON 接口`,
    ``,
    `## 已核查资源与变更说明`,
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
  const result = await listTokens(c.env, { status: 'published', includeAll: false, pageSize: 500 })
  const items = result.items.filter(t => reviewFor(t))
  const sections = [
    `# FreeTokenBox — 免费送 Token 合集完整内容`,
    ``,
    `> 站点: ${base}`,
    `> 描述: ${siteDescription()}`,
    `> 已核查条目数: ${items.length}`,
    `> 导出生成时间: ${new Date().toISOString()}（不是资源核查日期）`,
    ``,
    `---`,
    ``,
  ]
  sections.push(
    '## 豆包小豆邀请码',
    `- 专题页：${base}${XIAODOU_PATH}`,
    `- 入口核查日期：${XIAODOU_LINKS_CHECKED}`,
    '- 邀请码有效性由小豆 App 判定，社区状态仅供参考。',
    ...XIAODOU_SOURCES.map(source => `- [${source.name}](${source.url})：${source.description}`),
    '',
  )
  for (const t of items) {
    sections.push(`## ${t.name}`)
    sections.push(``)
    sections.push(`- URL: ${base}/token/${t.slug}`)
    if (t.provider) sections.push(`- 提供方: ${t.provider}`)
    if (t.url) sections.push(`- 官方说明: ${reviewFor(t)?.source || t.url}`)
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
  const result = await listTokens(c.env, { status: 'published', includeAll: false, pageSize: 500 })
  const items = result.items.filter(t => reviewFor(t))
  return c.json({
    site: 'FreeTokenBox',
    description: siteDescription(),
    url: base,
    total: items.length,
    updated: new Date().toISOString(),
    tokens: items.map((t) => ({
      name: t.name,
      slug: t.slug,
      url: `${base}/token/${t.slug}`,
      provider_url: t.url,
      provider: t.provider,
      category: t.category,
      tags: t.tags,
      description: t.description,
      expiry_date: t.expiry_date,
      review_status: t.review,
      checked_at: t.checked_at,
      access: t.access,
      renewal: t.renewal,
      official_source: reviewFor(t)?.source,
      created_at: t.created_at,
      updated_at: t.updated_at,
    })),
  })
})

// ---------- AI Agent 插件清单（OpenAI plugin manifest，便于 Agent 发现 API） ----------
app.get('/.well-known/ai-plugin.json', async (c) => {
  const base = siteUrl(c.env)
  const result = await listTokens(c.env, { status: 'published', includeAll: false, pageSize: 1 })
  return c.json({
    schema_version: 'v1',
    name_for_human: 'FreeTokenBox',
    name_for_model: 'freetokenbox',
    description_for_human: '免费送 Token 合集：查找免费 AI token / API 额度。',
    description_for_model:
      'FreeTokenBox is a directory of free AI tokens, API credits and compute offers. ' +
      'Use GET /api/tokens to list free offers, GET /api/tokens/:slug for details, GET /api/stats for stats. ' +
      'The public API is read-only. Fetched data may help answer questions about free AI API offers.',
    auth: { type: 'none' },
    api: { type: 'openapi', url: `${base}/api/openapi.json`, has_user_authentication: false },
    logo_url: `${base}/logo.svg`,
    legal_info_url: `${base}/terms`,
  })
})

// ---------- OpenAPI 规范（Agent / 工具自动发现） ----------
app.get('/api/openapi.json', async (c) => {
  const base = siteUrl(c.env)
  return c.json({
    openapi: '3.0.0',
    info: { title: 'FreeTokenBox API', version: '1.1.0', description: '公开只读资源目录，包含历史条目。review=verified 表示已核查公开文档，changed 表示规则变更，pending 表示当前条件待复核；均非账户实测或免费资格保证。' },
    servers: [{ url: base }],
    paths: {
      '/api/tokens': {
        get: {
          summary: '列出已发布资源（含历史收录，请检查 review 状态）',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'tag', in: 'query', schema: { type: 'string' } },
            { name: 'q', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { '200': { description: 'OK' } },
        },
      },
      '/api/tokens/{slug}': {
        get: { summary: '获取单条详情', parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
      },
      '/api/stats': { get: { summary: '站点统计', responses: { '200': { description: 'OK' } } } },
    },
  })
})

// ---------- API 文档页（人类 + Agent 友好） ----------
app.get('/api/docs', async (c) => {
  const base = siteUrl(c.env)
  const body = html`<article class="article">
    <h1>API 文档</h1>
    <div class="body">
      <p>FreeTokenBox 开放只读接口，供第三方与 AI Agent 消费公开的免费 Token 数据。公开接口无需鉴权；<strong>内容仅由站点管理员维护</strong>，不对外提供写入接口。</p>
      <h2>读取接口</h2>
      <pre><code>GET ${base}/api/tokens?category=free-api&tag=llm&q=deepseek&page=1&pageSize=50
GET ${base}/api/tokens/:slug
GET ${base}/api/stats
GET ${base}/ai.json</code></pre>
      <h2>字段</h2>
      <table class="list">
        <thead><tr><th>字段</th><th>说明</th></tr></thead>
        <tbody>
          <tr><td>name</td><td>名称</td></tr>
          <tr><td>description</td><td>一句话简介</td></tr>
          <tr><td>content</td><td>Markdown 长文</td></tr>
          <tr><td>provider / url</td><td>提供方 / 领取地址</td></tr>
          <tr><td>category</td><td>free-api | free-plan | image | audio | video | 3d | giveaways | coupons | other</td></tr>
          <tr><td>tags</td><td>字符串数组</td></tr>
          <tr><td>expiry_date</td><td>截止日期（可为空）</td></tr>
          <tr><td>is_featured</td><td>是否精选</td></tr>
          <tr><td>review</td><td>verified：已核查公开文档；changed：原规则变化；pending：历史信息待复核。不是账户实测或免费保证。</td></tr>
          <tr><td>checked_at / official_source</td><td>公开文档核查日期 / 官方依据链接；未核查时为空。</td></tr>
          <tr><td>content_notice</td><td>历史内容提示。自动推荐时应排除 pending 和 changed，而不是把全部条目当作可领取福利。</td></tr>
        </tbody>
      </table>
      <h2>机器可读</h2>
      <ul>
        <li><a href="${base}/api/openapi.json">OpenAPI 规范（/api/openapi.json）</a></li>
        <li><a href="${base}/.well-known/ai-plugin.json">AI 插件清单</a></li>
        <li><a href="${base}/tokens.md">Markdown 导出（/tokens.md）</a></li>
        <li><a href="${base}/llms.txt">llms.txt</a></li>
      </ul>
      <p style="color:var(--faint)">如需提交内容，请通过站内维护渠道联系管理员。</p>
    </div>
  </article>`
  return c.html(layout({ title: 'API 文档 · FreeTokenBox', description: 'FreeTokenBox 开放接口文档', path: '/api/docs', env: c.env, body }))
})

// ---------- 全量 Markdown 导出（LLM / Agent 友好） ----------
app.get('/tokens.md', async (c) => {
  const base = siteUrl(c.env)
  const result = await listTokens(c.env, { status: 'published', includeAll: false, pageSize: 500 })
  const items = result.items.filter(t => reviewFor(t))
  const lines = [
    '# FreeTokenBox — 免费送 Token 合集（Markdown 导出）',
    '',
    `共 ${items.length} 条已核查资源与变更说明。核查日期见各条目。`,
    '',
    ...items.map((t) => {
      const tags = (t.tags || []).join(', ')
      return [
        `## ${t.name}`,
        '',
        `- 提供方：${t.provider || '-'}`,
        `- 官方说明：${reviewFor(t)?.source || t.url || '-'}`,
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
  const result = await listTokens(c.env, { status:'published', pageSize:1000 })
  const items = result.items.filter(t => {
    const rev = reviewFor(t)
    return rev && rev.status !== 'changed' && !rev.noAds
  })
  const catCounts = new Map()
  for (const t of items.filter(isCurrent)) {
    if (t.category) catCounts.set(t.category, (catCounts.get(t.category) || 0) + 1)
  }
  const corePaths = [
    { path: '/', lastmod: CONTENT_DATE },
    { path: '/calculator', lastmod: CALCULATOR_UPDATED },
    { path: '/local', lastmod: LOCAL_UPDATED },
    { path: '/guides', lastmod: CONTENT_DATE },
    { path: '/about', lastmod: CONTENT_DATE },
    { path: '/editorial-policy', lastmod: CONTENT_DATE },
    ...GUIDES.map(g => ({ path: `/guides/${g.slug}`, lastmod: g.date || CONTENT_DATE })),
  ]
  const urls = ['zh','en'].flatMap(lang => [
    ...corePaths.map(p => ({ loc: base + lp(lang, p.path), lastmod: p.lastmod })),
    ...items.map(t => ({ loc: base + lp(lang, `/token/${t.slug}`), lastmod: reviewFor(t)?.checked || formatDate(t.updated_at) })),
    ...[...catCounts.entries()].filter(([, n]) => n >= 4).map(([cat]) => ({ loc: base + lp(lang, `/category/${cat}`), lastmod: CONTENT_DATE })),
  ])
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${escapeHtml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('')}
</urlset>`
  return c.text(xml,200,{'Content-Type':'application/xml'})
})

app.get('/rss.xml', async (c) => {
  const base = siteUrl(c.env)
  const result = await listTokens(c.env, { status: 'published', includeAll: false, pageSize: 50 })
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${siteTitle()}</title>
  <link>${base}/</link>
  <description>AI API 免费层、试用条件与规则变更说明，附官方来源与核查日期。</description>
  <language>zh-cn</language>
  <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${result.items.filter(t => reviewFor(t))
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
  const page = pageNumber(c)
  const category = c.req.query('category')
  const tag = c.req.query('tag')
  const query = c.req.query('q')
  const pageSize = Math.max(1, Math.min(200, Math.floor(Number(c.req.query('pageSize')) || 50)))
  const result = await listTokens(c.env, { status: 'published', category, tag, query, page, pageSize })
  return c.json(result)
})

app.get('/api/tokens/:slug', async (c) => {
  const token = await getTokenBySlug(c.env, c.req.param('slug'))
  if (!token || token.status !== 'published') return c.json({ error: 'not_found' }, 404)
  return c.json({ item: token })
})

app.get('/api/stats', async (c) => {
  const [total, categories] = await Promise.all([
    listTokens(c.env, { status: 'published', includeAll: false, pageSize: 1 }),
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
  if (!token || token.status !== 'published') return c.json({ error: 'not_found' }, 404)
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
app.notFound((c) => {
  const lang = langFromPath(c.req.path)
  const s = T(lang)
  return c.html(
    layout({
      noindex: true,
      title: s.notFoundTitle,
      description: s.notFoundDesc,
      path: c.req.path,
      env: c.env,
      lang,
      body: html`<div class="article" style="text-align:center"><h1>404</h1><p>${s.notFoundBody}</p><p><a class="btn" href="${lp(lang, '/')}">${s.backHome}</a></p></div>`,
    }),
    404
  )
})

app.onError((err, c) => {
  console.error('FreeTokenBox error:', err)
  return c.json({ error: 'internal_error', detail: String(err && err.message || err) }, 500)
})

export default app
