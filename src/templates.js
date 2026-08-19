// HTML 模板（使用 hono/html 的 html 模板字符串，${} 自动转义）
// 设计规范：中立 zinc 色板 + 单一 emerald 强调色，目录式列表布局，
// 无渐变、无发光、无 emoji 图标，左对齐排版 —— 去 AI 味
import { html, raw } from 'hono/html'
import {
  escapeHtml,
  renderMarkdown,
  formatDate,
  excerpt,
  siteUrl,
  siteTitle,
  siteDescription,
  tokenJsonLd,
  faqJsonLd,
  websiteJsonLd,
  breadcrumbJsonLd,
  itemListJsonLd,
} from './content.js'

// 内联 SVG 图标（禁止 emoji 充当图标）
const ICON = {
  search: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  external: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>',
}

// JSON-LD 必须以原文注入（${} 会被 hono/html 转义成 &quot;，导致 Google 无法解析结构化数据）
function jsonScript(obj) {
  return raw(JSON.stringify(obj).replace(/</g, '\\u003c'))
}

// Google AdSense 广告位
function adSlot(env, slotId, label) {
  const adClient = env.ADSENSE_CLIENT_ID || ''
  if (adClient) {
    const adUnit = env.ADSENSE_AD_UNITS ? (JSON.parse(env.ADSENSE_AD_UNITS) || {}) : {}
    const slot = adUnit[slotId] || adUnit.fallback || ''
    return html`<div class="ad-slot">
      <ins class="adsbygoogle" style="display:block" data-ad-client="${adClient}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </div>`
  }
  return html`<div class="ad-slot"><span>${label}</span></div>`
}

function adLoaderHead(env) {
  const adClient = env.ADSENSE_CLIENT_ID || ''
  if (!adClient) return ''
  return html`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}" crossorigin="anonymous"></script>`
}

// 面包屑组件
function breadcrumb(items) {
  return html`<nav class="crumbs" aria-label="面包屑导航">
    <ol>
      ${items.map((item, i) => {
        const isLast = i === items.length - 1
        return html`<li>${isLast || !item.url
          ? html`<span aria-current="page">${item.name}</span>`
          : html`<a href="${item.url}">${item.name}</a>`}</li>`
      })}
    </ol>
  </nav>`
}

// ---------- 布局 ----------
export function layout({ title, description, path, env, body, extraHead = '', breadcrumbs = null, jsonLd = null }) {
  const base = siteUrl(env)
  const canonical = base ? `${base}${path}` : ''
  const desc = description || siteDescription()
  const ogImage = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#18181b"/><rect x="90" y="240" width="56" height="6" fill="#34d399"/><text x="90" y="326" font-size="62" font-weight="700" fill="#fafafa" font-family="-apple-system,sans-serif">FreeTokenBox</text><text x="90" y="380" font-size="25" fill="#a1a1aa" font-family="-apple-system,sans-serif">免费送 Token 合集 · 持续更新</text></svg>')
  const favicon = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#059669"/><path d="M10 14h12v9H10z" stroke="#fff" stroke-width="2.2" fill="none"/><path d="M8 11h16" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M16 11v12" stroke="#fff" stroke-width="2.2"/></svg>')
  return html`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#fafafa" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#111113" media="(prefers-color-scheme: dark)" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta name="keywords" content="免费Token, 免费API, AI API, free token, free API, DeepSeek, OpenRouter, Gemini, Groq, Cloudflare Workers AI, Mistral, 免费AI额度, API免费调用, LLM免费" />
  <meta name="author" content="FreeTokenBox" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  ${canonical ? html`<link rel="canonical" href="${canonical}" />` : ''}
  <link rel="icon" href="data:image/svg+xml,${favicon}" />
  <link rel="alternate" type="application/rss+xml" title="${siteTitle()}" href="${base}/rss.xml" />
  <link rel="sitemap" type="application/xml" title="Sitemap" href="${base}/sitemap.xml" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="FreeTokenBox" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:locale" content="zh_CN" />
  <meta property="og:image" content="data:image/svg+xml,${ogImage}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="data:image/svg+xml,${ogImage}" />
  <meta name="application-name" content="FreeTokenBox" />
  <meta name="apple-mobile-web-app-title" content="FreeTokenBox" />
  ${extraHead}
  ${adLoaderHead(env)}
  <script type="application/ld+json">${jsonScript(websiteJsonLd(env))}</script>
  ${jsonLd ? html`<script type="application/ld+json">${jsonScript(jsonLd)}</script>` : ''}
  <style>
    :root {
      --bg: #fafafa;
      --surface: #ffffff;
      --text: #18181b;
      --muted: #71717a;
      --faint: #a1a1aa;
      --border: #e4e4e7;
      --border-strong: #d4d4d8;
      --accent: #059669;
      --accent-strong: #047857;
      --accent-ink: #065f46;
      --accent-soft: #ecfdf5;
      --accent-border: #a7f3d0;
      --danger: #dc2626;
      --code-bg: #f4f4f5;
      --radius: 8px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #111113;
        --surface: #1a1a1d;
        --text: #f4f4f5;
        --muted: #a1a1aa;
        --faint: #71717a;
        --border: #2a2a2e;
        --border-strong: #3f3f46;
        --accent: #10b981;
        --accent-strong: #34d399;
        --accent-ink: #6ee7b7;
        --accent-soft: rgba(16,185,129,.09);
        --accent-border: rgba(52,211,153,.32);
        --danger: #f87171;
        --code-bg: #26262a;
      }
    }
    *,*::before,*::after { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
      font-size: 15px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    a { color: var(--accent-strong); text-decoration: none; }
    a:hover { text-decoration: underline; text-underline-offset: 3px; }

    /* ---- 顶栏 ---- */
    header { position: sticky; top: 0; z-index: 100; background: var(--surface); border-bottom: 1px solid var(--border); }
    .nav { max-width: 920px; margin: 0 auto; padding: 0 24px; height: 56px; display: flex; align-items: center; gap: 20px; }
    .brand { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; white-space: nowrap; }
    .brand:hover { text-decoration: none; }
    .brand .mark { width: 20px; height: 20px; border-radius: 5px; background: var(--accent); flex: none; }
    .nav-search { flex: 1; max-width: 320px; position: relative; }
    .nav-search .ic { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--faint); display: flex; }
    .nav-search input { width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: var(--radius); padding: 7px 10px 7px 32px; font-size: 13.5px; font-family: inherit; }
    .nav-search input::placeholder { color: var(--faint); }
    .nav-search input:focus { outline: none; border-color: var(--accent); }
    .nav-links { display: flex; gap: 4px; font-size: 13.5px; margin-left: auto; }
    .nav-links a { color: var(--muted); padding: 5px 10px; border-radius: 6px; }
    .nav-links a:hover { color: var(--text); background: var(--bg); text-decoration: none; }

    main { max-width: 920px; margin: 0 auto; padding: 40px 24px 72px; min-height: 60vh; }

    /* ---- 首屏（左对齐，不居中） ---- */
    .intro { padding: 8px 0 4px; }
    .intro h1 { font-size: clamp(24px, 4vw, 30px); margin: 0 0 10px; line-height: 1.3; font-weight: 700; letter-spacing: -0.015em; }
    .intro .lede { color: var(--muted); margin: 0 0 22px; max-width: 560px; font-size: 14.5px; }
    .search { display: flex; align-items: center; position: relative; max-width: 460px; }
    .search .ic { position: absolute; left: 12px; color: var(--faint); display: flex; pointer-events: none; }
    .search input { width: 100%; background: var(--surface); border: 1px solid var(--border-strong); color: var(--text); border-radius: var(--radius); padding: 10px 14px 10px 36px; font-size: 14.5px; font-family: inherit; }
    .search input::placeholder { color: var(--faint); }
    .search input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .hint { color: var(--faint); font-size: 12.5px; margin: 12px 0 0; }

    /* ---- 分类导航 ---- */
    .cats { display: flex; gap: 4px; flex-wrap: wrap; margin: 28px 0 0; padding: 10px 0; border-bottom: 1px solid var(--border); }
    .cats a { font-size: 13.5px; color: var(--muted); padding: 4px 10px; border-radius: 6px; }
    .cats a .n { color: var(--faint); font-size: 12px; margin-left: 3px; }
    .cats a:hover { color: var(--text); text-decoration: none; background: var(--bg); }
    .cats a.active { color: var(--accent-strong); font-weight: 600; background: var(--accent-soft); text-decoration: none; }

    /* ---- 区块标题 ---- */
    .sec { display: flex; align-items: baseline; gap: 10px; margin: 36px 0 4px; }
    .sec h2 { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: .01em; }
    .sec .n { font-size: 12.5px; color: var(--faint); }

    /* ---- 目录式条目列表 ---- */
    .list { display: flex; flex-direction: column; }
    .entry { display: flex; align-items: center; gap: 20px; padding: 16px 0; border-bottom: 1px solid var(--border); }
    .entry.pick { background: var(--accent-soft); border: 1px solid var(--accent-border); border-radius: var(--radius); padding: 16px 18px; margin: 10px 0; }
    .e-main { flex: 1; min-width: 0; }
    .e-main h3 { margin: 0 0 3px; font-size: 15px; font-weight: 600; line-height: 1.45; }
    .e-main h3 a { color: var(--text); }
    .e-main h3 a:hover { color: var(--accent-strong); text-decoration: none; }
    .e-desc { margin: 0; font-size: 13.5px; color: var(--muted); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .e-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 7px; font-size: 12px; color: var(--faint); }
    .e-meta .sep { opacity: .6; }
    .e-meta .tg { color: var(--muted); font-size: 12px; }
    .e-meta .tg:hover { color: var(--accent-strong); }
    .flag { display: inline-block; font-size: 11px; font-weight: 600; color: var(--accent-ink); background: var(--surface); border: 1px solid var(--accent-border); border-radius: 4px; padding: 0 6px; margin-right: 7px; vertical-align: 2px; }
    .claim { display: inline-flex; align-items: center; gap: 5px; flex: none; font-size: 13px; font-weight: 600; color: var(--accent-strong); border: 1px solid var(--accent-border); background: var(--surface); padding: 7px 13px; border-radius: 6px; white-space: nowrap; }
    .claim .ic { display: flex; }
    .claim:hover { background: var(--accent); border-color: var(--accent); color: #fff; text-decoration: none; }
    .claim.solid { background: var(--accent); border-color: var(--accent); color: #fff; }
    .claim.solid:hover { background: var(--accent-strong); border-color: var(--accent-strong); }

    /* ---- 文章页 ---- */
    .crumbs { font-size: 12.5px; color: var(--faint); padding-bottom: 14px; }
    .crumbs ol { list-style: none; display: flex; gap: 6px; margin: 0; padding: 0; flex-wrap: wrap; }
    .crumbs li { display: flex; gap: 6px; }
    .crumbs li + li::before { content: '/'; color: var(--faint); }
    .crumbs a { color: var(--muted); }
    .crumbs a:hover { color: var(--accent-strong); }
    .article { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 36px; max-width: 760px; margin: 0 auto; }
    .article .meta { color: var(--muted); margin: 0 0 18px; font-size: 12.5px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .article .meta .tg { color: var(--muted); }
    .article .meta .tg:hover { color: var(--accent-strong); }
    .article .meta .sep { opacity: .5; }
    .article h1 { font-size: 24px; margin: 0 0 6px; line-height: 1.35; font-weight: 700; letter-spacing: -0.01em; }
    .article .standfirst { color: var(--muted); margin: 0 0 24px; font-size: 14.5px; }
    .article .body { color: var(--text); line-height: 1.85; font-size: 14.5px; }
    .article .body h2,.article .body h3 { margin: 26px 0 10px; font-weight: 600; font-size: 17px; }
    .article .body ul,.article .body ol { padding-left: 22px; }
    .article .body li { margin: 5px 0; }
    .article .body blockquote { border-left: 2px solid var(--accent); margin: 14px 0; padding: 4px 16px; color: var(--muted); }
    .article .body code { background: var(--code-bg); padding: 2px 6px; border-radius: 4px; font-size: .88em; font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace; }
    .article .body a { text-decoration: underline; text-underline-offset: 3px; }
    .cta { margin-top: 28px; padding-top: 22px; border-top: 1px solid var(--border); display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .btn { display: inline-flex; align-items: center; gap: 6px; background: var(--accent); color: #fff; font-weight: 600; padding: 9px 16px; border-radius: 6px; font-size: 14px; border: 1px solid var(--accent); cursor: pointer; font-family: inherit; }
    .btn:hover { background: var(--accent-strong); border-color: var(--accent-strong); color: #fff; text-decoration: none; }
    .btn .ic { display: flex; }
    .btn-quiet { background: transparent; border-color: var(--border-strong); color: var(--muted); }
    .btn-quiet:hover { border-color: var(--muted); background: transparent; color: var(--text); }
    .btn-sm { padding: 7px 12px; font-size: 13px; }

    /* ---- FAQ（细分隔线，不做卡片盒子） ---- */
    .faq { max-width: 760px; margin: 40px auto 0; }
    .faq h2 { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
    .faq details { border-bottom: 1px solid var(--border); }
    .faq details:first-of-type { border-top: 1px solid var(--border); margin-top: 12px; }
    .faq summary { padding: 13px 2px; font-size: 13.5px; font-weight: 500; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .faq summary::-webkit-details-marker { display: none; }
    .faq summary:hover { color: var(--accent-strong); }
    .faq summary::after { content: '+'; color: var(--faint); font-size: 16px; font-weight: 400; flex: none; }
    .faq details[open] summary::after { content: '−'; }
    .faq .answer { padding: 0 2px 14px; color: var(--muted); font-size: 13.5px; line-height: 1.75; }

    /* ---- 相关推荐 ---- */
    .related { margin-top: 40px; }
    .related h2 { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
    .related-list { display: flex; flex-direction: column; margin-top: 12px; }
    .related-list .entry { padding: 12px 0; }

    /* ---- 分页 ---- */
    .pager { display: flex; gap: 8px; justify-content: center; margin: 36px 0 0; }
    .pager a,.pager span { padding: 7px 14px; border: 1px solid var(--border); border-radius: 6px; color: var(--muted); font-size: 13.5px; background: var(--surface); }
    .pager a:hover { border-color: var(--accent); color: var(--accent-strong); text-decoration: none; }
    .pager .cur { color: var(--text); font-weight: 600; border-color: var(--border-strong); }

    /* ---- 广告位 ---- */
    .ad-slot { border: 1px dashed var(--border); border-radius: var(--radius); padding: 18px; text-align: center; color: var(--faint); font-size: 12px; margin: 28px 0; }

    /* ---- 页脚 ---- */
    footer { border-top: 1px solid var(--border); }
    .foot { max-width: 920px; margin: 0 auto; padding: 22px 24px; color: var(--faint); font-size: 12.5px; display: flex; gap: 18px; flex-wrap: wrap; align-items: center; }
    .foot a { color: var(--muted); }
    .foot a:hover { color: var(--accent-strong); }
    .foot .right { margin-left: auto; }

    /* ---- 后台 ---- */
    form.admin { display: flex; flex-direction: column; gap: 14px; max-width: 640px; margin: 0 auto; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 28px; }
    label { font-size: 13px; color: var(--muted); display: flex; flex-direction: column; gap: 6px; font-weight: 500; }
    input,select,textarea { background: var(--bg); border: 1px solid var(--border-strong); color: var(--text); border-radius: 6px; padding: 9px 12px; font-size: 14px; font-family: inherit; }
    input:focus,select:focus,textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    textarea { min-height: 120px; resize: vertical; }
    .flash { padding: 11px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 13.5px; border: 1px solid; }
    .flash.ok { background: var(--accent-soft); border-color: var(--accent-border); color: var(--accent-ink); }
    .flash.err { background: rgba(220,38,38,.06); border-color: var(--danger); color: var(--danger); }
    .rowline { display: flex; gap: 10px; flex-wrap: wrap; }
    table.list { width: 100%; border-collapse: collapse; font-size: 13.5px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
    table.list th,table.list td { border-bottom: 1px solid var(--border); padding: 10px 12px; text-align: left; vertical-align: top; }
    table.list th { color: var(--muted); font-weight: 500; font-size: 12px; background: var(--bg); }
    table.list tr:last-child td { border-bottom: none; }
    .actions a,.actions form { display: inline-block; margin-right: 8px; font-size: 13px; }
    .danger { color: var(--danger); background: none; border: none; cursor: pointer; padding: 0; font-size: 13px; font-family: inherit; }

    /* ---- 响应式 ---- */
    @media (max-width: 640px) {
      .nav { padding: 0 16px; gap: 12px; }
      .nav-search { display: none; }
      main { padding: 24px 16px 56px; }
      .article { padding: 22px; }
      .entry { flex-direction: column; align-items: stretch; gap: 12px; }
      .entry .claim { align-self: flex-start; }
      .foot { flex-direction: column; align-items: flex-start; gap: 8px; }
      .foot .right { margin-left: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; transition: none !important; }
    }
  </style>
</head>
<body>
  <header>
    <div class="nav">
      <a class="brand" href="/"><span class="mark" aria-hidden="true"></span>FreeTokenBox</a>
      <form class="nav-search" action="/" method="get">
        <span class="ic">${raw(ICON.search)}</span>
        <input type="search" name="q" placeholder="搜索免费 Token" aria-label="搜索" value="" />
      </form>
      <div class="nav-links">
        <a href="/">首页</a>
        <a href="/api/tokens">API</a>
        <a href="/about">关于</a>
        <a href="/admin">后台</a>
      </div>
    </div>
  </header>
  <main>
    ${breadcrumbs ? breadcrumb(breadcrumbs) : ''}
    ${body}
    ${adSlot(env, 'footer', '广告位')}
  </main>
  <footer>
    <div class="foot">
      <span>© ${new Date().getFullYear()} FreeTokenBox</span>
      <a href="/sitemap.xml">Sitemap</a>
      <a href="/rss.xml">RSS</a>
      <a href="/llms.txt">llms.txt</a>
      <a href="/api/tokens">API</a>
      <a href="/about">关于</a>
      <a href="/privacy">隐私</a>
      <a href="/terms">条款</a>
      <span class="right">条目信息仅供参考，领取以官方页面为准</span>
    </div>
  </footer>
</body>
</html>`
}

// ---------- 条目行 ----------
function entryRow(t, opts = {}) {
  const pick = opts.pick || t.is_featured
  return html`<article class="entry${pick ? ' pick' : ''}">
    <div class="e-main">
      <h3>${pick ? html`<span class="flag">精选</span>` : ''}<a href="/token/${t.slug}">${t.name}</a></h3>
      <p class="e-desc">${excerpt(t.description, 110)}</p>
      <div class="e-meta">
        ${t.provider ? html`<span>${t.provider}</span><span class="sep">·</span>` : ''}
        ${t.expiry_date ? html`<span>截止 ${formatDate(t.expiry_date)}</span><span class="sep">·</span>` : ''}
        ${(t.tags || []).slice(0, 4).map((tag) => html`<a class="tg" href="/tags/${tag}">#${tag}</a>`)}
      </div>
    </div>
    <a class="claim${pick ? ' solid' : ''}" href="${t.url || `/token/${t.slug}`}" rel="noopener nofollow" target="_blank">领取<span class="ic">${raw(ICON.external)}</span></a>
  </article>`
}

// ---------- 首页 ----------
export function homePage({ featured, items, categories, page, totalPages, env, query, searchQuery, stats }) {
  const body = html`
    <section class="intro">
      <h1>免费送 Token 合集</h1>
      <p class="lede">收录正在发放免费 AI Token、API 额度与算力的活动。领取链接均指向官方页面，人工核对、持续更新。</p>
      <form class="search" action="/" method="get">
        <span class="ic">${raw(ICON.search)}</span>
        <input type="search" name="q" placeholder="搜索平台、模型或关键词" aria-label="搜索免费 Token" value="${escapeHtml(searchQuery || '')}" />
      </form>
      ${stats ? html`<p class="hint">已收录 ${stats.total} 个条目 · ${stats.categories} 个分类 · 其中 ${stats.featured} 个精选</p>` : ''}
    </section>

    ${categories.length ? html`
      <nav class="cats" aria-label="分类导航">
        <a href="/" class="${!searchQuery ? 'active' : ''}">全部</a>
        ${categories.map((c) => html`<a href="/category/${c.name}" class="${searchQuery === c.name ? 'active' : ''}">${c.name}<span class="n">${c.count}</span></a>`)}
      </nav>
    ` : ''}

    ${featured.length ? html`
      <div class="sec"><h2>精选</h2><span class="n">${featured.length} 个</span></div>
      <div class="list">${featured.map((t) => entryRow(t, { pick: true }))}</div>
    ` : ''}

    <div class="sec">
      <h2>${searchQuery ? '搜索结果' : '全部条目'}</h2>
      <span class="n">${items.length} 条${totalPages > 1 ? ` · 第 ${page}/${totalPages} 页` : ''}</span>
    </div>
    ${adSlot(env, 'home-top', '列表上方广告位')}
    <div class="list">${items.map((t) => entryRow(t))}</div>

    ${totalPages > 1 ? html`<nav class="pager" aria-label="分页">
      ${page > 1 ? html`<a href="/?page=${page - 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}">上一页</a>` : ''}
      <span class="cur">${page} / ${totalPages}</span>
      ${page < totalPages ? html`<a href="/?page=${page + 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}">下一页</a>` : ''}
    </nav>` : ''}
  `
  return layout({
    title: searchQuery
      ? `搜索「${searchQuery}」· ${siteTitle()}`
      : `${siteTitle()} · 免费 AI Token / API 额度聚合`,
    description: searchQuery
      ? `搜索「${searchQuery}」相关的免费 Token 和 API 额度。`
      : siteDescription(),
    path: query ? `/?${query}` : '/',
    env,
    body,
    jsonLd: itemListJsonLd(featured.length ? [...featured, ...items] : items, env),
  })
}

// ---------- 列表页（分类/标签/搜索共用） ----------
export function listPage({ title, description, items, categories, page, totalPages, env, path, badge, breadcrumbs, query, searchQuery }) {
  const body = html`
    ${breadcrumbs ? breadcrumb(breadcrumbs) : ''}
    <section class="intro">
      <h1>${title}</h1>
      <p class="lede">${description}</p>
      ${badge ? html`<p class="hint">${badge}</p>` : ''}
    </section>
    <div class="list">${items.map((t) => entryRow(t))}</div>
    ${totalPages > 1 ? html`<nav class="pager" aria-label="分页">
      ${page > 1 ? html`<a href="${path}?page=${page - 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}">上一页</a>` : ''}
      <span class="cur">${page} / ${totalPages}</span>
      ${page < totalPages ? html`<a href="${path}?page=${page + 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}">下一页</a>` : ''}
    </nav>` : ''}
  `
  return layout({
    title,
    description,
    path: query ? `${path}?${query}` : path,
    env,
    body,
    breadcrumbs,
    jsonLd: itemListJsonLd(items, env),
  })
}

// ---------- Token 详情页 ----------
export function tokenPage(token, env, related = []) {
  const base = siteUrl(env)
  const canonical = `${base}/token/${token.slug}`
  const jsonLd = tokenJsonLd(token, env)
  const faqLd = faqJsonLd(token)
  const crumbs = [
    { name: '首页', url: '/' },
    { name: token.category || '全部', url: token.category ? `/category/${token.category}` : '/' },
    { name: token.name },
  ]
  const body = html`
    ${breadcrumb(crumbs)}
    <article class="article">
      <div class="meta">
        ${token.category ? html`<a class="tg" href="/category/${token.category}">${token.category}</a>` : ''}
        ${(token.tags || []).map((t) => html`<a class="tg" href="/tags/${t}">#${t}</a>`)}
        ${token.provider ? html`<span class="sep">·</span><span>${token.provider}</span>` : ''}
        ${token.expiry_date ? html`<span class="sep">·</span><span>截止 ${formatDate(token.expiry_date)}</span>` : ''}
        <span class="sep">·</span><span>收录于 ${formatDate(token.created_at)}</span>
      </div>
      <h1>${token.name}</h1>
      <p class="standfirst">${token.description}</p>
      <div class="body">${raw(renderMarkdown(token.content))}</div>
      <div class="cta">
        <a class="btn" href="${token.url || canonical}" rel="noopener nofollow" target="_blank">前往 ${token.provider || '官方'} 领取<span class="ic">${raw(ICON.external)}</span></a>
        <a class="btn btn-quiet" href="/">返回列表</a>
      </div>
      ${adSlot(env, 'article-bottom', '文章底部广告位')}
    </article>

    ${related.length ? html`
    <section class="related" style="max-width:760px;margin:40px auto 0">
      <h2>相关条目</h2>
      <div class="related-list">
        ${related.map((t) => html`<article class="entry">
          <div class="e-main">
            <h3><a href="/token/${t.slug}">${t.name}</a></h3>
            <p class="e-desc">${excerpt(t.description, 80)}</p>
          </div>
          <a class="claim" href="/token/${t.slug}">查看</a>
        </article>`)}
      </div>
    </section>` : ''}

    <section class="faq">
      <h2>常见问题</h2>
      <details>
        <summary>${token.name} 收费吗？</summary>
        <div class="answer">不收费。该活动由 ${token.provider || '官方'} 免费发放，领取和使用均不产生费用，具体细则以官方页面为准。</div>
      </details>
      <details>
        <summary>怎么领取？</summary>
        <div class="answer">点击上方「前往领取」按钮，会跳转到 ${token.provider || '官方'} 的活动页面，按页面提示完成领取即可。</div>
      </details>
      ${token.expiry_date ? html`<details>
        <summary>什么时候结束？</summary>
        <div class="answer">本次活动截止到 ${formatDate(token.expiry_date)}，建议尽早领取，额度发完即止。</div>
      </details>` : ''}
      <details>
        <summary>还有其他免费额度吗？</summary>
        <div class="answer">FreeTokenBox 持续收录 DeepSeek、OpenRouter、Google Gemini、Groq、Cloudflare Workers AI、Mistral 等平台的免费活动，可在 <a href="/">首页</a> 浏览全部条目。</div>
      </details>
    </section>
  `
  return layout({
    title: `${token.name} · 免费领取 · FreeTokenBox`,
    description: excerpt(token.description, 160),
    path: `/token/${token.slug}`,
    env,
    body,
    breadcrumbs: crumbs,
    jsonLd: [jsonLd, faqLd, breadcrumbJsonLd(crumbs, env)],
    extraHead: html`
      <meta property="og:type" content="article" />
      <meta property="og:url" content="${canonical}" />
      <meta property="article:published_time" content="${token.created_at}" />
      <meta property="article:modified_time" content="${token.updated_at}" />
      <meta property="article:author" content="FreeTokenBox" />
      ${token.tags ? html`<meta property="article:tag" content="${token.tags.join(', ')}" />` : ''}
    `,
  })
}

// ---------- 后台页面 ----------
export function adminLoginPage({ error, env }) {
  const body = html`
    <form class="admin" method="post" action="/admin/login" style="margin-top:40px">
      <h1 style="margin:0;font-size:20px">后台登录</h1>
      ${error ? html`<div class="flash err">${error}</div>` : ''}
      <label>密码
        <input type="password" name="password" autofocus required placeholder="ADMIN_PASSWORD" />
      </label>
      <button class="btn" type="submit">登录</button>
      <p style="font-size:12px;color:var(--faint);margin:0">密码来自 Worker 环境变量 ADMIN_PASSWORD。</p>
    </form>
  `
  return layout({ title: '后台登录 · FreeTokenBox', description: 'FreeTokenBox 后台登录', path: '/admin/login', env, body })
}

export function adminPage({ tokens, flash, env, categories }) {
  const flashHtml = flash ? html`<div class="flash ${flash.type}">${flash.msg}</div>` : ''
  const rows = tokens.map(
    (t) => html`<tr>
      <td>${t.id}</td>
      <td><a href="/token/${t.slug}" target="_blank">${t.name}</a>${t.is_featured ? html` <span class="flag">精选</span>` : ''}</td>
      <td>${t.provider || '-'}</td>
      <td>${t.status}${t.expiry_date ? html`<br/><span style="color:var(--faint)">${t.expiry_date} 截止</span>` : ''}</td>
      <td>${(t.tags || []).slice(0, 3).map((t2) => `#${t2}`).join(' ')}</td>
      <td class="actions">
        <a href="/admin/edit/${t.slug}">编辑</a>
        <form method="post" action="/admin/delete/${t.slug}" onsubmit="return confirm('确认删除「${t.name.replace(/'/g, '')}」？')">
          <button type="submit" class="danger">删除</button>
        </form>
      </td>
    </tr>`
  )
  const body = html`
    <div class="sec" style="margin-top:0"><h2 style="font-size:18px">后台管理</h2></div>
    ${flashHtml}
    <div class="rowline" style="margin-bottom:20px">
      <a class="btn btn-sm" href="/admin/new">新增 Token</a>
      <a class="btn btn-sm btn-quiet" href="/admin/seed">导入种子数据</a>
      <form method="post" action="/admin/logout" style="margin-left:auto">
        <button class="btn btn-sm btn-quiet" type="submit">退出登录</button>
      </form>
    </div>
    <div style="overflow-x:auto">
      <table class="list">
        <thead><tr><th>ID</th><th>名称</th><th>提供方</th><th>状态</th><th>标签</th><th>操作</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
  return layout({ title: '后台管理 · FreeTokenBox', description: '管理免费 token 条目', path: '/admin', env, body })
}

function formField(name, label, value, opts = {}) {
  const v = escapeHtml(value ?? '')
  if (opts.type === 'textarea') {
    return html`<label>${label}
      <textarea name="${name}" ${opts.required ? 'required' : ''}>${v}</textarea>
    </label>`
  }
  if (opts.type === 'select') {
    const options = (opts.options || []).map((o) => {
      const selected = o === value ? ' selected' : ''
      return html`<option value="${o}"${selected}>${o}</option>`
    })
    return html`<label>${label}
      <select name="${name}" ${opts.required ? 'required' : ''}>${options}</select>
    </label>`
  }
  return html`<label>${label}
    <input type="${opts.type || 'text'}" name="${name}" value="${v}" ${opts.required ? 'required' : ''} placeholder="${opts.placeholder || ''}" />
  </label>`
}

export function adminFormPage({ token, flash, env, isNew }) {
  const t = token || {}
  const flashHtml = flash ? html`<div class="flash ${flash.type}">${flash.msg}</div>` : ''
  const action = isNew ? '/admin/new' : `/admin/edit/${t.slug}`
  const body = html`
    <form class="admin" method="post" action="${action}">
      <h1 style="margin:0;font-size:20px">${isNew ? '新增 Token' : '编辑 Token'}</h1>
      ${flashHtml}
      ${formField('name', '名称（如：DeepSeek-V4-Flash API 限时免费开放）', t.name, { required: true })}
      ${formField('slug', 'Slug（留空自动生成，用于 /token/:slug）', t.slug, { placeholder: 'deepseek-v4-flash-free' })}
      ${formField('provider', '提供方 / 公司名', t.provider)}
      ${formField('url', '领取地址（官方链接）', t.url, { placeholder: 'https://...' })}
      ${formField('category', '分类', t.category || 'free-api', { type: 'select', options: ['free-api', 'free-plan', 'giveaways', 'coupons', 'other'] })}
      ${formField('tags', '标签（逗号分隔，如 api, llm, free-token）', (t.tags || []).join(', '))}
      ${formField('expiry_date', '活动截止日期（可选，YYYY-MM-DD）', t.expiry_date)}
      ${formField('status', '状态', t.status || 'published', { type: 'select', options: ['published', 'draft'] })}
      ${formField('is_featured', '精选（首页头条，1/0）', t.is_featured ? '1' : '0', { type: 'select', options: ['0', '1'] })}
      ${formField('sort_weight', '排序权重（越大越靠前）', t.sort_weight || '0')}
      ${formField('description', '一句话简介（列表页展示）', t.description, { type: 'textarea', required: true })}
      ${formField('content', '长文内容（Markdown 格式）', t.content, { type: 'textarea' })}
      <div class="rowline">
        <button class="btn" type="submit">保存</button>
        <a class="btn btn-quiet" href="/admin">取消</a>
      </div>
    </form>
  `
  return layout({ title: `${isNew ? '新增' : '编辑'} Token · FreeTokenBox`, description: '后台表单', path: action, env, body })
}
