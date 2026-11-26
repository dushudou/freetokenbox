// AI Token 与免费额度估算器（/calculator 与 /en/calculator）
// 在浏览器内粗估文本 Token，并按用户填写的额度、定价测算用量。

import { html, raw } from 'hono/html'
import { layout } from './templates.js'
import { siteUrl } from './content.js'
import { lp } from './i18n.js'

export const CALCULATOR_UPDATED = '2026-11-26'

const CALC_CSS = `
.calc-hero { padding: 6px 0 22px; max-width: 820px; }
.calc-hero h1 { font-size: clamp(26px, 4vw, 38px); margin: 0 0 10px; line-height: 1.2; font-weight: 800; letter-spacing: -0.025em; }
.calc-hero p { margin: 0; color: var(--muted); font-size: 16px; line-height: 1.75; }
.calc-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr); gap: 22px; align-items: start; margin: 24px 0 36px; }
.calc-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; box-shadow: var(--shadow-card); }
.calc-card h2 { margin: 0 0 14px; font-size: 18px; font-weight: 750; letter-spacing: -0.01em; }
.calc-presets { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
.calc-preset { font-size: 13px; padding: 6px 13px; border-radius: 999px; border: 1px solid var(--border-strong); background: var(--surface-2); color: var(--text); cursor: pointer; font-family: inherit; transition: all .15s ease; }
.calc-preset:hover, .calc-preset.active { background: var(--accent-soft); border-color: var(--accent); color: var(--accent-ink); font-weight: 600; }
.calc-fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.calc-fields label { font-size: 13px; color: var(--muted); font-weight: 500; gap: 6px; }
.calc-fields input, .calc-fields select { width: 100%; }
.calc-kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 18px; }
.calc-kpi { background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
.calc-kpi span { display: block; font-size: 12px; color: var(--muted); margin-bottom: 4px; }
.calc-kpi strong { font-size: 22px; font-family: var(--font-mono); color: var(--text); letter-spacing: -0.02em; }
.calc-kpi.hi { background: var(--accent-soft); border-color: var(--accent-border); }
.calc-kpi.hi strong { color: var(--accent-ink); }
.calc-text-box { width: 100%; min-height: 132px; font-family: var(--font-mono); font-size: 13.5px; line-height: 1.6; margin-top: 8px; }
.calc-live-stats { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 12px; font-size: 13px; color: var(--muted); font-family: var(--font-mono); }
.calc-live-stats b { color: var(--text); }
.calc-note { color: var(--muted); font-size: 13px; }
.calc-result { min-height: 1.5em; margin: 8px 0 16px; font-size: 14px; }
.calc-article { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 34px 36px; margin-top: 32px; box-shadow: var(--shadow-card); }
.calc-article h2 { font-size: 20px; margin: 26px 0 12px; font-weight: 750; }
.calc-article h2:first-child { margin-top: 0; }
.calc-article p, .calc-article li { color: var(--text); line-height: 1.8; }
@media (max-width: 860px) {
  .calc-grid { grid-template-columns: 1fr; }
  .calc-fields { grid-template-columns: 1fr; }
  .calc-article { padding: 24px 20px; }
}
`

const WORKLOADS = {
  chat: { sessions: 40, turns: 4, input: 600, growth: 400, output: 400, retry: 1.1 },
  coding: { sessions: 120, turns: 6, input: 3500, growth: 1000, output: 700, retry: 1.15 },
  rag: { sessions: 100, turns: 2, input: 4500, growth: 750, output: 500, retry: 1.1 },
  agent: { sessions: 30, turns: 10, input: 6000, growth: 1500, output: 1200, retry: 1.25 },
  batch: { sessions: 300, turns: 1, input: 1800, growth: 0, output: 350, retry: 1.1 },
}

export function calculateBudget({
  sessions, turns, input, growth, output, retry, days, inputPrice, outputPrice,
}) {
  const dailyRequests = sessions * turns * retry
  const averageInput = input + (turns - 1) * growth / 2
  const dailyInput = dailyRequests * averageInput
  const dailyOutput = dailyRequests * output
  const dailyTokens = dailyInput + dailyOutput
  const monthlyCost = inputPrice === null || outputPrice === null
    ? null
    : days * (dailyInput * inputPrice + dailyOutput * outputPrice) / 1_000_000

  return {
    dailyRequests, dailyInput, dailyOutput, dailyTokens,
    monthlyTokens: dailyTokens * days, monthlyCost,
  }
}

function calculatorScript(lang) {
  return `(function() {
    const workloads = ${JSON.stringify(WORKLOADS)};
    const calculateBudget = ${calculateBudget.toString()};
    const get = id => document.getElementById(id);
    const fields = Object.fromEntries(Object.keys(workloads.chat).map(key => [key, get(key)]));
    const optionalFields = ['inputPrice', 'outputPrice', 'requestCap', 'tokenCap'];
    const sample = get('cSample');
    const locale = ${JSON.stringify(lang === 'en' ? 'en-US' : 'zh-CN')};
    const isEn = locale === 'en-US';
    const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    const currency = new Intl.NumberFormat(locale, {
      style: 'currency', currency: 'USD', maximumFractionDigits: 4,
    });

    function read(field, fallback = null) {
      const number = field.valueAsNumber;
      if (!Number.isFinite(number) || !field.validity.valid) return fallback;
      return number;
    }

    function showQuota(id, usage, cap) {
      const result = get(id);
      if (cap === null) {
        result.textContent = isEn ? 'Enter a limit from your dashboard.' : '请填写控制台中的上限。';
        return;
      }
      const remaining = cap - usage;
      const amount = format.format(Math.abs(remaining));
      result.textContent = isEn
        ? (remaining < 0 ? 'Over by ' : 'Remaining ') + amount
        : (remaining < 0 ? '超出 ' : '剩余 ') + amount;
    }

    function updateWorkload() {
      const inputs = Object.fromEntries(
        Object.entries(fields).map(([key, field]) => [key, read(field)]),
      );
      const days = read(get('activeDays'));
      const invalid = Object.values(inputs).includes(null) || days === null;
      get('calcInputStatus').textContent = invalid
        ? (isEn ? 'Enter a value within the displayed range in each workload field.' : '请根据字段下方的范围说明填写用量参数。')
        : '';
      const result = invalid ? null : calculateBudget({
        ...inputs, days, inputPrice: read(get('inputPrice')), outputPrice: read(get('outputPrice')),
      });
      for (const [id, key] of Object.entries({
        kDayTok: 'dailyTokens', kMonTok: 'monthlyTokens', kDayReq: 'dailyRequests',
        kDayIn: 'dailyInput', kDayOut: 'dailyOutput',
      })) {
        get(id).textContent = result ? format.format(result[key]) : '–';
      }
      get('kCost').textContent = result?.monthlyCost == null ? '–' : currency.format(result.monthlyCost);
      if (result) {
        showQuota('requestResult', result.dailyRequests, read(get('requestCap')));
        showQuota('tokenResult', result.dailyTokens, read(get('tokenCap')));
      } else {
        get('requestResult').textContent = '–';
        get('tokenResult').textContent = '–';
      }
    }

    function estimateSample() {
      const chars = Array.from(sample.value).length;
      const cjk = (sample.value.match(/[\\u4e00-\\u9fff\\u3400-\\u4dbf\\u3000-\\u303f\\uff00-\\uffef]/g) || []).length;
      const symbols = (sample.value.match(/[{}\\[\\]()<>:;=+\\-*\\/\\x60"'_]/g) || []).length;
      const other = chars - cjk - symbols;
      return { chars, tokens: chars ? Math.max(1, Math.round(cjk + symbols * 0.55 + other * 0.25)) : 0 };
    }

    function updateSample() {
      const sample = estimateSample();
      get('sChars').textContent = format.format(sample.chars);
      get('sTok').textContent = format.format(sample.tokens);
      get('cApplySample').disabled = sample.tokens === 0;
    }

    document.querySelectorAll('.calc-preset').forEach(button => {
      button.addEventListener('click', () => {
        for (const [key, value] of Object.entries(workloads[button.dataset.preset])) {
          fields[key].value = value;
        }
        updateWorkload();
      });
    });
    for (const field of [...Object.values(fields), ...optionalFields.map(get), get('activeDays')]) {
      field.addEventListener('input', updateWorkload);
    }
    sample.addEventListener('input', updateSample);
    get('cApplySample').addEventListener('click', () => {
      fields.input.value = estimateSample().tokens;
      updateWorkload();
    });

    updateWorkload();
    updateSample();
  })();`
}

function renderCalculatorPage(lang, env) {
  const isEn = lang === 'en'
  const t = (zh, en) => isEn ? en : zh
  const path = '/calculator'
  const name = t('AI Token 用量与 API 额度计算器', 'AI Token Usage & API Quota Calculator')
  const description = t(
    '从多轮对话的上下文增长算出日/月 Token 用量，再用模型控制台里的额度与输入、输出单价核对预算。',
    'Estimate daily and monthly tokens from conversation growth, then compare usage with your model’s actual quota and prices.',
  )
  const numberField = (id, label, { min = 0, max, step = 1, value } = {}) => html`
    <label for="${id}">${label}
      <input id="${id}" type="number" min="${min}" step="${step}"
        ${max == null ? '' : html`max="${max}"`} value="${value ?? ''}" />
    </label>`
  const defaultValues = WORKLOADS.chat
  const body = html`
    <style>${raw(CALC_CSS)}</style>
    <section class="calc-hero">
      <h1>${name}</h1>
      <p>${description}</p>
    </section>

    <div class="calc-grid">
      <section class="calc-card" aria-labelledby="workload-h">
        <h2 id="workload-h">${t('模拟工作负载', 'Model your workload')}</h2>
        <div class="calc-presets" role="group" aria-label="${t('示例参数', 'Example workloads')}">
          ${Object.entries({
            chat: t('多轮问答', 'Chat'), coding: t('编程辅助', 'Coding'),
            rag: t('RAG 知识库', 'RAG'), agent: t('Agent', 'Agent'), batch: t('批量摘要', 'Batch'),
          }).map(([id, label]) => html`<button type="button" class="calc-preset" data-preset="${id}">${label}</button>`)}
        </div>
        <div class="calc-fields">
          ${numberField('sessions', t('每日任务 / 会话数', 'Sessions per day'), { max: 100_000, value: defaultValues.sessions })}
          ${numberField('turns', t('每次会话轮数', 'Turns per session'), { min: 1, max: 100, value: defaultValues.turns })}
          ${numberField('input', t('首轮输入 Token', 'First-turn input tokens'), { max: 1_000_000, value: defaultValues.input })}
          ${numberField('growth', t('后续每轮增加的输入 Token', 'Extra input tokens per successive turn'), { max: 1_000_000, value: defaultValues.growth })}
          ${numberField('output', t('每轮输出 Token', 'Output tokens per turn'), { max: 1_000_000, value: defaultValues.output })}
          ${numberField('retry', t('请求系数（1.1 = 多 10%）', 'Request multiplier (1.1 = 10% extra)'), { min: 1, max: 3, step: 0.01, value: defaultValues.retry })}
          ${numberField('activeDays', t('每月使用天数', 'Active days per month'), { min: 1, max: 31, value: 30 })}
        </div>
        <p class="calc-note">${t(
          '每日最多 100,000 次会话，每次 1–100 轮，单轮 Token 参数 0–1,000,000，请求系数 1–3，每月 1–31 天。后续增长包括随请求一同发送的新消息、历史回复和工具结果。用无状态单轮请求时，设为 1 轮。',
          'Use up to 100,000 sessions/day, 1–100 turns/session, 0–1,000,000 tokens per input, growth or output field, a 1–3 request multiplier and 1–31 active days. Include new messages, retained replies and tool results in growth. Use one turn for independent requests.',
        )}</p>
        <p id="calcInputStatus" class="calc-result" role="status"></p>
        <h2>${t('粗估一段提示词的 Token', 'Roughly estimate prompt tokens')}</h2>
        <label for="cSample">${t('用公开文本试算。文本在浏览器内计算。', 'Try a public text sample. Estimation runs in your browser.')}</label>
        <textarea id="cSample" class="calc-text-box" maxlength="100000">${t('请将下面的公开文档整理成三个要点。', 'Summarize the public documentation below in three bullet points.')}</textarea>
        <div class="calc-live-stats">
          <span>${t('字符数', 'Characters')} <b id="sChars">–</b></span>
          <span>${t('估算 Token', 'Estimated tokens')} <b id="sTok">–</b></span>
        </div>
        <p><button type="button" id="cApplySample" class="btn btn-sm btn-quiet">${t('填入首轮输入', 'Use as first-turn input')}</button></p>
      </section>

      <section class="calc-card" aria-labelledby="res-h">
        <h2 id="res-h">${t('用量与预算', 'Usage and budget')}</h2>
        <div class="calc-kpis">
          <div class="calc-kpi hi"><span>${t('每日 Token 合计', 'Total tokens per day')}</span><strong id="kDayTok">–</strong></div>
          <div class="calc-kpi"><span>${t('每月 Token 合计', 'Total tokens per month')}</span><strong id="kMonTok">–</strong></div>
          <div class="calc-kpi"><span>${t('每日输入 Token', 'Input tokens per day')}</span><strong id="kDayIn">–</strong></div>
          <div class="calc-kpi"><span>${t('每日输出 Token', 'Output tokens per day')}</span><strong id="kDayOut">–</strong></div>
          <div class="calc-kpi"><span>${t('每日请求数', 'Requests per day')}</span><strong id="kDayReq">–</strong></div>
          <div class="calc-kpi"><span>${t('预计月费（USD）', 'Estimated monthly cost (USD)')}</span><strong id="kCost">–</strong></div>
        </div>
        <div class="calc-fields">
          ${numberField('inputPrice', t('每百万输入 Token 单价（USD）', 'USD per million input tokens'), { step: 'any' })}
          ${numberField('outputPrice', t('每百万输出 Token 单价（USD）', 'USD per million output tokens'), { step: 'any' })}
        </div>
        <p class="calc-note">${t('填入两项单价后显示月费。支持填 0。月费按全部用量乘单价计算。', 'Enter both prices to see a monthly estimate. Zero is accepted. The formula applies your prices to all estimated usage.')}</p>
        <h2>${t('核对账号额度', 'Check your account limits')}</h2>
        <p class="calc-note">${t('从所选模型的控制台复制同一周期与计量口径的日上限。', 'Use daily limits from your model dashboard with the same units and counting rules.')}</p>
        ${numberField('requestCap', t('每日请求上限', 'Request limit per day'))}
        <p class="calc-result" id="requestResult" aria-live="polite"></p>
        ${numberField('tokenCap', t('每日输入与输出 Token 合计上限', 'Combined input and output token limit per day'))}
        <p class="calc-result" id="tokenResult" aria-live="polite"></p>
      </section>
    </div>

    <article class="calc-article">
      <h2>${t('复算一个多轮问答示例', 'Reproduce a multi-turn chat estimate')}</h2>
      <p>${t(
        '每天 40 次会话，每次 4 轮，首轮输入 600 Token，随历史每轮再增加 400 Token。四轮输入分别为 600、1,000、1,400、1,800，平均 1,200。以请求系数 1.10 计算，每日预计 176 次请求，输入 211,200 Token。每轮输出 400 时，每日再增加 70,400 输出 Token。按 30 个使用日，合计 8,448,000 Token。',
        'Start with 40 conversations per day, four turns each, 600 input tokens and 400 tokens added per successive turn. The four input sizes are 600, 1,000, 1,400 and 1,800, averaging 1,200. A 1.10 multiplier gives 176 expected requests and 211,200 input tokens per day. At 400 output tokens per request, add 70,400 output tokens per day. Over 30 active days, the total is 8,448,000 tokens.',
      )}</p>
      <p>${t(
        '拿一次真实会话的首轮和末轮输入用量，按轮数估算增长，再用模型返回的 usage 或官方计数接口校准。文本框只按字符类型粗估。缓存、阶梯价格、附件和推理 Token 请查模型的计费说明。',
        'Use the first and last input sizes from a real conversation to estimate per-turn growth. Check the model’s usage field or official counting endpoint for exact counts. The text box uses a character heuristic. Check model pricing for caching, tiered rates, attachments and reasoning tokens.',
      )}</p>

      <h2>${t('三种典型开发者场景的复算对照（30 天）', 'Three reproducible developer scenarios (30 active days)')}</h2>
      <p>${t(
        '下表直接对应上方预设按钮的参数，展示多轮上下文累积如何放大输入 Token。你可以点击上方预设按钮实时验证每一行结果：',
        'Each row below uses the exact defaults from the preset buttons above so you can verify how multi-turn history multiplies input token volume:',
      )}</p>
      <div class="table-scroll">
        <table class="list">
          <thead>
            <tr>
              <th>${t('场景预设', 'Scenario preset')}</th>
              <th>${t('会话 × 轮数 × 系数', 'Sessions × turns × mult')}</th>
              <th>${t('日请求数', 'Daily requests')}</th>
              <th>${t('日输入 / 日输出 Token', 'Daily input / output')}</th>
              <th>${t('30 天合计 Token', '30-day total tokens')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${t('多轮问答（Chat）', 'Multi-turn Chat')}</td>
              <td>40 × 4 × 1.10</td>
              <td>176</td>
              <td>211,200 / 70,400</td>
              <td>8,448,000</td>
            </tr>
            <tr>
              <td>${t('RAG 知识库（RAG）', 'RAG Knowledge Base')}</td>
              <td>100 × 2 × 1.10</td>
              <td>220</td>
              <td>1,072,500 / 110,000</td>
              <td>35,475,000</td>
            </tr>
            <tr>
              <td>${t('编程辅助（Coding）', 'IDE Coding Assistant')}</td>
              <td>120 × 6 × 1.15</td>
              <td>828</td>
              <td>4,968,000 / 579,600</td>
              <td>166,428,000</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="calc-note">${t(
        '观察重点：即使单轮输出都不大，编程辅助因上下文每轮递增 1,000 Token，输入占比接近 90%，往往会先触发每日 Token 上限（TPD）而非每日请求上限（RPD）。',
        'Key takeaway: even with modest output sizes, IDE coding grows by 1,000 tokens per turn, making input nearly 90% of total volume and typically exhausting daily token caps (TPD) before request caps (RPD).',
      )}</p>

      <h2>${t('在哪查模型额度', 'Where to check model limits')}</h2>
      <p>${t(
        '即使两项日预算都有余量，短时间内集中发送仍可能触及每分钟限制。只公布分钟额度、月额度或算力单位的平台，可以留空对应的日额度。Cloudflare Workers AI 应按模型费率查 Neurons。',
        'Bursts can hit per-minute limits even when daily capacity remains. Leave daily fields blank for quotas published by minute, month or compute unit. Check the model-specific Neuron rate for Cloudflare Workers AI.',
      )}</p>
      <ul>
        <li><a href="https://openrouter.ai/docs/api_reference/limits">OpenRouter Limits</a></li>
        <li><a href="https://ai.google.dev/gemini-api/docs/rate-limits">Gemini API Rate Limits</a></li>
        <li><a href="https://console.groq.com/docs/rate-limits">Groq Rate Limits</a></li>
        <li><a href="https://developers.cloudflare.com/workers-ai/platform/pricing/">Cloudflare Workers AI Pricing</a></li>
      </ul>
      <p><a href="${lp(lang, '/guides/token-pricing-and-context-math')}">${t('查看 Token 计费与上下文示例', 'Read the token pricing and context guide')}</a> ·
        <a href="${lp(lang, '/local')}">${t('按硬件比较本地模型', 'Compare local models by hardware')}</a></p>
    </article>

    <script id="quota-calculator-script">${raw(calculatorScript(lang))}</script>
  `
  return layout({
    title: name + ' · FreeTokenBox',
    description,
    path,
    env,
    lang,
    breadcrumbs: [{ name: t('首页', 'Home'), url: '/' }, { name }],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name,
      url: siteUrl(env) + lp(lang, path),
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      dateModified: CALCULATOR_UPDATED,
    },
    body,
  })
}

export function registerCalculator(app) {
  app.get('/calculator', (c) => c.html(renderCalculatorPage('zh', c.env)))
  app.get('/en/calculator', (c) => c.html(renderCalculatorPage('en', c.env)))
}
