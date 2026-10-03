import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const root = new URL('../dist/', import.meta.url);
async function walk(path) {const out=[];for(const name of await readdir(path)){const file=join(path,name);if((await stat(file)).isDirectory())out.push(...await walk(file));else out.push(file);}return out;}
const files=await walk(root.pathname);const html=files.filter(f=>f.endsWith('.html'));let links=0;
for(const file of html){const text=await readFile(file,'utf8');assert.match(text,/<html lang="en"/);assert.match(text,/<title>[^<]+<\/title>/);assert.match(text,/name="description"/);assert.equal((text.match(/<h1(?:\s|>)/g)||[]).length,1,`${file}: exactly one h1`);assert.match(text,/id="main"/);assert.ok(!text.includes('<script'),`${file}: no client JavaScript expected`);for(const [,href] of text.matchAll(/(?:href|src)="([^"#]+)"/g)){if(href.startsWith('/')&&!href.startsWith('//')){const target=decodeURIComponent(href.split('#')[0].split('?')[0]);const local=join(root.pathname,target,target.endsWith('/')?'index.html':'');assert.ok(files.includes(local),`${file}: broken internal link ${href}`);links++;}}}
for(const route of ['index.html','about/index.html','now/index.html','projects/index.html','blog/index.html','emulation/index.html','transparency/index.html','404.html','rss.xml','sitemap-index.xml'])assert.ok(files.includes(join(root.pathname,route)),`Missing ${route}`);
const rss=await readFile(new URL('rss.xml',root),'utf8');assert.match(rss,/<item>/);assert.match(rss,/https:\/\/almo0aya\.online\/blog\/a-notebook-for-understanding\//);
console.log(`PASS: ${html.length} HTML pages; ${links} internal references; metadata, headings, RSS, sitemap, and zero client JavaScript.`);
