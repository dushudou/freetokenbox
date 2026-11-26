import { html, raw } from 'hono/html'
import { layout } from './templates.js'
import { renderMarkdown, siteUrl } from './content.js'
import { GUIDES, CONTENT_DATE } from './guides.js'
import { REVIEWS } from './reviews.js'
import { lp } from './i18n.js'

const PAGES = {
  about: {
    zh: { title: '关于 FreeTokenBox', description: '了解 FreeTokenBox 的内容定位、编辑核查流程、独立非隶属声明与运营模式。', content: `FreeTokenBox 是一个独立维护的 AI 免费资源目录、开发者估算工具与工程实战手册站点，面向独立开发者、学生、技术团队与内容创作者。我们的核心目标，是在写作代码或绑定计费方式之前，帮助读者看清各 AI 平台免费层、限时试用与算力赠额的真实边界。

## 我们提供哪些原创内容与工具
- **已核查免费资源目录**：逐条拆分文本 API、图片、语音、音乐、视频与 3D 平台的免费层与试用规则，明确区分网页体验与开发者 API、每日/每月重置周期、下载水印与商用限制，并附官方来源与核查日期。
- **[AI Token 与额度估算器](/calculator)**：在浏览器本地运行的交互式工具，支持按多轮对话上下文增长测算日/月 Token 用量、请求数与预算，无需上传提示词。
- **[本地开源模型选型器](/local)**：按 8GB–64GB 内存或显存、以及编程/推理/视觉/轻量对话等任务，匹配可离线零限流运行的开源权重模型与 Ollama 启动命令。
- **[原创工程实战指南](/guides)**：覆盖免费 API 选型、首次调用、Token 计费数学、多平台 429 熔断路由、API Key 安全与零成本 RAG 架构，全部依据公开文档与工程实践编写。

## 独立性与商标非隶属声明
FreeTokenBox 是完全独立的第三方信息与工具站点，**与 OpenAI、Anthropic、Google、DeepSeek、阿里巴巴（Qwen）、Moonshot（Kimi）、xAI、智谱、MiniMax、腾讯混元、Cloudflare、Groq、Mistral、Cohere、Hugging Face 或目录中列出的任何厂商均无隶属、合作、代理或赞助关系**。页面中出现的公司名称、产品名、图标及商标均归各自权利人所有，仅用于客观识别与技术说明。本站不发放 API Key、不出售或共享第三方账号，也不提供代充值或代领取服务。

## 信息核查与质量卫生
本轮内容依据提供方官方定价表、开发者文档、服务条款与正式公告整理。页面标注的核查日期代表公开文档的检查时间，不代表本站已代表访客完成个人账户实测或保证特定地区资格。历史旧条目与规则已变更/退役的服务会被明确标记并与当前推荐隔离，不主动参与搜索引擎推广。

## 运营模式与广告原则
访问和使用本站全部指南与工具完全免费，不要求注册账号，也不以点击广告或推广链接作为阅读前提。本站接入 Google AdSense 用于覆盖域名与服务器维护成本，并严格将广告限定在原创正文与核心内容页面，不在搜索结果、分页列表、错误页、后台页或敏感聚合页面投放广告。

## 纠错与权利人联系
如果你发现平台定价、配额或链接发生变化，或作为品牌/版权权利人希望修改或移除相关标识与引用，请通过 [联系与内容纠错](/contact) 页面提供官方链接或权利说明。请勿在公开反馈中提交 API Key、支付卡号或包含个人隐私的截图。` },
    en: { title: 'About FreeTokenBox', description: 'Learn about FreeTokenBox’s independent mission, developer tools, verification standards, trademark notice and funding.', content: `FreeTokenBox is an independently maintained directory, developer utility suite and engineering handbook focused on free AI APIs, open-weight local models and usage budgeting. We help developers, students and creators understand exact free-tier limits, renewal cycles and commercial boundaries before writing integration code or enabling billing.

## What we build and publish
- **Documented free-tier directory**: Structured comparisons across text APIs, image, speech, music, video and 3D platforms that clearly separate web chat from developer APIs, recurring quotas from one-time trials, and watermark or licensing constraints.
- **[AI Token & Quota Calculator](/en/calculator)**: A browser-local calculator that models multi-turn context growth, daily/monthly token volume and budget math without sending prompts to any server.
- **[Local Open-Weight Model Picker](/en/local)**: Hardware-aware recommendations (8 GB to 64 GB RAM/VRAM) with copyable Ollama commands for zero-rate-limit offline workflows.
- **[Original Engineering Guides](/en/guides)**: Practical playbooks covering API selection, first calls, token pricing math, multi-provider 429 fallback routing, key security and zero-cost RAG architectures.

## Independence and trademark notice
FreeTokenBox is an independent third-party publication. **We are not affiliated with, endorsed by, sponsored by, or officially connected to OpenAI, Anthropic, Google, DeepSeek, Alibaba (Qwen), Moonshot, xAI, Zhipu, MiniMax, Tencent, Cloudflare, Groq, Mistral, Cohere, Hugging Face, or any other listed provider.** All product names, logos and trademarks belong to their respective owners and are used strictly for factual identification. We do not issue API keys, resell accounts, or redeem credits on anyone’s behalf.

## Verification and content hygiene
Reviewed entries cite public pricing pages, developer documentation and official announcements with explicit review dates. Checking documentation is not a guarantee of individual account or regional eligibility. Retired services and unverified archives are clearly labelled and separated from active recommendations.

## Funding and advertising policy
All guides and tools on FreeTokenBox are free to use without registration. We use Google AdSense to help cover hosting and maintenance costs, and restrict ads to substantive editorial pages—never on search results, paginated link lists, utility/error pages or unverified archives.

## Corrections and rights inquiries
To report quota changes or submit a copyright/trademark modification request, visit our [Contact and corrections](/en/contact) page with an official reference. Never submit API keys, payment credentials or private console screenshots.` },
  },
  'editorial-policy': {
    zh: { title: '内容核查与更正原则', description: '说明资料来源、核查状态、更新日期、过期活动及商业关系如何处理。', content: `本原则说明如何阅读 FreeTokenBox 的条目状态。目录不是免费额度的保证书；在调用或启用计费前，仍需核对自己的账户。
## 来源优先级
优先使用提供方的定价表、开发者文档、服务条款与正式公告。社区消息可作为查找线索，不能单独证明新用户一定获得赠额。登录后才能看到的配额不会被写成所有人的统一标准。
## 三种内容状态
- 已核查：已检查公开文档，页面给出核查日期、适用范围与来源。它不等于完成真实账户调用。
- 规则变更：已确认原免费说明过期、服务退役或适用条件改变，页面保留更正与迁移提示。
- 历史待复核：保留旧收录供查阅，不作为当前可领取资源推荐；不主动向搜索引擎提交该详情页。
## 如何判断“免费”
区分网页免费体验与 API 免费、开源权重与托管推理、长期免费层与限时试用、计算赠额与订阅附赠。标注支付验证、有效期、重置周期以及已知排除项。无法确认时明确写明，不使用“无限”“永久免费”替代证据。
## 日期与更新
核查日期表示公开资料的检查时间，文章修改日期表示本站内容变更时间。不会仅为了制造新鲜感每天刷新全部页面日期。收到具有官方依据的更正后，会重新核对相关条目；无法确认的内容保留不确定说明。
## 原创内容与推广
教程中的选型框架、排查顺序与工程建议由本站整理，不伪造实测或用户证言。商业链接应作披露；推广收益不能作为免费资格的证据。` },
    en: { title: 'Editorial and corrections policy', description: 'How we use sources, label review status, handle outdated offers and disclose commercial links.', content: `A directory listing is not a guarantee of free access. Check your own account before making calls or enabling billing.
## Sources
We prioritize official pricing, developer documentation, terms and announcements. Community posts are leads, not proof of universal eligibility. Account-only quotas are not published as universal limits.
## Status labels
Reviewed means public documentation was checked, not that a live account test occurred. Changed means a previous offer or service has changed. Historical entries await recheck, are excluded from current recommendations and are not actively submitted for indexing.
## What free means
We separate web chat from APIs, weights from hosted inference, recurring tiers from trials, and compute from subscription benefits. Unknown restrictions are not described as unlimited access.
## Dates and corrections
Review dates describe source checks; modification dates describe actual edits. We do not refresh every date daily. Submit an official reference when reporting a change.
## Original work and funding
Selection frameworks and troubleshooting guidance are our editorial explanations. We do not invent test results or testimonials. Affiliate revenue does not establish eligibility for free access.` },
  },
  contact: {
    zh: { title: '联系与内容纠错', description: '通过公开渠道报告失效链接、额度变化、内容错误以及版权/商标权利人通知。', content: `发现资源过期、描述矛盾、链接失效，或需要提出版权与商标更正请求时，可以在 [FreeTokenBox GitHub Issues](https://github.com/dushudou/freetokenbox/issues) 提交反馈。该入口需要 GitHub 账户，内容通常公开可见；如果不希望公开账户资料，请只提供公开文档链接。
## 怎样的反馈便于核查
1. 贴出本站出错页面的网址。
2. 说明哪项信息变化：免费资格、额度单位、到期日、模型可用性或入口地址。
3. 提供官方定价页、文档或公告链接，并附你看到变化的日期。
4. 如果只是某个账户不可用，请说明是账户层面的现象，不把它直接推断为所有用户的政策。
## 版权、商标与权利人通知（DMCA / 知识产权）
FreeTokenBox 尊重各方知识产权。页面中的厂商名称、标识及公开文档摘要均仅用于客观技术说明与索引，且注明官方来源。如果你是相关品牌、标识或受版权保护内容的权利人，认为本站某处展示需要修改署名、替换图标或移除引用，请在 GitHub Issues 标题中标注 **[Copyright / Trademark]**，并附上：
1. 涉及页面的完整 URL；
2. 权利归属或官方品牌规范说明链接；
3. 你希望执行的处理方式（更正表述、替换或移除）。
核实后我们将尽快处理并更新页面。
## 不要提交敏感信息
不要粘贴 API Key、Cookie、身份证件、支付卡号或带余额和个人信息的控制台截图。本站不需要你的登录凭据，也不会要求代登录领取额度。
## 处理方式
反馈用于核查和改进公开内容。项目没有承诺固定响应时限；在更正完成前，请以提供方当前官方说明和你的控制台为准。涉及广告隐私的问题也可以通过该入口提出，但不要公开个人身份信息。` },
    en: { title: 'Contact and corrections', description: 'Report changed quotas, broken links, factual errors and copyright or trademark takedown notices.', content: `Report changes or rights inquiries via [FreeTokenBox GitHub Issues](https://github.com/dushudou/freetokenbox/issues). A GitHub account is required and submissions are generally public. Share public references rather than private account details.
## Include useful evidence
Provide the affected page URL, the disputed field, an official documentation link and the date observed. Distinguish account-specific behavior from a platform-wide rule.
## Copyright, trademark and takedown notices (DMCA)
FreeTokenBox respects intellectual property rights. Third-party names, marks and factual summaries are used solely for identification and documentation with attribution. If you are a rights holder requesting an attribution update, logo adjustment or content removal, open an issue prefixed with **[Copyright / Trademark]** including:
1. The exact FreeTokenBox page URL;
2. Proof of authority or a link to official brand guidelines;
3. The specific change or removal requested.
Verified requests are handled promptly.
## Never send secrets
Do not submit keys, cookies, identity documents, payment details or private console screenshots. We do not need your credentials or offer to sign in and redeem credits for you.
## Handling
Reports support public content corrections. We do not promise a fixed response time. Until corrected, follow current provider documentation and your console. Privacy-related feedback can use the same channel without posting personal information.` },
  },
  privacy: {
    zh: { title: '隐私政策', description: 'FreeTokenBox 的访问数据、本地工具隐私、Google 广告 Cookie、欧盟地区用户选择与第三方资源说明。', content: `本页说明 FreeTokenBox 当前网站的数据处理、浏览器本地工具与第三方广告服务。更新日期：2026-11-26。
## 访问、搜索与零个人身份信息传递
浏览公开目录、指南与工具无需注册账户。网络请求会经过 Cloudflare，基础设施可能处理 IP 地址、请求时间、URL、设备或浏览器信息，用于传输、安全防护与故障排查。站内搜索词出现在 URL（\`?q=\`）中，可能进入浏览器历史与网络日志，请勿在搜索框中输入 API Key 或个人隐私；本站同时在所有站内搜索页、后台页及工具参数页禁用第三方广告脚本，不会向 Google 或其他广告供应商传递可供识别个人身份的信息（PII）。
## 浏览器本地工具（Token 计算器与本地模型筛选）
[AI Token 与额度计算器](/calculator) 以及 [本地开源模型选型器](/local) 的全部输入、筛选与估算均完全在你的浏览器本地 JavaScript 中完成。你在计算器文本框中粘贴的任何测试文本均不会上传至 FreeTokenBox 服务器，也不会发送给广告网络。
## Google AdSense 与广告 Cookie
本站接入了 Google AdSense 代码，仅在符合规范的原创内容页面加载；广告是否展示取决于审核与服务状态。Google 及其他第三方广告供应商可能根据你此前访问本站或其他网站的情况，使用 Cookie、网络信标、IP 地址或类似标识符提供、衡量广告并防止无效流量。
你可以随时通过以下官方入口了解并管理广告隐私选择：
- 阅读 [Google 如何使用合作伙伴网站或应用的数据](https://policies.google.com/technologies/partner-sites)；
- 在 [Google 广告设置（My Ad Center）](https://adssettings.google.com/) 管理或关闭个性化广告；
- 通过 [AboutAds](https://www.aboutads.info/choices/) 或欧盟地区 [YourOnlineChoices](https://www.youronlinechoices.eu/) 管理部分第三方供应商的个性化广告偏好。
选择非个性化广告时，仍可能使用必要 Cookie 或本地存储进行频次控制、汇总统计与反作弊。
## 欧洲经济区（EEA）、英国及瑞士访客说明
面向欧洲经济区、英国及瑞士访客时，本站遵循 Google《欧盟地区用户意见征求政策》。当你从适用地区访问支持广告的页面时，可通过页面展示的隐私意见征求横幅选择同意或管理广告与 Cookie 偏好，并可随时通过浏览器清除 Cookie 或广告设置撤回选择。
## 图片、外链与联盟链接
本站可能从 Google 网站图标服务（Favicon）加载第三方站点图标；该服务会接收完成图片请求所需的常规网络信息。点击外部平台链接后，目标网站适用其自身的隐私政策。若某页面启用联盟链接，本站会在页脚及区块内显著披露。
## 反馈与管理登录
公开纠错通过 GitHub Issues 进行，适用 GitHub 的隐私政策；请勿提交密钥或个人资料。后台管理员登录仅使用服务端签名的会话 Cookie，普通访客无需登录。
## 你的选择与政策更新
你可以通过浏览器设置管理、拦截或清除 Cookie，或通过本站 [联系与内容纠错](/contact) 页面咨询隐私事宜。本站会在数据处理方式变更时同步更新本页日期与条款。` },
    en: { title: 'Privacy policy', description: 'Visitor data, browser-local tools, Google advertising cookies, EEA/UK consent choices and external resources on FreeTokenBox.', content: `Updated November 26, 2026. This page describes data handling, browser-local utilities and third-party advertising on FreeTokenBox.
## Visits, search and no PII transmission
Public browsing requires no account or sign-in. Requests pass through Cloudflare, which may process IP addresses, timestamps, URLs and browser metadata for delivery, security and diagnostics. Search terms appear in URLs (\`?q=\`) and may enter browser history or request logs—never enter API keys or personal details. Google advertising scripts are disabled on search result pages, admin routes and utility pages so we do not pass personally identifiable information (PII) to advertising partners.
## Browser-local tools (Token Calculator & Local Model Picker)
All text estimation, workload math and hardware filtering on our [Token Calculator](/en/calculator) and [Local AI Model Picker](/en/local) run 100% locally in your browser. Sample text pasted into the calculator is never sent to FreeTokenBox servers or ad networks.
## Google AdSense and advertising cookies
Google AdSense code is installed only on eligible substantive content pages; display depends on review and service availability. Google and third-party ad vendors may use cookies, web beacons, IP addresses or similar identifiers to serve ads based on prior visits to this or other websites, measure performance and prevent invalid traffic.
You can review and manage your choices via official resources:
- Read [How Google uses information from sites or apps that use our services](https://policies.google.com/technologies/partner-sites);
- Manage ad personalization in [Google Ads Settings](https://adssettings.google.com/);
- Opt out of participating third-party vendors at [AboutAds](https://www.aboutads.info/choices/) or [YourOnlineChoices (EU)](https://www.youronlinechoices.eu/).
Choosing non-personalized ads may still involve cookies or local storage for frequency capping, aggregated reporting and fraud prevention.
## EEA, UK and Switzerland visitors (EU User Consent Policy)
For visitors in the EEA, UK and Switzerland, FreeTokenBox follows Google’s EU User Consent Policy. Where applicable, you can accept or manage consent preferences through the consent dialog presented on ad-supported pages and withdraw consent at any time by clearing site cookies or adjusting your ad settings.
## External assets and links
Google’s favicon service may receive standard request metadata to load provider icons. Outbound links are governed by each destination’s own privacy policy. When affiliate links are active, disclosures are shown clearly on the page and footer.
## Feedback and administration
Public reports via GitHub Issues follow GitHub’s privacy policy; never post credentials or personal documents. Admin authentication uses a signed session cookie; ordinary visitors do not need an account.
## Your choices and updates
Control cookies in your browser settings or reach us through the [Contact and corrections](/en/contact) page without posting personal information. This policy is updated whenever processing practices change.` },
  },
  terms: {
    zh: { title: '使用条款', description: '资源目录的使用范围、第三方商标声明、第三方服务责任、价格变化与内容更正说明。', content: `FreeTokenBox 提供公开资料整理、本地计算工具与开发者教程，不是所列平台的服务提供方，也不代发免费额度。更新日期：2026-11-26。
## 资源资格与费用
所列免费层、试用赠额、模型和价格可能改变。实际资格、地区、支付验证、使用限制与收费行为由提供方决定；在注册、启用计费或调用前，请阅读该平台当前条款。本站不保证每名访客都能领取或永久免费使用。
## 商标与第三方品牌声明
FreeTokenBox 为独立第三方资料站，与所列任何 AI 模型厂商或云平台无隶属、赞助或官方授权关系。本站出现的全部第三方名称、标识及商标均为各自权利人资产，仅用于识别相应文档与服务。权利人如需更正或移除，可按 [联系与内容纠错](/contact) 中的说明提交通知。
## 教程、计算工具与示例
教程示例与 [Token 估算器](/calculator) 的结果仅用于辅助理解计费与架构设计，需结合目标平台的真实计费说明与返回 usage 校验。请先用公开测试数据、小额度和有限请求验证，再用于生产。不要将 API Key 放进网页、公开仓库或反馈内容。
## 外部服务与商业关系
外链跳转后适用目标网站的条款和隐私政策。若部分链接启用联盟推广或页面展示广告，相关商业关系不构成对第三方可用性、输出质量或安全性的保证。
## 内容与更正
本站原创的整理、教程和说明供阅读参考。引用时请注明来源，不得冒充平台官方公告或删除限制条件后宣传。发现错误可通过联系页面提供官方证据；内容更新和纠正遵循核查原则。` },
    en: { title: 'Terms of use', description: 'Scope of the directory, trademark notice, changing provider terms, instructional examples and corrections.', content: `Updated November 26, 2026. FreeTokenBox organizes public information, browser-local utilities and developer guidance; we do not operate listed services or distribute their credits.
## Eligibility and cost
Offers, models and prices can change. Providers determine eligibility, regions, payment verification, limits and billing. Review current terms before registering, enabling billing or making calls. We do not guarantee universal eligibility or permanently free access.
## Trademarks and third-party brands
FreeTokenBox is an independent publication with no affiliation, sponsorship or endorsement from any listed AI vendor or cloud platform. All third-party names, logos and trademarks belong to their respective owners and are used strictly for factual identification. Rights holders may submit modification or removal requests via our [Contact and corrections](/en/contact) page.
## Examples and calculator outputs
Code examples and [Token Calculator](/en/calculator) estimates are educational planning aids and must be verified against current provider billing rules and live usage responses. Start with public test data and bounded requests before production. Never expose keys in browser code, public repositories or reports.
## External services
Destinations have their own terms and privacy policies. Advertising or affiliate disclosures never constitute an endorsement or guarantee of a third party’s availability, quality or security.
## Corrections
Credit original editorial material when quoting it, and do not present it as an official provider announcement or omit its restrictions. Report errors with an official reference through the contact page.` },
  },
}

export function registerEditorial(app) {
  for (const lang of ['zh', 'en']) {
    for (const [slug, values] of Object.entries(PAGES)) {
      const p = values[lang]
      app.get(lp(lang, `/${slug}`), c => c.html(layout({
        title: `${p.title} · FreeTokenBox`, description: p.description, path: `/${slug}`, env: c.env, lang,
        breadcrumbs: [{ name: lang === 'en' ? 'Home' : '首页', url: '/' }, { name: p.title }],
        body: html`<article class="article"><h1>${p.title}</h1><p class="meta">${CONTENT_DATE} · FreeTokenBox</p><div class="body">${raw(renderMarkdown(p.content))}</div></article>`,
      })))
    }
    app.get(lp(lang, '/guides'), c => c.html(layout({
      title: lang === 'en' ? 'AI Free Quota Guides & Engineering Playbooks · FreeTokenBox' : '免费 AI 资源使用指南与工程实战手册 · FreeTokenBox',
      description: lang === 'en' ? 'Practical engineering guides on free AI API selection, token billing math, Ollama local setup, 429 fallbacks, API key security and zero-cost RAG.' : '系统化的免费 AI API 实战指南：涵盖额度选型、Token 计费数学、本地 Ollama 部署、多平台熔断路由、API Key 安全与零成本 RAG 架构。', path: '/guides', env: c.env, lang,
      breadcrumbs: [{ name: lang === 'en' ? 'Home' : '首页', url: '/' }, { name: lang === 'en' ? 'Guides' : '使用指南' }],
      body: html`<section class="intro"><h1>${lang === 'en' ? 'AI Free-Tier Engineering Guides & Comparison' : '免费 AI 额度实战指南与平台条件对照'}</h1><p class="lede">${lang === 'en' ? `${GUIDES.length} original engineering playbooks updated through ${CONTENT_DATE}, paired with our browser-based Token Calculator and Local Model Hardware Picker.` : `共 ${GUIDES.length} 篇原创工程实战指南（持续更新至 ${CONTENT_DATE}），配合 Token 计算器与本地模型硬件选型工具，帮助你零成本跑通从原型到高可用架构的全流程。`}</p><p><a class="btn btn-sm" href="${lp(lang, '/calculator')}">${lang === 'en' ? 'Open Token Calculator' : '打开 Token 额度计算器'}</a> <a class="btn btn-sm btn-quiet" href="${lp(lang, '/local')}">${lang === 'en' ? 'Local AI Hardware Picker' : '本地模型硬件选型器'}</a></p></section>
      <section class="guide-cards">${GUIDES.map(g => html`<article><span class="g-date">${g.date || CONTENT_DATE}</span><h2><a href="${lp(lang, `/guides/${g.slug}`)}">${g[lang].title}</a></h2><p>${g[lang].description}</p></article>`)}</section>
      <section class="comparison"><h2>${lang === 'en' ? 'Reviewed resources comparison' : '已核查平台条件速查表'}</h2><div class="table-scroll"><table class="list"><thead><tr><th>${lang === 'en' ? 'Resource' : '资源'}</th><th>${lang === 'en' ? 'Checked' : '核查日期'}</th><th>${lang === 'en' ? 'Scope and limits' : '适用范围与限制'}</th></tr></thead><tbody>${Object.entries(REVIEWS).filter(([, r]) => r.status !== 'changed' && !r.noAds).map(([slug,r]) => html`<tr><td><a href="${lp(lang, `/token/${slug}`)}">${lang === 'en' ? r.en.name : r.name}</a></td><td>${r.checked}</td><td>${lang === 'en' ? r.en.description : r.description}</td></tr>`)}</tbody></table></div></section>`,
    })))
    for (const guide of GUIDES) {
      const p = guide[lang], path = `/guides/${guide.slug}`, gDate = guide.date || CONTENT_DATE
      app.get(lp(lang, path), c => c.html(layout({
        title: `${p.title} · FreeTokenBox`, description: p.description, path, env: c.env, lang, ogType: 'article',
        breadcrumbs: [{ name: lang === 'en' ? 'Home' : '首页', url: '/' }, { name: lang === 'en' ? 'Guides' : '使用指南', url: '/guides' }, { name: p.title }],
        jsonLd: { '@context':'https://schema.org','@type':'Article', headline:p.title, description:p.description, inLanguage:lang === 'en' ? 'en' : 'zh-CN', datePublished:gDate, dateModified:gDate, author:{'@type':'Organization',name:'FreeTokenBox',url:siteUrl(c.env)}, publisher:{'@type':'Organization',name:'FreeTokenBox',url:siteUrl(c.env)}, mainEntityOfPage:siteUrl(c.env)+lp(lang,path) },
        body: html`<article class="article"><h1>${p.title}</h1><p class="standfirst">${p.description}</p><p class="meta">${gDate} · FreeTokenBox Editorial · <a href="${lp(lang, '/editorial-policy')}">${lang === 'en' ? 'Review method' : '核查方法'}</a> · <a href="${lp(lang, '/calculator')}">${lang === 'en' ? 'Token Calculator' : 'Token 计算器'}</a></p><div class="body">${raw(renderMarkdown(p.content))}</div><nav class="related-guides"><p><strong>${lang === 'en' ? 'Continue reading' : '继续阅读其他指南'}</strong></p>${GUIDES.filter(g => g.slug !== guide.slug).slice(0, 5).map(g => html`<p><a href="${lp(lang, `/guides/${g.slug}`)}">${g[lang].title}</a></p>`)}<p><a href="${lp(lang, '/guides')}">${lang === 'en' ? 'View all guides and resource comparison' : '查看全部指南与平台条件对照表'}</a></p></nav></article>`,
      })))
    }
  }
}
