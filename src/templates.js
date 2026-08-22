// HTML 模板（使用 hono/html 的 html 模板字符串，${} 自动转义）
// 设计规范：中立 zinc 色板 + 单一 emerald 强调色，目录式列表布局，中英双语（/en 前缀）
import { html, raw } from 'hono/html'
import { siteCss } from './styles.js'
import { AFFILIATE, affiliateActive } from './affiliate.js'
import { bookList } from './books.js'
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
import { MODEL_LOGOS, modelLogoSvg } from './logos.js'
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
  arrowL: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  arrowR: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
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

// 首页轮播交互脚本（纯 vanilla JS，通过 raw() 注入，不依赖外部库）
const CAROUSEL_JS = `(function(){
  var track=document.getElementById('carouselTrack');
  if(!track)return;
  var slides=track.children,dots=document.querySelectorAll('.carousel-dots .dot');
  var current=0,timer=null,busy=false;
  function go(n){
    n=(n+slides.length)%slides.length;
    if(n===current||busy)return;
    busy=true;current=n;
    track.style.transform='translateX(-'+(n*100)+'%)';
    for(var i=0;i<slides.length;i++){
      slides[i].classList.toggle('active',i===n);
      if(dots[i])dots[i].classList.toggle('active',i===n);
    }
    setTimeout(function(){busy=false;},660);
    restart();
  }
  window.carouselGo=function(d){go(current+d);};
  window.carouselGoTo=function(n){go(n);};
  function next(){go(current+1);}
  function start(){timer=setInterval(next,4500);}
  function stop(){if(timer){clearInterval(timer);timer=null;}}
  function restart(){stop();start();}
  start();
  var hero=document.querySelector('.hero-carousel');
  if(hero){
    hero.addEventListener('mouseenter',stop);
    hero.addEventListener('mouseleave',start);
    var tx=0;
    hero.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;stop();},{passive:true});
    hero.addEventListener('touchend',function(e){
      var d=tx-e.changedTouches[0].clientX;
      if(Math.abs(d)>50)go(current+(d>0?1:-1));else start();
    });
  }
  document.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft')go(current-1);
    if(e.key==='ArrowRight')go(current+1);
  });
})();`

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
  <script type="application/ld+json">${jsonScript(websiteJsonLd(env, lang))}</script>
  ${jsonLd ? html`<script type="application/ld+json">${jsonScript(jsonLd)}</script>` : ''}
  <style>
    ${raw(siteCss)}
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
    ${affiliateActive() ? html`<p class="aff-disclosure">${lang === 'en' ? 'Some links on this site are affiliate links — they don\'t affect your cost and help support the site.' : '本站部分外链为联盟推广链接：通过本站注册/购买不影响你的费用，同时可为本站带来佣金支持运营。'}</p>` : ''}
  </footer>
</body>
</html>`
}

// ---------- 外链 UTM 来源（跳转其他网站时带上我们的来源） ----------
// 联盟营销改写：命中配置的域名时替换/追加推广参数（未配置返回 null = 原样处理）
function affiliateUrl(rawUrl) {
  try {
    const u = new URL(rawUrl)
    const host = u.hostname.toLowerCase()
    // 1) 通用按域名整体替换（CJ / ShareASale 商家推广链接）
    if (AFFILIATE.rewrite && AFFILIATE.rewrite[host]) return AFFILIATE.rewrite[host]
    // 2) Amazon Associates：给 amazon.* 链接追加 tag
    if (
      AFFILIATE.amazonTag &&
      (host === 'amazon.com' || host === 'amazon.cn' || host.endsWith('.amazon.com') || host.endsWith('.amazon.cn'))
    ) {
      if (!u.searchParams.has('tag')) u.searchParams.set('tag', AFFILIATE.amazonTag)
      return u.toString()
    }
    // 3) OpenRouter 官方返佣：给 openrouter.ai 链接追加 ref
    if (
      AFFILIATE.openrouterRef &&
      (host === 'openrouter.ai' || host.endsWith('.openrouter.ai'))
    ) {
      if (!u.searchParams.has('ref')) u.searchParams.set('ref', AFFILIATE.openrouterRef)
      return u.toString()
    }
  } catch (e) {
    /* 忽略无效 URL */
  }
  return null
}

function withUtm(url, slug) {
  if (!url || !/^https?:\/\//i.test(url)) return url // 仅外链；内部链接原样返回
  // 先应用联盟改写（整体替换或追加推广参数），再补 UTM
  const aff = affiliateUrl(url)
  if (aff) return withUtm(aff, slug)
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
export function homePage({ featured, items, categories, page, totalPages, env, query, searchQuery, stats, lang = 'zh', latest = [], modelCounts = null }) {
  const s = T(lang)
  const pre = lang === 'en' ? '/en' : ''
  const showFeatured = featured.length && !searchQuery
  // 书单（联盟返佣位）：仅在启用联盟且非搜索结果时展示
  const books = affiliateActive() && !searchQuery ? bookList(lang) : []
  // 全宽轮播横幅：渲染在 <main> 容器之外，横贯整个视口宽度
  const hero = html`
    <section class="hero-carousel">
      <h1 class="sr-only">${s.h1}</h1>
      <div class="carousel-watermark" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.4" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="8.8" y="8.8" width="6.4" height="6.4" rx="1.3" fill="currentColor"/></svg></div>
      <div class="carousel-viewport">
        <div class="carousel-track" id="carouselTrack">
          ${MODEL_LOGOS.map((m, i) => html`
            <div class="carousel-slide${i === 0 ? ' active' : ''}" data-i="${i}" style="--slide-color: ${m.color}; --bg: url('${m.image}')">
              <div class="slide-bg"></div>
              <div class="slide-glow"></div>
              <div class="slide-inner">
                <span class="kicker">${s.carouselKicker}</span>
                <div class="slide-logo">${raw(modelLogoSvg(m, 64))}</div>
                <h2 class="slide-title">${m.name}</h2>
                <p class="slide-desc">${s.carouselTaglines[i] || ''}</p>
                ${modelCounts ? html`<p class="slide-stats">${s.slideStats(modelCounts[i] || 0)}</p>` : (stats && i === 0 ? html`<p class="slide-stats">${s.bannerStats(stats)}</p>` : '')}
              </div>
            </div>
          `)}
        </div>
        <button class="carousel-arrow prev" type="button" aria-label="${lang === 'en' ? 'Previous' : '上一个'}" onclick="carouselGo(-1)">${raw(ICON.arrowL)}</button>
        <button class="carousel-arrow next" type="button" aria-label="${lang === 'en' ? 'Next' : '下一个'}" onclick="carouselGo(1)">${raw(ICON.arrowR)}</button>
      </div>
      <div class="carousel-dots">
        ${MODEL_LOGOS.map((m, i) => html`<button class="dot${i === 0 ? ' active' : ''}" type="button" data-i="${i}" onclick="carouselGoTo(${i})" aria-label="${lang === 'en' ? 'Slide' : '幻灯片'} ${i + 1}"></button>`)}
      </div>
    </section>
    <script>${raw(CAROUSEL_JS)}</script>`
  const body = html`
    <div class="layout-grid">
      <div class="col-main" id="list">
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
        <div class="list">${items.map((t) => entryRow(t, lang))}</div>

        ${totalPages > 1 ? html`<nav class="pager" aria-label="${lang === 'en' ? 'Pagination' : '分页'}">
          ${page > 1 ? html`<a href="${lp(lang, '/')}?page=${page - 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}">${s.prev}</a>` : ''}
          <span class="cur">${page} / ${totalPages}</span>
          ${page < totalPages ? html`<a href="${lp(lang, '/')}?page=${page + 1}${searchQuery ? '&q=' + encodeURIComponent(searchQuery) : ''}">${s.next}</a>` : ''}
        </nav>` : ''}
      </div>

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
      </aside>
    </div>
    ${books.length ? html`
    <section class="bookshelf">
      <div class="sec">
        <h2>${lang === 'en' ? 'AI Developer Bookshelf' : 'AI 开发者书单'}</h2>
        <span class="n">${s.countTiao(books.length)}</span>
      </div>
      <p class="bs-sub">${lang === 'en' ? 'Essential AI and LLM books. Purchases through these links support this site at no extra cost to you.' : '精选 AI / LLM 经典书籍：通过链接购买不影响你的价格，同时可支持本站运营。'}</p>
      <div class="bs-grid">
        ${books.map((b) => html`
        <a class="bs-card" href="${withUtm(b.url, 'bookshelf')}" rel="noopener nofollow sponsored" target="_blank">
          <span class="bs-cover"><img src="${b.cover}" alt="${b.title}" loading="lazy" referrerpolicy="no-referrer" /></span>
          <span class="bs-info">
            <strong>${b.title}</strong>
            <em>${b.author} · ${b.year}</em>
            <p>${b.desc}</p>
            <span class="bs-cta">${lang === 'en' ? 'View on Amazon' : '在 Amazon 查看'}<span class="ic">${raw(ICON.external)}</span></span>
          </span>
        </a>`)}
      </div>
    </section>` : ''}
  `
  return layout({
    title: searchQuery ? s.searchTitleFor(searchQuery) : s.homeTitle,
    description: searchQuery ? s.searchDescFor(searchQuery) : s.homeDesc,
    path: query ? `/?${query}` : '/',
    env,
    lang,
    hero,
    body,
    jsonLd: [organizationJsonLd(env, lang), itemListJsonLd(featured.length ? [...featured, ...items] : items, env, lang)],
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
