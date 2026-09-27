import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Link } from '../router.jsx';

// Portal: dua jalan sesuai kebutuhan nyata. Jelajahi untuk lihat-lihat
// koleksi, Cari untuk langsung ke buku tertentu lalu baca.
// Alasan dua kartu (R-31): santri yang belum tahu mau baca apa vs yang
// sudah tahu judulnya, perilakunya beda sehingga jalannya dipisah.
export default function Portal() {
    const [library, setLibrary] = useState('Perpustakaan WBS');

    useEffect(() => {
        api.catalog().then((d) => d.library && setLibrary(d.library)).catch(() => {});
    }, []);

    return (
        <div className="reader">
            <main className="portal">
                <h1 className="portal-title">{library}</h1>
                <p className="portal-sub">Mau baca apa hari ini?</p>
                <div className="portal-options">
                    <Link to="/katalog" className="portal-card">
                        <span className="portal-card-title">Jelajahi Katalog</span>
                        <span className="portal-card-desc">Lihat koleksi terbaru dan per kategori.</span>
                    </Link>
                    <Link to="/cari" className="portal-card">
                        <span className="portal-card-title">Cari Buku</span>
                        <span className="portal-card-desc">Ketik judul atau pengarang, langsung baca.</span>
                    </Link>
                </div>
            </main>
        </div>
    );
}
