import assert from 'node:assert/strict';
import highlight from './rehype-brand.mjs';
const text = value => ({ type: 'text', value });
function apply(value, ancestors = []) {
  const node = text(value);
  const parents = new Map([node, ...ancestors].map((item, index) => [item, ancestors[index]]));
  let replacement;
  highlight.text(node, { parent: item => parents.get(item), replaceNode: (old, next) => { assert.equal(old, node); replacement = next; } });
  return replacement;
}
const flatten = nodes => nodes.map(n => n.value ?? flatten(n.children)).join('');
const value = '@almo0aya and almo0aya.online';
const replacement = apply(value, [{ tagName: 'a', properties: { href: 'https://github.com/almo0aya' } }]);
assert.equal(flatten(replacement), value);
assert.equal(replacement.filter(n => n.properties?.className.includes('brand-name')).length, 2);
for (const tagName of ['code', 'pre', 'script', 'style', 'textarea', 'svg', 'math']) {
  assert.equal(apply('almo0aya', [{ tagName: 'span' }, { tagName }]), undefined);
}
assert.equal(apply('almo7aya'), undefined);
assert.equal(apply('almo0aya', [{ tagName: 'span', properties: { className: ['brand-name'] } }]), undefined);
console.log('PASS: Markdown transformation preserves text and linked labels, skips code and existing decorations.');
