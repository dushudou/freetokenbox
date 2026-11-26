import fs from 'node:fs'
import { MEDIA_RESOURCES } from '../src/media-resources.js'
const [snapshotPath, outputPath] = process.argv.slice(2)
if (!snapshotPath || !outputPath) throw Error('Usage: node scripts/prepare-media-update.mjs snapshot.json update.sql')
const snapshot = JSON.parse(fs.readFileSync(snapshotPath,'utf8'))
if (!Array.isArray(snapshot.items) || snapshot.items.length !== snapshot.total) throw Error('Snapshot must include every published record')
const quote = v => v == null ? 'NULL' : "'"+String(v).replaceAll("'","''")+"'"
const timestamp = new Date().toISOString().slice(0,19).replace('T',' ')
const sql=[],rollback=[],after=structuredClone(snapshot.items)
let inserted=0,updated=0
for (const r of MEDIA_RESOURCES) {
 const old = snapshot.items.find(t => t.slug === r.slug)
 const fields={name:r.name,description:r.description,content:r.content,provider:r.provider,url:r.url,category:r.category,tags:JSON.stringify(r.tags),expiry_date:r.expiry_date||null,status:'published',is_featured:0,sort_weight:r.sort_weight||70,updated_at:timestamp}
 if (old) {
  sql.push(`UPDATE tokens SET ${Object.entries(fields).map(([k,v])=>`${k}=${quote(v)}`).join(',')} WHERE slug=${quote(r.slug)} AND updated_at=${quote(old.updated_at)};`)
  rollback.push(`UPDATE tokens SET ${Object.keys(fields).map(k=>`${k}=${quote(k==='tags'?JSON.stringify(old.tags):old[k])}`).join(',')} WHERE slug=${quote(r.slug)} AND updated_at=${quote(timestamp)};`)
  Object.assign(after.find(t=>t.slug===r.slug),fields,{tags:r.tags});updated++
 } else {
  const record={slug:r.slug,...fields,created_at:timestamp}
  sql.push(`INSERT INTO tokens (${Object.keys(record).join(',')}) SELECT ${Object.values(record).map(quote).join(',')} WHERE NOT EXISTS (SELECT 1 FROM tokens WHERE slug=${quote(r.slug)});`)
  rollback.push(`DELETE FROM tokens WHERE slug=${quote(r.slug)} AND created_at=${quote(timestamp)} AND updated_at=${quote(timestamp)};`)
  after.push({...record,id:1000+inserted,tags:r.tags});inserted++
 }
}
fs.writeFileSync(outputPath,sql.join('\n')+'\n')
fs.writeFileSync(outputPath+'.rollback.sql',rollback.join('\n')+'\n')
fs.writeFileSync(outputPath+'.preview.json',JSON.stringify({items:after,total:after.length},null,2)+'\n')
console.log(JSON.stringify({inserted,updated,totalAfter:after.length,timestamp,rollback:outputPath+'.rollback.sql'}))
