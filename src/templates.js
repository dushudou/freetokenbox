// HTML 模板（使用 hono/html 的 html 模板字符串，${} 自动转义）
// 设计规范：中立 zinc 色板 + 单一 emerald 强调色，目录式列表布局，中英双语（/en 前缀）
import { html, raw } from 'hono/html'
import {
  escapeHtml,
  renderMarkdown,
  formatDate,
  daysUntil,
  excerpt,
  siteUrl,
  siteTitle,
  siteDescription,
  tokenJsonLd,
  faqJsonLd,
  websiteJsonLd,
  organizationJsonLd,
  breadcrumbJsonLd,
  itemListJsonLd,
} from './content.js'
import { T, lp } from './i18n.js'

// ---------- 图标体系（全部 SVG，禁止 emoji） ----------
// 品牌标识「方孔钱」：外圆内方 —— Token 硬币中间开出 Box 方孔
// tile 颜色由 .brand-tile class + CSS 变量 --brand-tile 控制（浅色 #059669 / 深色 #10b981）
const BRAND_GLYPH = (tile) =>
  `<circle cx="12" cy="12" r="7.4" fill="#fff"/>` +
  `<rect x="8.8" y="8.8" width="6.4" height="6.4" rx="1.3" fill="${tile}"/>`

const ICON = {
  brand: `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6.5" class="brand-tile"/><circle cx="12" cy="12" r="7.4" fill="#fff"/><rect x="8.8" y="8.8" width="6.4" height="6.4" rx="1.3" class="brand-tile"/></svg>`,
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M16.6 16.6L21 21"/></svg>',
  external: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 15.5L15.5 8.5"/><path d="M10 8.5h6.5V15"/></svg>',
}

// favicon 内嵌 prefers-color-scheme：深色浏览器主题下自动换用亮一档的翡翠绿
const FAVICON = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><style>.t{fill:#059669}@media (prefers-color-scheme: dark){.t{fill:#10b981}}</style><rect width="32" height="32" rx="8.7" class="t"/><circle cx="16" cy="16" r="9.9" fill="#fff"/><rect x="11.7" y="11.7" width="8.6" height="8.6" rx="1.7" class="t"/></svg>'
)

const OG_IMAGE = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#18181b"/><g transform="translate(90,96) scale(3)"><rect width="24" height="24" rx="6.5" fill="#10b981"/><circle cx="12" cy="12" r="7.4" fill="#fff"/><rect x="8.8" y="8.8" width="6.4" height="6.4" rx="1.3" fill="#10b981"/></g><text x="90" y="292" font-size="60" font-weight="700" fill="#fafafa" font-family="-apple-system,Segoe UI,sans-serif">FreeTokenBox</text><text x="90" y="346" font-size="26" fill="#a1a1aa" font-family="-apple-system,Segoe UI,sans-serif">免费送 Token 合集 · Free AI Token Deals</text><rect x="90" y="394" width="56" height="6" fill="#34d399"/><text x="90" y="472" font-size="21" fill="#71717a" font-family="-apple-system,Segoe UI,sans-serif">DeepSeek · OpenRouter · Gemini · Groq · Cloudflare · Mistral</text></svg>'
)

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

// 面包屑组件（item.url 传 zh 形式路径，渲染时按语言加前缀）
function breadcrumb(items, lang) {
  return html`<nav class="crumbs" aria-label="${lang === 'en' ? 'Breadcrumb' : '面包屑导航'}">
    <ol>
      ${items.map((item, i) => {
        const isLast = i === items.length - 1
        return html`<li>${isLast || !item.url
          ? html`<span aria-current="page">${item.name}</span>`
          : html`<a href="${lp(lang, item.url)}">${item.name}</a>`}</li>`
      })}
    </ol>
  </nav>`
}

// ---------- 布局 ----------
export function layout({ title, description, path, env, body, hero = null, extraHead = '', breadcrumbs = null, jsonLd = null, lang = 'zh' }) {
  const base = siteUrl(env)
  const t = T(lang)
  const cleanPath = ((path || '/').split('?')[0]) || '/'
  const canonical = base ? `${base}${lp(lang, cleanPath)}` : ''
  const desc = description || siteDescription(lang)
  return html`<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#fafafa" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#111113" media="(prefers-color-scheme: dark)" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta name="keywords" content="免费Token, 免费API, AI API, free token, free API, free AI credits, DeepSeek, OpenRouter, Gemini, Groq, Cloudflare Workers AI, Mistral, 免费AI额度, API免费调用, LLM免费" />
  <meta name="author" content="FreeTokenBox" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  ${canonical ? html`<link rel="canonical" href="${canonical}" />` : ''}
  ${base ? html`
  <link rel="alternate" hreflang="zh-CN" href="${base}${cleanPath}" />
  <link rel="alternate" hreflang="en" href="${base}/en${cleanPath}" />
  <link rel="alternate" hreflang="x-default" href="${base}${cleanPath}" />` : ''}
  <link rel="icon" href="data:image/svg+xml,${FAVICON}" />
  <link rel="alternate" type="application/rss+xml" title="${siteTitle(lang)}" href="${base}/rss.xml" />
  <link rel="sitemap" type="application/xml" title="Sitemap" href="${base}/sitemap.xml" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="FreeTokenBox" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:locale" content="${t.locale}" />
  <meta property="og:locale:alternate" content="${t.altLocale}" />
  <meta property="og:image" content="data:image/svg+xml,${OG_IMAGE}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="data:image/svg+xml,${OG_IMAGE}" />
  <meta name="application-name" content="FreeTokenBox" />
  <meta name="apple-mobile-web-app-title" content="FreeTokenBox" />
  ${extraHead}
  ${adLoaderHead(env)}
  <script type="application/ld+json">${jsonScript(websiteJsonLd(env, lang))}</script>
  ${jsonLd ? html`<script type="application/ld+json">${jsonScript(jsonLd)}</script>` : ''}
  <style>
    :root {
      --bg: #f6f6f7;
      --surface: #ffffff;
      --surface-2: #f0f0f2;
      --text: #1d1d1f;
      --muted: #6e6e73;
      --faint: #9b9ba2;
      --border: rgba(0,0,0,.09);
      --border-strong: rgba(0,0,0,.18);
      --accent: #0c8f62;
      --accent-strong: #0a7a54;
      --accent-ink: #065f46;
      --on-accent: #ffffff;
      --accent-soft: rgba(12,143,98,.09);
      --accent-border: rgba(12,143,98,.32);
      --ok: #0c8f62; --warn: #d97706; --danger: #dc2626;
      --ok-tint: rgba(12,143,98,.10); --warn-tint: rgba(217,119,6,.13); --danger-tint: rgba(220,38,38,.10);
      --code-bg: #f0f0f2;
      --radius: 12px;
      --shadow-card: 0 1px 3px rgba(0,0,0,.05), 0 6px 18px -8px rgba(0,0,0,.10);
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif;
      --font-mono: ui-monospace, "SF Mono", SFMono-Regular, "Cascadia Mono", Menlo, Consolas, monospace;
      --brand-tile: #0c8f62;
      --hero-bg: #eef4f1;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0b0b0e;
        --surface: #161619;
        --surface-2: #1e1e23;
        --text: #f2f2f4;
        --muted: #a1a1a8;
        --faint: #707077;
        --border: rgba(255,255,255,.09);
        --border-strong: rgba(255,255,255,.17);
        --accent: #34d399; --accent-strong: #5ee0ad; --accent-ink: #34d399;
        --on-accent: #042a1e;
        --accent-soft: rgba(52,211,153,.11); --accent-border: rgba(52,211,153,.34);
        --ok: #34d399; --warn: #fbbf24; --danger: #f87171;
        --ok-tint: rgba(52,211,153,.12); --warn-tint: rgba(251,191,36,.12); --danger-tint: rgba(248,113,113,.12);
        --code-bg: #1e1e23;
        --shadow-card: 0 1px 3px rgba(0,0,0,.35), 0 8px 24px -10px rgba(0,0,0,.55);
        --brand-tile: #34d399;
        --hero-bg: #101a15;
      }
    }
    *,*::before,*::after { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--font-sans);
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
      font-size: 16px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      font-variant-numeric: tabular-nums;
    }
    a { color: var(--accent-strong); text-decoration: none; }
    a:hover { text-decoration: underline; text-underline-offset: 3px; }
    :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }

    /* ---- 顶栏（磨砂吸顶） ---- */
    header { position: sticky; top: 0; z-index: 100; background: color-mix(in srgb, var(--surface) 82%, transparent); backdrop-filter: saturate(1.4) blur(12px); border-bottom: 1px solid var(--border); }
    .nav { max-width: 1120px; margin: 0 auto; padding: 0 24px; height: 60px; display: flex; align-items: center; gap: 20px; }
    .brand { display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 700; color: var(--text); letter-spacing: -0.02em; white-space: nowrap; }
    .brand svg { display: block; }
    .brand-tile { fill: var(--brand-tile); }
    .brand:hover { text-decoration: none; }
    .nav-search { flex: 1; max-width: 300px; position: relative; }
    .nav-search .ic { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--faint); display: flex; }
    .nav-search input { width: 100%; background: var(--surface-2); border: 1px solid transparent; color: var(--text); border-radius: 999px; padding: 8px 12px 8px 34px; font-size: 14px; font-family: inherit; transition: border-color .15s ease, background .15s ease; }
    .nav-search input::placeholder { color: var(--faint); }
    .nav-search input:focus { outline: none; border-color: var(--accent); background: var(--surface); box-shadow: 0 0 0 3px var(--accent-soft); }
    .nav-links { display: flex; gap: 2px; font-size: 14.5px; margin-left: auto; align-items: center; }
    .nav-links a { color: var(--muted); padding: 6px 12px; border-radius: 8px; }
    .nav-links a:hover { color: var(--text); background: var(--surface-2); text-decoration: none; }
    .lang-switch { font-size: 13px; font-weight: 600; color: var(--muted); border: 1px solid var(--border-strong); padding: 5px 12px; border-radius: 999px; letter-spacing: .02em; margin-left: 6px; background: var(--surface); }
    .lang-switch:hover { color: var(--accent-strong); border-color: var(--accent); text-decoration: none; }

    main { max-width: 1120px; margin: 0 auto; padding: 40px 24px 80px; min-height: 60vh; }

    /* ---- 列表页标题（intro） ---- */
    .intro { padding: 8px 0 4px; }
    .intro h1 { font-size: clamp(26px, 4.5vw, 38px); margin: 0 0 10px; line-height: 1.2; font-weight: 750; letter-spacing: -0.025em; }
    .intro .lede { color: var(--muted); margin: 0 0 24px; max-width: 620px; font-size: 16px; }
    .hint { color: var(--faint); font-size: 13.5px; margin: 14px 0 0; }

    /* ---- 首页 Hero（全宽横幅，紧贴顶栏，内容与主栏对齐） ---- */
    .hero { position: relative; overflow: hidden; border-bottom: 1px solid var(--border); background: var(--hero-bg); }
    .hero-in { max-width: 1120px; margin: 0 auto; padding: 54px 24px 46px; position: relative; }
    .hero .kicker { font-family: var(--font-mono); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .16em; color: var(--accent-strong); margin: 0 0 14px; display: block; }
    .hero-in h1 { font-size: clamp(34px, 5.2vw + 10px, 56px); margin: 0 0 16px; line-height: 1.04; font-weight: 800; letter-spacing: -0.03em; }
    .hero-in .lede { color: var(--muted); margin: 0 0 24px; max-width: 640px; font-size: 17px; line-height: 1.65; }
    .hero-search { display: flex; align-items: center; gap: 6px; max-width: 580px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: 999px; padding: 6px 6px 6px 16px; margin: 0 0 22px; box-shadow: var(--shadow-card); transition: border-color .15s ease, box-shadow .15s ease; }
    .hero-search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
    .hero-search .ic { color: var(--faint); display: flex; flex: none; }
    .hero-search input { flex: 1; min-width: 0; border: none; background: none; color: var(--text); font-size: 15.5px; font-family: inherit; padding: 9px 0; }
    .hero-search input::placeholder { color: var(--faint); }
    .hero-search input:focus { outline: none; border: none; box-shadow: none; }
    .hero-search button { flex: none; border: 1px solid var(--accent); background: var(--accent); color: var(--on-accent); font-weight: 600; font-size: 14px; font-family: inherit; padding: 9px 22px; border-radius: 999px; cursor: pointer; transition: background .15s ease, border-color .15s ease; }
    .hero-search button:hover { background: var(--accent-strong); border-color: var(--accent-strong); }
    .banner-stats { color: var(--faint); font-size: 13px; margin: 0 0 22px; font-family: var(--font-mono); letter-spacing: .02em; }
    .banner-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .hero-mark { position: absolute; right: -40px; top: 50%; transform: translateY(-50%); width: 360px; height: 360px; color: var(--accent); opacity: .08; pointer-events: none; }
    .hero-mark svg { width: 100%; height: 100%; display: block; }

    /* ---- 首页双栏（主体 + 右侧侧边栏） ---- */
    .layout-grid { display: grid; grid-template-columns: minmax(0, 1fr) 304px; gap: 30px; align-items: start; margin-top: 6px; }
    .col-main { min-width: 0; }
    .sidebar { position: sticky; top: 76px; display: flex; flex-direction: column; gap: 16px; }
    .widget { border: 1px solid var(--border); background: var(--surface); border-radius: 14px; padding: 16px 18px; box-shadow: var(--shadow-card); }
    .widget h3 { margin: 0 0 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: var(--faint); }
    .w-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
    .w-item:last-child { border-bottom: 0; }
    .w-rank { flex: none; font-family: var(--font-mono); font-size: 12px; color: var(--faint); width: 18px; text-align: center; }
    .w-rank.top { color: var(--accent-strong); font-weight: 700; }
    .w-main { flex: 1; min-width: 0; }
    .w-name { color: var(--text); font-size: 14px; font-weight: 600; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
    .w-name:hover { color: var(--accent-strong); text-decoration: none; }
    .w-desc { margin: 3px 0 0; color: var(--faint); font-size: 12.5px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
    .w-go { flex: none; font-size: 12.5px; font-weight: 600; color: var(--accent-strong); font-family: var(--font-mono); }
    .w-go:hover { text-decoration: none; }
    .w-more { display: block; margin-top: 10px; font-size: 13px; color: var(--muted); font-weight: 500; }
    .w-cats { display: flex; flex-direction: column; gap: 2px; }
    .w-cats a { display: flex; align-items: center; justify-content: space-between; font-size: 13.5px; color: var(--muted); padding: 7px 4px; border-radius: 8px; }
    .w-cats a .n { font-family: var(--font-mono); font-size: 12px; color: var(--faint); background: var(--surface-2); border-radius: 999px; padding: 1px 8px; }
    .w-cats a:hover { color: var(--accent-strong); background: var(--accent-soft); text-decoration: none; }

    /* ---- 分类导航（chips） ---- */
    .cats { display: flex; gap: 6px; flex-wrap: wrap; margin: 22px 0 18px; }
    .cats a { font-size: 13.5px; color: var(--muted); padding: 6px 13px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); }
    .cats a .n { color: var(--faint); font-size: 12px; font-family: var(--font-mono); margin-left: 4px; }
    .cats a:hover { color: var(--text); text-decoration: none; border-color: var(--border-strong); }
    .cats a.active { color: var(--accent-ink); font-weight: 600; background: var(--accent-soft); border-color: var(--accent-border); text-decoration: none; }

    /* ---- 区块标题 ---- */
    .sec { display: flex; align-items: baseline; gap: 10px; margin: 32px 0 12px; }
    .sec h2 { margin: 0; font-size: 17px; font-weight: 750; letter-spacing: -0.01em; }
    .sec .n { font-size: 13px; color: var(--faint); font-family: var(--font-mono); }

    /* ---- 条目卡片 ---- */
    .list { display: flex; flex-direction: column; gap: 12px; }
    .entry { display: flex; align-items: center; gap: 16px; padding: 16px 18px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface); box-shadow: var(--shadow-card); transition: border-color .16s ease, box-shadow .16s ease; }
    .entry:hover { border-color: var(--accent-border); box-shadow: 0 4px 16px -6px rgba(0,0,0,.14); }
    .entry.pick { border-color: var(--accent-border); background: var(--accent-soft); }
    .e-logo { width: 42px; height: 42px; flex: none; border-radius: 11px; border: 1px solid var(--border); background: var(--surface-2) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='17' r='6' fill='none' stroke='%23a1a1aa' stroke-width='2.4'/%3E%3Cpath d='M11 30c2.4-6.4 5-9.5 9-9.5s6.6 3.1 9 9.5' fill='none' stroke='%23a1a1aa' stroke-width='2.4' stroke-linecap='round'/%3E%3C/svg%3E") center/26px no-repeat; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .e-logo img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .e-logo.lg { width: 58px; height: 58px; border-radius: 14px; }
    .e-main { flex: 1; min-width: 0; }
    .e-main h3 { margin: 0 0 4px; font-size: 16px; font-weight: 650; line-height: 1.4; letter-spacing: -0.01em; }
    .e-main h3 a { color: var(--text); }
    .e-main h3 a:hover { color: var(--accent-strong); text-decoration: none; }
    .e-desc { margin: 0; font-size: 14px; color: var(--muted); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .e-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; font-size: 12.5px; color: var(--faint); }
    .e-meta .sep { opacity: .55; }
    .e-meta .tg { color: var(--muted); font-size: 12.5px; }
    .e-meta .tg:hover { color: var(--accent-strong); }
    .flag { display: inline-flex; align-items: center; font-size: 11px; font-weight: 700; color: var(--accent-ink); background: var(--accent-soft); border: 1px solid var(--accent-border); border-radius: 999px; padding: 1px 8px; margin-right: 8px; vertical-align: 1px; letter-spacing: .04em; }
    .chip { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; border-radius: 999px; padding: 2px 8px; white-space: nowrap; }
    .chip.free { color: var(--accent-ink); background: var(--ok-tint); border: 1px solid var(--accent-border); }
    .chip.warn { color: var(--warn); background: var(--warn-tint); border: 1px solid color-mix(in srgb, var(--warn) 40%, transparent); }
    .chip.danger { color: var(--danger); background: var(--danger-tint); border: 1px solid color-mix(in srgb, var(--danger) 40%, transparent); }
    .claim { display: inline-flex; align-items: center; gap: 6px; flex: none; font-size: 13.5px; font-weight: 600; color: var(--accent-strong); border: 1px solid var(--accent-border); background: var(--surface); padding: 9px 16px; border-radius: 999px; white-space: nowrap; transition: background .15s ease, border-color .15s ease, color .15s ease; }
    .claim .ic { display: flex; }
    .claim:hover { background: var(--accent); border-color: var(--accent); color: var(--on-accent); text-decoration: none; }
    .claim.solid { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
    .claim.solid:hover { background: var(--accent-strong); border-color: var(--accent-strong); }

    /* ---- 文章页 ---- */
    .crumbs { font-size: 13px; color: var(--faint); padding-bottom: 14px; margin-bottom: 22px; border-bottom: 1px solid var(--border); }
    .crumbs ol { list-style: none; display: flex; gap: 7px; margin: 0; padding: 0; flex-wrap: wrap; }
    .crumbs li { display: flex; gap: 7px; }
    .crumbs li + li::before { content: '/'; color: var(--faint); }
    .crumbs a { color: var(--muted); }
    .crumbs a:hover { color: var(--accent-strong); }
    .article { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 40px; max-width: 800px; margin: 0 auto; box-shadow: var(--shadow-card); }
    .article .meta { color: var(--muted); margin: 0 0 18px; font-size: 13px; display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
    .article .meta .tg { color: var(--muted); }
    .article .meta .tg:hover { color: var(--accent-strong); }
    .article .meta .sep { opacity: .5; }
    .article .headline { display: flex; align-items: flex-start; gap: 18px; margin: 0 0 12px; }
    .article .headline h1 { font-size: clamp(24px, 3.4vw, 32px); margin: 0 0 10px; line-height: 1.18; font-weight: 800; letter-spacing: -0.025em; }
    .article .headline .standfirst { margin: 0; font-size: 16px; line-height: 1.65; }
    .article .standfirst { color: var(--muted); }
    .article-chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 20px; }
    .article .body { color: var(--text); line-height: 1.85; font-size: 16px; }
    .article .body h2,.article .body h3 { margin: 28px 0 12px; font-weight: 650; font-size: 18px; }
    .article .body ul,.article .body ol { padding-left: 24px; }
    .article .body li { margin: 6px 0; }
    .article .body blockquote { border-left: 2px solid var(--accent); margin: 16px 0; padding: 4px 18px; color: var(--muted); }
    .article .body code { background: var(--code-bg); padding: 2px 7px; border-radius: 6px; font-size: .88em; font-family: var(--font-mono); }
    .article .body a { text-decoration: underline; text-underline-offset: 3px; }
    .article .body img { max-width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--border); margin: 16px 0; }
    .cta { margin-top: 30px; padding-top: 24px; border-top: 1px solid var(--border); display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .btn { display: inline-flex; align-items: center; gap: 7px; background: var(--accent); color: var(--on-accent); font-weight: 600; padding: 11px 20px; border-radius: 999px; font-size: 15px; border: 1px solid var(--accent); cursor: pointer; font-family: inherit; transition: background .15s ease, border-color .15s ease; }
    .btn:hover { background: var(--accent-strong); border-color: var(--accent-strong); color: var(--on-accent); text-decoration: none; }
    .btn .ic { display: flex; }
    .btn-quiet { background: transparent; border-color: var(--border-strong); color: var(--muted); }
    .btn-quiet:hover { border-color: var(--muted); background: transparent; color: var(--text); }
    .btn-sm { padding: 9px 14px; font-size: 14px; }

    /* ---- FAQ ---- */
    .faq { max-width: 800px; margin: 40px auto 0; }
    .faq h2 { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
    .faq details { border-bottom: 1px solid var(--border); }
    .faq details:first-of-type { border-top: 1px solid var(--border); margin-top: 14px; }
    .faq summary { padding: 15px 2px; font-size: 15px; font-weight: 500; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .faq summary::-webkit-details-marker { display: none; }
    .faq summary:hover { color: var(--accent-strong); }
    .faq summary::after { content: '+'; color: var(--faint); font-size: 17px; font-weight: 400; flex: none; }
    .faq details[open] summary::after { content: '−'; }
    .faq .answer { padding: 0 2px 16px; color: var(--muted); font-size: 15px; line-height: 1.75; }

    /* ---- 相关推荐 ---- */
    .related { margin-top: 40px; }
    .related h2 { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
    .related-list { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
    .related-list .entry { padding: 14px 16px; }

    /* ---- 分页 ---- */
    .pager { display: flex; gap: 8px; justify-content: center; margin: 36px 0 0; }
    .pager a,.pager span { padding: 9px 16px; border: 1px solid var(--border); border-radius: 999px; color: var(--muted); font-size: 14px; background: var(--surface); }
    .pager a:hover { border-color: var(--accent); color: var(--accent-strong); text-decoration: none; }
    .pager .cur { color: var(--text); font-weight: 600; border-color: var(--border-strong); }

    /* ---- 广告位 ---- */
    .ad-slot { border: 1px dashed var(--border-strong); border-radius: 14px; padding: 22px; text-align: center; color: var(--faint); font-size: 12px; margin: 28px 0; background: var(--surface-2); min-height: 90px; display: flex; align-items: center; justify-content: center; }

    /* ---- 页脚 ---- */
    footer { border-top: 1px solid var(--border); background: var(--surface-2); }
    .foot { max-width: 1120px; margin: 0 auto; padding: 26px 24px; color: var(--faint); font-size: 13px; display: flex; gap: 18px; flex-wrap: wrap; align-items: center; }
    .foot a { color: var(--muted); }
    .foot a:hover { color: var(--accent-strong); }
    .foot .right { margin-left: auto; }

    /* ---- 后台 ---- */
    form.admin { display: flex; flex-direction: column; gap: 14px; max-width: 640px; margin: 0 auto; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 32px; }
    label { font-size: 13.5px; color: var(--muted); display: flex; flex-direction: column; gap: 6px; font-weight: 500; }
    input,select,textarea { background: var(--bg); border: 1px solid var(--border-strong); color: var(--text); border-radius: 10px; padding: 10px 13px; font-size: 14.5px; font-family: inherit; }
    input:focus,select:focus,textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    textarea { min-height: 120px; resize: vertical; }
    .flash { padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 14px; border: 1px solid; }
    .flash.ok { background: var(--accent-soft); border-color: var(--accent-border); color: var(--accent-ink); }
    .flash.err { background: var(--danger-tint); border-color: var(--danger); color: var(--danger); }
    .rowline { display: flex; gap: 10px; flex-wrap: wrap; }
    table.list { width: 100%; border-collapse: collapse; font-size: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
    table.list th,table.list td { border-bottom: 1px solid var(--border); padding: 11px 13px; text-align: left; vertical-align: top; }
    table.list th { color: var(--muted); font-weight: 500; font-size: 12.5px; background: var(--bg); }
    table.list tr:last-child td { border-bottom: none; }
    .actions a,.actions form { display: inline-block; margin-right: 8px; font-size: 13.5px; }
    .danger { color: var(--danger); background: none; border: none; cursor: pointer; padding: 0; font-size: 13.5px; font-family: inherit; }

    /* ---- 响应式 ---- */
    @media (max-width: 980px) {
      .layout-grid { grid-template-columns: 1fr; }
      .sidebar { position: static; }
    }
    @media (max-width: 640px) {
      .nav { padding: 0 16px; gap: 12px; }
      .nav-search { display: none; }
      main { padding: 26px 16px 60px; }
      .article { padding: 24px; }
      .banner-in h1 { font-size: 32px; }
      .entry { flex-direction: column; align-items: stretch; gap: 14px; }
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
      <a class="brand" href="${lp(lang, '/')}">${raw(ICON.brand)}FreeTokenBox</a>
      <form class="nav-search" action="${lp(lang, '/')}" method="get">
        <span class="ic">${raw(ICON.search)}</span>
        <input type="search" name="q" placeholder="${t.navSearch}" aria-label="${t.navSearch}" value="" />
      </form>
      <div class="nav-links">
        <a href="${lp(lang, '/')}">${t.navHome}</a>
        <a href="${lp(lang, '/about')}">${t.navAbout}</a>
        <a href="/api/tokens">API</a>
        <a class="lang-switch" href="${lang === 'zh' ? '/en' + cleanPath : cleanPath}" hreflang="${lang === 'zh' ? 'en' : 'zh-CN'}">${t.switchLabel}</a>
      </div>
    </div>
  </header>
  ${hero || ''}
  <main>
    ${breadcrumbs ? breadcrumb(breadcrumbs, lang) : ''}
    ${body}
    ${adSlot(env, 'footer', lang === 'en' ? 'Ad slot' : '广告位')}
  </main>
  <footer>
    <div class="foot">
      <span>© ${new Date().getFullYear()} FreeTokenBox</span>
      <a href="/sitemap.xml">Sitemap</a>
      <a href="/rss.xml">RSS</a>
      <a href="/llms.txt">llms.txt</a>
      <a href="/api/tokens">API</a>
      <a href="${lp(lang, '/about')}">${t.navAbout}</a>
      <a href="${lp(lang, '/privacy')}">${lang === 'en' ? 'Privacy' : '隐私'}</a>
      <a href="${lp(lang, '/terms')}">${lang === 'en' ? 'Terms' : '条款'}</a>
      <span class="right">${t.footerNote}</span>
    </div>
  </footer>
</body>
</html>`
}

// ---------- 外链 UTM 来源（跳转其他网站时带上我们的来源） ----------
function withUtm(url, slug) {
  if (!url || !/^https?:\/\//i.test(url)) return url // 仅外链；内部链接原样返回
  try {
    const u = new URL(url)
    if (!u.searchParams.has('utm_source')) {
      u.searchParams.set('utm_source', 'freetokenbox')
      u.searchParams.set('utm_medium', 'referral')
      u.searchParams.set('utm_campaign', slug || 'free-token')
    }
    return u.toString()
  } catch (e) {
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}utm_source=freetokenbox&utm_medium=referral&utm_campaign=${encodeURIComponent(slug || 'free-token')}`
  }
}

// ---------- 站点 logo：显式 logo > favicon 服务 > 默认图标（CSS 背景兜底） ----------
function siteLogo(t) {
  if (t.logo) return t.logo
  if (t.url) {
    try {
      const host = new URL(t.url).hostname
      if (host) return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`
    } catch (e) {}
  }
  return null
}
function logoImg(t) {
  const src = siteLogo(t)
  return src ? html`<img src="${src}" alt="" width="40" height="40" loading="lazy" onerror="this.remove()" />` : ''
}

// ---------- 条目行 ----------
function entryRow(t, lang, opts = {}) {
  const s = T(lang)
  const pre = lang === 'en' ? '/en' : ''
  const pick = opts.pick || t.is_featured
  const left = daysUntil(t.expiry_date)
  const expiryChip =
    left === null ? '' :
    left < 0 ? html`<span class="chip danger">${s.expired}</span>` :
    left <= 7 ? html`<span class="chip warn">${s.expiresIn(left)}</span>` : ''
  return html`<article class="entry${pick ? ' pick' : ''}">
    <div class="e-logo">${logoImg(t)}</div>
    <div class="e-main">
      <h3>${pick ? html`<span class="flag">${s.flag}</span>` : ''}<span class="chip free">${s.free}</span> <a href="${pre}/token/${t.slug}">${t.name}</a></h3>
      <p class="e-desc">${excerpt(t.description, 110)}</p>
      <div class="e-meta">
        ${t.provider ? html`<span>${t.provider}</span><span class="sep">·</span>` : ''}
        ${expiryChip}
        ${t.expiry_date ? html`<span class="sep">·</span><span>${s.deadline(formatDate(t.expiry_date))}</span>` : ''}
        ${(t.tags || []).slice(0, 4).map((tag) => html`<a class="tg" href="${pre}/tags/${tag}">#${tag}</a>`)}
      </div>
    </div>
    <a class="claim${pick ? ' solid' : ''}" href="${withUtm(t.url || `${pre}/token/${t.slug}`, t.slug)}" rel="noopener nofollow" target="_blank">${s.claim}<span class="ic">${raw(ICON.external)}</span></a>
  </article>`
}

// ---------- 首页 ----------
export function homePage({ featured, items, categories, page, totalPages, env, query, searchQuery, stats, lang = 'zh', latest = [] }) {
  const s = T(lang)
  const pre = lang === 'en' ? '/en' : ''
  const showFeatured = featured.length && !searchQuery
  // 全宽 Hero 横幅：渲染在 <main> 容器之外，横贯整个视口宽度
  const hero = html`
    <section class="hero">
      <div class="hero-in">
        <span class="kicker">${s.bannerKicker}</span>
        <h1>${s.h1}</h1>
        <p class="lede">${s.lede}</p>
        <form class="hero-search" action="${lp(lang, '/')}" method="get" role="search">
          <span class="ic">${raw(ICON.search)}</span>
          <input type="search" name="q" placeholder="${s.searchPlaceholder}" aria-label="${s.searchLabel}" value="${searchQuery || ''}" />
          <button type="submit">${s.searchBtn}</button>
        </form>
        ${stats ? html`<p class="banner-stats">${s.bannerStats(stats)}</p>` : ''}
        <div class="banner-actions">
          <a class="btn" href="#list">${s.browseAll}</a>
          <a class="btn btn-quiet" href="${lp(lang, '/about')}">${s.aboutLink}</a>
        </div>
      </div>
      <div class="hero-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.4" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="8.8" y="8.8" width="6.4" height="6.4" rx="1.3" fill="currentColor"/></svg></div>
    </section>`
  const body = html`
    <div class="layout-grid">
      <main class="col-main" id="list">
        ${categories.length ? html`
          <nav class="cats" aria-label="${lang === 'en' ? 'Categories' : '分类导航'}">
            <a href="${lp(lang, '/')}" class="${!searchQuery ? 'active' : ''}">${s.all}</a>
            ${categories.map((c) => html`<a href="${pre}/category/${c.name}">${c.name}<span class="n">${c.count}</span></a>`)}
          </nav>
        ` : ''}

        ${showFeatured ? html`
          <div class="sec"><h2>${s.featuredSec}</h2><span class="n">${s.countGe(featured.length)}</span></div>
          <div class="list">${featured.map((t) => entryRow(t, lang, { pick: true }))}</div>
        ` : ''}

        <div class="sec">
          <h2>${searchQuery ? s.searchResults : s.allEntries}</h2>
          <span class="n">${s.countTiao(items.length)}${totalPages > 1 ? ` · ${s.pageOf(page, totalPages)}` : ''}</span>
        </div>
        ${adSlot(env, 'home-top', lang === 'en' ? 'Ad slot' : '列表上方广告位')}
        <div class="list">${items.map((t) => entryRow(t, lang))}</div>

        ${totalPages > 1 ? html`<nav class="pager" aria-label="${lang === 'en' ? 'Pagination' : '分页'}">
          ${page > 1 ? html`<a href="${lp(lang, '/')}?page=${page - 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}">${s.prev}</a>` : ''}
          <span class="cur">${page} / ${totalPages}</span>
          ${page < totalPages ? html`<a href="${lp(lang, '/')}?page=${page + 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}">${s.next}</a>` : ''}
        </nav>` : ''}
      </main>

      <aside class="sidebar">
        ${showFeatured ? html`<section class="widget">
          <h3>${s.sidebarHot}</h3>
          ${featured.slice(0, 5).map((t, i) => sideItem(t, lang, pre, i + 1))}
        </section>` : ''}
        <section class="widget">
          <h3>${s.sidebarLatest}</h3>
          ${latest.slice(0, 8).map((t) => sideItem(t, lang, pre))}
          <a class="w-more" href="${lp(lang, '/')}">${s.viewAll} →</a>
        </section>
        ${categories.length ? html`<section class="widget">
          <h3>${s.sidebarCats}</h3>
          <div class="w-cats">
            ${categories.map((c) => html`<a href="${pre}/category/${c.name}">${c.name}<span class="n">${c.count}</span></a>`)}
          </div>
        </section>` : ''}
        ${adSlot(env, 'sidebar', lang === 'en' ? 'Ad slot' : '侧边栏广告位')}
      </aside>
    </div>
  `
  return layout({
    title: searchQuery ? s.searchTitleFor(searchQuery) : s.homeTitle,
    description: searchQuery ? s.searchDescFor(searchQuery) : s.homeDesc,
    path: query ? `/?${query}` : '/',
    env,
    lang,
    hero,
    body,
    jsonLd: [organizationJsonLd(env), itemListJsonLd(featured.length ? [...featured, ...items] : items, env, lang)],
  })
}

/** 侧边栏紧凑条目（rank 可选：热门精选显示排名序号） */
function sideItem(t, lang, pre, rank) {
  const s = T(lang)
  return html`<div class="w-item">
    ${rank ? html`<span class="w-rank${rank <= 3 ? ' top' : ''}">${String(rank).padStart(2, '0')}</span>` : ''}
    <div class="w-main">
      <a class="w-name" href="${pre}/token/${t.slug}">${t.name}</a>
      <p class="w-desc">${excerpt(t.description, 52)}</p>
    </div>
    <a class="w-go" href="${pre}/token/${t.slug}" aria-label="${s.view}">${s.view}</a>
  </div>`
}

// ---------- 列表页（分类/标签/搜索共用） ----------
export function listPage({ title, description, items, categories, page, totalPages, env, path, badge, breadcrumbs, query, searchQuery, lang = 'zh' }) {
  const s = T(lang)
  const pre = lang === 'en' ? '/en' : ''
  const body = html`
    <section class="intro">
      <h1>${title}</h1>
      <p class="lede">${description}</p>
      ${badge ? html`<p class="hint">${badge}</p>` : ''}
    </section>
    <div class="list">${items.map((t) => entryRow(t, lang))}</div>
    ${totalPages > 1 ? html`<nav class="pager" aria-label="${lang === 'en' ? 'Pagination' : '分页'}">
      ${page > 1 ? html`<a href="${pre}${path}?page=${page - 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}">${s.prev}</a>` : ''}
      <span class="cur">${page} / ${totalPages}</span>
      ${page < totalPages ? html`<a href="${pre}${path}?page=${page + 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}">${s.next}</a>` : ''}
    </nav>` : ''}
  `
  return layout({
    title,
    description,
    path: query ? `${path}?${query}` : path,
    env,
    lang,
    body,
    breadcrumbs,
    jsonLd: itemListJsonLd(items, env, lang),
  })
}

// ---------- Token 详情页 ----------
export function tokenPage(token, env, related = [], lang = 'zh') {
  const s = T(lang)
  const pre = lang === 'en' ? '/en' : ''
  const base = siteUrl(env)
  const canonical = `${base}${lp(lang, `/token/${token.slug}`)}`
  const provider = token.provider || s.providerFallback
  const jsonLd = tokenJsonLd(token, env, lang)
  const faqLd = faqJsonLd(token, lang)
  const crumbs = [
    { name: s.crumbHome, url: '/' },
    { name: token.category || s.allEntries, url: token.category ? `/category/${token.category}` : '/' },
    { name: token.name },
  ]
  const body = html`
    <article class="article">
      <div class="meta">
        ${token.category ? html`<a class="tg" href="${pre}/category/${token.category}">${token.category}</a>` : ''}
        ${(token.tags || []).map((t) => html`<a class="tg" href="${pre}/tags/${t}">#${t}</a>`)}
        ${token.provider ? html`<span class="sep">·</span><span>${token.provider}</span>` : ''}
        ${token.expiry_date ? html`<span class="sep">·</span><span>${s.deadline(formatDate(token.expiry_date))}</span>` : ''}
        <span class="sep">·</span><span>${s.collectedAt(formatDate(token.created_at))}</span>
      </div>
      <div class="headline">
        <div class="e-logo lg">${logoImg(token)}</div>
        <div><h1>${token.name}</h1>
        <p class="standfirst">${token.description}</p></div>
      </div>
      <div class="article-chips">
        <span class="chip free">${s.free}</span>
        ${daysUntil(token.expiry_date) !== null && daysUntil(token.expiry_date) < 0 ? html`<span class="chip danger">${s.expired}</span>` : ''}
        ${daysUntil(token.expiry_date) !== null && daysUntil(token.expiry_date) >= 0 && daysUntil(token.expiry_date) <= 7 ? html`<span class="chip warn">${s.expiresIn(daysUntil(token.expiry_date))}</span>` : ''}
      </div>
      <div class="body">${raw(renderMarkdown(token.content))}</div>
      <div class="cta">
        <a class="btn" href="${withUtm(token.url, token.slug) || canonical}" rel="noopener nofollow" target="_blank">${s.goClaim(provider)}<span class="ic">${raw(ICON.external)}</span></a>
        <a class="btn btn-quiet" href="${lp(lang, '/')}">${s.back}</a>
      </div>
      ${adSlot(env, 'article-bottom', lang === 'en' ? 'Ad slot' : '文章底部广告位')}
    </article>

    ${related.length ? html`
    <section class="related" style="max-width:780px;margin:44px auto 0">
      <h2>${s.related}</h2>
      <div class="related-list">
        ${related.map((t) => html`<article class="entry">
          <div class="e-main">
            <h3><a href="${pre}/token/${t.slug}">${t.name}</a></h3>
            <p class="e-desc">${excerpt(t.description, 80)}</p>
          </div>
          <a class="claim" href="${pre}/token/${t.slug}">${s.view}</a>
        </article>`)}
      </div>
    </section>` : ''}

    <section class="faq">
      <h2>${s.faqTitle}</h2>
      <details>
        <summary>${s.faqQ1(token.name)}</summary>
        <div class="answer">${s.faqA1(token.name, provider)}</div>
      </details>
      <details>
        <summary>${s.faqQ2}</summary>
        <div class="answer">${s.faqA2(provider)}</div>
      </details>
      ${token.expiry_date ? html`<details>
        <summary>${s.faqQ3}</summary>
        <div class="answer">${s.faqA3(formatDate(token.expiry_date))}</div>
      </details>` : ''}
      <details>
        <summary>${s.faqQ4}</summary>
        <div class="answer">${s.faqA4} <a href="${lp(lang, '/')}">${lang === 'en' ? 'Browse all offers' : '浏览全部条目'}</a></div>
      </details>
    </section>
  `
  return layout({
    title: s.tokenTitle(token.name),
    description: excerpt(token.description, 160),
    path: `/token/${token.slug}`,
    env,
    lang,
    body,
    breadcrumbs: crumbs,
    jsonLd: [jsonLd, faqLd, breadcrumbJsonLd(crumbs, env, lang)],
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

// ---------- 后台页面（内部工具，保持中文） ----------
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
