import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Link } from '../router.jsx';
import ViewerHeader from '../components/ViewerHeader.jsx';

// Ikon garis seperlunya (R-04): buku untuk jelajah koleksi, kaca pembesar
// untuk cari. Tanpa pustaka ikon agar viewer tetap ringan.
function BookIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M12 6c-2-1.5-4.5-2-8-2v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V4c-3.5 0-6 .5-8 2Z" />
            <path d="M12 6v14" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    );
}

// Portal: dua jalan sesuai kebutuhan nyata. Jelajahi untuk lihat-lihat
// koleksi, Cari untuk langsung ke buku tertentu lalu baca.
export default function Portal() {
    const [library, setLibrary] = useState('Perpustakaan WBS');

    useEffect(() => {
        api.catalog().then((d) => d.library && setLibrary(d.library)).catch(() => {});
    }, []);

    return (
        <div className="reader">
            <ViewerHeader library={library} />
            <main className="portal">
                <h1 className="portal-title">Mau baca apa hari ini?</h1>
                <div className="portal-options">
                    <Link to="/katalog" className="portal-card">
                        <span className="icon-circle">
                            <BookIcon />
                        </span>
                        <span className="portal-card-title">Jelajahi Katalog</span>
                        <span className="portal-card-desc">Lihat koleksi terbaru dan per kategori.</span>
                    </Link>
                    <Link to="/cari" className="portal-card">
                        <span className="icon-circle">
                            <SearchIcon />
                        </span>
                        <span className="portal-card-title">Cari Buku</span>
                        <span className="portal-card-desc">Ketik judul atau pengarang, langsung baca.</span>
                    </Link>
                </div>
            </main>
        </div>
    );
}
