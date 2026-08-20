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
  assert(text.includes('DeepSeek-V4-Flash') && text.includes('FreeTokenBox'), 'home contains seed title & brand')
  assert(!text.includes('adsbygoogle'), 'home does NOT load AdSense script')
  assert(!text.includes('ad-slot'), 'home has NO ad slot placeholders')
  assert(!text.includes('form class="search"'), 'home has NO legacy content-area search form')
  assert(text.includes('class="hero"') && text.includes('class="sidebar"'), 'home has full-width hero + sidebar layout')
  assert(text.indexOf('class="hero"') < text.indexOf('<main>'), 'hero banner renders OUTSIDE main container (full-bleed)')
  assert(text.includes('form class="hero-search"'), 'hero contains search box (directory primary CTA)')
  assert(text.includes('class="hero-mark"'), 'hero has brand watermark mark')
  assert(text.includes('class="kicker"'), 'hero banner has editorial kicker')
  assert(text.includes('最新收录') && text.includes('热门精选'), 'home sidebar has latest & hot widgets')
  assert((text.match(/class="crumbs"/g) || []).length === 0, 'home has NO breadcrumb (info-site home)')
  assert(text.includes('class="e-logo"'), 'home entries show site logo container')
  assert(text.includes('chip free'), 'entries show 免费/Free status chip')
  assert(text.includes('class="w-rank'), 'hot sidebar shows rank numbers')
  assert(text.includes('utm_source=freetokenbox'), 'home claim links carry UTM source')

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
  res = await app.request('/?q=deepseek', {}, env)
  text = await res.text()
  assert(res.status === 200 && text.includes('DeepSeek-V4-Flash'), 'search /?q=deepseek works')

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
  assert(res.status === 200 && text.includes('deepseek-v4-flash-api-free'), 'llms.txt lists tokens')

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
  assert(res.status === 200 && text.includes('## DeepSeek-V4-Flash'), 'tokens.md markdown export works')

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

  console.log(`\n== 结果: ${passed} 通过, ${failed} 失败 ==`)
  if (failed) {
    console.error('\n失败项:')
    for (const f of failures) console.error('  - ' + f)
    process.exit(1)
  }
  console.log('✅ 全部通过')
}

run().catch((err) => {
  console.error('测试运行出错:', err)
  process.exit(1)
})

// 供 gen-preview.js 复用（直接执行本文件时不受影响）
export { MockDB, env, run }
