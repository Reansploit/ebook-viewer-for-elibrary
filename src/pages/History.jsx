import { useEffect, useState } from 'react';
import ViewerHeader from '../components/ViewerHeader.jsx';
import { readerApi } from '../api.js';
import { useSession } from '../session.jsx';

// Riwayat buka buku milik akun, terbaru di atas.
export default function History({ onRead }) {
    const { member, token } = useSession();
    const [rows, setRows] = useState([]);

    useEffect(() => {
        if (!token) return;
        readerApi(token, 'GET', '/api/v1/reader/history')
            .then((d) => setRows(d.history || []))
            .catch(() => {});
    }, [token]);

    return (
        <div className="reader">
            <ViewerHeader library={member?.name || ''} backTo="/" backLabel="Menu" right="Riwayat" />
            <main className="page">
                {rows.length === 0 && (
                    <p className="reader-state">Belum ada riwayat. Buka buku dulu dari katalog atau pencarian.</p>
                )}
                <div className="book-list">
                    {rows.map((h) => (
                        <div key={h.id} className="list-item">
                            <span>
                                <span className="book-title">{h.book.title}</span>
                                <span className="book-meta"> — dibuka {new Date(h.at).toLocaleString('id-ID')}</span>
                            </span>
                            {h.book.file && (
                                <button type="button" className="mini-btn" onClick={() => onRead(h.book)}>
                                    Baca lagi
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
