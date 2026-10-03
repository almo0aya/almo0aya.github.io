// Build-time HAST decoration. Never change URLs, attributes, code, or RSS.
const excluded = new Set(['code', 'pre', 'script', 'style', 'textarea', 'svg', 'math']);
const text = value => ({ type: 'text', value });
const span = (className, children) => ({ type: 'element', tagName: 'span', properties: { className: [className] }, children });
export default {
  name: 'highlight-brand-zero',
  text(node, ctx) {
    if (!node.value.includes('almo0aya')) return;
    for (let parent = ctx.parent(node); parent; parent = ctx.parent(parent)) {
      if (excluded.has(parent.tagName) || parent.properties?.className?.includes('brand-name')) return;
    }
    ctx.replaceNode(node, node.value.split('almo0aya').flatMap((part, i) => i
      ? [span('brand-name', [text('almo'), span('brand-zero', [text('0')]), text('aya')]), text(part)]
      : [text(part)]));
  },
};
