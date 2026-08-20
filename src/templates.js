// HTML 模板（使用 hono/html 的 html 模板字符串，${} 自动转义）
// 设计规范：中立 zinc 色板 + 单一 emerald 强调色，目录式列表布局，中英双语（/en 前缀）
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
  organizationJsonLd,
  breadcrumbJsonLd,
  itemListJsonLd,
} from './content.js'
import { T, lp } from './i18n.js'

// ---------- 图标体系（全部 SVG，禁止 emoji） ----------
// 品牌标识：「Token 落入开口盒子」
const BRAND_GLYPH = (rx) =>
  `<circle cx="12" cy="5.9" r="1.8" fill="#fff"/>` +
  `<path d="M5.7 10h12.6" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>` +
  `<rect x="7.4" y="10" width="9.2" height="7.6" rx="1.6" fill="none" stroke="#fff" stroke-width="1.9"/>`

const ICON = {
  brand: `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6.5" fill="#059669"/>${BRAND_GLYPH()}</svg>`,
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M16.6 16.6L21 21"/></svg>',
  external: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 15.5L15.5 8.5"/><path d="M10 8.5h6.5V15"/></svg>',
}

const FAVICON = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8.7" fill="#059669"/><circle cx="16" cy="7.9" r="2.4" fill="#fff"/><path d="M7.6 13.3h16.8" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><rect x="9.9" y="13.3" width="12.2" height="10.1" rx="2.1" fill="none" stroke="#fff" stroke-width="2.5"/></svg>'
)

const OG_IMAGE = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#18181b"/><g transform="translate(90,96) scale(3)"><rect width="24" height="24" rx="6.5" fill="#059669"/><circle cx="12" cy="5.9" r="1.8" fill="#fff"/><path d="M5.7 10h12.6" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/><rect x="7.4" y="10" width="9.2" height="7.6" rx="1.6" fill="none" stroke="#fff" stroke-width="1.9"/></g><text x="90" y="292" font-size="60" font-weight="700" fill="#fafafa" font-family="-apple-system,Segoe UI,sans-serif">FreeTokenBox</text><text x="90" y="346" font-size="26" fill="#a1a1aa" font-family="-apple-system,Segoe UI,sans-serif">免费送 Token 合集 · Free AI Token Deals</text><rect x="90" y="394" width="56" height="6" fill="#34d399"/><text x="90" y="472" font-size="21" fill="#71717a" font-family="-apple-system,Segoe UI,sans-serif">DeepSeek · OpenRouter · Gemini · Groq · Cloudflare · Mistral</text></svg>'
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
export function layout({ title, description, path, env, body, extraHead = '', breadcrumbs = null, jsonLd = null, lang = 'zh' }) {
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
      font-size: 16px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    a { color: var(--accent-strong); text-decoration: none; }
    a:hover { text-decoration: underline; text-underline-offset: 3px; }

    /* ---- 顶栏 ---- */
    header { position: sticky; top: 0; z-index: 100; background: var(--surface); border-bottom: 1px solid var(--border); }
    .nav { max-width: 960px; margin: 0 auto; padding: 0 24px; height: 64px; display: flex; align-items: center; gap: 20px; }
    .brand { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; white-space: nowrap; }
    .brand svg { display: block; }
    .brand:hover { text-decoration: none; }
    .nav-search { flex: 1; max-width: 320px; position: relative; }
    .nav-search .ic { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--faint); display: flex; }
    .nav-search input { width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: var(--radius); padding: 8px 12px 8px 36px; font-size: 14px; font-family: inherit; }
    .nav-search input::placeholder { color: var(--faint); }
    .nav-search input:focus { outline: none; border-color: var(--accent); }
    .nav-links { display: flex; gap: 4px; font-size: 14.5px; margin-left: auto; align-items: center; }
    .nav-links a { color: var(--muted); padding: 6px 11px; border-radius: 6px; }
    .nav-links a:hover { color: var(--text); background: var(--bg); text-decoration: none; }
    .lang-switch { font-size: 13px; font-weight: 600; color: var(--muted); border: 1px solid var(--border-strong); padding: 5px 11px; border-radius: 6px; letter-spacing: .02em; margin-left: 6px; }
    .lang-switch:hover { color: var(--accent-strong); border-color: var(--accent); text-decoration: none; }

    main { max-width: 960px; margin: 0 auto; padding: 52px 24px 80px; min-height: 60vh; }

    /* ---- 首屏（左对齐，不居中） ---- */
    .intro { padding: 8px 0 4px; }
    .intro h1 { font-size: clamp(28px, 5vw, 36px); margin: 0 0 12px; line-height: 1.25; font-weight: 700; letter-spacing: -0.015em; }
    .intro .lede { color: var(--muted); margin: 0 0 26px; max-width: 580px; font-size: 16px; }
    .hint { color: var(--faint); font-size: 13.5px; margin: 14px 0 0; }

    /* ---- 顶部 Banner（信息站风格） ---- */
    .banner { border: 1px solid var(--border); background: var(--surface); border-radius: 12px; padding: 30px 32px; margin-bottom: 30px; }
    .banner-in h1 { font-size: clamp(26px, 4.6vw, 34px); margin: 0 0 10px; line-height: 1.25; font-weight: 700; letter-spacing: -0.015em; }
    .banner-in .lede { color: var(--muted); margin: 0 0 14px; max-width: 620px; font-size: 15.5px; }
    .banner-stats { color: var(--faint); font-size: 13.5px; margin: 0 0 18px; }
    .banner-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .banner-actions .btn { padding: 9px 18px; font-size: 14px; }

    /* ---- 首页双栏（主体 + 右侧侧边栏） ---- */
    .layout-grid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 28px; align-items: start; }
    .col-main { min-width: 0; }
    .sidebar { position: sticky; top: 84px; display: flex; flex-direction: column; gap: 18px; }
    .widget { border: 1px solid var(--border); background: var(--surface); border-radius: 10px; padding: 16px 18px; }
    .widget h3 { margin: 0 0 10px; font-size: 14px; font-weight: 600; color: var(--text); letter-spacing: .01em; }
    .w-item { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px dashed var(--border); }
    .w-item:last-child { border-bottom: 0; }
    .w-main { flex: 1; min-width: 0; }
    .w-name { color: var(--text); font-size: 14px; font-weight: 600; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
    .w-name:hover { color: var(--accent-strong); text-decoration: none; }
    .w-desc { margin: 3px 0 0; color: var(--faint); font-size: 12.5px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
    .w-go { flex: none; font-size: 13px; font-weight: 600; color: var(--accent-strong); }
    .w-go:hover { text-decoration: none; }
    .w-more { display: block; margin-top: 8px; font-size: 13px; color: var(--muted); }
    .w-cats { display: flex; flex-wrap: wrap; gap: 6px; }
    .w-cats a { font-size: 13px; color: var(--muted); padding: 4px 9px; border: 1px solid var(--border); border-radius: 6px; }
    .w-cats a .n { color: var(--faint); margin-left: 3px; }
    .w-cats a:hover { color: var(--accent-strong); border-color: var(--accent); text-decoration: none; }

    @media (max-width: 860px) {
      .layout-grid { grid-template-columns: 1fr; }
      .sidebar { position: static; }
    }

    /* ---- 分类导航 ---- */
    .cats { display: flex; gap: 4px; flex-wrap: wrap; margin: 32px 0 0; padding: 12px 0; border-bottom: 1px solid var(--border); }
    .cats a { font-size: 14.5px; color: var(--muted); padding: 5px 11px; border-radius: 6px; }
    .cats a .n { color: var(--faint); font-size: 12.5px; margin-left: 4px; }
    .cats a:hover { color: var(--text); text-decoration: none; background: var(--bg); }
    .cats a.active { color: var(--accent-strong); font-weight: 600; background: var(--accent-soft); text-decoration: none; }

    /* ---- 区块标题 ---- */
    .sec { display: flex; align-items: baseline; gap: 10px; margin: 40px 0 6px; }
    .sec h2 { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: .01em; }
    .sec .n { font-size: 13.5px; color: var(--faint); }

    /* ---- 目录式条目列表 ---- */
    .list { display: flex; flex-direction: column; }
    .entry { display: flex; align-items: center; gap: 24px; padding: 20px 0; border-bottom: 1px solid var(--border); }
    .entry.pick { background: var(--accent-soft); border: 1px solid var(--accent-border); border-radius: var(--radius); padding: 20px 22px; margin: 12px 0; }
    .e-main { flex: 1; min-width: 0; }
    .e-main h3 { margin: 0 0 5px; font-size: 17px; font-weight: 600; line-height: 1.45; }
    .e-main h3 a { color: var(--text); }
    .e-main h3 a:hover { color: var(--accent-strong); text-decoration: none; }
    .e-desc { margin: 0; font-size: 14.5px; color: var(--muted); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .e-meta { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; margin-top: 9px; font-size: 13px; color: var(--faint); }
    .e-meta .sep { opacity: .6; }
    .e-meta .tg { color: var(--muted); font-size: 13px; }
    .e-meta .tg:hover { color: var(--accent-strong); }
    .flag { display: inline-block; font-size: 12px; font-weight: 600; color: var(--accent-ink); background: var(--surface); border: 1px solid var(--accent-border); border-radius: 4px; padding: 1px 7px; margin-right: 8px; vertical-align: 2px; }
    .claim { display: inline-flex; align-items: center; gap: 6px; flex: none; font-size: 14px; font-weight: 600; color: var(--accent-strong); border: 1px solid var(--accent-border); background: var(--surface); padding: 9px 16px; border-radius: 6px; white-space: nowrap; }
    .claim .ic { display: flex; }
    .claim:hover { background: var(--accent); border-color: var(--accent); color: #fff; text-decoration: none; }
    .claim.solid { background: var(--accent); border-color: var(--accent); color: #fff; }
    .claim.solid:hover { background: var(--accent-strong); border-color: var(--accent-strong); }

    /* ---- 文章页 ---- */
    .crumbs { font-size: 13.5px; color: var(--faint); padding-bottom: 16px; }
    .crumbs ol { list-style: none; display: flex; gap: 7px; margin: 0; padding: 0; flex-wrap: wrap; }
    .crumbs li { display: flex; gap: 7px; }
    .crumbs li + li::before { content: '/'; color: var(--faint); }
    .crumbs a { color: var(--muted); }
    .crumbs a:hover { color: var(--accent-strong); }
    .article { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 44px; max-width: 780px; margin: 0 auto; }
    .article .meta { color: var(--muted); margin: 0 0 20px; font-size: 13.5px; display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
    .article .meta .tg { color: var(--muted); }
    .article .meta .tg:hover { color: var(--accent-strong); }
    .article .meta .sep { opacity: .5; }
    .article h1 { font-size: 30px; margin: 0 0 8px; line-height: 1.3; font-weight: 700; letter-spacing: -0.01em; }
    .article .standfirst { color: var(--muted); margin: 0 0 28px; font-size: 16px; }
    .article .body { color: var(--text); line-height: 1.9; font-size: 16px; }
    .article .body h2,.article .body h3 { margin: 28px 0 12px; font-weight: 600; font-size: 18px; }
    .article .body ul,.article .body ol { padding-left: 24px; }
    .article .body li { margin: 6px 0; }
    .article .body blockquote { border-left: 2px solid var(--accent); margin: 16px 0; padding: 4px 18px; color: var(--muted); }
    .article .body code { background: var(--code-bg); padding: 2px 7px; border-radius: 4px; font-size: .88em; font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace; }
    .article .body a { text-decoration: underline; text-underline-offset: 3px; }
    .cta { margin-top: 32px; padding-top: 26px; border-top: 1px solid var(--border); display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .btn { display: inline-flex; align-items: center; gap: 7px; background: var(--accent); color: #fff; font-weight: 600; padding: 11px 18px; border-radius: 6px; font-size: 15px; border: 1px solid var(--accent); cursor: pointer; font-family: inherit; }
    .btn:hover { background: var(--accent-strong); border-color: var(--accent-strong); color: #fff; text-decoration: none; }
    .btn .ic { display: flex; }
    .btn-quiet { background: transparent; border-color: var(--border-strong); color: var(--muted); }
    .btn-quiet:hover { border-color: var(--muted); background: transparent; color: var(--text); }
    .btn-sm { padding: 9px 14px; font-size: 14px; }

    /* ---- FAQ（细分隔线，不做卡片盒子） ---- */
    .faq { max-width: 780px; margin: 44px auto 0; }
    .faq h2 { font-size: 17px; font-weight: 600; margin: 0 0 4px; }
    .faq details { border-bottom: 1px solid var(--border); }
    .faq details:first-of-type { border-top: 1px solid var(--border); margin-top: 14px; }
    .faq summary { padding: 15px 2px; font-size: 15px; font-weight: 500; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .faq summary::-webkit-details-marker { display: none; }
    .faq summary:hover { color: var(--accent-strong); }
    .faq summary::after { content: '+'; color: var(--faint); font-size: 17px; font-weight: 400; flex: none; }
    .faq details[open] summary::after { content: '−'; }
    .faq .answer { padding: 0 2px 16px; color: var(--muted); font-size: 15px; line-height: 1.75; }

    /* ---- 相关推荐 ---- */
    .related { margin-top: 44px; }
    .related h2 { font-size: 17px; font-weight: 600; margin: 0 0 4px; }
    .related-list { display: flex; flex-direction: column; margin-top: 14px; }
    .related-list .entry { padding: 14px 0; }

    /* ---- 分页 ---- */
    .pager { display: flex; gap: 8px; justify-content: center; margin: 40px 0 0; }
    .pager a,.pager span { padding: 9px 16px; border: 1px solid var(--border); border-radius: 6px; color: var(--muted); font-size: 14.5px; background: var(--surface); }
    .pager a:hover { border-color: var(--accent); color: var(--accent-strong); text-decoration: none; }
    .pager .cur { color: var(--text); font-weight: 600; border-color: var(--border-strong); }

    /* ---- 广告位 ---- */
    .ad-slot { border: 1px dashed var(--border); border-radius: var(--radius); padding: 20px; text-align: center; color: var(--faint); font-size: 12px; margin: 30px 0; }

    /* ---- 页脚 ---- */
    footer { border-top: 1px solid var(--border); }
    .foot { max-width: 960px; margin: 0 auto; padding: 24px 24px; color: var(--faint); font-size: 13.5px; display: flex; gap: 18px; flex-wrap: wrap; align-items: center; }
    .foot a { color: var(--muted); }
    .foot a:hover { color: var(--accent-strong); }
    .foot .right { margin-left: auto; }

    /* ---- 后台 ---- */
    form.admin { display: flex; flex-direction: column; gap: 14px; max-width: 640px; margin: 0 auto; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 32px; }
    label { font-size: 13.5px; color: var(--muted); display: flex; flex-direction: column; gap: 6px; font-weight: 500; }
    input,select,textarea { background: var(--bg); border:  1px solid var(--border-strong); color: var(--text); border-radius: 6px; padding: 10px 13px; font-size: 14.5px; font-family: inherit; }
    input:focus,select:focus,textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    textarea { min-height: 120px; resize: vertical; }
    .flash { padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 14px; border: 1px solid; }
    .flash.ok { background: var(--accent-soft); border-color: var(--accent-border); color: var(--accent-ink); }
    .flash.err { background: rgba(220,38,38,.06); border-color: var(--danger); color: var(--danger); }
    .rowline { display: flex; gap: 10px; flex-wrap: wrap; }
    table.list { width: 100%; border-collapse: collapse; font-size: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
    table.list th,table.list td { border-bottom: 1px solid var(--border); padding: 11px 13px; text-align: left; vertical-align: top; }
    table.list th { color: var(--muted); font-weight: 500; font-size: 12.5px; background: var(--bg); }
    table.list tr:last-child td { border-bottom: none; }
    .actions a,.actions form { display: inline-block; margin-right: 8px; font-size: 13.5px; }
    .danger { color: var(--danger); background: none; border: none; cursor: pointer; padding: 0; font-size: 13.5px; font-family: inherit; }

    /* ---- 响应式 ---- */
    @media (max-width: 640px) {
      .nav { padding: 0 16px; gap: 12px; }
      .nav-search { display: none; }
      main { padding: 28px 16px 60px; }
      .article { padding: 24px; }
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

// ---------- 条目行 ----------
function entryRow(t, lang, opts = {}) {
  const s = T(lang)
  const pre = lang === 'en' ? '/en' : ''
  const pick = opts.pick || t.is_featured
  return html`<article class="entry${pick ? ' pick' : ''}">
    <div class="e-main">
      <h3>${pick ? html`<span class="flag">${s.flag}</span>` : ''}<a href="${pre}/token/${t.slug}">${t.name}</a></h3>
      <p class="e-desc">${excerpt(t.description, 110)}</p>
      <div class="e-meta">
        ${t.provider ? html`<span>${t.provider}</span><span class="sep">·</span>` : ''}
        ${t.expiry_date ? html`<span>${s.deadline(formatDate(t.expiry_date))}</span><span class="sep">·</span>` : ''}
        ${(t.tags || []).slice(0, 4).map((tag) => html`<a class="tg" href="${pre}/tags/${tag}">#${tag}</a>`)}
      </div>
    </div>
    <a class="claim${pick ? ' solid' : ''}" href="${t.url || `${pre}/token/${t.slug}`}" rel="noopener nofollow" target="_blank">${s.claim}<span class="ic">${raw(ICON.external)}</span></a>
  </article>`
}

// ---------- 首页 ----------
export function homePage({ featured, items, categories, page, totalPages, env, query, searchQuery, stats, lang = 'zh', latest = [] }) {
  const s = T(lang)
  const pre = lang === 'en' ? '/en' : ''
  const showFeatured = featured.length && !searchQuery
  const body = html`
    <section class="banner">
      <div class="banner-in">
        <h1>${s.h1}</h1>
        <p class="lede">${s.lede}</p>
        <p class="banner-stats">${stats ? s.bannerStats(stats) : ''}</p>
        <div class="banner-actions">
          <a class="btn" href="#list">${s.browseAll}</a>
          <a class="btn btn-quiet" href="${lp(lang, '/about')}">${s.aboutLink}</a>
        </div>
      </div>
    </section>

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
          ${featured.slice(0, 5).map((t) => sideItem(t, lang, pre))}
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
    body,
    jsonLd: [organizationJsonLd(env), itemListJsonLd(featured.length ? [...featured, ...items] : items, env, lang)],
  })
}

/** 侧边栏紧凑条目 */
function sideItem(t, lang, pre) {
  const s = T(lang)
  return html`<div class="w-item">
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
      <h1>${token.name}</h1>
      <p class="standfirst">${token.description}</p>
      <div class="body">${raw(renderMarkdown(token.content))}</div>
      <div class="cta">
        <a class="btn" href="${token.url || canonical}" rel="noopener nofollow" target="_blank">${s.goClaim(provider)}<span class="ic">${raw(ICON.external)}</span></a>
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
