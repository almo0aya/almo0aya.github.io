import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const root = new URL('../dist/', import.meta.url);
async function walk(path) {const out=[];for(const name of await readdir(path)){const file=join(path,name);if((await stat(file)).isDirectory())out.push(...await walk(file));else out.push(file);}return out;}
const files=await walk(root.pathname);const html=files.filter(f=>f.endsWith('.html'));let links=0;
for(const file of html){const text=await readFile(file,'utf8');assert.match(text,/<html lang="en"/);assert.match(text,/<title>[^<]+<\/title>/);assert.match(text,/name="description"/);assert.equal((text.match(/<h1(?:\s|>)/g)||[]).length,1,`${file}: exactly one h1`);assert.match(text,/id="main"/);assert.equal((text.match(/<script\b/g)||[]).length,1,`${file}: one local name-effect script`);assert.ok(!/<script[^>]+src=["']https?:/.test(text),`${file}: no third-party script`);for(const [,href] of text.matchAll(/(?:href|src)="([^"#]+)"/g)){if(href.startsWith('/')&&!href.startsWith('//')){const target=decodeURIComponent(href.split('#')[0].split('?')[0]);const local=join(root.pathname,target,target.endsWith('/')?'index.html':'');assert.ok(files.includes(local),`${file}: broken internal link ${href}`);links++;}}}
for(const route of ['index.html','about/index.html','now/index.html','projects/index.html','blog/index.html','emulation/index.html','transparency/index.html','404.html','rss.xml','sitemap-index.xml'])assert.ok(files.includes(join(root.pathname,route)),`Missing ${route}`);
const rss=await readFile(new URL('rss.xml',root),'utf8');assert.match(rss,/<item>/);assert.match(rss,/https:\/\/almo0aya\.online\/blog\/a-notebook-for-understanding\//);
console.log(`PASS: ${html.length} HTML pages; ${links} internal references; metadata, headings, RSS, sitemap, and one local name-effect script.`);

// Every visible name must carry the zero highlight; metadata/URLs stay plain.
let brandedNames = 0;
for (const file of html) {
  const body = (await readFile(file, 'utf8')).split('<body>')[1].split('</body>')[0];
  const visible = body.replace(/<[^>]*>/g, '');
  const names = (visible.match(/almo0aya/g) || []).length;
  const zeroes = (body.match(/<span class="brand-zero"><span class="zero-real">0<\/span><span class="zero-art" aria-hidden="true"><\/span><\/span>/g) || []).length;
  assert.equal(zeroes, names, `${file}: every visible name has exactly one highlighted zero`);
  assert.ok(names >= 2, `${file}: header and footer names retained`);
  assert.match(body, /aria-label="almo0aya home"/);
  brandedNames += names;
}
assert.ok(!rss.includes('brand-zero'), 'RSS remains plain text');
console.log(`PASS: all ${brandedNames} visible name references have one decorated zero; accessible name and plain RSS retained.`);

// Reduced motion, clipping and static fallback are enforced independently of JS.
const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');
assert.match(css, /@media\(prefers-reduced-motion:reduce\),\(forced-colors:active\)/);
assert.match(css, /\.zero-art\{display:none!important\}/);
assert.match(css, /\.zero-real\{opacity:1!important\}/);
assert.match(css, /overflow:hidden;contain:paint/);
assert.ok(!css.includes('zero-counter') && !css.includes('zero-orbit'), 'Rejected effects removed');
assert.equal(brandedNames, 28, 'All existing name references remain covered');
console.log('PASS: static/reduced-motion fallback, clipped fixed slot, and no rejected effects.');
