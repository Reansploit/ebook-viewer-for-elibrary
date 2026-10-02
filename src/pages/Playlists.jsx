import { useEffect, useState } from 'react';
import { readerApi } from '../api.js';
import Footer from '../components/Footer.jsx';
import ViewerHeader from '../components/ViewerHeader.jsx';
import { useSession } from '../session.jsx';

// Daftar putar milik akun: buat, buka isi, tambah dari hasil cari,
// hapus buku atau hapus daftarnya.
export default function Playlists({ onRead }) {
    const { member, token } = useSession();
    const [lists, setLists] = useState([]);
    const [name, setName] = useState('');
    const [openId, setOpenId] = useState(null);
    const [items, setItems] = useState([]);
    const [saved, setSaved] = useState([]);

    const reload = () => {
        readerApi(token, 'GET', '/api/v1/reader/lists')
            .then((d) => setLists(d.lists || []))
            .catch(() => {});
        readerApi(token, 'GET', '/api/v1/reader/saves')
            .then((d) => setSaved(d.saves || []))
            .catch(() => {});
    };

    useEffect(reload, [token]);

    const create = (e) => {
        e.preventDefault();
        const n = name.trim();
        if (!n) return;
        readerApi(token, 'POST', '/api/v1/reader/lists', { name: n }).then(() => {
            setName('');
            reload();
        });
    };

    const open = (id) => {
        if (openId === id) {
            setOpenId(null);
            return;
        }
        setOpenId(id);
        readerApi(token, 'GET', `/api/v1/reader/lists/${id}`)
            .then((d) => setItems(d.items || []))
            .catch(() => setItems([]));
    };

    const drop = (id) => {
        readerApi(token, 'DELETE', `/api/v1/reader/lists/${id}`).then(() => {
            if (openId === id) setOpenId(null);
            reload();
        });
    };

    const removeItem = (bookId) => {
        readerApi(token, 'DELETE', `/api/v1/reader/lists/${openId}/items/${bookId}`).then(() =>
            open(openId),
        );
    };

    return (
        <div className="reader">
            <ViewerHeader library={member?.name || ''} backTo="/" backLabel="Menu" right="Playlist" />
            <main className="page">
                {saved.length > 0 && (
                    <section className="section">
                        <h2 className="section-title">Ebook tersimpan</h2>
                        <div className="book-list">
                            {saved.map((b) => (
                                <div key={b.id} className="list-item">
                                    <span className="book-title">{b.title}</span>
                                    <span className="list-item-actions">
                                        {b.file && (
                                            <button type="button" className="mini-btn" onClick={() => onRead(b)}>
                                                Baca
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="mini-btn"
                                            onClick={() =>
                                                readerApi(token, 'DELETE', `/api/v1/reader/saves/${b.id}`).then(reload)
                                            }
                                        >
                                            Keluarkan
                                        </button>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                <form className="inline-form" onSubmit={create}>
                    <label className="reader-jump-label" htmlFor="list-name">
                        Nama daftar baru
                    </label>
                    <input
                        id="list-name"
                        className="search-input"
                        type="text"
                        placeholder="Nama daftar baru"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <button type="submit" className="btn-solid">
                        Buat
                    </button>
                </form>

                {lists.length === 0 && (
                    <p className="reader-state">Belum ada daftar. Buat dulu di atas.</p>
                )}

                <div className="book-list">
                    {lists.map((l) => (
                        <div key={l.id} className="book-card">
                            <div className="book-body list-head">
                                <button type="button" className="list-name" onClick={() => open(l.id)}>
                                    {l.name} ({l.count})
                                </button>
                                <button type="button" className="note-drop" onClick={() => drop(l.id)}>
                                    Hapus
                                </button>
                            </div>
                            {openId === l.id && (
                                <div className="list-items">
                                    {items.length === 0 && (
                                        <p className="book-meta">Kosong. Tambah dari hasil pencarian.</p>
                                    )}
                                    {items.map((b) => (
                                        <div key={b.id} className="list-item">
                                            <span className="book-title">{b.title}</span>
                                            <span className="list-item-actions">
                                                {b.file && (
                                                    <button type="button" className="mini-btn" onClick={() => onRead(b)}>
                                                        Baca
                                                    </button>
                                                )}
                                                <button type="button" className="mini-btn" onClick={() => removeItem(b.id)}>
                                                    Keluarkan
                                                </button>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </main>
            <Footer />
        </div>
    );
}
