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

const app = new Hono()

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

// ---------- 公开页面 ----------
app.get('/', async (c) => {
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
    })
  )
})

app.get('/token/:slug', async (c) => {
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
  return c.html(tokenPage(token, c.env, related))
})

app.get('/category/:category', async (c) => {
  const category = c.req.param('category')
  const page = Math.max(1, Number(c.req.query('page')) || 1)
  const result = await listTokens(c.env, { status: 'published', category, page, pageSize: 24 })
  const query = c.req.raw.url.split('?')[1] || ''
  return c.html(
    listPage({
      title: `${category} 分类 · 免费 Token`,
      description: `「${category}」分类下的免费送 Token 合集。收录 ${result.total} 个${category}分类的免费 AI Token / API 额度活动，全部可免费领取。`,
      items: result.items,
      categories: [],
      page,
      totalPages: result.totalPages,
      env: c.env,
      path: `/category/${category}`,
      query,
      breadcrumbs: [
        { name: '首页', url: '/' },
        { name: category, url: `/category/${category}` },
      ],
      badge: html`<span class="badge"><span class="dot"></span> 分类：${category} · 共 ${result.total} 条</span>`,
    })
  )
})

app.get('/tags/:tag', async (c) => {
  const tag = c.req.param('tag')
  const page = Math.max(1, Number(c.req.query('page')) || 1)
  const result = await listTokens(c.env, { status: 'published', tag, page, pageSize: 24 })
  const query = c.req.raw.url.split('?')[1] || ''
  return c.html(
    listPage({
      title: `#${tag} 标签 · 免费 Token`,
      description: `带有标签 #${tag} 的免费送 Token 条目。共收录 ${result.total} 个相关免费 AI Token / API 活动。`,
      items: result.items,
      categories: [],
      page,
      totalPages: result.totalPages,
      env: c.env,
      path: `/tags/${tag}`,
      query,
      breadcrumbs: [
        { name: '首页', url: '/' },
        { name: `#${tag}`, url: `/tags/${tag}` },
      ],
      badge: html`<span class="badge"><span class="dot"></span> #${tag} · 共 ${result.total} 条</span>`,
    })
  )
})

app.get('/about', (c) =>
  c.html(
    layout({
      title: '关于 FreeTokenBox · 免费 AI Token 聚合平台',
      description: 'FreeTokenBox 是一个收集所有免费赠送 AI Token / API 额度 / 算力的网站合集公益项目。收录 DeepSeek、OpenRouter、Google Gemini、Groq、Cloudflare Workers AI 等平台免费资源。',
      path: '/about',
      env: c.env,
      breadcrumbs: [
        { name: '首页', url: '/' },
        { name: '关于', url: '/about' },
      ],
      body: html`<article class="article">
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
      </article>`,
    })
  )
)

const staticTextPage = (path, title, lines) => (c) =>
  c.html(
    layout({
      title: `${title} · FreeTokenBox`,
      description: title,
      path,
      env: c.env,
      body: html`<article class="article"><h1>${title}</h1><div class="body">${lines.map((l) => html`<p>${l}</p>`)}</div></article>`,
    })
  )

app.get('/privacy', staticTextPage('/privacy', '隐私政策', [
  'FreeTokenBox 尊重并保护访客隐私。',
  '本站不主动收集个人身份信息；如未来接入 Google AdSense，广告服务可能使用 Cookie 提供个性化广告，详情见 Google 隐私政策。',
  '本政策如有更新，将在本页面发布。',
]))
app.get('/terms', staticTextPage('/terms', '使用条款', [
  'FreeTokenBox 收录的信息来自公开渠道，仅供学习参考，不构成任何建议。',
  '各平台免费额度与活动规则可能随时变化，请以官方页面为准。',
  '本站对链接指向的第三方内容不承担责任。',
]))

// ---------- SEO 文件 ----------
app.get('/robots.txt', async (c) => {
  const base = siteUrl(c.env)
  const sitemap = base ? `Sitemap: ${base}/sitemap.xml` : ''
  return c.text(`User-agent: *
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
Disallow: /admin
Disallow: /api/

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
    `- [API 文档](${base}/api/tokens): RESTful API，获取全部已发布条目的 JSON 数据`,
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
