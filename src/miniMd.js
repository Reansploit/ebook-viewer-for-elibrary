// Render markdown mini untuk pratinjau catatan. Aman: HTML dias escape
// dulu, hanya sintaks seperlunya (tebal, miring, coret, kode, judul,
// daftar, kutip). Bukan parser penuh.
function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s) {
    return escapeHtml(s)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/~~([^~]+)~~/g, '<s>$1</s>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
}

export function renderMiniMd(src) {
    const lines = String(src || '').split('\n');
    let html = '';
    let inList = false;

    const closeList = () => {
        if (inList) {
            html += '</ul>';
            inList = false;
        }
    };

    for (const line of lines) {
        const h = line.match(/^(#{1,3})\s+(.*)/);
        const li = line.match(/^-\s+(.*)/);
        const quote = line.match(/^>\s?(.*)/);
        if (h) {
            closeList();
            const level = h[1].length;
            html += `<h${level + 2} class="md-h">${inline(h[2])}</h${level + 2}>`;
        } else if (li) {
            if (!inList) {
                html += '<ul class="md-ul">';
                inList = true;
            }
            html += `<li>${inline(li[1])}</li>`;
        } else if (quote) {
            closeList();
            html += `<blockquote class="md-quote">${inline(quote[1])}</blockquote>`;
        } else if (line.trim() === '') {
            closeList();
        } else {
            closeList();
            html += `<p class="md-p">${inline(line)}</p>`;
        }
    }
    closeList();
    return html;
}
