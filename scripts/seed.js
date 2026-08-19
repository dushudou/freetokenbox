#!/usr/bin/env node
// 通过站点 API 导入种子数据到远程/本地站点。
// 用法: API_KEY=sk-xxx API_BASE=https://<host> node scripts/seed.js
import { SEED_TOKENS } from '../src/content.js'

const API_KEY = process.env.API_KEY
const API_BASE = (process.env.API_BASE || 'http://localhost:8787').replace(/\/+$/, '')

if (!API_KEY) {
  console.error('请设置 API_KEY 环境变量（对应服务端 API_KEYS 中的 key）')
  process.exit(1)
}

let created = 0
let skipped = 0
for (const seed of SEED_TOKENS) {
  const res = await fetch(`${API_BASE}/api/tokens/${seed.slug}`, { headers: { 'Content-Type': 'application/json' } })
  if (res.status === 200) {
    console.log(`⏭ 已存在: ${seed.slug}`)
    skipped++
    continue
  }
  const r = await fetch(`${API_BASE}/api/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
    body: JSON.stringify(seed),
  })
  if (r.ok) {
    console.log(`✅ 新增: ${seed.slug} (${seed.name})`)
    created++
  } else {
    console.error(`❌ 失败: ${seed.slug} → ${r.status} ${await r.text()}`)
  }
}
console.log(`\n完成: 新增 ${created}，跳过 ${skipped}`)
