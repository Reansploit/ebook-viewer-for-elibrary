import { useEffect, useState } from 'react';
import { readerApi } from '../api.js';
import ViewerHeader from '../components/ViewerHeader.jsx';
import { useSession } from '../session.jsx';

// Lanjut bacaan: semua progres status baca + tandai selesai.
// Selesai = hilang dari sini, masuk hitungan profil.
export default function Continue({ onRead }) {
    const { member, token } = useSession();
    const [rows, setRows] = useState(null);

    const reload = () => {
        readerApi(token, 'GET', '/api/v1/reader/progress')
            .then((d) => setRows((d.progress || []).filter((p) => p.status === 'baca' && p.book)))
            .catch(() => setRows([]));
    };

    useEffect(reload, [token]);

    const finish = (bookId) => {
        readerApi(token, 'POST', '/api/v1/reader/progress', { id_buku: bookId, status: 'selesai' })
            .then(reload)
            .catch(() => {});
    };

    return (
        <div className="reader">
            <ViewerHeader library={member?.name || ''} backTo="/" backLabel="Menu" right="Lanjutkan" />
            <main className="page">
                {rows === null && <p className="reader-state">Memuat...</p>}
                {rows && rows.length === 0 && (
                    <p className="reader-state">Tidak ada bacaan berjalan. Cari ebook lalu tekan Baca.</p>
                )}
                <div className="book-list">
                    {(rows || []).map((p) => (
                        <div key={p.id_buku} className="list-item">
                            <span>
                                <span className="book-title">{p.book.title}</span>
                                <span className="book-meta"> — halaman {p.page}</span>
                            </span>
                            <span className="list-item-actions">
                                <button type="button" className="mini-btn" onClick={() => onRead(p.book, p.page)}>
                                    Lanjutkan
                                </button>
                                <button type="button" className="mini-btn" onClick={() => finish(p.id_buku)}>
                                    Selesai
                                </button>
                            </span>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
