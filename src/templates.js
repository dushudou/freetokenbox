// HTML 模板（使用 hono/html 的 html 模板字符串，${} 自动转义）
// 全新现代化 UI + 深度 SEO 优化
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
  return html`<div class="ad-slot"><span>${label}</span><small>设置 ADSENSE_CLIENT_ID 后展示真实广告</small></div>`
}

function adLoaderHead(env) {
  const adClient = env.ADSENSE_CLIENT_ID || ''
  if (!adClient) return ''
  return html`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}" crossorigin="anonymous"></script>`
}

// 面包屑组件
function breadcrumb(items) {
  return html`<nav class="breadcrumb" aria-label="面包屑导航">
    <ol>
      ${items.map((item, i) => {
        const isLast = i === items.length - 1
        return html`<li>${isLast || !item.url
          ? html`<span aria-current="page">${item.name}</span>`
          : html`<a href="${item.url}">${item.name}</a>`}</li>${isLast ? '' : html`<span class="sep">›</span>`}`
      })}
    </ol>
  </nav>`
}

// ---------- 布局 ----------
export function layout({ title, description, path, env, body, extraHead = '', breadcrumbs = null, jsonLd = null }) {
  const base = siteUrl(env)
  const canonical = base ? `${base}${path}` : ''
  const desc = description || siteDescription()
  return html`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#667eea" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta name="keywords" content="免费Token, 免费API, AI API, free token, free API, DeepSeek, OpenRouter, Gemini, Groq, Cloudflare Workers AI, Mistral, 免费AI额度, API免费调用, LLM免费" />
  <meta name="author" content="FreeTokenBox" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  ${canonical ? html`<link rel="canonical" href="${canonical}" />` : ''}
  <link rel="icon" href="data:image/svg+xml,${html`${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🎁</text></svg>')}`}" />
  <link rel="alternate" type="application/rss+xml" title="${siteTitle()}" href="${base}/rss.xml" />
  <link rel="sitemap" type="application/xml" title="Sitemap" href="${base}/sitemap.xml" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="FreeTokenBox" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:locale" content="zh_CN" />
  <meta property="og:image" content="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#667eea"/><text x="600" y="280" font-size="72" font-weight="bold" fill="white" text-anchor="middle" font-family="sans-serif">FreeTokenBox</text><text x="600" y="360" font-size="32" fill="white" text-anchor="middle" font-family="sans-serif" opacity="0.9">免费送 Token 合集</text></svg>')}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#667eea"/><text x="600" y="280" font-size="72" font-weight="bold" fill="white" text-anchor="middle" font-family="sans-serif">FreeTokenBox</text><text x="600" y="360" font-size="32" fill="white" text-anchor="middle" font-family="sans-serif" opacity="0.9">免费送 Token 合集</text></svg>')}" />
  <meta name="application-name" content="FreeTokenBox" />
  <meta name="apple-mobile-web-app-title" content="FreeTokenBox" />
  ${extraHead}
  ${adLoaderHead(env)}
  <script type="application/ld+json">${JSON.stringify(websiteJsonLd(env))}</script>
  ${jsonLd ? html`<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
  <style>
    :root {
      --bg: #f8fafc;
      --bg-grad: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
      --card: #ffffff;
      --card-hover: #f1f5f9;
      --text: #1e293b;
      --muted: #64748b;
      --accent: #6366f1;
      --accent-light: #818cf8;
      --accent2: #06b6d4;
      --accent-grad: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --accent-grad2: linear-gradient(135deg, #6366f1, #06b6d4);
      --border: #e2e8f0;
      --border-hover: #c7d2fe;
      --shadow: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
      --shadow-hover: 0 10px 30px rgba(99,102,241,.12), 0 4px 12px rgba(0,0,0,.06);
      --shadow-lg: 0 20px 60px rgba(99,102,241,.15), 0 8px 24px rgba(0,0,0,.06);
      --radius: 16px;
      --radius-sm: 10px;
      --radius-lg: 20px;
      --header-bg: rgba(255,255,255,.85);
      --header-border: rgba(226,232,240,.8);
      --tag-bg: rgba(99,102,241,.08);
      --tag-text: #6366f1;
      --tag-border: rgba(99,102,241,.15);
      --search-bg: #f1f5f9;
      --code-bg: #f1f5f9;
      --flash-ok-bg: rgba(6,182,212,.08);
      --flash-ok-border: #06b6d4;
      --flash-err-bg: rgba(239,68,68,.08);
      --flash-err-border: #ef4444;
      --featured-shadow: 0 0 0 1.5px var(--accent), 0 8px 30px rgba(99,102,241,.15);
      --skeleton: #e2e8f0;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f172a;
        --bg-grad: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
        --card: #1e293b;
        --card-hover: #334155;
        --text: #e2e8f0;
        --muted: #94a3b8;
        --accent: #818cf8;
        --accent-light: #a5b4fc;
        --accent2: #22d3ee;
        --accent-grad: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        --accent-grad2: linear-gradient(135deg, #818cf8, #22d3ee);
        --border: #334155;
        --border-hover: #6366f1;
        --shadow: 0 1px 3px rgba(0,0,0,.3), 0 1px 2px rgba(0,0,0,.2);
        --shadow-hover: 0 10px 30px rgba(99,102,241,.2), 0 4px 12px rgba(0,0,0,.2);
        --shadow-lg: 0 20px 60px rgba(99,102,241,.2), 0 8px 24px rgba(0,0,0,.2);
        --header-bg: rgba(15,23,42,.85);
        --header-border: rgba(51,65,85,.8);
        --tag-bg: rgba(129,140,248,.12);
        --tag-text: #a5b4fc;
        --tag-border: rgba(129,140,248,.2);
        --search-bg: #334155;
        --code-bg: #0f172a;
        --flash-ok-bg: rgba(6,182,212,.1);
        --flash-err-bg: rgba(239,68,68,.1);
        --featured-shadow: 0 0 0 1.5px var(--accent), 0 8px 30px rgba(129,140,248,.2);
        --skeleton: #334155;
      }
    }
    *,*::before,*::after { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      background: var(--bg-grad);
      background-attachment: fixed;
      color: var(--text);
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    a { color: var(--accent); text-decoration: none; transition: color .15s ease; }
    a:hover { text-decoration: underline; }
    header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--header-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--header-border);
    }
    .nav { max-width:1120px; margin:0 auto; padding:12px 20px; display:flex; align-items:center; gap:16px; }
    .brand { font-size:21px; font-weight:800; color:var(--text); display:flex; align-items:center; gap:8px; white-space:nowrap; }
    .brand span { background:var(--accent-grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
    .nav-search { flex:1; max-width:340px; position:relative; }
    .nav-search input { width:100%; background:var(--search-bg); border:1px solid var(--border); color:var(--text); border-radius:999px; padding:8px 16px 8px 36px; font-size:14px; font-family:inherit; transition:border-color .15s ease, box-shadow .15s ease; }
    .nav-search input::placeholder { color:var(--muted); }
    .nav-search input:focus { outline:none; border-color:var(--accent); box-shadow:0 0 0 3px rgba(99,102,241,.1); }
    .nav-search .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--muted); font-size:14px; }
    .nav-links { display:flex; gap:6px; font-size:14px; }
    .nav-links a { color:var(--muted); padding:6px 12px; border-radius:8px; transition:all .15s ease; }
    .nav-links a:hover { color:var(--text); background:var(--card-hover); text-decoration:none; }
    main { max-width:1120px; margin:0 auto; padding:28px 20px 80px; min-height:60vh; }
    .hero { text-align:center; padding:48px 0 36px; }
    .hero h1 { font-size:clamp(28px, 5vw, 42px); margin:0 0 14px; line-height:1.2; font-weight:800; letter-spacing:-.02em; }
    .hero h1 .grad { background:var(--accent-grad2); -webkit-background-clip:text; background-clip:text; color:transparent; }
    .hero p { color:var(--muted); max-width:600px; margin:0 auto; font-size:17px; line-height:1.6; }
    .hero-search { max-width:560px; margin:24px auto 0; position:relative; }
    .hero-search input { width:100%; background:var(--card); border:1.5px solid var(--border); color:var(--text); border-radius:999px; padding:14px 20px 14px 48px; font-size:16px; font-family:inherit; box-shadow:var(--shadow); transition:all .2s ease; }
    .hero-search input::placeholder { color:var(--muted); }
    .hero-search input:focus { outline:none; border-color:var(--accent); box-shadow:0 0 0 4px rgba(99,102,241,.12), var(--shadow-hover); }
    .hero-search .search-icon { position:absolute; left:18px; top:50%; transform:translateY(-50%); color:var(--muted); font-size:18px; }
    .badges { display:flex; gap:8px; justify-content:center; margin-top:18px; flex-wrap:wrap; }
    .badge { font-size:13px; background:var(--card); border:1px solid var(--border); color:var(--muted); padding:6px 14px; border-radius:999px; transition:all .15s ease; display:inline-flex; align-items:center; gap:4px; }
    .badge:hover { border-color:var(--border-hover); color:var(--text); text-decoration:none; }
    .badge .dot { width:6px; height:6px; border-radius:50%; background:var(--accent2); display:inline-block; }
    .section-title { font-size:24px; margin:36px 0 18px; display:flex; align-items:center; gap:10px; font-weight:700; }
    .section-title .count { font-size:14px; font-weight:400; color:var(--muted); }
    .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:18px; }
    .card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:20px; display:flex; flex-direction:column; gap:12px; transition:transform .15s ease, border-color .15s ease, box-shadow .15s ease; position:relative; overflow:hidden; }
    .card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--accent-grad2); opacity:0; transition:opacity .15s ease; }
    .card:hover { transform:translateY(-3px); border-color:var(--border-hover); box-shadow:var(--shadow-hover); }
    .card:hover::before { opacity:1; }
    .card h3 { margin:0; font-size:17px; line-height:1.4; }
    .card h3 a { color:var(--text); }
    .card h3 a:hover { color:var(--accent); text-decoration:none; }
    .card p { color:var(--muted); margin:0; font-size:14px; flex:1; line-height:1.6; }
    .card-meta { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--muted); flex-wrap:wrap; }
    .tag { font-size:11px; background:var(--tag-bg); color:var(--tag-text); border:1px solid var(--tag-border); border-radius:6px; padding:2px 8px; transition:all .15s ease; display:inline-block; }
    .tag:hover { background:var(--tag-text); color:var(--card); text-decoration:none; }
    .featured { box-shadow:var(--featured-shadow); border-color:transparent; }
    .featured-flag { font-size:11px; font-weight:700; color:#fff; background:var(--accent-grad); border-radius:6px; padding:3px 10px; width:max-content; display:inline-flex; align-items:center; gap:4px; }
    .btn { display:inline-flex; align-items:center; gap:6px; background:var(--accent-grad); color:#fff!important; font-weight:600; padding:10px 18px; border-radius:var(--radius-sm); font-size:14px; border:none; cursor:pointer; transition:all .15s ease; text-decoration:none!important; }
    .btn:hover { filter:brightness(1.08); transform:translateY(-1px); box-shadow:0 4px 12px rgba(99,102,241,.3); }
    .btn-outline { background:transparent; border:1.5px solid var(--border); color:var(--text)!important; }
    .btn-outline:hover { border-color:var(--accent); color:var(--accent)!important; filter:none; transform:translateY(-1px); box-shadow:none; background:transparent; }
    .btn-sm { padding:7px 14px; font-size:13px; }
    .article { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-lg); padding:32px; max-width:840px; margin:0 auto; box-shadow:var(--shadow); }
    .article h1 { font-size:30px; margin:0 0 8px; line-height:1.3; font-weight:800; letter-spacing:-.02em; }
    .article .sub { color:var(--muted); margin:0 0 24px; font-size:14px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .article .body { color:var(--text); line-height:1.8; }
    .article .body h2,.article .body h3 { margin:28px 0 10px; font-weight:700; }
    .article .body ul,.article .body ol { padding-left:24px; }
    .article .body li { margin:6px 0; }
    .article .body blockquote { border-left:3px solid var(--accent); margin:16px 0; padding:10px 18px; color:var(--muted); background:var(--card-hover); border-radius:0 var(--radius-sm) var(--radius-sm) 0; }
    .article .body code { background:var(--code-bg); padding:2px 7px; border-radius:6px; font-size:.9em; font-family:"SF Mono","Fira Code",monospace; }
    .article .body a { color:var(--accent); text-decoration:underline; text-underline-offset:2px; }
    .cta { margin-top:24px; display:flex; gap:10px; flex-wrap:wrap; }
    .breadcrumb { padding:0 0 16px; font-size:13px; color:var(--muted); }
    .breadcrumb ol { list-style:none; display:flex; align-items:center; gap:6px; margin:0; padding:0; flex-wrap:wrap; }
    .breadcrumb li { display:flex; align-items:center; gap:6px; }
    .breadcrumb a { color:var(--muted); }
    .breadcrumb a:hover { color:var(--accent); text-decoration:none; }
    .breadcrumb .sep { color:var(--muted); opacity:.5; }
    .ad-slot { background:var(--card); border:1px dashed var(--border); border-radius:var(--radius); padding:20px; text-align:center; color:var(--muted); font-size:13px; margin:28px 0; display:flex; flex-direction:column; align-items:center; gap:4px; }
    .ad-slot small { font-size:11px; opacity:.6; }
    footer { max-width:1120px; margin:0 auto; padding:28px 20px; border-top:1px solid var(--border); color:var(--muted); font-size:13px; display:flex; gap:16px; flex-wrap:wrap; align-items:center; }
    footer a { color:var(--muted); }
    footer a:hover { color:var(--accent); text-decoration:none; }
    footer .right { margin-left:auto; }
    .footer-links { display:flex; gap:16px; flex-wrap:wrap; }
    .pager { display:flex; gap:8px; justify-content:center; margin:32px 0; flex-wrap:wrap; }
    .pager a,.pager span { padding:8px 14px; border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-size:14px; transition:all .15s ease; background:var(--card); }
    .pager a:hover { border-color:var(--accent); color:var(--accent); text-decoration:none; }
    .pager .cur { background:var(--accent-grad); border-color:transparent; color:#fff; font-weight:600; }
    .cat-nav { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:24px; }
    .cat-nav a { font-size:13px; background:var(--card); border:1px solid var(--border); color:var(--muted); padding:6px 14px; border-radius:999px; transition:all .15s ease; }
    .cat-nav a:hover,.cat-nav a.active { border-color:var(--accent); color:var(--accent); text-decoration:none; background:var(--tag-bg); }
    .cat-nav .count { font-size:11px; opacity:.6; }
    .faq-section { margin-top:32px; max-width:840px; margin-left:auto; margin-right:auto; }
    .faq-section h2 { font-size:20px; margin:0 0 16px; }
    .faq-item { border:1px solid var(--border); border-radius:var(--radius-sm); margin-bottom:10px; overflow:hidden; }
    .faq-item summary { padding:14px 18px; font-weight:600; cursor:pointer; list-style:none; display:flex; align-items:center; justify-content:space-between; transition:background .15s ease; }
    .faq-item summary::-webkit-details-marker { display:none; }
    .faq-item summary:hover { background:var(--card-hover); }
    .faq-item summary::after { content:'+'; font-size:20px; color:var(--muted); transition:transform .2s ease; }
    .faq-item[open] summary::after { transform:rotate(45deg); }
    .faq-item .answer { padding:0 18px 14px; color:var(--muted); font-size:14px; line-height:1.7; }
    form.admin { display:flex; flex-direction:column; gap:14px; max-width:760px; margin:0 auto; }
    label { font-size:13px; color:var(--muted); display:flex; flex-direction:column; gap:6px; font-weight:500; }
    input,select,textarea { background:var(--search-bg); border:1.5px solid var(--border); color:var(--text); border-radius:var(--radius-sm); padding:10px 14px; font-size:14px; font-family:inherit; transition:border-color .15s ease, box-shadow .15s ease; }
    input:focus,select:focus,textarea:focus { outline:none; border-color:var(--accent); box-shadow:0 0 0 3px rgba(99,102,241,.1); }
    textarea { min-height:120px; resize:vertical; }
    .flash { padding:12px 16px; border-radius:var(--radius-sm); margin-bottom:16px; font-size:14px; border:1px solid; }
    .flash.ok { background:var(--flash-ok-bg); border-color:var(--flash-ok-border); color:var(--flash-ok-border); }
    .flash.err { background:var(--flash-err-bg); border-color:var(--flash-err-border); color:var(--flash-err-border); }
    .rowline { display:flex; gap:10px; flex-wrap:wrap; }
    .rowline>* { flex:1; min-width:200px; }
    table.list { width:100%; border-collapse:collapse; font-size:14px; }
    table.list th,table.list td { border-bottom:1px solid var(--border); padding:10px 8px; text-align:left; vertical-align:top; }
    table.list th { color:var(--muted); font-weight:600; font-size:12px; }
    .actions a,.actions form { display:inline-block; margin-right:8px; font-size:13px; }
    .danger { color:var(--flash-err-border)!important; }
    .stats-bar { display:flex; gap:24px; justify-content:center; margin:20px 0; flex-wrap:wrap; }
    .stat-item { text-align:center; }
    .stat-item .num { font-size:28px; font-weight:800; background:var(--accent-grad2); -webkit-background-clip:text; background-clip:text; color:transparent; }
    .stat-item .label { font-size:13px; color:var(--muted); }
    .related-section { margin-top:32px; }
    .related-section h2 { font-size:18px; margin:0 0 14px; }
    .related-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:12px; }
    .related-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:14px; transition:all .15s ease; }
    .related-card:hover { border-color:var(--border-hover); transform:translateY(-2px); }
    .related-card h4 { margin:0; font-size:15px; }
    .related-card h4 a { color:var(--text); }
    .related-card h4 a:hover { color:var(--accent); text-decoration:none; }
    .related-card p { margin:4px 0 0; font-size:13px; color:var(--muted); }
    @media (max-width: 768px) {
      .nav { flex-wrap:wrap; gap:10px; padding:10px 16px; }
      .nav-search { order:5; flex-basis:100%; max-width:none; }
      .nav-links { font-size:13px; gap:2px; }
      .nav-links a { padding:4px 8px; }
      main { padding:20px 16px 60px; }
      .hero { padding:32px 0 24px; }
      .article { padding:20px; border-radius:var(--radius); }
      .grid { grid-template-columns:1fr; gap:14px; }
      .stats-bar { gap:16px; }
      .stat-item .num { font-size:24px; }
    }
    @media (prefers-reduced-motion: reduce) {
      * { animation:none!important; transition:none!important; }
    }
  </style>
</head>
<body>
  <header>
    <div class="nav">
      <a class="brand" href="/">🎁 Free<span>Token</span>Box</a>
      <div class="nav-search">
        <span class="search-icon">🔍</span>
        <input type="search" name="q" placeholder="搜索免费 Token…" aria-label="搜索" value="" onkeydown="if(event.key==='Enter'){var q=this.value.trim();if(q)location.href='/?q='+encodeURIComponent(q)}" />
      </div>
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
    ${adSlot(env, 'footer', '页脚广告')}
  </main>
  <footer>
    <span>© ${new Date().getFullYear()} FreeTokenBox · 免费送 Token 合集</span>
    <div class="footer-links">
      <a href="/sitemap.xml">Sitemap</a>
      <a href="/rss.xml">RSS</a>
      <a href="/llms.txt">llms.txt</a>
      <a href="/api/tokens">API</a>
      <a href="/about">关于</a>
      <a href="/privacy">隐私政策</a>
      <a href="/terms">条款</a>
    </div>
    <span class="right">内容仅供学习参考，请以官方页面为准</span>
  </footer>
  <script>
    // 搜索增强：回车跳转
    document.querySelectorAll('input[name="q"]').forEach(function(input){
      if(input.dataset.enhanced) return;
      input.dataset.enhanced = '1';
      input.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){
          e.preventDefault();
          var q = this.value.trim();
          if(q) location.href = '/?q=' + encodeURIComponent(q);
        }
      });
    });
    // 卡片点击跳转（整卡可点）
    document.querySelectorAll('.card[data-href]').forEach(function(card){
      card.style.cursor = 'pointer';
      card.addEventListener('click', function(e){
        if(e.target.closest('a,button')) return;
        location.href = this.dataset.href;
      });
    });
  </script>
</body>
</html>`
}

// ---------- 卡片 ----------
function tokenCard(t) {
  return html`<article class="card ${t.is_featured ? 'featured' : ''}" data-href="/token/${t.slug}">
    ${t.is_featured ? html`<div class="featured-flag">⭐ 精选</div>` : ''}
    <h3><a href="/token/${t.slug}">${t.name}</a></h3>
    <p>${excerpt(t.description, 100)}</p>
    <div class="card-meta">
      ${t.provider ? html`<span>🏢 ${t.provider}</span>` : ''}
      ${t.expiry_date ? html`<span>⏳ ${formatDate(t.expiry_date)} 截止</span>` : ''}
      ${(t.tags || []).slice(0, 3).map((tag) => html`<a class="tag" href="/tags/${tag}">${tag}</a>`)}
    </div>
    <div><a class="btn btn-sm" href="${t.url || `/token/${t.slug}`}" rel="noopener nofollow" target="_blank">去领取 →</a></div>
  </article>`
}

// ---------- 首页 ----------
export function homePage({ featured, items, categories, page, totalPages, env, query, searchQuery, stats }) {
  const breadcrumbs = [
    { name: '首页', url: '/' },
  ]
  const body = html`
    <section class="hero">
      <h1>免费送 <span class="grad">Token</span> 合集，一站式发现</h1>
      <p>收集所有免费赠送 AI Token / API 额度 / 算力的网站与活动。DeepSeek、OpenRouter、Gemini、Groq、Cloudflare 等平台免费资源，一键直达官网领取。</p>
      <div class="hero-search">
        <span class="search-icon">🔍</span>
        <input type="search" name="q" placeholder="搜索免费 Token / API / 平台…" aria-label="搜索免费 Token" value="${escapeHtml(searchQuery || '')}" />
      </div>
      ${stats ? html`<div class="stats-bar">
        <div class="stat-item"><div class="num">${stats.total}</div><div class="label">免费条目</div></div>
        <div class="stat-item"><div class="num">${stats.categories}</div><div class="label">分类</div></div>
        <div class="stat-item"><div class="num">${stats.featured}</div><div class="label">精选</div></div>
      </div>` : ''}
      <div class="badges">
        <span class="badge"><span class="dot"></span> 全免费</span>
        <span class="badge"><span class="dot"></span> 无需付费</span>
        <span class="badge"><span class="dot"></span> 每日更新</span>
        <span class="badge"><span class="dot"></span> 直达官网</span>
      </div>
    </section>

    ${categories.length ? html`
      <nav class="cat-nav" aria-label="分类导航">
        <a href="/" class="${!searchQuery ? 'active' : ''}">全部</a>
        ${categories.map((c) => html`<a href="/category/${c.name}">${c.name} <span class="count">(${c.count})</span></a>`)}
      </nav>
    ` : ''}

    ${adSlot(env, 'home-top', '列表顶部')}

    ${featured.length ? html`
      <section class="section-title">⭐ 精选免费 Token <span class="count">${featured.length} 个</span></section>
      <div class="grid">${featured.map(tokenCard)}</div>
    ` : ''}

    <section class="section-title">📦 全部免费 Token <span class="count">共 ${items.length} 条${totalPages > 1 ? ` · 第 ${page}/${totalPages} 页` : ''}</span></section>
    <div class="grid">${items.map(tokenCard)}</div>

    ${totalPages > 1 ? html`<nav class="pager" aria-label="分页">
      ${page > 1 ? html`<a href="/?page=${page - 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}">← 上一页</a>` : ''}
      <span class="cur">${page} / ${totalPages}</span>
      ${page < totalPages ? html`<a href="/?page=${page + 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}">下一页 →</a>` : ''}
    </nav>` : ''}
  `
  return layout({
    title: searchQuery
      ? `搜索"${searchQuery}" · ${siteTitle()}`
      : `${siteTitle()} · 免费 AI Token / API 额度聚合`,
    description: searchQuery
      ? `搜索"${searchQuery}"相关的免费 Token 和 API 额度。`
      : siteDescription(),
    path: query ? `/?${query}` : '/',
    env,
    body,
    breadcrumbs,
    jsonLd: itemListJsonLd(featured.length ? [...featured, ...items] : items, env),
  })
}

// ---------- 列表页（分类/标签/搜索共用） ----------
export function listPage({ title, description, items, categories, page, totalPages, env, path, badge, breadcrumbs, query, searchQuery }) {
  const body = html`
    ${breadcrumbs ? breadcrumb(breadcrumbs) : ''}
    <section class="hero">
      <h1>${title}</h1>
      <p>${description}</p>
      ${badge ? html`<div class="badges">${badge}</div>` : ''}
    </section>
    <div class="grid">${items.map(tokenCard)}</div>
    ${totalPages > 1 ? html`<nav class="pager" aria-label="分页">
      ${page > 1 ? html`<a href="${path}?page=${page - 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}">← 上一页</a>` : ''}
      <span class="cur">${page} / ${totalPages}</span>
      ${page < totalPages ? html`<a href="${path}?page=${page + 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}">下一页 →</a>` : ''}
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
      <div class="sub">
        ${token.category ? html`<a class="tag" href="/category/${token.category}">${token.category}</a>` : ''}
        ${(token.tags || []).map((t) => html`<a class="tag" href="/tags/${t}">${t}</a>`)}
        ${token.provider ? html`<span>· 🏢 ${token.provider}</span>` : ''}
        ${token.expiry_date ? html`<span>· ⏳ ${formatDate(token.expiry_date)} 截止</span>` : ''}
        <span>· 📅 ${formatDate(token.created_at)}</span>
      </div>
      <h1>${token.name}</h1>
      <p class="sub" style="font-size:16px; color:var(--text); opacity:.8">${token.description}</p>
      <div class="body">${raw(renderMarkdown(token.content))}</div>
      <div class="cta">
        <a class="btn" href="${token.url || canonical}" rel="noopener nofollow" target="_blank">前往 ${escapeHtml(token.provider || '官网')} 领取 →</a>
        <a class="btn btn-outline" href="/">← 返回列表</a>
      </div>
      ${adSlot(env, 'article-bottom', '文章底部')}
    </article>

    ${related.length ? html`
    <section class="related-section" style="max-width:840px;margin:32px auto 0">
      <h2>相关免费 Token</h2>
      <div class="related-grid">
        ${related.map((t) => html`<div class="related-card">
          <h4><a href="/token/${t.slug}">${t.name}</a></h4>
          <p>${excerpt(t.description, 60)}</p>
        </div>`)}
      </div>
    </section>` : ''}

    <section class="faq-section">
      <h2>常见问题</h2>
      <details class="faq-item">
        <summary>${token.name} 是免费的吗？</summary>
        <div class="answer">是的，${token.name} 是完全免费的。${token.description} 你可以直接前往${token.provider || '官方'}页面领取。</div>
      </details>
      <details class="faq-item">
        <summary>如何领取 ${token.name}？</summary>
        <div class="answer">点击本页面上的"前往领取"按钮，即可跳转到${token.provider || '官方'}页面获取免费额度。整个过程无需付费。</div>
      </details>
      ${token.expiry_date ? html`<details class="faq-item">
        <summary>${token.name} 的活动截止时间是什么时候？</summary>
        <div class="answer">${token.name} 的活动截止日期为 ${formatDate(token.expiry_date)}，建议尽早领取以免错过。</div>
      </details>` : ''}
      <details class="faq-item">
        <summary>FreeTokenBox 还有哪些免费 Token？</summary>
        <div class="answer">FreeTokenBox 收录了大量免费 AI Token / API 额度活动，包括 DeepSeek、OpenRouter、Google Gemini、Groq、Cloudflare Workers AI、Mistral 等平台。请访问 <a href="/">首页</a> 浏览全部。</div>
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
    <div class="article" style="max-width:420px; margin-top:40px">
      <h1>🔐 后台登录</h1>
      ${error ? html`<div class="flash err">${error}</div>` : ''}
      <form class="admin" method="post" action="/admin/login">
        <label>密码
          <input type="password" name="password" autofocus required placeholder="请输入 ADMIN_PASSWORD" />
        </label>
        <button class="btn" type="submit" style="border:none;cursor:pointer">登录</button>
      </form>
      <p style="font-size:12px;color:var(--muted);margin-top:12px">默认密码来自 Worker 环境变量 ADMIN_PASSWORD。</p>
    </div>
  `
  return layout({ title: '后台登录 · FreeTokenBox', description: 'FreeTokenBox 后台登录', path: '/admin/login', env, body })
}

export function adminPage({ tokens, flash, env, categories }) {
  const flashHtml = flash ? html`<div class="flash ${flash.type}">${flash.msg}</div>` : ''
  const rows = tokens.map(
    (t) => html`<tr>
      <td>${t.id}</td>
      <td><a href="/token/${t.slug}" target="_blank">${t.name}</a>${t.is_featured ? ' ⭐' : ''}</td>
      <td>${t.provider || '-'}</td>
      <td>${t.status}${t.expiry_date ? html`<br/>⏳ ${t.expiry_date}` : ''}</td>
      <td>${(t.tags || []).slice(0, 3).join(', ')}</td>
      <td class="actions">
        <a href="/admin/edit/${t.slug}">编辑</a>
        <form method="post" action="/admin/delete/${t.slug}" onsubmit="return confirm('确认删除「${t.name.replace(/'/g, '')}」？')">
          <button type="submit" class="danger" style="background:none;border:none;cursor:pointer;padding:0;font-size:13px">删除</button>
        </form>
      </td>
    </tr>`
  )
  const body = html`
    <div class="section-title">⚙️ 后台管理</div>
    ${flashHtml}
    <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap">
      <a class="btn" href="/admin/new">＋ 新增 Token</a>
      <a class="btn btn-outline" href="/admin/seed">⚡ 导入种子数据</a>
      <form method="post" action="/admin/logout" style="margin-left:auto">
        <button class="btn btn-outline" type="submit" style="cursor:pointer">退出登录</button>
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
    <div class="section-title">${isNew ? '＋ 新增 Token' : '✏️ 编辑 Token'}</div>
    ${flashHtml}
    <form class="admin" method="post" action="${action}">
      ${formField('name', '名称 *（如：DeepSeek-V4-Flash API 限时免费开放）', t.name, { required: true })}
      ${formField('slug', 'Slug（留空自动生成，用于 /token/:slug）', t.slug, { placeholder: 'deepseek-v4-flash-free' })}
      ${formField('provider', '提供方 / 公司名', t.provider)}
      ${formField('url', '领取地址（官方链接）', t.url, { placeholder: 'https://...' })}
      ${formField('category', '分类', t.category || 'free-api', { type: 'select', options: ['free-api', 'free-plan', 'giveaways', 'coupons', 'other'] })}
      ${formField('tags', '标签（逗号分隔，如 api, llm, free-token）', (t.tags || []).join(', '))}
      ${formField('expiry_date', '活动截止日期（可选，YYYY-MM-DD）', t.expiry_date)}
      ${formField('status', '状态', t.status || 'published', { type: 'select', options: ['published', 'draft'] })}
      ${formField('is_featured', '精选（首页头条，1/0）', t.is_featured ? '1' : '0', { type: 'select', options: ['0', '1'] })}
      ${formField('sort_weight', '排序权重（越大越靠前）', t.sort_weight || '0')}
      ${formField('description', '一句话简介 *（列表页展示）', t.description, { type: 'textarea', required: true })}
      ${formField('content', '长文内容（Markdown 格式）', t.content, { type: 'textarea' })}
      <div style="display:flex;gap:10px">
        <button class="btn" type="submit" style="border:none;cursor:pointer">保存</button>
        <a class="btn btn-outline" href="/admin">取消</a>
      </div>
    </form>
  `
  return layout({ title: `${isNew ? '新增' : '编辑'} Token · FreeTokenBox`, description: '后台表单', path: action, env, body })
}
