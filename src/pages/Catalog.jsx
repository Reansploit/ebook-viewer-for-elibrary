import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { Link } from '../router.jsx';
import BookCard from '../components/BookCard.jsx';
import NetState from '../components/NetState.jsx';
import { useReaderMarks } from '../readerMarks.js';
import CategoryChips from '../components/CategoryChips.jsx';
import SearchBox from '../components/SearchBox.jsx';
import ViewerHeader from '../components/ViewerHeader.jsx';

// Beranda katalog: cari cepat + kategori + koleksi terbaru.
// Cermin halaman Katalog elibrary yang dipindah ke sini.
export default function Catalog({ go }) {
    const { votes, sendVote } = useReaderMarks();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [searchErr, setSearchErr] = useState(null);
    const timer = useRef(null);

    useEffect(() => {
        setError(null);
        api.catalog().then(setData).catch(setError);
    }, [reloadKey]);

    const applyCounts = (bookId, likes, dislikes) => {
        const patch = (rows) => (rows || []).map((b) => (b.id === bookId ? { ...b, likes, dislikes } : b));
        setResults((r) => (r ? patch(r) : r));
        setData((d) => (d ? { ...d, featured: patch(d.featured) } : d));
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
            api.search(q, '0')
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

    const showResults = query.length >= 1;

    return (
        <div className="reader">
            <ViewerHeader library={data?.library || 'Perpustakaan WBS'} right="Katalog" />
            <main className="page">
                <h1 className="page-title">Cari buku</h1>
                <p className="page-sub">Cek ketersediaan koleksi tanpa perlu login.</p>

                <SearchBox
                    placeholder="Ketik judul, pengarang, atau ID buku"
                    onSearch={liveSearch}
                    onSubmit={(q) => q && go(`/semua?q=${encodeURIComponent(q)}`)}
                />

                {error && <NetState error={error} onRetry={() => setReloadKey((k) => k + 1)} />}

                {showResults ? (
                    <div className="result-list">
                        {searching && !results && <p className="reader-state">Mencari...</p>}
                        {searchErr && !searching && (
                            <NetState error={searchErr} onRetry={() => liveSearch(query)} />
                        )}
                        {results && results.length === 0 && (
                            <div className="reader-state">
                                <p>Tidak ditemukan.</p>
                                <p className="page-placeholder-sub">Coba kata kunci lain atau tanya petugas.</p>
                            </div>
                        )}
                        {results && results.length > 0 && (
                            <div className="book-grid">
                                {results.map((b) => (
                                    <BookCard key={b.id} book={b} myVote={votes[b.id] || 0} onVote={(id, v) => sendVote(id, v, applyCounts)} />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    data && (
                        <>
                            <CategoryChips
                                categories={data.categories}
                                activeId=""
                                makeHref={(id) => `#/semua${id ? `?kategori=${encodeURIComponent(id)}` : ''}`}
                            />
                            {data.featured.length > 0 && (
                                <section className="section">
                                    <h2 className="section-title">Koleksi terbaru</h2>
                                    <div className="book-grid">
                                        {data.featured.map((b) => (
                                            <BookCard key={b.id} book={b} myVote={votes[b.id] || 0} onVote={(id, v) => sendVote(id, v, applyCounts)} />
                                        ))}
                                    </div>
                                    {data.total > data.featured.length && (
                                        <div className="section-more">
                                            <Link to="/semua" className="btn-outline">
                                                Lihat selengkapnya ({data.total - data.featured.length} lainnya)
                                            </Link>
                                        </div>
                                    )}
                                </section>
                            )}
                        </>
                    )
                )}
            </main>
        </div>
    );
}
