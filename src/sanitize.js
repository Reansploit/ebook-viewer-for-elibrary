// Sanitasi HTML catatan: hanya tag format word-like yang lolos,
// semua atribut dibuang kecuali perataan teks yang aman.
const ALLOWED = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote']);
const ALIGN = /^\s*text-align\s*:\s*(left|center|right|justify)\s*;?\s*$/i;

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
            for (const attr of [...child.attributes]) child.removeAttribute(attr.name);
            const m = String(align).match(ALIGN) || String(`text-align:${align}`).match(ALIGN);
            if (m) child.setAttribute('style', `text-align: ${m[1].toLowerCase()}`);
            walk(child);
        }
    };
    walk(doc.body);
    return doc.body.innerHTML;
}
