// 中英文双语字符串字典
// lang: 'zh'（默认，路径无前缀）| 'en'（路径前缀 /en）

export const STR = {
  zh: {
    code: 'zh',
    htmlLang: 'zh-CN',
    locale: 'zh_CN',
    altLocale: 'en_US',

    // 导航
    navSearch: '搜索免费 Token',
    navHome: '首页',
    navAbout: '关于',
    navAdmin: '后台',
    switchLabel: 'EN', // 中文页上显示，链接到英文版

    // 首页
    h1: '免费 AI 资源：文本、图片、音视频与 3D',
    bannerKicker: '免费额度目录 · 人工核对',
    lede: '收录正在发放免费 AI Token、API 额度与算力的活动。领取链接均指向官方页面，人工核对、持续更新。',
    bannerStats: (s) => `已收录 ${s.total} 个条目 · ${s.categories} 个分类 · ${s.featured} 个精选`,
    modelWallLabel: '覆盖主流大模型',
    free: '免费',
    expired: '已截止',
    expiresIn: (n) => `${n} 天后截止`,
    carouselKicker: '独立文档整理 · 免费与试用 API 目录',
    carouselTaglines: [
      '查看支持 GPT 系列的资源与适用条件', '查看 Claude 相关资源与适用条件',
      '核对 Gemini 免费层、模型资格与数据条款', '核对 DeepSeek 模型的服务提供方与价格',
      '查看 Qwen 相关平台的额度与限制', '查看 Kimi 相关资源的接入条件',
      '查看 Grok 相关平台与价格说明', '查看 GLM 相关资源与适用条件',
      '查看 MiniMax 相关平台与价格说明', '查看混元相关资源与适用条件',
      '查看 MiMo 相关平台与价格说明',
    ],
    slideStats: (n) => (n > 0 ? `站内已收录 ${n} 条已核查资源` : '持续追踪官方定价与免费额度变动'),
    browseAll: '浏览全部条目',
    aboutLink: '关于本站',
    sidebarHot: '热门精选',
    sidebarLatest: '已核查资源',
    sidebarCats: '分类导航',
    viewAll: '查看全部',
    searchPlaceholder: '搜索平台、模型或关键词',
    searchBtn: '搜索',
    searchLabel: '搜索免费 Token',
    hintStats: (s) => `已收录 ${s.total} 个条目 · ${s.categories} 个分类 · 其中 ${s.featured} 个精选`,
    homeTitle: '免费 AI 额度目录：图片、音视频、3D 与 API · FreeTokenBox',
    homeDesc: '查找文本 API、AI 图片、语音、音乐、视频和 3D 资产生成的免费额度。区分网页体验与 API、每日每月额度与一次性试用，核对下载、商用限制及官方来源。',
    searchTitleFor: (q) => `搜索「${q}」· FreeTokenBox`,
    searchDescFor: (q) => `搜索「${q}」相关的免费 Token 和 API 额度。`,

    // 列表
    all: '全部',
    featuredSec: '精选',
    countGe: (n) => `${n} 个`,
    allEntries: '全部条目',
    searchResults: '搜索结果',
    countTiao: (n) => `${n} 条`,
    pageOf: (p, t) => `第 ${p}/${t} 页`,
    prev: '上一页',
    next: '下一页',

    // 条目
    claim: '领取',
    view: '查看',
    flag: '精选',
    deadline: (d) => `截止 ${d}`,
    collectedAt: (d) => `收录于 ${d}`,

    // 详情页
    goClaim: (p) => `前往 ${p} 领取`,
    providerFallback: '官方',
    back: '返回列表',
    related: '相关条目',
    tokenTitle: (n) => `${n} · 额度与限制 · FreeTokenBox`,

    // FAQ
    faqTitle: '常见问题',
    faqQ1: (n) => `${n} 收费吗？`,
    faqA1: (n, p) => `不收费。${n} 由 ${p} 免费发放，领取和使用均不产生费用，具体细则以官方页面为准。`,
    faqQ2: '怎么领取？',
    faqA2: (p) => `点击上方「前往领取」按钮，跳转到 ${p} 的活动页面，按提示完成领取即可。`,
    faqQ3: '什么时候结束？',
    faqA3: (d) => `本次活动截止到 ${d}，建议尽早领取，额度发完即止。`,
    faqQ4: '还有其他免费额度吗？',
    faqA4: 'FreeTokenBox 持续收录 DeepSeek、OpenRouter、Google Gemini、Groq、Cloudflare Workers AI、Mistral 等平台的免费活动，可在首页浏览全部条目。',

    // 面包屑 / 页脚 / 其他
    crumbHome: '首页',
    footerNote: '条目信息仅供参考，领取以官方页面为准',
    notFoundTitle: '404 · FreeTokenBox',
    notFoundDesc: '页面不存在',
    notFoundBody: '页面不存在或已下线。',
    backHome: '返回首页',

    // 列表页标题（分类/标签）
    categoryTitle: (c) => `${categoryLabel(c, 'zh')}免费额度与试用`,
    categoryDesc: (c, n) => `比较 ${n} 个${categoryLabel(c, 'zh')}资源的免费额度、重置周期、网页或 API 入口，以及下载和商用限制。每项附核查日期与官方来源。`,
    tagTitle: (t) => `#${t} 标签 · 免费 Token`,
    tagDesc: (t, n) => `带有标签 #${t} 的免费送 Token 条目，共收录 ${n} 个相关免费 AI Token / API 活动。`,
  },

  en: {
    code: 'en',
    htmlLang: 'en',
    locale: 'en_US',
    altLocale: 'zh_CN',

    navSearch: 'Search free tokens',
    navHome: 'Home',
    navAbout: 'About',
    navAdmin: 'Admin',
    switchLabel: '中文',

    h1: 'Free AI Resources: Text, Images, Audio, Video & 3D',
    bannerKicker: 'CURATED · FREE AI TOKENS',
    lede: 'A hand-checked directory of AI tokens, API credits and compute being given away for free. Every claim link points to the official page.',
    bannerStats: (s) => `${s.total} offers · ${s.categories} categories · ${s.featured} featured`,
    modelWallLabel: 'Covering mainstream LLMs',
    free: 'Free',
    expired: 'Ended',
    expiresIn: (n) => `${n}d left`,
    carouselKicker: 'INDEPENDENT DIRECTORY · AI API TIERS & TRIALS',
    carouselTaglines: [
      'Check access terms for GPT-related resources', 'Check terms for Claude-related resources',
      'Review Gemini free-tier eligibility and data terms', 'Check the provider and price for DeepSeek access',
      'Review Qwen platform quotas and limits', 'Check terms for Kimi-related resources',
      'Review Grok platform access and pricing', 'Check terms for GLM-related resources',
      'Review MiniMax platform access and pricing', 'Check terms for Hunyuan-related resources',
      'Review MiMo platform access and pricing',
    ],
    slideStats: (n) => (n > 0 ? `${n} verified ${n === 1 ? 'resource' : 'resources'} in directory` : 'Explore model pricing & free-tier notes'),
    browseAll: 'Browse all offers',
    aboutLink: 'About',
    sidebarHot: 'Featured',
    sidebarLatest: 'Reviewed resources',
    sidebarCats: 'Categories',
    viewAll: 'View all',
    searchPlaceholder: 'Search platforms, models or keywords',
    searchBtn: 'Search',
    searchLabel: 'Search free tokens',
    hintStats: (s) => `${s.total} offers · ${s.categories} categories · ${s.featured} featured`,
    homeTitle: 'Free AI Credits: Image, Audio, Video, 3D & APIs · FreeTokenBox',
    homeDesc: 'Find free AI image, audio, music, video, 3D and API allowances. Compare web and API access, recurring credits, trials, downloads and commercial-use limits.',
    searchTitleFor: (q) => `Search "${q}" · FreeTokenBox`,
    searchDescFor: (q) => `Free token and API credit offers matching "${q}".`,

    all: 'All',
    featuredSec: 'Featured',
    countGe: (n) => `${n}`,
    allEntries: 'All offers',
    searchResults: 'Search results',
    countTiao: (n) => `${n} ${n === 1 ? 'offer' : 'offers'}`,
    pageOf: (p, t) => `Page ${p} of ${t}`,
    prev: 'Previous',
    next: 'Next',

    claim: 'Claim',
    view: 'View',
    flag: 'Featured',
    deadline: (d) => `Ends ${d}`,
    collectedAt: (d) => `Added ${d}`,

    goClaim: (p) => `Claim on ${p}`,
    providerFallback: 'the official site',
    back: 'Back to list',
    related: 'Related offers',
    tokenTitle: (n) => `${n} · Quotas & Terms · FreeTokenBox`,

    faqTitle: 'FAQ',
    faqQ1: (n) => `Is ${n} really free?`,
    faqA1: (n, p) => `Yes. ${n} is given away for free by ${p}. Claiming and using it costs nothing — see the official page for exact terms.`,
    faqQ2: 'How do I claim it?',
    faqA2: (p) => `Click the claim button above. It takes you to the offer page on ${p} — follow the instructions there.`,
    faqQ3: 'When does it end?',
    faqA3: (d) => `This offer ends on ${d}. Claim it early — it stops once the quota runs out.`,
    faqQ4: 'Any other free offers?',
    faqA4: 'FreeTokenBox keeps tracking free offers from DeepSeek, OpenRouter, Google Gemini, Groq, Cloudflare Workers AI, Mistral and more. Browse them all on the home page.',

    crumbHome: 'Home',
    footerNote: 'Offer details may change — always check the official page',
    notFoundTitle: '404 · FreeTokenBox',
    notFoundDesc: 'Page not found',
    notFoundBody: 'This page does not exist or has been removed.',
    backHome: 'Back to home',

    categoryTitle: (c) => `Free ${categoryLabel(c, 'en')} Credits & Trials`,
    categoryDesc: (c, n) => `Compare ${n} ${categoryLabel(c, 'en')} resources: free quotas, renewal, web or API access, download and commercial-use limits, with official sources.`,
    tagTitle: (t) => `#${t} · Free Tokens`,
    tagDesc: (t, n) => `Free token and API credit offers tagged #${t} — ${n} related free AI offers.`,
  },
}

/** 取语言字典（默认中文） */
export function T(lang) {
  return STR[lang] || STR.zh
}

/** 语言路径前缀：en 时给路径加 /en 前缀 */
export function lp(lang, path) {
  if (lang !== 'en') return path
  return '/en' + (path.startsWith('/') ? path : '/' + path)
}

/** 从请求路径判断语言 */
export function langFromPath(path) {
  return path === '/en' || path.startsWith('/en/') ? 'en' : 'zh'
}

const CATEGORY_LABELS = {
 'free-api': ['文本与开发 API', 'Text & Developer APIs'],
 'free-plan': ['算力与免费套餐', 'Compute & Free Plans'],
 image: ['图片生成', 'Image Generation'],
 audio: ['语音与音乐', 'Speech & Music'],
 video: ['视频生成', 'Video Generation'],
 '3d': ['3D 资产生成', '3D Asset Generation'],
}
export function categoryLabel(category, lang = 'zh') { return CATEGORY_LABELS[category]?.[lang === 'en' ? 1 : 0] || category }
