import { useEffect, useRef, useState } from 'react';
import { api, readerApi } from '../api.js';
import ViewerHeader from '../components/ViewerHeader.jsx';
import { renderMiniMd } from '../miniMd.js';
import { useSession } from '../session.jsx';

// Catatan bebas ala word sederhana: toolbar Tebal, Miring, Coret, Judul,
// Daftar, Kutip + pratinjau. Bisa terikat buku (dari pencarian) atau bebas.
const TOOLS = [
    { id: 'bold', label: 'Tebal', before: '**', after: '**' },
    { id: 'italic', label: 'Miring', before: '*', after: '*' },
    { id: 'strike', label: 'Coret', before: '~~', after: '~~' },
    { id: 'code', label: 'Kode', before: '`', after: '`' },
    { id: 'heading', label: 'Judul', prefix: '## ' },
    { id: 'list', label: 'Daftar', prefix: '- ' },
    { id: 'quote', label: 'Kutip', prefix: '> ' },
];

export default function Notes() {
    const { member, token } = useSession();
    const [notes, setNotes] = useState([]);
    const [text, setText] = useState('');
    const [book, setBook] = useState(null);
    const [query, setQuery] = useState('');
    const [found, setFound] = useState(null);
    const [preview, setPreview] = useState(false);
    const areaRef = useRef(null);
    const timer = useRef(null);

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

    const surround = (before, after) => {
        const el = areaRef.current;
        if (!el) return;
        const { selectionStart: s, selectionEnd: e, value } = el;
        const next = value.slice(0, s) + before + value.slice(s, e) + after + value.slice(e);
        setText(next);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(s + before.length, e + before.length);
        });
    };

    const prefixLines = (prefix) => {
        const el = areaRef.current;
        if (!el) return;
        const { selectionStart: s, value } = el;
        const lineStart = value.lastIndexOf('\n', s - 1) + 1;
        const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
        setText(next);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(s + prefix.length, s + prefix.length);
        });
    };

    const save = (e) => {
        e.preventDefault();
        const catatan = text.trim();
        if (!catatan) return;
        readerApi(token, 'POST', '/api/v1/reader/notes', {
            id_buku: book?.id || null,
            catatan,
        }).then(() => {
            setText('');
            setBook(null);
            setPreview(false);
            reload();
        });
    };

    const drop = (id) => {
        readerApi(token, 'DELETE', `/api/v1/reader/notes/${id}`).then(reload);
    };

    return (
        <div className="reader">
            <ViewerHeader library={member?.name || ''} backTo="/" backLabel="Menu" right="Catatan" />
            <main className="page">
                <form className="note-editor" onSubmit={save}>
                    <div className="md-toolbar" role="toolbar" aria-label="Alat tulis">
                        {TOOLS.map((t) =>
                            t.prefix ? (
                                <button key={t.id} type="button" className="mini-btn" onClick={() => prefixLines(t.prefix)}>
                                    {t.label}
                                </button>
                            ) : (
                                <button key={t.id} type="button" className="mini-btn" onClick={() => surround(t.before, t.after)}>
                                    {t.label}
                                </button>
                            ),
                        )}
                        <button type="button" className="mini-btn" onClick={() => setPreview((p) => !p)} aria-pressed={preview}>
                            {preview ? 'Tulis' : 'Pratinjau'}
                        </button>
                    </div>

                    {book && (
                        <p className="book-meta">
                            Untuk: {book.title}{' '}
                            <button type="button" className="note-drop" onClick={() => setBook(null)}>
                                Lepas
                            </button>
                        </p>
                    )}

                    {preview ? (
                        <div className="md-preview" dangerouslySetInnerHTML={{ __html: renderMiniMd(text) || '<p class="md-p">Kosong.</p>' }} />
                    ) : (
                        <textarea
                            ref={areaRef}
                            className="md-area"
                            rows={6}
                            placeholder="Tulis catatan bebas..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    )}

                    {!book && (
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

                    <button type="submit" className="btn-solid" disabled={!text.trim()}>
                        Simpan catatan
                    </button>
                </form>

                <section className="section">
                    <h2 className="section-title">Catatanku</h2>
                    {notes.length === 0 && <p className="reader-state">Belum ada catatan.</p>}
                    <div className="note-list">
                        {notes.map((n) => (
                            <div key={n.id} className="note-card">
                                {n.book && <p className="note-book">{n.book.title}</p>}
                                {n.page && <p className="book-meta">Halaman {n.page}</p>}
                                <div className="md-preview" dangerouslySetInnerHTML={{ __html: renderMiniMd(n.catatan) }} />
                                <button type="button" className="note-drop" onClick={() => drop(n.id)}>
                                    Hapus
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
