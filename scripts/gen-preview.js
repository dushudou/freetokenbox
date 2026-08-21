// 生成静态预览文件到 preview/（复用 test-local 的内存 mock D1 + 种子数据）
// 运行: node scripts/gen-preview.js

import { writeFileSync } from 'node:fs'
import app from '../src/index.js'
import { env, run } from './test-local.js'

// 先跑一遍回归测试（同时完成种子导入）
await run()

const routes = [
  ['/', 'home.html'],
  ['/en', 'home-en.html'],
  ['/token/deepseek-v4-flash-api-free', 'detail.html'],
  ['/en/token/deepseek-v4-flash-api-free', 'detail-en.html'],
]

for (const [route, file] of routes) {
  const res = await app.request(route, {}, env)
  let htmlText = await res.text()
  // 本地预览文件在 preview/ 目录，把绝对路径 /banners/ 指回 ../public/banners/
  htmlText = htmlText.replace(/url\(['"]\/banners\//g, "url('../public/banners/")
                       .replace(/(["'])\/banners\//g, '$1../public/banners/')
  writeFileSync(new URL('../preview/' + file, import.meta.url), htmlText)
  console.log(`preview/${file} ← ${route} [${res.status}] ${htmlText.length} bytes`)
}
