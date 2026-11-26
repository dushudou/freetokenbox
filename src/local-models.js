// 本地离线免费 AI 模型选型器（/local 与 /en/local）
// 按电脑内存/显存与用途筛选开源权重模型，提供一键复制 Ollama 命令、硬件速查表、FAQ 与 GEO 机器接口（/local.md、/local.json）。

import { html, raw } from 'hono/html'
import { layout } from './templates.js'
import { siteUrl } from './content.js'
import { lp } from './i18n.js'

export const LOCAL_UPDATED = '2026-11-24'

export const HARDWARE_TIERS = [
  { id: 'all', gb: 999, zh: '全部配置', en: 'All hardware', hintZh: '显示全部 20 个模型', hintEn: 'Show all 20 models' },
  { id: '8', gb: 8, zh: '8 GB 内存 / 显存', en: '8 GB RAM / VRAM', hintZh: 'MacBook 8GB · RTX 3060/4060', hintEn: 'Mac 8GB · RTX 3060/4060' },
  { id: '16', gb: 16, zh: '16 GB 内存 / 显存', en: '16 GB RAM / VRAM', hintZh: 'Mac 16GB · RTX 4060 Ti 16G', hintEn: 'Mac 16GB · RTX 4060 Ti 16G' },
  { id: '24', gb: 24, zh: '24 GB 内存 / 显存', en: '24 GB RAM / VRAM', hintZh: 'Mac 24GB · RTX 3090 / 4090', hintEn: 'Mac 24GB · RTX 3090 / 4090' },
  { id: '32', gb: 32, zh: '32–48 GB 内存', en: '32–48 GB RAM', hintZh: 'Mac Studio 32–48G · RTX 5090', hintEn: 'Mac 32–48GB · RTX 5090' },
  { id: '64', gb: 64, zh: '64 GB+ 统一内存', en: '64 GB+ Unified', hintZh: 'Mac Studio 64–128G · 双卡', hintEn: 'Mac 64–128GB · Dual GPU' },
]

export const USE_CASES = [
  { id: 'all', zh: '全部用途', en: 'All tasks' },
  { id: 'chat', zh: '日常对话', en: 'General chat' },
  { id: 'code', zh: '编程代码', en: 'Coding' },
  { id: 'reason', zh: '深度推理', en: 'Reasoning' },
  { id: 'vision', zh: '视觉识图', en: 'Vision' },
  { id: 'light', zh: '极速轻量', en: 'Ultra-fast' },
]

// 均采用 Ollama 官方库验证过的标准标签（默认 4-bit Q4_K_M 量化）
export const LOCAL_MODELS = [
  {
    id: 'qwen2.5-coder-7b',
    name: 'Qwen 2.5 Coder 7B',
    provider: 'Alibaba Qwen',
    params: '7.6B',
    sizeGb: 4.7,
    minRamGb: 8,
    context: '32K',
    license: 'Apache 2.0',
    tasks: ['code', 'light'],
    cmd: 'ollama run qwen2.5-coder:7b',
    url: 'https://ollama.com/library/qwen2.5-coder',
    topPick: true,
    zh: '8GB 机器上表现最稳的本地代码补全与脚本生成模型，中英文注释理解好。',
    en: 'One of the strongest 8GB-class local coding models for IDE autocomplete, refactoring, and scripts.',
  },
  {
    id: 'gemma3-4b',
    name: 'Gemma 3 4B',
    provider: 'Google',
    params: '4.3B',
    sizeGb: 3.3,
    minRamGb: 8,
    context: '128K',
    license: 'Gemma License',
    tasks: ['chat', 'vision', 'light'],
    cmd: 'ollama run gemma3:4b',
    url: 'https://ollama.com/library/gemma3',
    topPick: true,
    zh: '自带视觉识图能力且支持 128K 上下文，轻薄本也能流畅离线看图与总结。',
    en: 'Native multimodal vision with a 128K context window that runs smoothly on 8GB laptops.',
  },
  {
    id: 'deepseek-r1-8b',
    name: 'DeepSeek-R1 8B',
    provider: 'DeepSeek',
    params: '8B',
    sizeGb: 4.9,
    minRamGb: 8,
    context: '128K',
    license: 'MIT',
    tasks: ['reason', 'chat'],
    cmd: 'ollama run deepseek-r1:8b',
    url: 'https://ollama.com/library/deepseek-r1',
    topPick: true,
    zh: 'MIT 开源蒸馏推理模型，8GB 内存即可离线体验带思维链（CoT）的分步推导。',
    en: 'MIT-licensed distilled reasoning model bringing step-by-step chain-of-thought offline to 8GB machines.',
  },
  {
    id: 'qwen2.5-7b',
    name: 'Qwen 2.5 7B',
    provider: 'Alibaba Qwen',
    params: '7.6B',
    sizeGb: 4.7,
    minRamGb: 8,
    context: '32K',
    license: 'Apache 2.0',
    tasks: ['chat', 'light'],
    cmd: 'ollama run qwen2.5:7b',
    url: 'https://ollama.com/library/qwen2.5',
    zh: '8GB 档位综合中文能力与 JSON 结构化输出最均衡的通用模型。',
    en: 'Well-balanced 7B general assistant with strong multilingual and structured JSON output.',
  },
  {
    id: 'llama3.1-8b',
    name: 'Llama 3.1 8B',
    provider: 'Meta',
    params: '8B',
    sizeGb: 4.9,
    minRamGb: 8,
    context: '128K',
    license: 'Llama 3.1',
    tasks: ['chat', 'light'],
    cmd: 'ollama run llama3.1:8b',
    url: 'https://ollama.com/library/llama3.1',
    zh: '生态兼容度最高的 8B 基准模型，英文写作、工具调用与插件适配极佳。',
    en: 'Broadly supported 8B baseline with reliable English writing and native tool calling.',
  },
  {
    id: 'llama3.2-3b',
    name: 'Llama 3.2 3B',
    provider: 'Meta',
    params: '3.2B',
    sizeGb: 2.0,
    minRamGb: 8,
    context: '128K',
    license: 'Llama 3.2',
    tasks: ['chat', 'light'],
    cmd: 'ollama run llama3.2:3b',
    url: 'https://ollama.com/library/llama3.2',
    zh: '仅 2GB 体积，适合老款笔记本或后台常驻做摘要、分类与快速改写。',
    en: 'Compact 2GB download ideal for older laptops, instant summaries, and background classification.',
  },
  {
    id: 'qwen2.5-3b',
    name: 'Qwen 2.5 3B',
    provider: 'Alibaba Qwen',
    params: '3.1B',
    sizeGb: 1.9,
    minRamGb: 8,
    context: '32K',
    license: 'Qwen Research',
    tasks: ['chat', 'light'],
    cmd: 'ollama run qwen2.5:3b',
    url: 'https://ollama.com/library/qwen2.5',
    zh: '极速中文轻量模型，1.9GB 下载即可在普通 CPU 上流畅响应。',
    en: 'Fast 1.9GB multilingual model that stays responsive even on CPU-only notebooks.',
  },
  {
    id: 'phi4-mini',
    name: 'Phi-4 Mini (3.8B)',
    provider: 'Microsoft',
    params: '3.8B',
    sizeGb: 2.5,
    minRamGb: 8,
    context: '128K',
    license: 'MIT',
    tasks: ['reason', 'light'],
    cmd: 'ollama run phi4-mini',
    url: 'https://ollama.com/library/phi4-mini',
    zh: 'MIT 开源小钢炮，在 3.8B 体积内提供极强的逻辑、数学与函数调用能力。',
    en: 'MIT-licensed 3.8B dense model punching above its weight on math, logic, and function calling.',
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B v0.3',
    provider: 'Mistral AI',
    params: '7.2B',
    sizeGb: 4.1,
    minRamGb: 8,
    context: '32K',
    license: 'Apache 2.0',
    tasks: ['chat', 'light'],
    cmd: 'ollama run mistral:7b',
    url: 'https://ollama.com/library/mistral',
    zh: 'Apache 2.0 协议的经典轻量通用模型，英文指令跟随干脆、废话少。',
    en: 'Classic Apache 2.0 7B model valued for concise English prose and clean instruction following.',
  },
  {
    id: 'gemma3-12b',
    name: 'Gemma 3 12B',
    provider: 'Google',
    params: '12B',
    sizeGb: 8.1,
    minRamGb: 16,
    context: '128K',
    license: 'Gemma License',
    tasks: ['chat', 'vision'],
    cmd: 'ollama run gemma3:12b',
    url: 'https://ollama.com/library/gemma3',
    topPick: true,
    zh: '16GB Mac / 显卡的甜点级多模态模型，写作自然度与看图理解显著强于 4B。',
    en: 'Sweet-spot multimodal model for 16GB machines with crisp writing and strong vision accuracy.',
  },
  {
    id: 'qwen2.5-coder-14b',
    name: 'Qwen 2.5 Coder 14B',
    provider: 'Alibaba Qwen',
    params: '14.8B',
    sizeGb: 9.0,
    minRamGb: 16,
    context: '32K',
    license: 'Apache 2.0',
    tasks: ['code'],
    cmd: 'ollama run qwen2.5-coder:14b',
    url: 'https://ollama.com/library/qwen2.5-coder',
    topPick: true,
    zh: '16GB 内存开发者的首选本地编程主力，多文件重构与排错准确率大幅跃升。',
    en: 'Top-tier 16GB local coding workhorse with noticeably stronger multi-file debugging than 7B.',
  },
  {
    id: 'deepseek-r1-14b',
    name: 'DeepSeek-R1 14B',
    provider: 'DeepSeek',
    params: '14.8B',
    sizeGb: 9.0,
    minRamGb: 16,
    context: '128K',
    license: 'MIT',
    tasks: ['reason', 'code'],
    cmd: 'ollama run deepseek-r1:14b',
    url: 'https://ollama.com/library/deepseek-r1',
    topPick: true,
    zh: '16GB 档位综合推理性价比之王，基于 Qwen 14B 蒸馏，复杂逻辑与算法题表现扎实。',
    en: 'Standout 16GB reasoning model distilled on Qwen 14B for math, architecture, and hard bugs.',
  },
  {
    id: 'phi4-14b',
    name: 'Phi-4 14B',
    provider: 'Microsoft',
    params: '14.7B',
    sizeGb: 9.1,
    minRamGb: 16,
    context: '16K',
    license: 'MIT',
    tasks: ['reason', 'chat'],
    cmd: 'ollama run phi4:14b',
    url: 'https://ollama.com/library/phi4',
    zh: 'MIT 开源 14B 模型，在 STEM 问答、逻辑分析与严谨文本摘要方面表现突出。',
    en: 'MIT-licensed 14B dense model excelling at STEM reasoning and disciplined technical summaries.',
  },
  {
    id: 'qwen2.5-14b',
    name: 'Qwen 2.5 14B',
    provider: 'Alibaba Qwen',
    params: '14.8B',
    sizeGb: 9.0,
    minRamGb: 16,
    context: '32K',
    license: 'Apache 2.0',
    tasks: ['chat'],
    cmd: 'ollama run qwen2.5:14b',
    url: 'https://ollama.com/library/qwen2.5',
    zh: '16GB 内存下最省心的中英双语全能助手，文档翻译、总结和格式抽取都很稳。',
    en: 'Dependable 16GB bilingual generalist for translation, summarization, and structured extraction.',
  },
  {
    id: 'gemma3-27b',
    name: 'Gemma 3 27B',
    provider: 'Google',
    params: '27B',
    sizeGb: 17.0,
    minRamGb: 24,
    context: '128K',
    license: 'Gemma License',
    tasks: ['chat', 'vision'],
    cmd: 'ollama run gemma3:27b',
    url: 'https://ollama.com/library/gemma3',
    topPick: true,
    zh: '单卡 24GB 显存（3090/4090）或 32GB Mac 的旗舰多模态选择，长文与识图接近云端体验。',
    en: 'Flagship single-24GB GPU / 32GB Mac multimodal model with near-cloud writing and vision quality.',
  },
  {
    id: 'qwen2.5-coder-32b',
    name: 'Qwen 2.5 Coder 32B',
    provider: 'Alibaba Qwen',
    params: '32.8B',
    sizeGb: 20.0,
    minRamGb: 24,
    context: '32K',
    license: 'Apache 2.0',
    tasks: ['code'],
    cmd: 'ollama run qwen2.5-coder:32b',
    url: 'https://ollama.com/library/qwen2.5-coder',
    topPick: true,
    zh: '24–32GB 机器上最强的离线编程大模型之一，可直接接入 Continue / Cline / Zed 本地开发。',
    en: 'Benchmark-leading 32B offline coding model ready for Continue, Cline, or Zed on 24–32GB rigs.',
  },
  {
    id: 'deepseek-r1-32b',
    name: 'DeepSeek-R1 32B',
    provider: 'DeepSeek',
    params: '32.8B',
    sizeGb: 20.0,
    minRamGb: 24,
    context: '128K',
    license: 'MIT',
    tasks: ['reason', 'code'],
    cmd: 'ollama run deepseek-r1:32b',
    url: 'https://ollama.com/library/deepseek-r1',
    topPick: true,
    zh: '32B 满血蒸馏版，在 24GB 显存或 32GB Mac 上即可跑出极高完成度的深度推理。',
    en: 'High-accuracy 32B reasoning model delivering deep analytical quality on 24GB VRAM or 32GB Macs.',
  },
  {
    id: 'qwen2.5-32b',
    name: 'Qwen 2.5 32B',
    provider: 'Alibaba Qwen',
    params: '32.8B',
    sizeGb: 20.0,
    minRamGb: 32,
    context: '32K',
    license: 'Apache 2.0',
    tasks: ['chat'],
    cmd: 'ollama run qwen2.5:32b',
    url: 'https://ollama.com/library/qwen2.5',
    zh: '32GB+ 统一内存下的高质量中文写作、知识库问答与 Agent 工具调用主力。',
    en: 'Strong 32B all-rounder for long-form drafting, local RAG, and reliable tool calling on 32GB+ systems.',
  },
  {
    id: 'llama3.3-70b',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    params: '70.6B',
    sizeGb: 43.0,
    minRamGb: 64,
    context: '128K',
    license: 'Llama 3.3',
    tasks: ['chat', 'code'],
    cmd: 'ollama run llama3.3:70b',
    url: 'https://ollama.com/library/llama3.3',
    topPick: true,
    zh: '64GB+ Mac Studio 的离线旗舰通用模型，英文与多语言综合质量接近商业 API。',
    en: 'Flagship 70B offline generalist for 64GB+ Mac Studios with commercial-grade instruction following.',
  },
  {
    id: 'deepseek-r1-70b',
    name: 'DeepSeek-R1 70B',
    provider: 'DeepSeek',
    params: '70.6B',
    sizeGb: 43.0,
    minRamGb: 64,
    context: '128K',
    license: 'MIT',
    tasks: ['reason', 'code'],
    cmd: 'ollama run deepseek-r1:70b',
    url: 'https://ollama.com/library/deepseek-r1',
    zh: '面向大内存工作站的本地深度推理天花板，适合科研、代码审计与私有长链思考。',
    en: 'Workstation-grade 70B local reasoning model suited for private code audits and research workflows.',
  },
]

const LOCAL_CSS = `
.lm-hero { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; margin-bottom: 22px; box-shadow: var(--shadow-card); }
.lm-kicker { display: inline-flex; align-items: center; gap: 8px; font: 600 12px/1 var(--font-mono); color: var(--accent-ink); background: var(--accent-soft); border: 1px solid var(--accent-border); padding: 6px 11px; border-radius: 999px; margin-bottom: 14px; }
.lm-hero h1 { margin: 0 0 10px; font-size: clamp(24px, 3.6vw, 36px); line-height: 1.2; letter-spacing: -0.02em; }
.lm-hero p { margin: 0; color: var(--muted); max-width: 68ch; font-size: 15.5px; }
.lm-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 20px; }
.lm-stat { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; }
.lm-stat b { display: block; font: 700 20px/1.2 var(--font-mono); color: var(--text); }
.lm-stat span { font-size: 12.5px; color: var(--muted); }

.lm-picker { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 22px; margin-bottom: 22px; }
.lm-step { display: flex; gap: 14px; align-items: flex-start; padding: 6px 0; }
.lm-step + .lm-step { border-top: 1px dashed var(--border-strong); margin-top: 14px; padding-top: 16px; }
.lm-num { flex: none; width: 26px; height: 26px; border-radius: 8px; background: var(--accent); color: var(--on-accent); font: 700 13px/1 var(--font-mono); display: grid; place-items: center; margin-top: 2px; }
.lm-step-body { flex: 1; min-width: 0; }
.lm-step h2 { margin: 0 0 10px; font-size: 15px; font-weight: 700; }
.lm-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.lm-chip { border: 1px solid var(--border-strong); background: var(--bg); color: var(--text); font: 500 13px/1.2 var(--font-sans); padding: 8px 13px; border-radius: 10px; cursor: pointer; text-align: left; transition: border-color .15s, background-color .15s, color .15s; }
.lm-chip small { display: block; font-size: 11px; color: var(--muted); margin-top: 2px; font-family: var(--font-mono); }
.lm-chip:hover { border-color: var(--accent); }
.lm-chip[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
.lm-chip[aria-pressed="true"] small { color: var(--on-accent); opacity: 0.88; }

.lm-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 18px; }
.lm-search { flex: 1; min-width: 200px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: 10px; padding: 9px 13px; font: 14px var(--font-sans); color: var(--text); }
.lm-search:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.lm-select { background: var(--surface); border: 1px solid var(--border-strong); border-radius: 10px; padding: 9px 12px; font: 500 13.5px var(--font-sans); color: var(--text); }
.lm-count { font: 500 13px var(--font-mono); color: var(--muted); margin-left: auto; }

.lm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr)); gap: 16px; margin-bottom: 34px; }
.lm-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 12px; transition: border-color .15s, transform .15s, box-shadow .15s; }
.lm-card:hover { border-color: var(--accent-border); transform: translateY(-2px); box-shadow: var(--shadow-card); }
.lm-card.top { border-color: var(--accent-border); }
.lm-card[hidden] { display: none; }
.lm-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.lm-head h3 { margin: 0; font-size: 16.5px; font-weight: 700; line-height: 1.3; }
.lm-by { font-size: 12.5px; color: var(--muted); margin-top: 2px; }
.lm-badge { font: 600 11px/1 var(--font-mono); padding: 4px 8px; border-radius: 999px; background: var(--accent-soft); color: var(--accent-ink); border: 1px solid var(--accent-border); white-space: nowrap; }
.lm-mets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.lm-met { background: var(--bg); border: 1px solid var(--border); border-radius: 9px; padding: 8px 10px; }
.lm-met span { display: block; font-size: 11px; color: var(--muted); }
.lm-met b { font: 600 14px/1.3 var(--font-mono); color: var(--text); }
.lm-desc { margin: 0; font-size: 14px; color: var(--muted); line-height: 1.6; flex: 1; }
.lm-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.lm-tag { font: 500 11px/1 var(--font-mono); padding: 4px 8px; border-radius: 6px; background: var(--surface-2); color: var(--muted); }
.lm-cmd { display: flex; align-items: center; background: var(--code-bg); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.lm-cmd code { flex: 1; padding: 9px 11px; font: 12.5px/1.3 var(--font-mono); color: var(--text); white-space: nowrap; overflow-x: auto; }
.lm-copy { flex: none; border: 0; border-left: 1px solid var(--border); background: transparent; padding: 9px 12px; font: 600 12px var(--font-sans); color: var(--accent-strong); cursor: pointer; }
.lm-copy:hover { background: var(--accent-soft); }
.lm-foot { display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; color: var(--muted); }
.lm-empty { display: none; text-align: center; padding: 42px 16px; color: var(--muted); background: var(--surface); border: 1px dashed var(--border-strong); border-radius: 14px; margin-bottom: 30px; }

.lm-sec { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 22px; }
.lm-sec h2 { margin: 0 0 14px; font-size: 20px; }
.lm-table-wrap { overflow-x: auto; }
.lm-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 560px; }
.lm-table th, .lm-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
.lm-table th { font-size: 12px; font-family: var(--font-mono); color: var(--muted); text-transform: uppercase; }
.lm-table code { font-family: var(--font-mono); font-size: 12.5px; background: var(--code-bg); padding: 2px 6px; border-radius: 6px; }
.lm-faq { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 14px; }
.lm-q { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
.lm-q h3 { margin: 0 0 8px; font-size: 15px; }
.lm-q p { margin: 0; font-size: 14px; color: var(--muted); line-height: 1.65; }

@media (max-width: 680px) {
  .lm-hero, .lm-picker, .lm-sec { padding: 18px; }
  .lm-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .lm-step { flex-direction: column; gap: 8px; }
  .lm-count { margin-left: 0; width: 100%; }
}
`

const LOCAL_JS = `(function(){
  var ram='all', task='all', q='', sort='rec';
  var cards=[].slice.call(document.querySelectorAll('.lm-card'));
  var grid=document.getElementById('lmGrid');
  var empty=document.getElementById('lmEmpty');
  var count=document.getElementById('lmCount');
  var isEn=document.documentElement.lang==='en';

  function update(){
    var maxGb=ram==='all'?999:Number(ram);
    var visible=[];
    cards.forEach(function(c){
      var minGb=Number(c.dataset.ram);
      var tasks=(c.dataset.tasks||'').split(',');
      var hay=(c.dataset.search||'').toLowerCase();
      var okRam=minGb<=maxGb;
      var okTask=task==='all'||tasks.indexOf(task)!==-1;
      var okQ=!q||hay.indexOf(q)!==-1;
      var show=okRam&&okTask&&okQ;
      c.hidden=!show;
      if(show)visible.push(c);
    });
    visible.sort(function(a,b){
      if(sort==='size')return Number(a.dataset.size)-Number(b.dataset.size);
      if(sort==='ram')return Number(a.dataset.ram)-Number(b.dataset.ram)||Number(a.dataset.size)-Number(b.dataset.size);
      return Number(a.dataset.order)-Number(b.dataset.order);
    });
    visible.forEach(function(c){grid.appendChild(c);});
    if(count)count.textContent=isEn?(visible.length+' model'+(visible.length===1?'':'s')+' fit'):('匹配 '+visible.length+' 个模型');
    if(empty)empty.style.display=visible.length?'none':'block';
  }

  document.querySelectorAll('[data-ram-pick]').forEach(function(btn){
    btn.addEventListener('click',function(){
      ram=btn.dataset.ramPick;
      document.querySelectorAll('[data-ram-pick]').forEach(function(b){b.setAttribute('aria-pressed',String(b===btn));});
      update();
    });
  });
  document.querySelectorAll('[data-task-pick]').forEach(function(btn){
    btn.addEventListener('click',function(){
      task=btn.dataset.taskPick;
      document.querySelectorAll('[data-task-pick]').forEach(function(b){b.setAttribute('aria-pressed',String(b===btn));});
      update();
    });
  });
  var searchEl=document.getElementById('lmSearch');
  if(searchEl)searchEl.addEventListener('input',function(){q=searchEl.value.trim().toLowerCase();update();});
  var sortEl=document.getElementById('lmSort');
  if(sortEl)sortEl.addEventListener('change',function(){sort=sortEl.value;update();});

  document.querySelectorAll('[data-copy-cmd]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var cmd=btn.dataset.copyCmd||'';
      navigator.clipboard.writeText(cmd).then(function(){
        var prev=btn.textContent;
        btn.textContent=isEn?'Copied':'已复制';
        setTimeout(function(){btn.textContent=prev;},1500);
      });
    });
  });
  update();
})();`

const TASK_LABELS = {
  chat: ['日常对话', 'Chat'],
  code: ['编程代码', 'Coding'],
  reason: ['深度推理', 'Reasoning'],
  vision: ['视觉识图', 'Vision'],
  light: ['极速轻量', 'Fast'],
}

function faqList(lang) {
  if (lang === 'en') {
    return [
      {
        q: 'What is the best free local LLM for a 16GB Mac or RTX 4060 Ti 16GB?',
        a: 'For coding, Qwen 2.5 Coder 14B (9.0 GB) is a strong default. For step-by-step reasoning, pick DeepSeek-R1 14B (9.0 GB). For multimodal vision and writing, choose Gemma 3 12B (8.1 GB).',
      },
      {
        q: 'How much RAM or VRAM do Q4_K_M models actually need?',
        a: 'Plan for the download size plus 2–4 GB of headroom for the KV cache and your OS. A ~4.7 GB 7B/8B model fits comfortably in 8–16 GB RAM, while a ~20 GB 32B model fits on a 24 GB GPU or 32 GB Apple Silicon Mac.',
      },
      {
        q: 'Is running these models with Ollama really $0 and offline?',
        a: 'Yes. Once downloaded via `ollama run <model>`, inference runs 100% locally on your GPU or Apple Silicon unified memory with zero API fees, no rate limits, and no prompts leaving your machine.',
      },
      {
        q: 'When should I use cloud free API tiers instead of local models?',
        a: 'Use local models for privacy, unlimited offline runs, and IDE autocomplete. Switch to cloud free APIs on our home directory when you need frontier 200B+ models, video/3D generation, or your laptop is on battery.',
      },
    ]
  }
  return [
    {
      q: '16GB 内存的 Mac 或 16GB 显存显卡，最推荐跑哪个本地免费模型？',
      a: '写代码优先选 Qwen 2.5 Coder 14B（9.0 GB）；做数学与复杂推理选 DeepSeek-R1 14B（9.0 GB）；需要看图和日常写作选 Gemma 3 12B（8.1 GB）。',
    },
    {
      q: '4-bit（Q4_K_M）量化模型实际需要多少内存/显存？',
      a: '建议按「模型下载体积 + 2~4 GB 系统与上下文缓存余量」估算。约 4.7 GB 的 7B/8B 模型可在 8–16GB 设备流畅运行；约 20 GB 的 32B 模型适合 24GB 显存（3090/4090）或 32GB 以上 Mac。',
    },
    {
      q: '用 Ollama 本地运行真的完全免费、断网可用吗？',
      a: '是的。只需首次联网执行 `ollama run <模型名>` 下载权重，之后全部推理都在本机完成：$0 费用、无限次调用、无并发限流，提示词与代码不会上传到任何云端。',
    },
    {
      q: '什么时候该用云端免费 API，什么时候用本地模型？',
      a: '看重数据隐私、无限次调用或离线编程时优先跑本地模型；需要超大参数旗舰模型、图像/视频/3D 生成，或笔记本不想掉电发热时，可回到首页选用云端免费 API 额度。',
    },
  ]
}

export function localModelsMarkdown(base) {
  const rows = LOCAL_MODELS.map(
    (m) =>
      `| ${m.name} | ${m.params} | ${m.sizeGb} GB | ${m.minRamGb} GB | ${m.context} | ${m.license} | \`${m.cmd}\` |`
  )
  return [
    '# Free Local AI Models by Hardware (FreeTokenBox)',
    '',
    `> Curated offline open-weight LLMs matched to your RAM/VRAM (8GB, 16GB, 24GB, 32GB, 64GB+). Zero API fees, 100% local via Ollama. Updated ${LOCAL_UPDATED}.`,
    '',
    `- Interactive selector (EN): ${base}/en/local`,
    `- Interactive selector (ZH): ${base}/local`,
    `- JSON endpoint: ${base}/local.json`,
    '',
    '## Quick Hardware Matrix',
    '',
    '| Model | Params | Download (Q4) | Min RAM/VRAM | Context | License | Ollama Command |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
    '',
    '## Cloud Free APIs',
    '',
    `Need frontier models or media generation without local GPU load? Browse verified cloud free tiers at ${base}/`,
  ].join('\n')
}

export function registerLocalModels(app) {
  app.get('/local.md', (c) => {
    const base = siteUrl(c.env)
    return c.text(localModelsMarkdown(base), 200, { 'Content-Type': 'text/markdown; charset=utf-8' })
  })

  app.get('/local.json', (c) => {
    const base = siteUrl(c.env)
    return c.json({
      site: 'FreeTokenBox',
      url: `${base}/local`,
      enUrl: `${base}/en/local`,
      updated: LOCAL_UPDATED,
      total: LOCAL_MODELS.length,
      hardwareTiersGb: [8, 16, 24, 32, 64],
      models: LOCAL_MODELS,
    })
  })

  for (const lang of ['zh', 'en']) {
    app.get(lp(lang, '/local'), (c) => {
      const isEn = lang === 'en'
      const base = siteUrl(c.env)
      const faqs = faqList(lang)
      const title = isEn
        ? 'Free Local AI Models by Hardware (8GB–64GB RAM) · FreeTokenBox'
        : '免费本地离线 AI 模型选型（按 8GB–64GB 内存/显存匹配）· FreeTokenBox'
      const description = isEn
        ? 'Pick your Mac RAM or GPU VRAM (8GB, 16GB, 24GB, 32GB, 64GB+) and copy one Ollama command to run 20 verified open-weight LLMs offline for $0.'
        : '按你的 Mac 内存或显卡显存（8GB/16GB/24GB/32GB/64GB+）筛选 20 个主流开源大模型，一键复制 Ollama 命令，$0 离线本地运行。'

      const jsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          url: `${base}${lp(lang, '/local')}`,
          dateModified: LOCAL_UPDATED,
          inLanguage: isEn ? 'en-US' : 'zh-CN',
        },
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: isEn ? 'Free Local Open-Weight AI Models' : '免费本地开源 AI 模型目录',
          itemListElement: LOCAL_MODELS.map((m, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: m.name,
            url: m.url,
            description: isEn ? m.en : m.zh,
          })),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ]

      const body = html`
        <style>${raw(LOCAL_CSS)}</style>
        <section class="lm-hero">
          <div class="lm-kicker">${isEn ? 'LOCAL OFFLINE AI · $0 FOREVER · UPDATED ' + LOCAL_UPDATED : '本地离线免费模型 · $0 无限次 · 更新于 ' + LOCAL_UPDATED}</div>
          <h1>${isEn ? 'Run Free Local AI Models Matched to Your Hardware' : '按你的电脑配置，挑选 $0 免费本地离线 AI 模型'}</h1>
          <p>${isEn
            ? 'Cloud free APIs hit rate limits. Pick your RAM or GPU VRAM below, filter by coding, reasoning, or vision, and copy one Ollama command to run open-weight LLMs 100% offline.'
            : '云端免费 API 限流或需要绑卡？选出你的内存/显存大小与用途，一键复制 Ollama 启动命令，直接在本地免费、隐私、无限次运行开源大模型。'}</p>
          <div class="lm-stats">
            <div class="lm-stat"><b>${LOCAL_MODELS.length}</b><span>${isEn ? 'Verified open models' : '精选主流开源模型'}</span></div>
            <div class="lm-stat"><b>$0</b><span>${isEn ? 'API cost & zero limits' : '永久免费、无限次调用'}</span></div>
            <div class="lm-stat"><b>8–64GB</b><span>${isEn ? 'Hardware tiers covered' : '覆盖轻薄本到工作站'}</span></div>
            <div class="lm-stat"><b>100%</b><span>${isEn ? 'Offline & private' : '离线运行、隐私不出本机'}</span></div>
          </div>
        </section>

        <section class="lm-picker" aria-label="${isEn ? 'Hardware and task picker' : '硬件与用途筛选器'}">
          <div class="lm-step">
            <span class="lm-num">1</span>
            <div class="lm-step-body">
              <h2>${isEn ? 'Pick your computer memory (Mac Unified RAM or GPU VRAM)' : '选择你的电脑内存（Mac 统一内存 或 独立显卡显存）'}</h2>
              <div class="lm-chips">
                ${HARDWARE_TIERS.map((tier) => html`
                  <button type="button" class="lm-chip" data-ram-pick="${tier.id}" aria-pressed="${tier.id === 'all' ? 'true' : 'false'}">
                    ${isEn ? tier.en : tier.zh}
                    <small>${isEn ? tier.hintEn : tier.hintZh}</small>
                  </button>
                `)}
              </div>
            </div>
          </div>
          <div class="lm-step">
            <span class="lm-num">2</span>
            <div class="lm-step-body">
              <h2>${isEn ? 'What do you want to run?' : '选择你的主要用途'}</h2>
              <div class="lm-chips">
                ${USE_CASES.map((u) => html`
                  <button type="button" class="lm-chip" data-task-pick="${u.id}" aria-pressed="${u.id === 'all' ? 'true' : 'false'}">
                    ${isEn ? u.en : u.zh}
                  </button>
                `)}
              </div>
            </div>
          </div>
        </section>

        <div class="lm-bar">
          <input id="lmSearch" class="lm-search" type="search" placeholder="${isEn ? 'Filter by model name, provider, license (e.g. Qwen, DeepSeek, MIT)...' : '按模型名、厂商或协议筛选（如 Qwen、DeepSeek、MIT）...'}" aria-label="${isEn ? 'Filter models' : '筛选模型'}" />
          <select id="lmSort" class="lm-select" aria-label="${isEn ? 'Sort models' : '排序'}">
            <option value="rec">${isEn ? 'Sort: Recommended' : '排序：综合推荐'}</option>
            <option value="size">${isEn ? 'Sort: Smallest download' : '排序：体积从小到大'}</option>
            <option value="ram">${isEn ? 'Sort: Lowest RAM required' : '排序：内存要求从低到高'}</option>
          </select>
          <span id="lmCount" class="lm-count">${isEn ? `${LOCAL_MODELS.length} models fit` : `匹配 ${LOCAL_MODELS.length} 个模型`}</span>
        </div>

        <div id="lmGrid" class="lm-grid">
          ${LOCAL_MODELS.map((m, idx) => html`
            <article
              class="lm-card${m.topPick ? ' top' : ''}"
              data-order="${idx}"
              data-ram="${m.minRamGb}"
              data-size="${m.sizeGb}"
              data-tasks="${m.tasks.join(',')}"
              data-search="${`${m.name} ${m.provider} ${m.license} ${m.cmd} ${m.zh} ${m.en}`}"
            >
              <div class="lm-head">
                <div>
                  <h3>${m.name}</h3>
                  <div class="lm-by">${m.provider} · ${m.params} · ${m.license}</div>
                </div>
                ${m.topPick ? html`<span class="lm-badge">${isEn ? 'Top pick' : '主力推荐'}</span>` : ''}
              </div>
              <div class="lm-mets">
                <div class="lm-met"><span>${isEn ? 'Download' : '下载体积'}</span><b>${m.sizeGb} GB</b></div>
                <div class="lm-met"><span>${isEn ? 'Min RAM' : '最低内存'}</span><b>${m.minRamGb} GB+</b></div>
                <div class="lm-met"><span>${isEn ? 'Context' : '上下文'}</span><b>${m.context}</b></div>
              </div>
              <p class="lm-desc">${isEn ? m.en : m.zh}</p>
              <div class="lm-tags">
                ${m.tasks.map((tk) => html`<span class="lm-tag">${TASK_LABELS[tk]?.[isEn ? 1 : 0] || tk}</span>`)}
              </div>
              <div class="lm-cmd">
                <code>${m.cmd}</code>
                <button type="button" class="lm-copy" data-copy-cmd="${m.cmd}">${isEn ? 'Copy' : '复制'}</button>
              </div>
              <div class="lm-foot">
                <a href="${m.url}" target="_blank" rel="noopener noreferrer">${isEn ? 'Ollama library ↗' : 'Ollama 官方页 ↗'}</a>
                <span>Q4_K_M</span>
              </div>
            </article>
          `)}
        </div>
        <div id="lmEmpty" class="lm-empty">${isEn ? 'No models match this filter. Try raising the RAM tier or clearing the search.' : '当前条件暂无匹配模型，请调高内存档位或清空关键词。'}</div>

        <section class="lm-sec">
          <h2>${isEn ? 'Hardware-to-Model Quick Cheat Sheet' : '硬件配置速查表（直接抄作业）'}</h2>
          <div class="lm-table-wrap">
            <table class="lm-table">
              <thead>
                <tr>
                  <th>${isEn ? 'Hardware Tier' : '硬件档位'}</th>
                  <th>${isEn ? 'Best Coding' : '编程首选'}</th>
                  <th>${isEn ? 'Best Reasoning' : '推理首选'}</th>
                  <th>${isEn ? 'Best Vision / Chat' : '多模态 / 日常首选'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>8 GB</strong> (MacBook Air / RTX 4060)</td>
                  <td><code>qwen2.5-coder:7b</code></td>
                  <td><code>deepseek-r1:8b</code></td>
                  <td><code>gemma3:4b</code></td>
                </tr>
                <tr>
                  <td><strong>16 GB</strong> (MacBook Pro / RTX 4060 Ti 16G)</td>
                  <td><code>qwen2.5-coder:14b</code></td>
                  <td><code>deepseek-r1:14b</code></td>
                  <td><code>gemma3:12b</code></td>
                </tr>
                <tr>
                  <td><strong>24–32 GB</strong> (RTX 4090 / Mac 32GB)</td>
                  <td><code>qwen2.5-coder:32b</code></td>
                  <td><code>deepseek-r1:32b</code></td>
                  <td><code>gemma3:27b</code></td>
                </tr>
                <tr>
                  <td><strong>64 GB+</strong> (Mac Studio / Dual GPU)</td>
                  <td><code>qwen2.5-coder:32b</code></td>
                  <td><code>deepseek-r1:70b</code></td>
                  <td><code>llama3.3:70b</code></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style="margin:14px 0 0;font-size:13.5px;color:var(--muted);">
            ${isEn
              ? html`For AI agents &amp; scripts: <a href="/local.md">/local.md</a> · <a href="/local.json">/local.json</a>. Prefer cloud APIs without local GPU heat? <a href="${lp(lang, '/')}">Browse cloud free API tiers →</a>`
              : html`面向 AI Agent 与脚本调用：<a href="/local.md">/local.md</a> · <a href="/local.json">/local.json</a>。电脑不想发热？<a href="${lp(lang, '/')}">返回浏览云端免费 API 额度 →</a>`}
          </p>
        </section>

        <section class="lm-sec">
          <h2>${isEn ? 'Frequently Asked Questions' : '常见问题 (FAQ)'}</h2>
          <div class="lm-faq">
            ${faqs.map((f) => html`<div class="lm-q"><h3>${f.q}</h3><p>${f.a}</p></div>`)}
          </div>
        </section>
        <script>${raw(LOCAL_JS)}</script>
      `

      return c.html(
        layout({
          title,
          description,
          path: '/local',
          env: c.env,
          body,
          lang,
          jsonLd,
          breadcrumbs: [
            { name: isEn ? 'Home' : '首页', url: '/' },
            { name: isEn ? 'Local AI Models' : '本地免费模型', url: '/local' },
          ],
        })
      )
    })
  }
}
