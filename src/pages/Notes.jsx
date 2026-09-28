import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { api, readerApi } from '../api.js';
import ViewerHeader from '../components/ViewerHeader.jsx';
import { sanitizeNoteHtml } from '../sanitize.js';
import { useSession } from '../session.jsx';

// Kertas Quill untuk naskah (mis. muhadhoroh): Tebal, Miring,
// Garis bawah, Judul, Rata, Daftar, Nomor, Bersihkan. Tanda aktif
// bawaan Quill (diwarnai oranye via CSS). Simpan HTML tersanitasi;
// Cetak mengeluarkan kertasnya. Bisa terikat buku atau bebas.
const TOOLBAR = [
    ['bold', 'italic', 'underline'],
    [{ header: [1, 2, false] }],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
];

export default function Notes() {
    const { member, token } = useSession();
    const [notes, setNotes] = useState([]);
    const [book, setBook] = useState(null);
    const [query, setQuery] = useState('');
    const [found, setFound] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const quillRef = useRef(null);
    const boxRef = useRef(null);
    const timer = useRef(null);

    useEffect(() => {
        if (!boxRef.current || quillRef.current) return;
        quillRef.current = new Quill(boxRef.current, {
            theme: 'snow',
            placeholder: 'Tulis naskah di sini...',
            modules: { toolbar: TOOLBAR },
        });
    }, []);

    const reload = () => {
        readerApi(token, 'GET', '/api/v1/reader/notes')
            .then((d) => setNotes(d.notes || []))
            .catch(() => {});
    };

    useEffect(reload, [token]);

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

    const readPaper = () => sanitizeNoteHtml(quillRef.current?.root.innerHTML || '');

    const resetPaper = () => {
        quillRef.current?.setText('');
        setBook(null);
        setEditingId(null);
    };

    const save = (e) => {
        e.preventDefault();
        const catatan = readPaper();
        if (!quillRef.current?.getText().trim()) return;
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
        quillRef.current?.clipboard.dangerouslyPasteHTML(0, sanitizeNoteHtml(n.catatan));
        setBook(n.book ? { id: n.book.id ?? null, title: n.book.title } : null);
        setEditingId(n.id);
        quillRef.current?.focus();
    };

    const drop = (id) => {
        readerApi(token, 'DELETE', `/api/v1/reader/notes/${id}`).then(reload);
    };

    const print = () => {
        const html = readPaper();
        if (!quillRef.current?.getText().trim()) return;
        const w = window.open('', '_blank', 'width=800,height=600');
        if (!w) return;
        w.document.write(
            `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Naskah</title>` +
                `<style>body{font-family:Georgia,serif;line-height:1.8;max-width:42rem;margin:2rem auto;padding:0 1rem;color:#111}h1,h2,h3{line-height:1.3}blockquote{border-left:3px solid #999;margin-left:0;padding-left:1rem;color:#444}.ql-align-center{text-align:center}.ql-align-right{text-align:right}.ql-align-justify{text-align:justify}</style>` +
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
                    {book && (
                        <p className="book-meta">
                            Untuk: {book.title}{' '}
                            <button type="button" className="note-drop" onClick={() => setBook(null)}>
                                Lepas
                            </button>
                        </p>
                    )}
                    {editingId && <p className="book-meta">Mengubah catatan lama.</p>}

                    <div className="paper paper-quill">
                        <div ref={boxRef} />
                    </div>

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
                        <button type="submit" className="btn-solid">
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
