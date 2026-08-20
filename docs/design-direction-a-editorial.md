# FreeTokenBox · 视觉设计方案 A — Editorial / Magazine 编辑杂志风

> 交付对象：仅视觉设计（模板已生成 HTML，CSS 以 `:root` 自定义属性 + `@media (prefers-color-scheme: dark)` 内嵌于 `<head><style>`，现有变量名保持不变，仅换值 + 新增 3 个字体 token）。本方案不改变任何页面结构、语义标签或 AdSense 占位标记。

---

## 1. 设计理念（Design Concept）

**一句话品味：** FreeTokenBox 读起来像一份"印刷出来的免费算力名录"，而不是一个软件仪表盘——周日副刊的技术版，而非薅羊毛交易站。

具体而言：展示级标题用编辑衬线体（Newsreader，中文回退到思源宋体/宋体），正文与界面用中性系统无衬线体；页面由"墨线规则"（hairline rule）、大留白与唯一一个朱砂红强调色构成。没有任何卡片、阴影或圆角盒子——只有分割行的细线，与承担语义的墨色强调。克制、可信、安静地高级：与"大而响的交易列表"完全相反。

---

## 2. 色彩系统（Color System）

暖色"纸与墨"色板。唯一强调色：**朱砂红 Vermilion**（经典印刷强调红橙）。它读起来像"编辑/印刷"而非"成功绿"，且与拉丁衬线体和中文宋体的墨色都相配。克制使用：只出现在 CTA、价值数字、激活下划线、`#` 标签。

### Light（纸面）
| Token | Hex | 用途 |
|---|---|---|
| `--bg` | `#F7F4EE` | 页面纸色 |
| `--surface` | `#FFFEFA` | 卡片/广告位/浮层 |
| `--text` | `#211F1B` | 墨色、标题 |
| `--muted` | `#6E6960` | 次要文字 |
| `--faint` | `#A39D91` | 说明文字、幽灵数字 |
| `--border` | `#E4DED1` | 发丝线 |
| `--border-strong` | `#C9C1AF` | 较强规则线 |
| `--accent` | `#C2431F` | 主强调（朱砂） |
| `--accent-strong` | `#A83717` | hover / pressed |
| `--accent-ink` | `#8F2D10` | 浅底上的强调文字 |
| `--accent-soft` | `#F6E8E0` | 选中底色 |
| `--accent-border` | `#E8CDBC` | 柔和描边 |
| `--danger` | `#A33220` | 错误 |
| `--success` | `#2F6F4F` | "有效/已核验"圆点 |
| `--code-bg` | `#F0EBE1` | 行内代码底 |

### Dark（墨底，绝不纯黑/纯白）
| Token | Hex |
|---|---|
| `--bg` | `#16140F` |
| `--surface` | `#201D17` |
| `--text` | `#ECE6DA` |
| `--muted` | `#A8A196` |
| `--faint` | `#6F6A60` |
| `--border` | `#332F27` |
| `--border-strong` | `#4A4438` |
| `--accent` | `#E0653A` |
| `--accent-strong` | `#EA7A4F` |
| `--accent-ink` | `#F3A47F` |
| `--accent-soft` | `rgba(224,101,58,.12)` |
| `--accent-border` | `rgba(224,101,58,.35)` |
| `--danger` | `#E2664D` |
| `--success` | `#5E9A77` |
| `--code-bg` | `#2A261F` |

**编码方式：** 沿用现有变量名（`--bg … --code-bg`）与现有机制——`:root` 放浅色，`@media (prefers-color-scheme: dark){ :root {…} }` 覆盖。仅需换值。新增 3 个 token 到 `:root`（两主题一致）：`--rule-thick:3px`、`--font-display`、`--font-body`、`--font-mono`。favicon 的 `prefers-color-scheme` 内联 SVG 同样保留机制，品牌色换为 `#C2431F` / 深色 `#E0653A`。`<meta name="theme-color">` 更新为 `#F7F4EE` / `#16140F`。

---

## 3. 字体系统（Typography）

无需 CDN 也能上线（系统衬线 + 宋体回退仍成立）；但**一组 Google Font 会显著拉高质感**。在 `<head>` 加（`display=swap`，渲染安全）：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Noto+Serif+SC:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

字体栈：
```css
--font-display: "Newsreader", "Noto Serif SC", "Songti SC", "STSong", "SimSun", Georgia, "Times New Roman", serif;
--font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif;
--font-mono: "IBM Plex Mono", ui-monospace, "SF Mono", "Cascadia Mono", "Menlo", Consolas, monospace;
```

理由：Newsreader 专为新闻/杂志排版设计，支持光学尺寸（标题自动收紧）；Noto Serif SC 让中文标题获得同等的宋体气质；正文走系统无衬线体保证速度与 CJK 稳健。字体加载失败时，Georgia/宋体仍能扛住整体观感。

### 字号阶梯（rem，移动优先 clamp）
| 对象 | 规格 |
|---|---|
| 首页 Masthead h1 | `clamp(2.125rem, 6vw + .75rem, 4rem)` · display · w500 · lh `1.04` · ls `-0.015em` |
| 详情页 h1 | `clamp(1.75rem, 4.5vw + .5rem, 3rem)` · display · w500 · lh `1.08` · ls `-0.012em` |
| 区块标题 h2 | `clamp(1.375rem, 2.6vw + .4rem, 1.875rem)` · display · w600 · lh `1.15` |
| Kicker / 区块眉题 | `0.75rem` · mono · 大写 · ls `0.16em` · w500 |
| 条目标题 | `1.125rem` · display · w600 · lh `1.35` · ls `0` |
| 正文 | `1rem`（≥640px `1.0625rem`）· body · lh `1.75` · ls `0.005em` |
| Meta / 说明 | `0.8125rem` · body · muted · lh `1.5` |
| 数字/序号/极细文字 | `0.75–0.8125rem` · mono · ls `0.04em` |
| 按钮/链接 | `0.9375rem` · w600 · ls `0.02em` |

**规范：** display 衬线权重 ≤600（不用粗黑，显廉价）；标题不大写（CJK 大写无意义）；正文权重 ≤500；散文行长 `max-width: 68ch`（≈720px）。

---

## 4. 布局（Layout）

网格：`max-width: 1200px`，内边距 `24px`（移动）→ `48px`（≥1024px）。首页 12 列：主栏 `span 8`，侧栏 `span 4`，`gap: 48px`；侧栏用 `border-left: 1px solid var(--border)` 报纸栏线，而非盒子。

间距刻度（一组 token）：`--s1:4px --s2:8px --s3:12px --s4:16px --s5:24px --s6:32px --s7:48px --s8:64px --s9:96px`。区块间以 `--s8`(64px) 分隔 + 3px 墨线。

**首页：**
- **Masthead（替代现有卡片 banner）**：无边框无盒子，纯文字头版。顶部 kicker 行"ISSUE 12 · 免费额度合集第 12 期"；serif h1 大标题；lede（muted，`max-width:58ch`）；两个 CTA（查看合集 + 提交收录）；下方 3px 墨线（`var(--rule-thick)`）。≥1024px 时右侧可有 `position:sticky` 的迷你统计列（最后更新 / 总数 / 今日新增，mono），移动端收成一行说明。
- **分类导航**：masthead 墨线下方横排文字：`0.875rem` muted，分隔符 `/`；hover = 墨色文字 + 2px 朱砂下划线（scaleX 原点左）。移动端换行，`gap: 4px 20px`。
- **Featured「本期精选」**：首条渲染为"头版稿"——序号 `01`（mono `3rem` faint）、条目标题 `1.5rem` serif、两行 lede、claim 链接；其后为标准条目行。行间发丝线。
- **All-entries「全部收录」**：紧凑行（见 §5）。
- **侧栏**：widget 纵向堆叠 `gap: 48px`，无卡片（见 §5）。

**列表页（分类/标签/搜索）：** 面包屑 → serif 页 h1（如"分类 · Category: 图像生成"）→ mono 计数 → 标准条目行。主/侧 8/4 网格同上。结果头上下各一条发丝线。

**详情页：**
- 顶部面包屑（§5）。
- **标题区**：56px 站点 logo 置于标题行起始处（与 h1 基线对齐），`border-radius:8px` + 1px 边框；其后 kicker（`类别 · 2025-08-20` mono）；serif h1；meta 行（提供商 · 免费额度[accent mono] · `# 标签`[mono accent] · 更新日期 · 外链 icon）；随后 **Claim CTA**（§5）在正文流中，CTA 上下一整行 3px 墨线——这是整页的"签名时刻"。
- **正文**：单栏 `max-width:720px`；首段用 CSS `::first-letter` 首字下沉（display serif 3 行高、`--accent-ink`——纯 CSS，不改标记，SEO 无损）；图片 `border-radius:4px`，图注 `0.8125rem` faint。
- **FAQ**：上规则线列表、手风琴（§5）。
- **相关「相关收录」**：3 条紧凑行 + 发丝线。

**页脚：** 顶 3px 墨线；serif 品牌词标 + 一行双语 tagline；链接列（sans `0.875rem` muted，`gap:8px`）；极细版权与免责声明 `0.75rem` faint（含"额度可能变化"与 admin 链接）；装饰性超大水印 "FreeTokenBox"（serif、`color:var(--border)`、`user-select:none`、`aria-hidden`）——柔和、对 SEO 不可见。

---

## 5. 组件规格（Component Specs）

**条目行**（所有列表变体）— `display:flex; gap:16px; padding:20px 0; border-bottom:1px solid var(--border); align-items:flex-start`
- Logo：`40×40px`、`border-radius:8px`、`border:1px solid var(--border)`、`object-fit:cover`、`background:var(--surface)`、`flex:none`、`margin-top:2px`
- 序号（可选行内）：mono `0.8125rem` `color:var(--faint)` 宽 `32px` 右对齐、`aria-hidden`——账本序号
- 标题：`--font-display` `1.125rem/600` `color:var(--text)`；hover = 2px accent 下划线（scaleX 左）+ 墨色
- Meta 行：`0.8125rem` muted `gap:12px`；免费额度用 `--font-mono` + `--accent-ink`（深色下 `--accent`）
- 副行（仅头版稿）：单行截断描述 `0.875rem` faint
- **头版稿（Featured #01）**：logo 56px、标题 `1.5rem/600` serif、两行 lede、`查看详情 →` mono `0.8125rem` accent 下划线链接

**侧栏 widget** — 无盒子：`padding:0`；每个 = kicker（mono `0.75rem` 大写 ls `.16em`）+ `border-top:3px solid var(--text)`（报纸栏线）+ 内容行 `padding:12px 0; border-bottom:1px solid var(--border)`，标题坐在墨线上。热门行：mono 排名序号 faint + 标题 sans `0.9375rem` w600（两行截断）+ 提供商 muted。最新行：标题 + mono 日期 faint。分类 widget：两列文字列表，`# 图像生成 (12)`——`#` accent、计数 mono faint。

**Claim 按钮：**
- `.btn-claim`（主）：`background:var(--accent); color:#fff; border-radius:2px`（锐角=反圆润的签名）；`padding:14px 28px; font:600 .9375rem/1 var(--font-body); letter-spacing:.02em; display:inline-flex; align-items:center; gap:10px; border:1px solid var(--accent-strong)`；hover `background:var(--accent-strong); transform:translateY(1px)`；focus-visible 2px 描边 `var(--accent)`。内置 SVG 箭头/外链图标，无 emoji。移动端 `width:100%; justify-content:center`。
- `.btn-ghost`（次）：透明，`border:1px solid var(--border-strong)`，文字 `var(--text)`；hover `border-color:var(--text)`。

**分类"胶囊"→ 改为文字标签：** `#` mono accent + `0.8125rem` 文字，无底色无圆角。卡片与详情 meta 均用。管理后台若需填充标签：`padding:2px 10px; border:1px solid var(--border-strong); border-radius:999px; font-size:.75rem`。

**面包屑：** `0.8125rem` muted `gap:8px`，分隔 `‹`（SVG chevron）`color:var(--faint)`；当前页 `color:var(--text)` 非链接；hover 下划线。

**FAQ 手风琴：**
- 条目 `border-top:1px solid var(--border)`；问题行 `display:flex; justify-content:space-between; align-items:center; padding:16px 0`；问题 `--font-display 1.125rem/600`；开关为 20px SVG plus/× `color:var(--accent)`，展开时旋转 45°
- 答案 `padding:0 0 20px; max-width:68ch; .9375rem; line-height:1.7`；关闭态 `[hidden]`（a11y 与 SEO 均安全）
- 首条额外 `border-top:3px solid var(--text)`（区块开场）

**分页：** 文字链接 `gap:4px 20px` `0.875rem`；当前页 = `border-bottom:2px solid var(--accent)` 墨字，其余 muted hover→墨字；省略号 mono faint；prev/next `‹ 上一页 / 下一页 ›`。不做盒式页码。移动端隐藏中间数字（仅 prev/next + 当前页）。

**广告位 `.ad-slot`：**
- 明暗两态均：`background:var(--surface)`（非纸色，AdSense 需干净容器）、`border:1px dashed var(--border)`（克制的"预留"暗示）、`border-radius:4px`
- 高度：移动 `min-height:120px`；≥768px `250px`（矩形/半页）；通栏位 `280px`
- 标签：居中 mono `0.6875rem` `color:var(--faint)` `letter-spacing:.2em` 大写，文案"广告 · Advertisement"（浅灰底白字满足对比）
- 不自行 lazy-load；占位标记保持加载器已注入的 `<div class="ad-slot">` 原样

---

## 6. 签名细节（Signature Touches ×4，全部 SEO 安全、无 emoji）

1. **账本序号（Ledger index number）** — 每一条精选条目与每个区块标题带一枚大号 faint mono 序号（"01"、"02"…）：置于行内标题左侧，`font-size:2rem→3rem`、`color:var(--border-strong)`、`font-variant-numeric:tabular-nums`、`aria-hidden`。服务端循环计数即可生成，瞬间建立"期刊"感。
2. **发丝线规则系统（Hairline rule system）** — 全站视觉语法只有规则线、没有盒子：`1px` 发丝线分割列表行与列；`3px` 墨线（`--rule-thick`）开启 Masthead、区块、侧栏 widget、Claim CTA 区、页脚、首条 FAQ。容器圆角全部归零（仅 logo/按钮/图片保留 2–8px），全站零 `box-shadow`。
3. **编辑首字下沉（Editorial drop cap）** — 详情页正文首段：
```css
.detail-body > p:first-of-type::first-letter {
  font-family: var(--font-display); font-size: 3.2em; font-weight: 600;
  float: left; line-height: .85; padding: 0 .08em 0 0; color: var(--accent-ink);
}
```
   纯 CSS、无标记改动 → SEO 无损；仅作用于首段，绝不喧宾夺主。
4. **Kicker 眉题 + 慢下划线（Slow underline）** — 每个区块与详情页以 mono kicker 开场（"ISSUE 12 · 免费额度合集" / "免费 · FREE"）；任何下划线链接 hover 用 `transform:scaleX(0→1)`、`transform-origin:left`、`transition:transform .25s cubic-bezier(.4,0,.2,1)`——缓慢、印刷感、不弹跳。另加极淡纸纹（仅浅色）：`body { background-image: repeating-linear-gradient(0deg, rgba(0,0,0,.012) 0 1px, transparent 1px 3px); }`——整屏如纸张颗粒，肉眼几乎不可见；深色模式移除（墨底不加纹理）。

---

## 7. 深色模式与移动端（Dark Mode & Mobile）

**深色模式：** 暖墨底 `#16140F`，绝不纯黑/纯白；边框提亮至 `#332F27`；强调色提亮为 `#E0653A`（深底需提亮）。纸纹保留但首字下沉改 `--accent`（更亮）。广告位 `--surface` = `#201D17`。发丝线保持 1px。`theme-color` 更新为 `#F7F4EE` / `#16140F`。

**移动端（≤767px）：**
- 单列：主栏在前、侧栏在后（侧栏 `border-left:none`，顶部改 3px 墨线）；正文行宽保持 ~68ch，内边距降至 `20px`
- Masthead h1 clamp 至 ~34px；kicker 与统计收成一行
- 分类导航换行或横向滚动（`overflow-x:auto; scrollbar-width:none`）
- 条目行：保留 40px logo，`padding:16px 0`；头版稿 logo 48px
- Claim 按钮 `width:100%`
- 分页仅 `‹ 上一页` / `下一页 ›` + 当前页
- 手风琴不变；导航与分页点击区 ≥44px
