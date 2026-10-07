import Slugger from 'github-slugger';
// Static anchors and scroll regions work even when JavaScript is disabled.
export default function readerMarkup() {
  const slugger = new Slugger();
  return {
    name: 'reader-markup',
    element: {
      filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'table'],
      visit(node, ctx) {
        if (/^h[1-6]$/.test(node.tagName)) {
          const title = ctx.textContent(node);
          const id = node.properties?.id || slugger.slug(title);
          ctx.setProperty(node, 'id', id);
          ctx.appendChild(node, { type: 'element', tagName: 'a', properties: { className: ['section-anchor'], href: `#${id}`, ariaLabel: `Link to section: ${title}` }, children: [] });
        } else if (node.tagName === 'pre') {
          ctx.setProperty(node, 'tabIndex', 0);
          ctx.setProperty(node, 'ariaLabel', 'Code example, scroll horizontally if needed');
        } else {
          ctx.wrapNode(node, { type: 'element', tagName: 'div', properties: { className: ['table-scroll'], tabIndex: 0, role: 'region', ariaLabel: 'Table, scroll horizontally if needed' }, children: [] });
        }
      },
    },
  };
}
