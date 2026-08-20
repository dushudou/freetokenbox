// 全站样式（单一来源）。由 templates.js 的 layout() 通过 <style>${raw(siteCss)}</style> 内嵌输出。
// 维护提示：变量/类名改动时同步检查 scripts/test-local.js 中的断言（class="banner"/"sidebar"/"e-logo"/"kicker"/"w-rank"/"chip free"/"ad-slot" 等）。
export const siteCss = `
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
    .col-main { min-width: 0; scroll-margin-top: 76px; }
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
      .hero-mark { display: none; }
    }
    @media (max-width: 640px) {
      .nav { padding: 0 16px; gap: 12px; }
      .nav-search { display: none; }
      main { padding: 26px 16px 60px; }
      .article { padding: 24px; }
      .hero-in { padding: 34px 16px 30px; }
      .hero-in h1 { font-size: 32px; }
      .entry { flex-direction: column; align-items: stretch; gap: 14px; }
      .entry .claim { align-self: flex-start; }
      .foot { flex-direction: column; align-items: flex-start; gap: 8px; }
      .foot .right { margin-left: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; transition: none !important; }
    }
`
