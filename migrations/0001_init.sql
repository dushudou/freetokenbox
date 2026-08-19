-- FreeTokenBox 初始 schema
-- 使用: wrangler d1 migrations apply freetokenbox

CREATE TABLE IF NOT EXISTS tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- 名称，如 "DeepSeek-V4-Flash API 限时免费开放"
  name TEXT NOT NULL,
  -- URL 友好的唯一 slug，用于 /token/:slug 与 SEO
  slug TEXT NOT NULL UNIQUE,
  -- 一句话简介（列表页展示）
  description TEXT NOT NULL DEFAULT '',
  -- 长文内容（支持 Markdown，详情页渲染）
  content TEXT NOT NULL DEFAULT '',
  -- 提供方/公司名
  provider TEXT NOT NULL DEFAULT '',
  -- 官方/领取地址
  url TEXT NOT NULL DEFAULT '',
  -- 分类：free-api / free-plan / giveaways / coupons ...
  category TEXT NOT NULL DEFAULT 'free-api',
  -- JSON 数组字符串，如 ["api","llm","deepseek"]
  tags TEXT NOT NULL DEFAULT '[]',
  -- 免费活动截止日期（可选，YYYY-MM-DD）
  expiry_date TEXT,
  -- published / draft
  status TEXT NOT NULL DEFAULT 'published',
  -- 是否精选（首页头条）
  is_featured INTEGER NOT NULL DEFAULT 0,
  -- 排序权重，越大越靠前
  sort_weight INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tokens_status_sort ON tokens(status, sort_weight DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_slug ON tokens(slug);
CREATE INDEX IF NOT EXISTS idx_tokens_category ON tokens(category);
