INSERT INTO tokens
  (name, slug, description, content, provider, url, category, tags, expiry_date, status, is_featured, sort_weight, created_at, updated_at)
VALUES ('豆包小豆邀请码怎么找？社区实时收录入口', 'doubao-xiaodou-invite-beta', '豆包旗下小豆开启邀请制公测，凭码可体验并获赠免费额度。社区入口汇总公开分享的码，是否有效以小豆 App 为准。', '## 免费体验需要什么
[豆包官方公告](https://www.sina.cn/news/detail/5368723595591761.html)于 2026 年 11 月 24 日公布小豆开启邀请制公测，凭邀请码可开启体验并获赠免费额度。具体额度、有效期和功能范围以 App 内显示为准。

## 怎么找邀请码
1. 打开[小豆邀请码社区收录页](https://zou-git0324.github.io/xiaodou-codes/)，按发布时间查看较新的公开分享。
2. 点开对应原帖核对来源，然后在小豆 App 内按提示尝试。社区的“可能可用”来自公开信息和状态推测，实际可能已被他人使用。
3. 需要下载时，从设备应用商店搜索「小豆 豆包旗下」。在 App 内提交登录信息和邀请码。社区页用于查找公开分享。

## 核查范围
FreeTokenBox 于 2026 年 11 月 25 日核对了公测公告和社区入口。社区网站由第三方维护，邀请码会被领取，当前可用性以实际验证为准。', '豆包小豆', 'https://zou-git0324.github.io/xiaodou-codes/', 'giveaways', '["xiaodou", "doubao", "invite-code", "free-trial"]', NULL, 'published', 1, 96, datetime('now'), datetime('now'))
ON CONFLICT(slug) DO NOTHING;
