import fs from 'node:fs'
const REVIEWS = JSON.parse(fs.readFileSync(new URL('../content/reviews.json', import.meta.url), 'utf8'))
const [snapshotPath, outputPath] = process.argv.slice(2)
if (!snapshotPath || !outputPath) throw Error('Usage: node scripts/prepare-content-update.mjs snapshot.json output.sql')
const {items} = JSON.parse(fs.readFileSync(snapshotPath,'utf8'))
const quote = v => v == null ? 'NULL' : "'" + String(v).replaceAll("'", "''") + "'"
const modified = new Date().toISOString().slice(0,19).replace('T',' ')
const updates=[],rollback=[]
for (const [slug,r] of Object.entries(REVIEWS)) {
 const old = items.find(t => t.slug === slug)
 if (!old) throw Error('No snapshot for '+slug)
 const fields = {name:r.name,description:r.description,content:r.content,is_featured:slug==='openrouter-free-models'||slug==='google-ai-studio-free'?1:0,updated_at:modified}
 const assignments = Object.entries(fields).map(([k,v]) => `${k} = ${quote(v)}`).join(', ')
 updates.push(`UPDATE tokens SET ${assignments} WHERE slug = ${quote(slug)} AND updated_at = ${quote(old.updated_at)};`)
 rollback.push(`UPDATE tokens SET ${Object.keys(fields).map(k => `${k} = ${quote(old[k])}`).join(', ')} WHERE slug = ${quote(slug)} AND updated_at = ${quote(modified)};`)
}
fs.writeFileSync(outputPath,updates.join('\n')+'\n')
fs.writeFileSync(outputPath+'.rollback.sql',rollback.join('\n')+'\n')
console.log(`Prepared ${updates.length} conditional updates; rollback alongside ${outputPath}. Expected modification time: ${modified}`)
