// Progressive enhancement: code remains readable/selectable without JavaScript.
export async function copyText(text, doc = document, nav = navigator) {
  try {
    if (nav.clipboard?.writeText) { await nav.clipboard.writeText(text); return true; }
  } catch { /* Fall back when clipboard permissions or secure context block access. */ }
  const focused = doc.activeElement;
  const selection = doc.getSelection();
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()) : [];
  const field = doc.createElement('textarea');
  field.value = text;
  field.className = 'clipboard-fallback';
  field.setAttribute('readonly', '');
  doc.body.append(field);
  field.select();
  let copied = false;
  try { copied = Boolean(doc.execCommand?.('copy')); } catch { /* Manual selection remains available. */ }
  finally {
    field.remove();
    focused?.focus({ preventScroll: true });
    if (selection) { selection.removeAllRanges(); ranges.forEach(range => selection.addRange(range)); }
  }
  return copied;
}
export function addCopyButtons(doc = document, nav = navigator) {
  doc.querySelectorAll('.article-body pre').forEach((pre, i) => {
    const code = pre.querySelector('code');
    if (!code || pre.parentElement?.classList.contains('code-block')) return;
    const wrap = doc.createElement('div'); wrap.className = 'code-block';
    pre.before(wrap); wrap.append(pre);
    const button = doc.createElement('button'); button.type = 'button'; button.className = 'copy-code';
    button.textContent = 'Copy code'; button.setAttribute('aria-label', `Copy code example ${i + 1}`);
    const status = doc.createElement('span'); status.className = 'copy-status'; status.setAttribute('role', 'status');
    wrap.prepend(button); wrap.append(status);
    let copying = false;
    button.addEventListener('click', async () => {
      if (copying) return;
      copying = true;
      button.setAttribute('aria-busy', 'true');
      status.textContent = '';
      try {
        const ok = await copyText(code.textContent || '', doc, nav);
        status.textContent = ok ? 'Code copied.' : 'Copy unavailable. Select the code and copy it manually.';
      } catch {
        status.textContent = 'Copy unavailable. Select the code and copy it manually.';
      } finally {
        copying = false;
        button.removeAttribute('aria-busy');
      }
    });
  });
}
