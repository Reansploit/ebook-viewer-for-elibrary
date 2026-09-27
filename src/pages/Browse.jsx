import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Link } from '../router.jsx';
import BookCard from '../components/BookCard.jsx';
import CategoryChips from '../components/CategoryChips.jsx';
import Pagination from '../components/Pagination.jsx';
import SearchBox from '../components/SearchBox.jsx';

// Semua buku: saring kategori + kata kunci + paginasi server 20/halaman.
export default function Browse({ params, go }) {
    const kategori = params.get('kategori') || '';
    const q = params.get('q') || '';
    const [page, setPage] = useState(1);
    const [data, setData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState(false);

    useEffect(() => {
        setPage(1);
    }, [kategori, q]);

    useEffect(() => {
        setError(false);
        api
            .all({ q, kategori, page })
            .then((d) => {
                setData(d);
                if (d.data && categories.length === 0) {
                    api.catalog().then((c) => setCategories(c.categories || [])).catch(() => {});
                }
            })
            .catch(() => setError(true));
    }, [q, kategori, page]);

    const withParams = (patch) => {
        const p = new URLSearchParams({ q, kategori, ...patch });
        for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
        const s = p.toString();
        return `#/semua${s ? `?${s}` : ''}`;
    };

    return (
        <div className="reader">
            <header className="reader-header">
                <Link to="/katalog" className="back-link">Katalog</Link>
                <p className="reader-position">Semua buku</p>
            </header>
            <main className="page">
                <SearchBox
                    initial={q}
                    placeholder="Ketik judul, pengarang, atau ID buku"
                    onSubmit={(v) => go(`/semua${v ? `?q=${encodeURIComponent(v)}` : ''}`)}
                />
                <CategoryChips
                    categories={categories}
                    activeId={kategori}
                    makeHref={(id) => withParams({ kategori: id })}
                />
                {error && (
                    <div className="reader-state">
                        <p>Daftar gagal dimuat.</p>
                        <p className="page-placeholder-sub">Periksa koneksi lalu muat ulang halaman ini.</p>
                    </div>
                )}
                {data && data.data.length === 0 && (
                    <div className="reader-state">
                        <p>Tidak ada buku yang cocok.</p>
                        <p className="page-placeholder-sub">Ubah kata kunci atau kategorinya.</p>
                    </div>
                )}
                {data && data.data.length > 0 && (
                    <>
                        <div className="book-grid">
                            {data.data.map((b) => (
                                <BookCard key={b.id} book={b} />
                            ))}
                        </div>
                        <Pagination page={data.current_page} lastPage={data.last_page} onGo={setPage} />
                    </>
                )}
            </main>
        </div>
    );
}
