import { html } from 'hono/html'
import { layout } from './templates.js'
import { siteUrl } from './content.js'

export const XIAODOU_PATH = '/xiaodou-codes'
export const XIAODOU_LINKS_CHECKED = '2026-11-25'
export const XIAODOU_SOURCES = [
  {
    name: 'Zou-git0324 小豆邀请码抓码站',
    url: 'https://zou-git0324.github.io/xiaodou-codes/',
    description: '汇总公开分享，可按来源平台筛选，并点回原帖核对。',
  },
  {
    name: 'xiaodou-codes.grok.me',
    url: 'https://xiaodou-codes.grok.me/',
    description: '提供今日码池、按状态筛选及刷新，试过的码可在本机标记。',
  },
  {
    name: 'BetterOPC 小豆邀请码共享',
    url: 'https://betteropc.com/ai-products/invite-codes/xiaodou',
    description: '社区用户分享邀请码。需要登录查看，揭晓后会标记为已领取。',
  },
  {
    name: 'good1uck 小豆邀请码抓码站',
    url: 'https://good1uck.github.io/xiaodou-codes/',
    description: '汇总 X 公开分享，页面显示巡检时间。FreeTokenBox 的站内列表读取该项目的公开数据。',
  },
]
const title = '豆包小豆邀请码哪里找？实时列表与 4 个社区入口'
const description = '查看可复制的豆包小豆邀请码、来源更新时间和原帖，比较四个社区入口的刷新、筛选和登录条件。邀请码是否有效以小豆 App 为准。'
const FEED = 'https://raw.githubusercontent.com/good1uck/xiaodou-codes/main/codes.json'
const MAX_BYTES = 512 * 1024
const formatTime = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

async function readFeed() {
  const response = await fetch(FEED, {
    redirect: 'manual',
    signal: AbortSignal.timeout(5000),
    cf: { cacheTtlByStatus: { '200-299': 45, '400-599': 0 } },
  })
  if (!response.ok || !response.body) throw new Error('Feed response: ' + response.status)
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let data = ''
  let bytes = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    bytes += value.byteLength
    if (bytes > MAX_BYTES) {
      await reader.cancel()
      throw new Error('Feed exceeds size limit')
    }
    data += decoder.decode(value, { stream: true })
  }
  const feed = JSON.parse(data + decoder.decode())
  if (!Array.isArray(feed.codes)) throw new Error('Unknown feed format')

  const updated = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2} 北京时间$/.test(feed.lastUpdated)
    ? feed.lastUpdated
    : null
  const records = []
  for (const item of feed.codes) {
    if (item?.status !== 'maybe_available') continue
    if (!/^(?=[A-Z0-9]{6}$)(?=.*[A-Z])(?=.*\d)/.test(item.code)) continue
    if (!/^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}\/status\/\d+$/.test(item.postUrl)) continue
    const posted = Date.parse(item.postedAtUtc)
    if (!Number.isFinite(posted) || posted > Date.now()) continue
    records.push({ code: item.code, posted, source: item.postUrl })
  }
  records.sort((a, b) => b.posted - a.posted)
  const unique = new Map()
  for (const row of records) {
    if (!unique.has(row.code)) unique.set(row.code, row)
  }
  return { updated, rows: [...unique.values()].slice(0, 24) }
}

export function registerXiaodou(app) {
  app.get(XIAODOU_PATH, async c => {
    let feed
    try {
      feed = await readFeed()
    } catch (error) {
      console.warn('Xiaodou feed unavailable', error.message)
      feed = null
    }

    c.header('Cache-Control', feed ? 'public, max-age=45' : 'no-store')
    c.header('X-Robots-Tag', 'noindex, follow')
    return c.html(layout({
      title,
      description,
      noindex: true,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        url: siteUrl(c.env) + XIAODOU_PATH,
        name: title,
        description,
        inLanguage: 'zh-CN',
        dateModified: XIAODOU_LINKS_CHECKED,
        mainEntity: {
          '@type': 'ItemList',
          name: '4 个小豆邀请码社区入口',
          numberOfItems: XIAODOU_SOURCES.length,
          itemListElement: XIAODOU_SOURCES.map((source, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: { '@type': 'WebPage', ...source },
          })),
        },
      },
      path: XIAODOU_PATH,
      env: c.env,
      translated: false,
      body: html`
        <style>
          .invite-list { list-style:none; margin:18px 0; padding:0!important; }
          .invite-list li { display:flex; align-items:center; flex-wrap:wrap; gap:8px 14px; margin:0!important; padding:12px 0; border-bottom:1px solid var(--border); }
          .invite-list code { font-weight:700; letter-spacing:.09em; font-size:1.12rem!important; }
          .invite-list time { color:var(--muted); font-size:.85rem; margin-right:auto; }
          .invite-copy { padding:5px 12px; font:inherit; cursor:pointer; }
        </style>
        <article class="article">
          <p class="meta"><a href="/token/doubao-xiaodou-invite-beta">← 小豆公测与免费额度</a></p>
          <div class="headline"><div>
            <h1>豆包小豆邀请码</h1>
            <p class="standfirst">先看站内按发布时间排列的公开邀请码，也可以查看下方四个社区入口。有效性以小豆 App 验证为准。</p>
          </div></div>
          <div class="body">
            <p class="meta">${feed?.updated ? `来源更新于 ${feed.updated}` : '社区公开数据'}</p>
            ${feed?.rows.length ? html`
              <ul class="invite-list" id="invite-list">
                ${feed.rows.map(row => html`
                  <li>
                    <code>${row.code}</code>
                    <button type="button" class="invite-copy" data-code="${row.code}">复制</button>
                    <time datetime="${new Date(row.posted).toISOString()}">${formatTime.format(row.posted)}</time>
                    <a href="${row.source}" rel="nofollow noopener" target="_blank">查看原帖</a>
                  </li>
                `)}
              </ul>
              <p id="invite-copy-status" class="meta" role="status"></p>
              <script>
                document.getElementById('invite-list').addEventListener('click', async event => {
                  const button = event.target.closest('button[data-code]');
                  if (!button) return;
                  const status = document.getElementById('invite-copy-status');
                  try {
                    await navigator.clipboard.writeText(button.dataset.code);
                    status.textContent = '已复制 ' + button.dataset.code + '，请到小豆 App 内使用。';
                    button.textContent = '已复制';
                  } catch {
                    status.textContent = '请长按或选中邀请码后手动复制。';
                  }
                });
              </script>
            ` : html`<p>${feed ? '当前没有被来源标记为可能可用的公开邀请码。' : '社区数据暂未加载，请稍后刷新页面。'}</p>`}
            <section aria-labelledby="invite-sources">
              <h2 id="invite-sources">4 个小豆邀请码社区入口</h2>
              <p class="meta">入口核查日期 <time datetime="${XIAODOU_LINKS_CHECKED}">${XIAODOU_LINKS_CHECKED}</time></p>
              <ol>
                ${XIAODOU_SOURCES.map(source => html`
                  <li><a href="${source.url}" target="_blank" rel="noopener">${source.name}</a>。 ${source.description}</li>
                `)}
              </ol>
              <p>感谢社区开发者维护公开数据和共享入口。多个站点可能收录同一条公开分享。</p>
            </section>
            <section aria-labelledby="invite-faq">
              <h2 id="invite-faq">小豆邀请码常见问题</h2>
              <h3>为什么显示可能可用，输入后还是失败？</h3>
              <p>社区站根据帖子和反馈推测状态。邀请码可能已被领取或过期，结果以小豆 App 为准。可以查看发布时间和原帖，再试更新的分享。</p>
              <h3>没有邀请码，可以等开放吗？</h3>
              <p>可以关注豆包官方公告或小豆 App 的开放通知。开放时间以官方消息为准。</p>
            </section>
          </div>
        </article>`,
    }))
  })
}
