/**
 * Dependency-free static site builder for 1998X Projects.
 * A new projects/<category>/<slug>/project.json automatically produces:
 * - a public catalog entry and category count
 * - a project detail page
 * - downloadable research assets
 * - a sitemap entry
 *
 * Usage: BASE_PATH=/projects/ node scripts/build.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'site');
const out = path.join(root, 'dist');
const projectRoot = path.join(root, 'projects');
let base = process.env.BASE_PATH || '/projects/';
if (!(base === '/' || /^\/[a-zA-Z0-9/_-]+\/$/.test(base))) throw new Error(`Unsafe BASE_PATH: ${base}`);
const isSlug = s => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const exists = async p => { try { await fs.stat(p); return true; } catch { return false; } };
const normalize = s => s.replaceAll('__BASE_PATH__', base);
const xml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const cfg = JSON.parse(await fs.readFile(path.join(source,'config.json'),'utf8'));
const categories = cfg.categories;
const cats = new Set(categories.map(c=>c.id));
assert(cats.size===categories.length,'Duplicate category identifiers');
categories.forEach(c=>assert(isSlug(c.id),`Invalid category slug ${c.id}`));

const projects = [];
for (const category of categories) {
  const categoryDir = path.join(projectRoot, category.id);
  if (!(await exists(categoryDir))) continue;
  const entries = (await fs.readdir(categoryDir,{withFileTypes:true})).filter(e=>e.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name));
  for(const e of entries){
    const infoPath=path.join(categoryDir,e.name,'project.json');
    if(!(await exists(infoPath))) continue;
    const p=JSON.parse(await fs.readFile(infoPath,'utf8'));
    assert(isSlug(p.id)&&p.id===e.name, `Project id should match its folder: ${infoPath}`);
    assert(p.category===category.id && cats.has(p.category), `Invalid category in ${infoPath}`);
    assert(typeof p.title==='string'&&p.title.length>0 && typeof p.summary==='string' && p.summary.length>0,`Title and summary required: ${infoPath}`);
    assert(['planned','published','prototype','validating','launched'].includes(p.status),`Invalid status for ${p.id}`);
    assert(Number.isInteger(p.sourceCount)&&p.sourceCount>=0,`sourceCount must be a nonnegative integer: ${p.id}`);
    assert(Array.isArray(p.files)&&Array.isArray(p.findings)&&Array.isArray(p.tags)&&Array.isArray(p.sourceLinks),`Malformed arrays: ${p.id}`);
    if(p.status==='planned') assert(p.files.length===0&&p.sourceCount===0&&!p.publishedAt&&p.findings.length===0,`Planned project cannot claim published deliverables/evidence: ${p.id}`);
    if(p.status==='published') assert(p.files.length>0&&p.publishedAt&&p.sourceCount>0,`Published project needs dated deliverables and sources: ${p.id}`);
    for(const f of p.files){
      assert(typeof f.path==='string' && (f.path.startsWith(`projects/${p.category}/${p.id}/reports/`) || f.path.startsWith(`projects/${p.category}/${p.id}/design/`)) && !f.path.includes('..'),`Unsafe file path: ${p.id}`);
      assert(await exists(path.join(root,f.path)),`Missing research file: ${f.path}`);
    }
    for(const s of p.sourceLinks) assert(/^https:\/\//.test(s.url),`Source link must use HTTPS: ${p.id}`);
    projects.push(p);
  }
}
assert(new Set(projects.map(p=>p.id)).size === projects.length,'Project IDs must be unique');
projects.sort((a,b)=>(Number(!!b.featured)-Number(!!a.featured)) || (a.order||99)-(b.order||99) || a.id.localeCompare(b.id));

await fs.rm(out,{recursive:true,force:true});
await fs.mkdir(out,{recursive:true});
await fs.cp(path.join(source,'assets'),path.join(out,'assets'),{recursive:true});
const home=normalize(await fs.readFile(path.join(source,'index.html'),'utf8'));
const detailSource=normalize(await fs.readFile(path.join(source,'detail.html'),'utf8'));
await fs.writeFile(path.join(out,'index.html'),home);
await fs.writeFile(path.join(out,'404.html'),home);
await fs.writeFile(path.join(out,'robots.txt'),await fs.readFile(path.join(source,'robots.txt')));
await fs.writeFile(path.join(out,'.nojekyll'),'');
await fs.mkdir(path.join(out,'data'),{recursive:true});
await fs.writeFile(path.join(out,'data/catalog.json'),JSON.stringify({site:{brand:cfg.brand,name:cfg.name,tagline:cfg.tagline,description:cfg.description,repository:cfg.repository},generatedAt:new Date().toISOString(),categories,projects},null,2)+'\n');
for(const p of projects){
  const dest=path.join(out,'projects',p.category,p.id);
  await fs.mkdir(dest,{recursive:true});
  await fs.writeFile(path.join(dest,'index.html'),detailSource.replaceAll('__PROJECT_ID__',p.id));
  for (const publicDir of ['reports','design']) {
    const srcDir = path.join(projectRoot,p.category,p.id,publicDir);
    if (await exists(srcDir)) await fs.cp(srcDir,path.join(dest,publicDir),{recursive:true});
  }
}
const location='https://1998x-stack.github.io'+base;
const allUrls=[location,...projects.map(p=>location+`projects/${p.category}/${p.id}/`)];
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allUrls.map(u=>`  <url><loc>${xml(u)}</loc></url>`).join('\n')}\n</urlset>\n`;
await fs.writeFile(path.join(out,'sitemap.xml'),sitemap);

// Sanity checks on build output; fail CI rather than silently publishing broken links.
for(const p of projects){
  assert(await exists(path.join(out,'projects',p.category,p.id,'index.html')),`Missing dossier for ${p.id}`);
  for(const f of p.files) assert(await exists(path.join(out,f.path)),`File not deployed: ${f.path}`);
}
assert(home.includes(`${base}assets/app.js`),'Missing correct base-path asset URL');
assert(projects.some(p=>p.status==='published'),'Expected at least one published research project');
console.log(`Build verified: ${projects.length} projects / ${projects.filter(p=>p.status==='published').length} published / ${categories.length} categories / ${projects.reduce((n,p)=>n+p.sourceCount,0)} cited source entries`);
console.log(`Static output: ${out} (BASE_PATH=${base})`);
