// Build an isolated copy with one extra post and a new tag. Never alters real content.
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const project = fileURLToPath(new URL('../', import.meta.url));
const temp = await mkdtemp(join(tmpdir(), 'notebook-growth-'));
const run = (cmd, args, extra = {}) => spawnSync(cmd, args, { cwd: temp, encoding: 'utf8', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', ...extra } });
try {
  for (const name of ['src', 'scripts', 'public', 'astro.config.mjs', 'package.json', 'tsconfig.json']) await cp(join(project, name), join(temp, name), { recursive: true });
  await symlink(join(project, 'node_modules'), join(temp, 'node_modules'), 'dir');
  await mkdir(join(temp, 'src/content/blog'), { recursive: true });
  await writeFile(join(temp, 'src/content/blog/growth-fixture.md'), `---\ntitle: Content growth fixture for almo0aya\ndescription: Regression-only article.\ndate: 2026-10-07\nupdated: 2026-10-07\ncorrections:\n  - date: 2026-10-07\n    note: Clarified the fixture.\ntags: [regression-only]\n---\n\nA new article by almo0aya.\n\n## Just one section\n\nA short post should not need a table of contents.\n`);
  const build = run(process.execPath, [join(project, 'node_modules/astro/bin/astro.mjs'), 'build']);
  assert.equal(build.status, 0, build.stdout + build.stderr);
  const check = run(process.execPath, [join(project, 'scripts/check-build.mjs')], { BUILD_DIR: join(temp, 'dist') });
  assert.equal(check.status, 0, check.stdout + check.stderr);
  const page = join(temp, 'dist/blog/growth-fixture/index.html');
  const html = await readFile(page, 'utf8');
  assert.ok(!html.includes('aria-label="On this page"'), 'Short article omits TOC');
  assert.match(html, /<h1>Content growth fixture for (?:<!--[^]*?-->)?\s*<span class="brand-name">/);
  assert.match(html, /Updated <time/); assert.match(html, /Clarified the fixture/);
  assert.match(await readFile(join(temp, 'dist/tags/regression-only/index.html'), 'utf8'), /Content growth fixture/);
  // Prove the coverage test still fails when one name loses its decoration.
  await writeFile(page, html.replace('<span class="brand-zero">', '<span class="uncovered-zero">'));
  const broken = run(process.execPath, [join(project, 'scripts/check-build.mjs')], { BUILD_DIR: join(temp, 'dist') });
  assert.notEqual(broken.status, 0, 'Broken per-page brand coverage must fail');
  assert.match(broken.stderr, /every visible name has exactly one highlighted zero/);
  console.log('PASS: new post/tag build passes without count changes; short TOC omitted; updated/correction metadata rendered; intentionally broken brand coverage fails.');
} finally { await rm(temp, { recursive: true, force: true }); }
