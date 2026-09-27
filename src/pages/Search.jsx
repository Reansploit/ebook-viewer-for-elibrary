import { useRef, useState } from 'react';
import { api } from '../api.js';
import { Link } from '../router.jsx';
import BookCard from '../components/BookCard.jsx';
import SearchBox from '../components/SearchBox.jsx';

// Cari lalu baca: ketik, pilih hasil, tombol Baca membuka reader.
// Reader masih stub engine (placeholder jujur) sampai engine asli dipasang.
export default function Search({ onRead }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const timer = useRef(null);

    const liveSearch = (q) => {
        setQuery(q);
        clearTimeout(timer.current);
        if (q.length < 1) {
            setResults(null);
            setSearching(false);
            return;
        }
        setSearching(true);
        timer.current = setTimeout(() => {
            api.search(q)
                .then((d) => {
                    setResults(d.books || []);
                    setSearching(false);
                })
                .catch(() => setSearching(false));
        }, 350);
    };

    return (
        <div className="reader">
            <header className="reader-header">
                <Link to="/" className="back-link">Portal</Link>
                <p className="reader-position">Cari buku</p>
            </header>
            <main className="page">
                <SearchBox placeholder="Ketik judul, pengarang, atau ID buku" onSearch={liveSearch} />
                {query.length < 1 && (
                    <p className="reader-state">Ketik di atas untuk mulai mencari.</p>
                )}
                {query.length >= 1 && searching && !results && (
                    <p className="reader-state">Mencari...</p>
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
                                    <BookCard book={b} />
                                </div>
                                <button
                                    type="button"
                                    className="btn-solid"
                                    onClick={() => onRead(b)}
                                    disabled={!b.remaining || b.remaining <= 0}
                                    title={!b.remaining || b.remaining <= 0 ? 'Stok habis' : undefined}
                                >
                                    Baca
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
