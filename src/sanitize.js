// Sanitasi HTML catatan: hanya tag format word-like yang lolos.
// Quill menyimpan rata sebagai class ql-align-*, dipertahankan khusus itu;
// atribut lain dibuang. Gaya sebaris text-align juga diterima.
const ALLOWED = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote']);
const ALIGN = /^\s*text-align\s*:\s*(left|center|right|justify)\s*;?\s*$/i;
const QL_ALIGN = /^ql-align-(left|center|right|justify)$/;

export function sanitizeNoteHtml(src) {
    const doc = new DOMParser().parseFromString(String(src || ''), 'text/html');
    const walk = (node) => {
        for (const child of [...node.childNodes]) {
            if (child.nodeType === 3) continue;
            if (child.nodeType !== 1) {
                child.remove();
                continue;
            }
            const tag = child.tagName.toLowerCase();
            if (!ALLOWED.has(tag)) {
                walk(child);
                child.replaceWith(...child.childNodes);
                continue;
            }
            const align = child.getAttribute('style') || child.getAttribute('align') || '';
            const cls = child.getAttribute('class') || '';
            for (const attr of [...child.attributes]) child.removeAttribute(attr.name);
            const m = String(align).match(ALIGN) || String(`text-align:${align}`).match(ALIGN);
            if (m) {
                child.setAttribute('style', `text-align: ${m[1].toLowerCase()}`);
            } else if (QL_ALIGN.test(cls.trim())) {
                child.setAttribute('class', cls.trim());
            }
            walk(child);
        }
    };
    walk(doc.body);
    return doc.body.innerHTML;
}
