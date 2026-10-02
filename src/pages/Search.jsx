import { useEffect, useRef, useState } from 'react';
import { api, readerApi } from '../api.js';
import BookCard from '../components/BookCard.jsx';
import NetState from '../components/NetState.jsx';
import { useReaderMarks } from '../readerMarks.js';
import SearchBox from '../components/SearchBox.jsx';
import Footer from '../components/Footer.jsx';
import ViewerHeader from '../components/ViewerHeader.jsx';
import { useSession } from '../session.jsx';

// Cari lalu baca: ketik, pilih hasil, tombol Baca membuka reader.
// Reader masih stub engine (placeholder jujur) sampai engine asli dipasang.
export default function Search({ onRead }) {
    const { votes, saves, sendVote, toggleSave } = useReaderMarks();
    const { token } = useSession();
    const [library, setLibrary] = useState('Perpustakaan WBS');
    const [query, setQuery] = useState('');
    const [lists, setLists] = useState([]);
    const [pick, setPick] = useState({});
    const [results, setResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [searchErr, setSearchErr] = useState(null);
    const timer = useRef(null);

    useEffect(() => {
        api.catalog().then((d) => d.library && setLibrary(d.library)).catch(() => {});
    }, []);

    useEffect(() => {
        if (!token) {
            setLists([]);
            return;
        }
        readerApi(token, 'GET', '/api/v1/reader/lists')
            .then((d) => setLists(d.lists || []))
            .catch(() => {});
    }, [token]);

    const saveToList = (book) => {
        const listId = pick[book.id] || lists[0]?.id;
        if (!listId || !token) return;
        readerApi(token, 'POST', `/api/v1/reader/lists/${listId}/items`, { id_buku: book.id })
            .then(() => setPick((p) => ({ ...p, [book.id]: 'ok' })))
            .catch(() => {});
    };

    const liveSearch = (q) => {
        setQuery(q);
        setSearchErr(null);
        clearTimeout(timer.current);
        if (q.length < 1) {
            setResults(null);
            setSearching(false);
            return;
        }
        setSearching(true);
        timer.current = setTimeout(() => {
            api.search(q, '1')
                .then((d) => {
                    setResults(d.books || []);
                    setSearching(false);
                })
                .catch((err) => {
                    setSearching(false);
                    setResults(null);
                    setSearchErr(err);
                });
        }, 350);
    };

    return (
        <div className="reader">
            <ViewerHeader library={library} right="Cari buku" />
            <main className="page">
                <SearchBox placeholder="Ketik judul, pengarang, atau ID buku" onSearch={liveSearch} />
                <p className="page-sub">Hanya buku yang ada berkas digitalnya.</p>
                {query.length < 1 && (
                    <p className="reader-state">Ketik di atas untuk mulai mencari.</p>
                )}
                {query.length >= 1 && searching && !results && (
                    <p className="reader-state">Mencari...</p>
                )}
                {query.length >= 1 && searchErr && !searching && (
                    <NetState error={searchErr} onRetry={() => liveSearch(query)} />
                )}
                {results && results.length === 0 && (
                    <div className="reader-state">
                        <p>Tidak ditemukan.</p>
                        <p className="page-placeholder-sub">Coba kata kunci lain atau tanya petugas.</p>
                    </div>
                )}
                {results && results.length > 0 && (
                    <div className="book-list">
                        {results.map((b) => (
                            <div key={b.id} className="book-row">
                                <div className="book-row-main">
                                    <BookCard
                                        book={b}
                                        myVote={votes[b.id] || 0}
                                        onVote={(id, v) =>
                                            sendVote(id, v, (bid, likes, dislikes) =>
                                                setResults((rs) => (rs || []).map((x) => (x.id === bid ? { ...x, likes, dislikes } : x))),
                                            )
                                        }
                                        showSave
                                        saved={!!saves[b.id]}
                                        onToggleSave={toggleSave}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="btn-solid"
                                    onClick={() => onRead(b)}
                                    disabled={!b.file}
                                    title={!b.file ? 'Belum ada berkas digital' : undefined}
                                >
                                    Baca
                                </button>
                                {token && lists.length > 0 && (
                                    <span className="save-row">
                                        <select
                                            className="save-select"
                                            value={pick[b.id] && pick[b.id] !== 'ok' ? pick[b.id] : lists[0].id}
                                            onChange={(e) => setPick((p) => ({ ...p, [b.id]: Number(e.target.value) }))}
                                            aria-label={`Simpan ${b.title} ke daftar`}
                                        >
                                            {lists.map((l) => (
                                                <option key={l.id} value={l.id}>
                                                    {l.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button type="button" className="mini-btn" onClick={() => saveToList(b)}>
                                            {pick[b.id] === 'ok' ? 'Tersimpan' : 'Simpan'}
                                        </button>
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
