import { useEffect, useState } from 'react';
import { readerApi } from '../api.js';
import { Link } from '../router.jsx';
import { useSession } from '../session.jsx';
import ViewerHeader from '../components/ViewerHeader.jsx';

// Menu utama akun: kartu grup Baca, Playlist, Riwayat, Profil,
// Wallpaper, Tema. Kartu Baca melanjutkan bacaan terakhir bila ada.
const CARDS = [
    { to: '/katalog', title: 'Baca', desc: 'Lanjutkan bacaan atau cari buku baru.' },
    { to: '/playlist', title: 'Playlist Buku', desc: 'Daftar bacaan yang kamu simpan.' },
    { to: '/riwayat', title: 'Riwayat', desc: 'Buku yang pernah kamu buka.' },
    { to: '/profil', title: 'Profil Akun', desc: 'Data diri dan catatanmu.' },
    { to: '/wallpaper', title: 'Wallpaper', desc: 'Ganti latar portal sesukamu.' },
    { to: '/tema', title: 'Tema', desc: 'Mode terang atau gelap.' },
];

export default function Menu({ theme, toggle, onRead }) {
    const { member, token } = useSession();
    const [resume, setResume] = useState(null);

    useEffect(() => {
        if (!token) return;
        readerApi(token, 'GET', '/api/v1/reader/progress')
            .then((d) => {
                const current = (d.progress || []).find((p) => p.status === 'baca' && p.book);
                setResume(current || null);
            })
            .catch(() => {});
    }, [token]);

    return (
        <div className="reader">
            <ViewerHeader library={member?.name || 'Perpustakaan WBS'} backTo={null} right="Menu" theme={theme} toggle={toggle} />
            <main className="page">
                {resume && (
                    <button type="button" className="resume-card" onClick={() => onRead(resume.book, resume.page)}>
                        <span className="resume-label">Lanjutkan bacaan</span>
                        <span className="resume-title">{resume.book.title}</span>
                        <span className="resume-meta">Halaman {resume.page}</span>
                    </button>
                )}
                <div className="portal-options menu-grid">
                    {CARDS.map((c) => (
                        <Link key={c.to} to={c.to} className="portal-card">
                            <span className="portal-card-title">{c.title}</span>
                            <span className="portal-card-desc">{c.desc}</span>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
