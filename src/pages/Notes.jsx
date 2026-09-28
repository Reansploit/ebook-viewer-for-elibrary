import { useEffect, useRef, useState } from 'react';
import { api, readerApi } from '../api.js';
import ViewerHeader from '../components/ViewerHeader.jsx';
import { sanitizeNoteHtml } from '../sanitize.js';
import { useSession } from '../session.jsx';

// Kertas ala word untuk naskah (mis. muhadhoroh): toolbar Tebal, Miring,
// Garis bawah, Judul, Rata kiri/tengah/kanan, Daftar, Bersihkan format.
// Simpan HTML tersanitasi; Cetak mengeluarkan kertasnya. Bisa terikat
// buku atau bebas.
const TOOLS = [
    { id: 'bold', label: 'Tebal', run: () => document.execCommand('bold') },
    { id: 'italic', label: 'Miring', run: () => document.execCommand('italic') },
    { id: 'underline', label: 'Garis bawah', run: () => document.execCommand('underline') },
    { id: 'h1', label: 'Judul', run: () => document.execCommand('formatBlock', false, 'h2') },
    { id: 'left', label: 'Kiri', run: () => document.execCommand('justifyLeft') },
    { id: 'center', label: 'Tengah', run: () => document.execCommand('justifyCenter') },
    { id: 'right', label: 'Kanan', run: () => document.execCommand('justifyRight') },
    { id: 'justify', label: 'Rata', run: () => document.execCommand('justifyFull') },
    { id: 'ul', label: 'Daftar', run: () => document.execCommand('insertUnorderedList') },
    { id: 'ol', label: 'Nomor', run: () => document.execCommand('insertOrderedList') },
    { id: 'clear', label: 'Bersih', run: () => document.execCommand('removeFormat') },
];

export default function Notes() {
    const { member, token } = useSession();
    const [notes, setNotes] = useState([]);
    const [book, setBook] = useState(null);
    const [query, setQuery] = useState('');
    const [found, setFound] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [active, setActive] = useState({});
    const lastExclusive = useRef({ align: null, list: null });
    const paperRef = useRef(null);
    const timer = useRef(null);

    const reload = () => {
        readerApi(token, 'GET', '/api/v1/reader/notes')
            .then((d) => setNotes(d.notes || []))
            .catch(() => {});
    };

    useEffect(reload, [token]);

    // Tandai tombol yang aktif mengikuti posisi kursor di kertas.
    useEffect(() => {
        const update = () => {
            if (!paperRef.current?.contains(document.activeElement)) return;
            try {
                const next = {
                    bold: document.queryCommandState('bold'),
                    italic: document.queryCommandState('italic'),
                    underline: document.queryCommandState('underline'),
                    h1: document.queryCommandValue('formatBlock').toLowerCase() === 'h2',
                    left: document.queryCommandState('justifyLeft'),
                    center: document.queryCommandState('justifyCenter'),
                    right: document.queryCommandState('justifyRight'),
                    justify: document.queryCommandState('justifyFull'),
                    ul: document.queryCommandState('insertUnorderedList'),
                    ol: document.queryCommandState('insertOrderedList'),
                };
                // Kursor pindah pun hanya yang terakhir diklik yang menyala.
                const alignOn = ['left', 'center', 'right', 'justify'].filter((k) => next[k]);
                if (alignOn.length > 1 && lastExclusive.current.align) {
                    for (const k of alignOn) {
                        if (k !== lastExclusive.current.align) next[k] = false;
                    }
                }
                const listOn = ['ul', 'ol'].filter((k) => next[k]);
                if (listOn.length > 1 && lastExclusive.current.list) {
                    for (const k of listOn) {
                        if (k !== lastExclusive.current.list) next[k] = false;
                    }
                }
                setActive(next);
            } catch {
                // abaikan: browser tidak mendukung
            }
        };
        document.addEventListener('selectionchange', update);
        return () => document.removeEventListener('selectionchange', update);
    }, []);

    const searchBook = (q) => {
        setQuery(q);
        clearTimeout(timer.current);
        if (q.trim().length < 2) {
            setFound(null);
            return;
        }
        timer.current = setTimeout(() => {
            api.search(q.trim()).then((d) => setFound(d.books || [])).catch(() => {});
        }, 350);
    };

    // Perataan dan daftar saling menggugurkan di DOM (yang terakhir
    // menang), tapi sebagian browser melaporkan keduanya aktif.
    // Samakan tampilannya dengan kenyataan: hanya yang terakhir menyala.
    const EXCLUSIVE = [
        ['left', 'center', 'right', 'justify'],
        ['ul', 'ol'],
    ];

    const tool = (id, fn) => (e) => {
        e.preventDefault();
        paperRef.current?.focus();
        // Klik saat aktif = nonaktifkan. Rata kembali ke kiri,
        // judul kembali ke paragraf biasa, sisanya toggle bawaan.
        if (id === 'h1') {
            try {
                const isH = document.queryCommandValue('formatBlock').toLowerCase() === 'h2';
                document.execCommand('formatBlock', false, isH ? 'p' : 'h2');
            } catch {
                fn();
            }
        } else if (['left', 'center', 'right', 'justify'].includes(id) && lastExclusive.current.align === id) {
            try {
                document.execCommand('justifyLeft');
            } catch {
                fn();
            }
            lastExclusive.current.align = 'left';
        } else {
            fn();
        }
        // Baca ulang setelah perintah jalan (state berubah sesudahnya).
        setTimeout(() => {
            try {
                const map = {
                    bold: 'bold', italic: 'italic', underline: 'underline',
                    left: 'justifyLeft', center: 'justifyCenter', right: 'justifyRight',
                    justify: 'justifyFull', ul: 'insertUnorderedList', ol: 'insertOrderedList',
                };
                if (id === 'h1') {
                    setActive((a) => ({ ...a, h1: document.queryCommandValue('formatBlock').toLowerCase() === 'h2' }));
                } else if (map[id]) {
                    if (['left', 'center', 'right', 'justify'].includes(id)) {
                        lastExclusive.current.align = id;
                    }
                    if (['ul', 'ol'].includes(id)) {
                        lastExclusive.current.list = id;
                    }
                    setActive((a) => {
                        const next = { ...a, [id]: document.queryCommandState(map[id]) };
                        for (const group of EXCLUSIVE) {
                            if (group.includes(id) && next[id]) {
                                for (const other of group) {
                                    if (other !== id) next[other] = false;
                                }
                            }
                        }
                        return next;
                    });
                }
            } catch {
                // abaikan
            }
        }, 0);
    };

    const readPaper = () => sanitizeNoteHtml(paperRef.current?.innerHTML || '');

    const resetPaper = () => {
        if (paperRef.current) paperRef.current.innerHTML = '';
        setBook(null);
        setEditingId(null);
    };

    const save = (e) => {
        e.preventDefault();
        const catatan = readPaper();
        if (!paperRef.current?.innerText.trim()) return;
        const payload = { id_buku: book?.id || null, catatan };
        const done = () => {
            resetPaper();
            reload();
        };
        if (editingId) {
            // API belum ada ubah: hapus lalu simpan baru.
            readerApi(token, 'DELETE', `/api/v1/reader/notes/${editingId}`)
                .then(() => readerApi(token, 'POST', '/api/v1/reader/notes', payload))
                .then(done);
        } else {
            readerApi(token, 'POST', '/api/v1/reader/notes', payload).then(done);
        }
    };

    const edit = (n) => {
        if (paperRef.current) paperRef.current.innerHTML = sanitizeNoteHtml(n.catatan);
        setBook(n.book ? { id: n.book.id ?? null, title: n.book.title } : null);
        setEditingId(n.id);
        paperRef.current?.focus();
    };

    const drop = (id) => {
        readerApi(token, 'DELETE', `/api/v1/reader/notes/${id}`).then(reload);
    };

    const print = () => {
        const html = readPaper();
        if (!paperRef.current?.innerText.trim()) return;
        const w = window.open('', '_blank', 'width=800,height=600');
        if (!w) return;
        w.document.write(
            `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Naskah</title>` +
                `<style>body{font-family:Georgia,serif;line-height:1.8;max-width:42rem;margin:2rem auto;padding:0 1rem;color:#111}h1,h2,h3{line-height:1.3}blockquote{border-left:3px solid #999;margin-left:0;padding-left:1rem;color:#444}</style>` +
                `</head><body>${html}</body></html>`,
        );
        w.document.close();
        w.focus();
        w.print();
    };

    return (
        <div className="reader">
            <ViewerHeader library={member?.name || ''} backTo="/" backLabel="Menu" right="Catatan" />
            <main className="page">
                <form className="note-editor" onSubmit={save}>
                    <div className="md-toolbar" role="toolbar" aria-label="Alat tulis">
                        {TOOLS.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                className={active[t.id] ? 'mini-btn tool-active' : 'mini-btn'}
                                onMouseDown={tool(t.id, t.run)}
                                aria-pressed={!!active[t.id]}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {book && (
                        <p className="book-meta">
                            Untuk: {book.title}{' '}
                            <button type="button" className="note-drop" onClick={() => setBook(null)}>
                                Lepas
                            </button>
                        </p>
                    )}
                    {editingId && <p className="book-meta">Mengubah catatan lama.</p>}

                    <div
                        ref={paperRef}
                        className="paper"
                        contentEditable
                        role="textbox"
                        aria-label="Kertas naskah"
                        data-placeholder="Tulis naskah di sini..."
                    />

                    {!book && !editingId && (
                        <>
                            <input
                                className="search-input"
                                type="search"
                                placeholder="Kaitkan ke buku (opsional)"
                                value={query}
                                onChange={(e) => searchBook(e.target.value)}
                            />
                            {found && found.length > 0 && (
                                <div className="book-list">
                                    {found.slice(0, 5).map((b) => (
                                        <button key={b.id} type="button" className="list-item" onClick={() => { setBook(b); setFound(null); setQuery(''); }}>
                                            <span className="book-title">{b.title}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    <div className="gate-actions">
                        <button type="submit" className="btn-solid" disabled={false}>
                            Simpan
                        </button>
                        <button type="button" className="btn-outline" onClick={print}>
                            Cetak
                        </button>
                        {(editingId || book) && (
                            <button type="button" className="btn-outline" onClick={resetPaper}>
                                Baru
                            </button>
                        )}
                    </div>
                </form>

                <section className="section">
                    <h2 className="section-title">Catatanku</h2>
                    {notes.length === 0 && <p className="reader-state">Belum ada catatan.</p>}
                    <div className="note-list">
                        {notes.map((n) => (
                            <div key={n.id} className="note-card">
                                {n.book && <p className="note-book">{n.book.title}</p>}
                                {n.page && <p className="book-meta">Halaman {n.page}</p>}
                                <div className="paper paper-read" dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(n.catatan) }} />
                                <span className="list-item-actions">
                                    <button type="button" className="mini-btn" onClick={() => edit(n)}>
                                        Ubah
                                    </button>
                                    <button type="button" className="mini-btn" onClick={() => drop(n.id)}>
                                        Hapus
                                    </button>
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
