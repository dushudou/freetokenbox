import { pathToFileURL } from 'node:url'
import { runInNewContext } from 'node:vm'
// 本地验证脚本：用内存 mock D1 跑真实的 Hono app，验证全部核心路径。
// 运行: npm test  (node scripts/test-local.js)
// 说明: 仅实现本项目用到的 SQL 子集（见 src/db.js），用于无 Cloudflare 环境的快速回归。

import app from '../src/index.js'
import { renderMarkdown } from '../src/content.js'

// ---------- 极简 D1 内存 mock ----------
class MockDB {
  constructor() {
    this.rows = []
    this.autoId = 1
    this.slugIndex = new Map()
  }
  prepare(sql) {
    const q = new Query(this, sql)
    return {
      bind: (...args) => q.withArgs(args),
      first: () => q.withArgs([]).first(),
      all: () => q.withArgs([]).all(),
      run: () => q.withArgs([]).run(),
    }
  }
}

class Query {
  constructor(db, sql) {
    this.db = db
    this.sql = sql
    this.args = []
  }
  withArgs(args) {
    this.args = args
    return this
  }
  first() {
    const res = this.all()
    return res.results[0] || null
  }
  all() {
    const sql = this.sql.trim()
    if (sql.toUpperCase().startsWith('SELECT')) return this._select(sql)
    throw new Error(`Unsupported SELECT mock: ${sql}`)
  }
  run() {
    const sql = this.sql.trim()
    const u = sql.toUpperCase()
    if (u.startsWith('INSERT')) return this._insert(sql)
    if (u.startsWith('UPDATE')) return this._update(sql)
    if (u.startsWith('DELETE')) return this._delete(sql)
    throw new Error(`Unsupported statement: ${sql}`)
  }

  _extractColumns(tableSql) {
    const m = tableSql.match(/\(([^)]*)\)/)
    return m
      ? m[1]
          .split(',')
          .map((s) => s.trim().replace(/^`|`$/g, ''))
          .filter(Boolean)
      : []
  }

  _matchWhere(whereClause) {
    // 先快照参数，再为每个条件编译匹配函数（参数按出现顺序取固定下标）
    const params = this.args.slice()
    let paramIdx = 0
    const compileLike = (col, pos) => (row) => {
      const pat = String(params[pos] ?? '')
      // SQLite LIKE 对 ASCII 不区分大小写
      const re = new RegExp('^' + pat.replace(/%/g, '.*') + '$', 'i')
      return re.test(String(row[col] || ''))
    }
    const compileEq = (col, val) => (row) => String(row[col]) === String(val)
    const compiled = whereClause.split(/\s+AND\s+/i).map((cond) => {
      // 支持 (col LIKE ? OR col LIKE ? ...) 括号 OR 组
      const orGroup = cond.match(/^\s*\(([^)]+)\)\s*$/)
      if (orGroup) {
        const fns = orGroup[1].split(/\s+OR\s+/i).map((c) => {
          const like = c.match(/^\s*([A-Za-z_]+)\s+LIKE\s+\?\s*$/)
          const m = c.match(/^\s*([A-Za-z_]+)\s*(=)\s*\?\s*$/)
          if (like) return compileLike(like[1], paramIdx++)
          if (m) return compileEq(m[1], params[paramIdx++])
          throw new Error(`Unsupported OR cond: ${c}`)
        })
        return (row) => fns.some((fn) => fn(row))
      }
      const m = cond.match(/^\s*([A-Za-z_]+)\s*(=)\s*('(?:[^']*)'|\?)\s*$/)
      const like = cond.match(/^\s*([A-Za-z_]+)\s+LIKE\s+\?\s*$/)
      if (m) {
        const [, col, , valRaw] = m
        if (valRaw !== '?') return compileEq(col, valRaw.slice(1, -1))
        return compileEq(col, params[paramIdx++])
      }
      if (like) return compileLike(like[1], paramIdx++)
      throw new Error(`Unsupported WHERE cond: ${cond}`)
    })
    // 消费掉 WHERE 用到的参数，让后续 LIMIT ? OFFSET ? 从正确位置读取
    this.args.splice(0, paramIdx)
    return (row) => compiled.every((fn) => fn(row))
  }

  _select(sql) {
    // SELECT cols FROM tokens [WHERE ...] [GROUP BY c] [ORDER BY ...] [LIMIT ? OFFSET ?]
    const fromIdx = sql.toUpperCase().indexOf('FROM')
    const selectPart = sql.slice(0, fromIdx)
    let rest = sql.slice(fromIdx + 4)

    // WHERE 段（截取到 GROUP BY / ORDER BY / LIMIT 之前）
    let whereClause = ''
    const whereIdx = rest.toUpperCase().indexOf('WHERE')
    if (whereIdx >= 0) {
      const tail = rest.slice(whereIdx + 5)
      const groupIdx = tail.toUpperCase().indexOf('GROUP BY')
      const orderIdx = tail.toUpperCase().indexOf('ORDER BY')
      const limitIdx = tail.toUpperCase().indexOf('LIMIT')
      const cut = [groupIdx, orderIdx, limitIdx].filter((i) => i >= 0)
      const end = cut.length ? Math.min(...cut) : tail.length
      whereClause = tail.slice(0, end)
      rest = rest.slice(0, whereIdx) + tail.slice(end)
    }

    let rows = [...this.db.rows]
    if (whereClause.trim()) rows = rows.filter(this._matchWhere(whereClause))

    if (/COUNT\s*\(/i.test(selectPart)) {
      return { results: [{ n: rows.length }] }
    }

    // GROUP BY
    const groupIdx = rest.toUpperCase().indexOf('GROUP BY')
    if (groupIdx >= 0) {
      const col = rest.slice(groupIdx + 8).trim().split(/\s+/)[0]
      const map = {}
      for (const r of rows) {
        const k = r[col] || ''
        map[k] = (map[k] || 0) + 1
      }
      const results = Object.entries(map)
        .map(([name, n]) => ({ category: name, n }))
        .sort((a, b) => b.n - a.n)
      return { results }
    }

    // ORDER BY ... 与 LIMIT ? OFFSET ?
    let orderClause = ''
    let limitClause = ''
    const orderIdx = rest.toUpperCase().indexOf('ORDER BY')
    if (orderIdx >= 0) {
      let tail = rest.slice(orderIdx + 8)
      const limitIdx = tail.toUpperCase().indexOf('LIMIT')
      if (limitIdx >= 0) {
        limitClause = tail.slice(limitIdx + 5)
        tail = tail.slice(0, limitIdx)
      }
      orderClause = tail.trim()
    } else {
      const limitIdx = rest.toUpperCase().indexOf('LIMIT')
      if (limitIdx >= 0) limitClause = rest.slice(limitIdx + 5)
    }

    for (const part of orderClause.split(',').reverse()) {
      if (!part.trim()) continue
      const mm = part.trim().match(/^([A-Za-z_]+)\s+(ASC|DESC)$/i)
      if (!mm) throw new Error(`Unsupported ORDER: ${part}`)
      const [col, dir] = [mm[1], mm[2].toUpperCase()]
      rows.sort((a, b) => {
        const av = a[col] ?? 0
        const bv = b[col] ?? 0
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return dir === 'DESC' ? -cmp : cmp
      })
    }

    let page = null
    let offset = 0
    if (limitClause.trim()) {
      // SQL: LIMIT ? OFFSET ? -> 第一个 ? 是 LIMIT(数量)，第二个 ? 是 OFFSET
      const mm = limitClause.trim().match(/^\s*\?\s+(?:OFFSET\s+)?\?\s*$/)
      if (mm) {
        page = Number(this.args.shift() || 0)
        offset = Number(this.args.shift() || 0)
      } else {
        throw new Error(`Unsupported LIMIT: ${limitClause}`)
      }
    }

    if (page !== null) rows = rows.slice(offset, offset + page)
    return { results: rows.map((r) => ({ ...r })) }
  }

  _insert(sql) {
    const cols = this._extractColumns(sql)
    const row = {}
    cols.forEach((c, i) => {
      row[c] = this.args[i]
    })
    row.id = this.db.autoId++
    this.db.rows.push(row)
    this.db.slugIndex.set(row.slug, row)
    return { meta: { last_row_id: row.id } }
  }

  _update(sql) {
    const m = sql.match(/SET\s+([\s\S]*?)\s+WHERE\s+id\s*=\s*\?/)
    if (!m) throw new Error(`Unsupported UPDATE: ${sql}`)
    const sets = {}
    for (const pair of m[1].split(',')) {
      const pm = pair.match(/^\s*([A-Za-z_]+)\s*=\s*\?\s*$/)
      if (!pm) throw new Error(`Unsupported SET: ${pair}`)
      sets[pm[1]] = this.args.shift()
    }
    const id = this.args.shift()
    const row = this.db.rows.find((r) => r.id === id)
    if (!row) return { meta: { changes: 0 } }
    Object.assign(row, sets)
    return { meta: { changes: 1 } }
  }

  _delete(sql) {
    const m = sql.match(/WHERE\s+slug\s*=\s*\?/)
    if (!m) throw new Error(`Unsupported DELETE: ${sql}`)
    const slug = this.args.shift()
    const before = this.db.rows.length
    this.db.rows = this.db.rows.filter((r) => r.slug !== slug)
    return { meta: { changes: before - this.db.rows.length } }
  }
}

// ---------- 测试 runner ----------
let passed = 0
let failed = 0
const failures = []

function assert(cond, label, extra) {
  if (cond) {
    passed++
  } else {
    failed++
    failures.push(`${label}${extra ? ' → ' + extra : ''}`)
    console.error(`  ✗ ${label}${extra ? ' → ' + extra : ''}`)
  }
}

const env = {
  DB: new MockDB(),
  ADMIN_PASSWORD: 'test-admin-pass',
  SESSION_SECRET: 'test-session-secret-long-enough',
  API_KEYS: 'sk-test-1, sk-test-2',
  SITE_URL: 'https://freetokenbox.example.com',
  // ADSENSE_CLIENT_ID 不设置，验证占位广告
}

async function seedViaAdmin() {
  // 通过 admin 登录流程 + /admin/seed 导入种子
  let res = await app.request('/admin/login', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'password=test-admin-pass' }, env)
  assert(res.status === 302, 'admin login success -> 302', `got ${res.status}`)
  const setCookie = res.headers.get('set-cookie')
  assert(!!setCookie, 'admin login sets cookie', setCookie)
  // 用 API key 直接导入种子更简单
  res = await app.request('/admin/seed', { method: 'POST' }, { ...env })
  assert(res.status === 302 && (res.headers.get('location') || '').includes('/admin/login'), 'seed without auth -> redirect to login', `got ${res.status}`)
  res = await app.request('/admin/seed', { method: 'POST', headers: { 'X-API-Key': 'sk-test-1' } }, env)
  assert(res.status === 302, 'seed with API key -> 302', `got ${res.status}`)
  return setCookie
}

async function run() {
  console.log('== FreeTokenBox 本地验证 ==\n')

  // 1. 种子
  const cookie = await seedViaAdmin()

  // 2. 公开页面
  let res = await app.request('/', {}, env)
  let text = await res.text()
  assert(res.status === 200, 'GET / -> 200', `got ${res.status}`)
  assert(text.includes('OpenRouter') && text.includes('FreeTokenBox'), 'home contains reviewed provider & brand')
  assert((text.match(/client=ca-pub-1530405841616000/g) || []).length === 1, 'home includes supplied AdSense client exactly once')
  assert(!text.includes('ad-slot'), 'home has NO ad slot placeholders')
  assert(!text.includes('form class="search"'), 'home has NO legacy content-area search form')
  assert(text.includes('class="hero-carousel"') && text.includes('class="sidebar"'), 'home has full-width carousel + sidebar layout')
  assert(text.indexOf('class="hero-carousel"') < text.indexOf('<main>'), 'carousel renders OUTSIDE main container (full-bleed)')
  assert(text.includes('id="carouselTrack"'), 'carousel has track element for JS')
  assert(text.includes('carousel-slide active'), 'first slide has active class')
  assert(text.includes('carousel-dots'), 'carousel has navigation dots')
  assert(text.includes('carousel-arrow'), 'carousel has prev/next arrows')
  assert(text.includes('carouselGo'), 'carousel has auto-rotate script')
  assert(text.includes('class="kicker"'), 'carousel slides have editorial kicker')
  assert(text.includes('class="slide-title"'), 'carousel slides have model name titles')
  assert(text.includes('class="slide-logo"'), 'carousel slides have model logos')
  assert(text.includes('class="slide-desc"'), 'carousel slides have taglines')
  assert(text.includes('class="sr-only"'), 'carousel has SEO h1 (sr-only)')
  assert(text.includes('class="carousel-watermark"'), 'carousel has brand watermark mark')
  assert(!text.includes('model-wall'), 'old model wall removed')
  assert(!text.includes('banner-actions'), 'old banner actions removed')
  for (const brand of ['OpenAI', 'Claude', 'Gemini', 'DeepSeek', 'Qwen', 'Kimi', 'Grok', 'GLM', 'MiniMax', 'Hunyuan', 'Mimo']) {
    assert(text.includes(`slide-title">${brand}<`), `carousel slide includes ${brand}`)
  }
  for (const gone of ['Llama', 'Mistral', 'Ollama']) {
    assert(!text.includes(`slide-title">${gone}<`), `carousel no longer includes ${gone}`)
  }
  assert((text.match(/banners\/[a-z]+\.webp/g) || []).length === 11, 'carousel has 11 banner background images')
  assert((text.match(/class="carousel-slide/g) || []).length === 11, 'carousel has exactly 11 slides')
  assert((text.match(/class="dot/g) || []).length === 11, 'carousel has exactly 11 dots')
  assert(text.includes('条已核查资源'), 'slides show per-model related offer counts')
  assert(text.includes('已核查资源') && text.includes('热门精选'), 'home sidebar has latest & hot widgets')
  assert((text.match(/class="crumbs"/g) || []).length === 0, 'home has NO breadcrumb (info-site home)')
  assert(text.includes('class="e-logo"'), 'home entries show site logo container')
  assert(text.includes('chip free'), 'entries show 免费/Free status chip')
  assert(text.includes('class="w-rank'), 'hot sidebar shows rank numbers')
  assert(text.includes('/token/openrouter-free-models'), 'home links to conditions before external signup')

  // Markdown 图片支持
  const md = '![示意图](https://example.com/demo.png)\n\n正文 **加粗** [链接](https://example.com)'
  const mdHtml = renderMarkdown(md)
  assert(mdHtml.includes('<img src="https://example.com/demo.png"'), 'markdown image renders <img>')
  assert(mdHtml.includes('loading="lazy"'), 'markdown image is lazy-loaded')
  assert(!mdHtml.includes('https://example.com/demo.png"></a>'), 'image is not wrapped as a link')

  res = await app.request('/token/deepseek-v4-flash-api-free', {}, env)
  text = await res.text()
  assert(res.status === 200, 'GET /token/:slug -> 200', `got ${res.status}`)
  assert(text.includes('BaiClaw') && text.includes('chat.b.ai'), 'token page contains content')
  assert(text.includes('application/ld+json'), 'token page has JSON-LD')
  assert(text.includes('相关推荐') || text.includes('相关'), 'token page has related section')
  assert(text.includes('class="article-chips"') && text.includes('chip free'), 'token page shows free/status chips')
  assert((text.match(/class="crumbs"/g) || []).length === 1, 'token page has EXACTLY ONE breadcrumb', `count=${(text.match(/class="crumbs"/g)||[]).length}`)

  res = await app.request('/token/not-exist', {}, env)
  assert(res.status === 404, 'missing token -> 404', `got ${res.status}`)

  res = await app.request('/category/free-api', {}, env)
  text = await res.text()
  assert(res.status === 200 && text.includes('分类'), 'category page 200')
  assert((text.match(/class="crumbs"/g) || []).length === 1, 'list page has EXACTLY ONE breadcrumb', `count=${(text.match(/class="crumbs"/g)||[]).length}`)

  res = await app.request('/tags/llm', {}, env)
  assert(res.status === 200 && (await res.text()).includes('llm'), 'tag page 200')

  // 搜索
  res = await app.request('/?q=groq', {}, env)
  text = await res.text()
  assert(res.status === 200 && text.includes('Groq'), 'search reviewed providers works')

  // 域名规范化跳转（仅线上域名；localhost 直通）
  res = await app.request('http://www.freetokenbox.com/', { headers: { Host: 'www.freetokenbox.com' } }, env)
  assert(res.status === 301 && (res.headers.get('location') || '').startsWith('https://freetokenbox.com'), 'www -> bare 301', `loc=${res.headers.get('location')}`)
  res = await app.request('http://freetokenbox.com/api/tokens', { headers: { Host: 'freetokenbox.com', 'x-forwarded-proto': 'http' } }, env)
  assert(res.status === 301 && (res.headers.get('location') || '').startsWith('https://freetokenbox.com/api/tokens'), 'http -> https 301', `loc=${res.headers.get('location')}`)
  res = await app.request('https://freetokenbox.mergedao.workers.dev/', { headers: { Host: 'freetokenbox.mergedao.workers.dev', 'x-forwarded-proto': 'https' } }, env)
  assert(res.status === 301 && (res.headers.get('location') || '').startsWith('https://freetokenbox.com'), 'workers.dev -> bare 301', `loc=${res.headers.get('location')}`)
  res = await app.request('http://localhost/', { headers: { Host: 'localhost' } }, env)
  assert(res.status === 200, 'localhost passes through (no redirect)')

  // 3. SEO 文件
  res = await app.request('/robots.txt', {}, env)
  text = await res.text()
  assert(res.status === 200 && text.includes('Sitemap: https://freetokenbox.example.com/sitemap.xml'), 'robots.txt has sitemap')

  res = await app.request('/sitemap.xml', {}, env)
  text = await res.text()
  assert(res.status === 200 && text.includes('/token/'), 'sitemap.xml lists token urls')

  res = await app.request('/rss.xml', {}, env)
  text = await res.text()
  assert(res.status === 200 && text.includes('<rss'), 'rss.xml works')

  // AI 友好接口
  res = await app.request('/llms.txt', {}, env)
  text = await res.text()
  assert(res.status === 200 && text.includes('openrouter-free-models'), 'llms.txt lists reviewed tokens')

  res = await app.request('/llms-full.txt', {}, env)
  assert(res.status === 200, 'llms-full.txt -> 200')

  res = await app.request('/ai.json', {}, env)
  const ai = await res.json()
  assert(res.status === 200 && Array.isArray(ai.tokens) && ai.tokens.length >= 6, 'ai.json lists tokens')

  // Agent/LLM 友好端点
  res = await app.request('/.well-known/ai-plugin.json', {}, env)
  const plugin = await res.json()
  assert(res.status === 200 && plugin.name_for_model === 'freetokenbox', 'ai-plugin.json manifest works')

  res = await app.request('/api/openapi.json', {}, env)
  const spec = await res.json()
  assert(res.status === 200 && spec.openapi === '3.0.0', 'openapi.json spec works')
  assert(!spec.paths['/api/tokens'].post && !spec.paths['/api/tokens/{slug}'].patch, 'openapi.json is READ-ONLY (no write ops)')

  res = await app.request('/tokens.md', {}, env)
  text = await res.text()
  assert(res.status === 200 && text.includes('OpenRouter'), 'tokens.md exports reviewed resources')

  res = await app.request('/api/docs', {}, env)
  text = await res.text()
  assert(res.status === 200 && text.includes('API 文档'), 'api docs page works')

  // 安全/缓存头
  res = await app.request('/api/tokens', {}, env)
  assert((res.headers.get('x-robots-tag') || '').includes('noindex'), 'api has noindex robots tag')
  assert((res.headers.get('cache-control') || '').includes('no-store'), 'api has no-store cache header')

  // 4. 公开 API
  res = await app.request('/api/tokens', {}, env)
  const list = await res.json()
  assert(res.status === 200 && list.total >= 6, 'GET /api/tokens lists seeds', `total=${list.total}`)

  res = await app.request('/api/tokens/deepseek-v4-flash-api-free', {}, env)
  const detail = await res.json()
  assert(res.status === 200 && detail.item.name.includes('DeepSeek'), 'GET /api/tokens/:slug works')

  res = await app.request('/api/stats', {}, env)
  const stats = await res.json()
  assert(stats.total >= 6 && Array.isArray(stats.categories), 'GET /api/stats works')

  // 5. 写 API 鉴权
  res = await app.request('/api/tokens', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'X' }) }, env)
  assert(res.status === 401, 'POST /api/tokens without auth -> 401', `got ${res.status}`)

  const newBody = {
    name: '测试平台免费额度',
    description: '测试用条目，验证写接口。',
    content: '## 简介\n这是一个 **测试** 条目。\n\n- 列表项 1\n- 列表项 2\n\n1. 有序一\n2. 有序二\n\n> 引用块',
    provider: 'TestCo',
    url: 'https://example.com/free',
    category: 'free-plan',
    tags: ['test', 'api'],
  }
  res = await app.request('/api/tokens', { method: 'POST', headers: { 'content-type': 'application/json', 'X-API-Key': 'sk-test-2' }, body: JSON.stringify(newBody) }, env)
  assert(res.status === 201, 'POST /api/tokens with API key -> 201', `got ${res.status}`)
  const created = await res.json()
  assert(created.item.slug && /^[a-z0-9-]+$/.test(created.item.slug), 'auto slug generated (url-safe)', created.item.slug)

  // 详情页渲染 markdown
  res = await app.request(`/token/${created.item.slug}`, {}, env)
  text = await res.text()
  assert(text.includes('<strong>测试</strong>') && text.includes('<blockquote>'), 'markdown rendered on page')

  // PATCH
  res = await app.request(`/api/tokens/${created.item.slug}`, { method: 'PATCH', headers: { 'content-type': 'application/json', 'X-API-Key': 'sk-test-1' }, body: JSON.stringify({ description: '已更新描述', tags: ['test', 'updated'] }) }, env)
  assert(res.status === 200, 'PATCH token -> 200', `got ${res.status}`)
  const patched = await res.json()
  assert(patched.item.description === '已更新描述' && patched.item.tags.includes('updated'), 'PATCH applied fields')

  // 删除
  res = await app.request(`/api/tokens/${created.item.slug}`, { method: 'DELETE', headers: { 'X-API-Key': 'sk-test-1' } }, env)
  assert(res.status === 200, 'DELETE token -> 200', `got ${res.status}`)
  res = await app.request(`/api/tokens/${created.item.slug}`, {}, env)
  assert(res.status === 404, 'deleted token -> 404', `got ${res.status}`)

  // 6. 后台
  res = await app.request('/admin', {}, env)
  assert(res.status === 302 && (res.headers.get('location') || '').includes('/admin/login'), 'GET /admin redirects to login', `got ${res.status}`)

  res = await app.request('/admin/login', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'password=wrong' }, env)
  assert(res.status === 401, 'admin login wrong password -> 401', `got ${res.status}`)

  res = await app.request('/admin', { headers: { Cookie: cookie } }, env)
  text = await res.text()
  assert(res.status === 200 && text.includes('后台管理'), 'GET /admin with cookie -> 200')

  // 表单新增
  const form = new URLSearchParams({ name: '表单新增条目', slug: 'form-new-item', provider: 'FormCo', url: 'https://form.example', category: 'free-api', tags: 'a, b', status: 'published', is_featured: '1', sort_weight: '5', description: '表单描述', content: '表单内容' })
  res = await app.request('/admin/new', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', Cookie: cookie }, body: form.toString() }, env)
  assert(res.status === 302, 'admin create -> 302', `got ${res.status}`)
  res = await app.request('/api/tokens/form-new-item', {}, env)
  const formCreated = await res.json()
  assert(formCreated.item && formCreated.item.name === '表单新增条目' && formCreated.item.is_featured === true, 'admin-created token exists & featured')

  // 编辑表单
  form.set('description', '编辑后的描述')
  res = await app.request('/admin/edit/form-new-item', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', Cookie: cookie }, body: form.toString() }, env)
  assert(res.status === 302, 'admin edit -> 302', `got ${res.status}`)
  res = await app.request('/api/tokens/form-new-item', {}, env)
  assert((await res.json()).item.description === '编辑后的描述', 'admin edit applied')

  // 删除
  res = await app.request('/admin/delete/form-new-item', { method: 'POST', headers: { Cookie: cookie } }, env)
  assert(res.status === 302, 'admin delete -> 302', `got ${res.status}`)
  res = await app.request('/api/tokens/form-new-item', {}, env)
  assert(res.status === 404, 'admin-deleted token gone', `got ${res.status}`)

  // 7. 404 页面
  res = await app.request('/nope/xyz', {}, env)
  assert(res.status === 404 && (await res.text()).includes('404'), 'unknown route -> 404 page')

  // Editorial/SEO integration checks: changed behavior and negative cases.
  for (const path of ['/guides','/guides/choose-free-ai-api','/guides/first-api-request','/guides/rate-limits-and-budget','/en/guides/choose-free-ai-api','/privacy','/en/privacy','/editorial-policy','/contact']) {
    res = await app.request(path, {}, env)
    text = await res.text()
    assert(res.status === 200 && (text.match(/<h1[ >]/g)||[]).length === 1, `editorial route has one h1: ${path}`)
    for (const match of text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let valid = true; try { JSON.parse(match[1]) } catch { valid = false }
      assert(valid, `valid JSON-LD: ${path}`)
    }
  }
  res = await app.request('/guides/first-api-request', {}, env)
  text = await res.text()
  assert(text.includes('<pre><code>') && !text.includes('```'), 'tutorial code fence renders a code block')
  res = await app.request('/?page=2', {}, env)
  text = await res.text()
  assert(res.status === 200 && text.includes('rel="canonical" href="https://freetokenbox.example.com/?page=2"'), 'page 2 has its own canonical')
  assert(text.includes('hreflang="en" href="https://freetokenbox.example.com/en/?page=2"'), 'pagination hreflang points to matching page')
  assert(!text.includes('adsbygoogle.js'), 'paginated listings do not load ads')
  assert((await app.request('/?page=999', {}, env)).status === 404, 'out-of-range pagination is 404')
  assert((await app.request('/category/no-such-category', {}, env)).status === 404, 'empty category is 404')
  res = await app.request('/en', {}, env)
  assert(res.status === 301 && res.headers.get('location') === '/en/', 'English homepage has one URL')
  for (const path of ['/?q=groq','/admin/login','/token/deepseek-v4-flash-api-free','/missing-route','/directory']) {
    res = await app.request(path, {}, env); text = await res.text()
    assert(text.includes('content="noindex, follow"') && !text.includes('adsbygoogle.js'), `no ads or indexing on utility/unverified page: ${path}`)
  }
  res = await app.request('/en/token/openrouter-free-models', {}, env); text = await res.text()
  assert(text.includes('OpenRouter free models: quotas and setup') && !text.includes('不限量调用'), 'English resource has translated content')
  res = await app.request('/token/openrouter-free-models', {}, env); text = await res.text()
  assert((text.match(/property="og:type"/g)||[]).length === 1 && !text.includes('FAQPage'), 'resource has one OG type and no fabricated FAQ schema')
  res = await app.request('/ads.txt', {}, env)
  assert((await res.text()).includes('pub-1530405841616000, DIRECT'), 'ads.txt matches publisher')
  res = await app.request('/api/tokens', {method:'POST',headers:{'Content-Type':'application/json','X-API-Key':'sk-test-1'},body:JSON.stringify({name:'Private draft',slug:'private-draft-check',status:'draft'})}, env)
  assert(res.status === 201, 'draft fixture created')
  for (const path of ['/sitemap.xml','/rss.xml','/llms.txt','/llms-full.txt','/ai.json','/tokens.md']) {
    res = await app.request(path, {}, env); text = await res.text()
    assert(!text.includes('private-draft-check'), `draft excluded from ${path}`)
  }
  assert((await app.request('/api/tokens/private-draft-check', {}, env)).status === 404, 'public detail API does not expose draft')
  text = await (await app.request('/sitemap.xml', {}, env)).text()
  assert(text.includes('/en/guides/first-api-request') && text.includes('/local') && text.includes('/en/local') && !text.includes('/tags/') && !text.includes('/token/deepseek-v4-flash-api-free'), 'sitemap includes guides and local models but excludes tags and unreviewed history')
  assert(!renderMarkdown('```html\n<script>alert(1)</script>\n```').includes('<script>'), 'code blocks escape embedded HTML')

  // 本地离线模型选型器（/local, /en/local, /local.md, /local.json）
  res = await app.request('/local', {}, env); text = await res.text()
  assert(res.status === 200 && text.includes('ollama run qwen2.5-coder:14b') && text.includes('FAQPage') && text.includes('adsbygoogle.js'), '/local renders models, FAQ schema, and ads')
  res = await app.request('/en/local', {}, env); text = await res.text()
  assert(res.status === 200 && text.includes('Free Local AI Models by Hardware') && text.includes('hreflang="zh-CN"'), '/en/local renders English version with hreflang')
  res = await app.request('/local.md', {}, env); text = await res.text()
  assert(res.status === 200 && text.includes('# Free Local AI Models by Hardware') && text.includes('ollama run deepseek-r1:14b'), '/local.md serves markdown matrix')
  res = await app.request('/local.json', {}, env)
  const localJson = await res.json()
  assert(res.status === 200 && localJson.total >= 20 && Array.isArray(localJson.models), '/local.json serves structured model list')

  // AI Token 与免费额度计算器（/calculator, /en/calculator）及新增深度指南
  for (const path of ['/calculator', '/en/calculator', '/guides/token-pricing-and-context-math', '/guides/ollama-local-ai-setup-guide', '/guides/multi-provider-fallback-router', '/guides/ai-api-security-key-management', '/guides/free-ai-for-coding-ides', '/guides/rag-embedding-rerank-free-stack', '/en/guides/rag-embedding-rerank-free-stack']) {
    res = await app.request(path, {}, env); text = await res.text()
    assert(res.status === 200 && (text.match(/<h1[ >]/g) || []).length === 1 && !text.includes('content="noindex, follow"'), `editorial page is accessible and indexable: ${path}`)
    assert(text.includes('adsbygoogle.js') === !path.endsWith('/calculator'), `expected ad inventory for ${path}`)
    for (const match of text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let valid = true; try { JSON.parse(match[1]) } catch { valid = false }
      assert(valid, `valid JSON-LD on ${path}`)
    }
  }
  text = await (await app.request('/en/calculator', {}, env)).text()
  const calculator = text.match(/<script id="quota-calculator-script">([\s\S]*?)<\/script>/)[1]
  const elements = new Map()
  for (const [, id] of text.matchAll(/ id="([^"]+)"/g)) {
    elements.set(id, {
      value: '',
      get valueAsNumber() { return this.value === '' ? NaN : Number(this.value) },
      validity: { valid: true },
      addEventListener(name, handler) { this[name] = handler },
    })
  }
  for (const [, id, value] of text.matchAll(/<input id="([^"]+)"[^>]* value="([^"]*)"/g)) {
    elements.get(id).value = value
  }
  const codingPreset = {
    dataset: { preset: 'coding' },
    addEventListener(name, handler) { this[name] = handler },
  }
  runInNewContext(calculator, { document: {
    getElementById: (id) => elements.get(id),
    querySelectorAll: () => [codingPreset],
  } })
  const displayed = (id) => elements.get(id).textContent
  const enter = (id, value) => {
    const field = elements.get(id)
    field.value = value
    field.input()
  }
  assert(displayed('kDayReq') === '176' && displayed('kDayIn') === '211,200' && displayed('kDayOut') === '70,400' && displayed('kMonTok') === '8,448,000', 'default workload matches the worked example')
  assert(displayed('kCost') === '–' && displayed('tokenResult') === 'Enter a limit from your dashboard.', 'blank fields do not invent pricing or quota')
  enter('inputPrice', '0.25')
  enter('outputPrice', '1')
  enter('requestCap', '100')
  enter('tokenCap', '300000')
  assert(displayed('kCost') === '$3.696' && displayed('requestResult') === 'Over by 76' && displayed('tokenResult') === 'Remaining 18,400', 'prices and user-specified quota update the estimate')
  enter('requestCap', '0')
  assert(displayed('requestResult') === 'Over by 176', 'zero is a valid quota')
  codingPreset.click()
  assert(elements.get('retry').value === 1.15 && displayed('kDayReq') === '828', 'coding preset keeps the fractional retry multiplier')
  enter('cSample', '你好')
  elements.get('cApplySample').click()
  assert(elements.get('input').value === 2 && displayed('sTok') === '2', 'text estimator fills the first-turn token input')
  enter('turns', '')
  assert(displayed('kDayReq') === '–', 'incomplete workload does not produce a misleading estimate')

  res = await app.request('/guides/rag-embedding-rerank-free-stack', {}, env); text = await res.text()
  assert(text.includes('<table class="list">') && text.includes('href="/calculator"'), 'markdown table and internal link render cleanly')

  // AdSense 质量卫生：/xiaodou-codes 不进 sitemap 且 noindex，无广告脚本
  res = await app.request('/xiaodou-codes', {}, env); text = await res.text()
  assert(res.status === 200 && text.includes('content="noindex, follow"') && !text.includes('adsbygoogle.js'), '/xiaodou-codes is noindex and ad-free')
  const smText = await (await app.request('/sitemap.xml', {}, env)).text()
  assert(smText.includes('/calculator') && smText.includes('/en/calculator') && smText.includes('/guides/rag-embedding-rerank-free-stack'), 'sitemap includes calculator and new guides')
  assert(!smText.includes('/xiaodou-codes') && !smText.includes('/privacy') && !smText.includes('/token/github-models-free'), 'sitemap excludes scraped invite page, legal pages, and retired offers')
  res = await app.request('/en/', {}, env); text = await res.text()
  assert(!text.includes('offers documented resources'), 'English hero slideStats grammar fixed')

  // Google Publisher Policies (answer/9335564) 合规验证：
  // 1) 导航型页面 /guides 与敏感/第三方中转/邀请码页不加载广告脚本，且敏感页不进 sitemap
  res = await app.request('/guides', {}, env); text = await res.text()
  assert(res.status === 200 && !text.includes('adsbygoogle.js'), '/guides index hub is ad-free')
  for (const riskyPath of ['/token/100milionseek-free-api', '/token/doubao-xiaodou-invite-beta']) {
    res = await app.request(riskyPath, {}, env)
    if (res.status === 200) {
      text = await res.text()
      assert(text.includes('content="noindex, follow"') && !text.includes('adsbygoogle.js'), `policy-sensitive token is noindex & ad-free: ${riskyPath}`)
    }
  }
  assert(!smText.includes('/token/100milionseek-free-api') && !smText.includes('/token/doubao-xiaodou-invite-beta'), 'sitemap excludes policy-sensitive third-party relay and invite-code pages')

  // 2) 商标非隶属声明、版权/DMCA 通道、隐私政策（Google Partner Sites + 本地工具隐私 + EEA/UK 意见征求）
  res = await app.request('/', {}, env); text = await res.text()
  assert(text.includes('class="trademark-note"') && text.includes('无隶属'), 'ZH footer displays trademark non-affiliation notice')
  res = await app.request('/en/', {}, env); text = await res.text()
  assert(text.includes('class="trademark-note"') && text.includes('not affiliated with'), 'EN footer displays trademark non-affiliation notice')
  res = await app.request('/about', {}, env); text = await res.text()
  assert(text.includes('独立性与商标非隶属声明') && text.includes('/calculator'), '/about includes independence & trademark disclosure')
  res = await app.request('/privacy', {}, env); text = await res.text()
  assert(text.includes('policies.google.com/technologies/partner-sites') && text.includes('欧盟地区用户意见征求政策') && text.includes('浏览器本地'), '/privacy covers Google partner sites, EU UCP, and browser-local tools')
  res = await app.request('/en/privacy', {}, env); text = await res.text()
  assert(text.includes('policies.google.com/technologies/partner-sites') && text.includes('EU User Consent Policy') && text.includes('100% locally'), '/en/privacy covers Google partner sites, EU UCP, and browser-local tools')
  res = await app.request('/contact', {}, env); text = await res.text()
  assert(text.includes('DMCA') && text.includes('Copyright / Trademark'), '/contact provides copyright/trademark takedown workflow')
  res = await app.request('/calculator', {}, env); text = await res.text()
  assert(text.includes('166,428,000') && text.includes('35,475,000'), '/calculator includes reproducible 3-scenario reference table')

  console.log(`\n== 结果: ${passed} 通过, ${failed} 失败 ==`)
  if (failed) {
    console.error('\n失败项:')
    for (const f of failures) console.error('  - ' + f)
    process.exit(1)
  }
  console.log('✅ 全部通过')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run().catch((err) => {
  console.error('测试运行出错:', err)
  process.exit(1)
})

// 供 gen-preview.js 复用（直接执行本文件时不受影响）
export { MockDB, env, run }
