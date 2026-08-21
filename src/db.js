// DB 访问层 —— 依赖 Cloudflare D1 绑定 env.DB（鸭子类型：prepare/bind/all/first/run）
// 也兼容本地测试用 mock，见 scripts/test-local.js

/** 把行数据规整成对外输出对象（叶子字段，无绑定引用） */
export function normalizeToken(row) {
  if (!row) return null
  let tags = []
  try {
    tags = JSON.parse(row.tags || '[]')
  } catch {
    tags = []
  }
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    content: row.content || '',
    provider: row.provider || '',
    url: row.url || '',
    category: row.category || 'free-api',
    tags,
    expiry_date: row.expiry_date || null,
    status: row.status || 'published',
    is_featured: !!row.is_featured,
    sort_weight: row.sort_weight || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function getDB(env) {
  return env.DB
}

/** 分页 + 状态/分类/标签过滤的列表查询 */
export async function listTokens(env, opts = {}) {
  const db = getDB(env)
  const {
    status = 'published',
    category,
    tag,
    query,
    page = 1,
    pageSize = 20,
    includeAll = false,
    order = 'sort', // 'sort'（精选权重优先）| 'newest'（最新收录优先）
  } = opts
  const where = []
  const params = []
  if (!includeAll) {
    where.push('status = ?')
    params.push(status || 'published')
  }
  if (category) {
    where.push('category = ?')
    params.push(category)
  }
  if (tag) {
    where.push('tags LIKE ?')
    params.push(`%"${tag}"%`)
  }
  if (query) {
    where.push('(name LIKE ? OR description LIKE ? OR provider LIKE ?)')
    const like = `%${query}%`
    params.push(like, like, like)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const offset = (Math.max(1, page) - 1) * pageSize

  const countRow = await db
    .prepare(`SELECT COUNT(*) AS n FROM tokens ${whereSql}`)
    .bind(...params)
    .first()
  const total = countRow ? Number(countRow.n) : 0

  const rows = await db
    .prepare(
      `SELECT * FROM tokens ${whereSql}
       ORDER BY ${order === 'weighted' ? 'sort_weight DESC, id DESC' : 'id DESC'} LIMIT ? OFFSET ?`
    )
    .bind(...params, pageSize, offset)
    .all()

  return {
    items: (rows.results || []).map(normalizeToken),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function getTokenBySlug(env, slug) {
  const db = getDB(env)
  const row = await db.prepare('SELECT * FROM tokens WHERE slug = ?').bind(slug).first()
  return normalizeToken(row)
}

export async function getTokenById(env, id) {
  const db = getDB(env)
  const row = await db.prepare('SELECT * FROM tokens WHERE id = ?').bind(id).first()
  return normalizeToken(row)
}

/** 创建 token，返回新记录 */
export async function createToken(env, data) {
  const db = getDB(env)
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const result = await db
    .prepare(
      `INSERT INTO tokens
        (name, slug, description, content, provider, url, category, tags, expiry_date, status, is_featured, sort_weight, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      data.name,
      data.slug,
      data.description || '',
      data.content || '',
      data.provider || '',
      data.url || '',
      data.category || 'free-api',
      JSON.stringify(data.tags || []),
      data.expiry_date || null,
      data.status || 'published',
      data.is_featured ? 1 : 0,
      data.sort_weight || 0,
      now,
      now
    )
    .run()
  const id = result.meta ? result.meta.last_row_id : undefined
  if (id === undefined) {
    // 部分 mock 实现不返回 meta
    const row = await db.prepare('SELECT * FROM tokens ORDER BY id DESC LIMIT 1').first()
    return normalizeToken(row)
  }
  return getTokenById(env, Number(id))
}

/** 更新 token，返回更新后的记录；不存在返回 null */
export async function updateToken(env, slug, data) {
  const db = getDB(env)
  const existing = await getTokenBySlug(env, slug)
  if (!existing) return null
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const merged = {
    name: data.name ?? existing.name,
    slug: data.slug ?? existing.slug,
    description: data.description ?? existing.description,
    content: data.content ?? existing.content,
    provider: data.provider ?? existing.provider,
    url: data.url ?? existing.url,
    category: data.category ?? existing.category,
    tags: data.tags !== undefined ? data.tags : existing.tags,
    expiry_date: data.expiry_date !== undefined ? data.expiry_date : existing.expiry_date,
    status: data.status ?? existing.status,
    is_featured: data.is_featured !== undefined ? data.is_featured : existing.is_featured,
    sort_weight: data.sort_weight !== undefined ? data.sort_weight : existing.sort_weight,
  }
  await db
    .prepare(
      `UPDATE tokens SET
        name = ?, slug = ?, description = ?, content = ?, provider = ?, url = ?,
        category = ?, tags = ?, expiry_date = ?, status = ?, is_featured = ?, sort_weight = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(
      merged.name,
      merged.slug,
      merged.description,
      merged.content,
      merged.provider,
      merged.url,
      merged.category,
      JSON.stringify(merged.tags || []),
      merged.expiry_date,
      merged.status,
      merged.is_featured ? 1 : 0,
      merged.sort_weight,
      now,
      existing.id
    )
    .run()
  return getTokenBySlug(env, merged.slug)
}

export async function deleteToken(env, slug) {
  const db = getDB(env)
  const existing = await getTokenBySlug(env, slug)
  if (!existing) return false
  await db.prepare('DELETE FROM tokens WHERE slug = ?').bind(slug).run()
  return true
}

/** 分类列表（用于导航与 SEO 筛选页） */
export async function listCategories(env) {
  const db = getDB(env)
  const rows = await db
    .prepare(`SELECT category, COUNT(*) AS n FROM tokens WHERE status='published' GROUP BY category ORDER BY n DESC`)
    .all()
  return (rows.results || []).map((r) => ({ name: r.category, count: Number(r.n) }))
}
