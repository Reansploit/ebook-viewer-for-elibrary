import { useEffect, useState } from 'react';
import { readerApi } from '../api.js';
import { Link } from '../router.jsx';
import { useSession } from '../session.jsx';
import { detectTones } from '../wp.js';

// Ikon garis oranye per layanan (R-04): bentuk mengikuti isi kartu.
function Icon({ d }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d={d} />
        </svg>
    );
}

const CARDS = [
    { to: '/katalog', title: 'Baca', desc: 'Koleksi buku digital', icon: 'M12 6c-2-1.5-4.5-2-8-2v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V4c-3.5 0-6 .5-8 2Zm0 0v14' },
    { to: '/playlist', title: 'Playlist Buku', desc: 'Daftar bacaanmu', icon: 'M4 6h12M4 10h12M4 14h7m-7 4h10m4-9 2 2 2-2m-2 7 2 2 2-2' },
    { to: '/riwayat', title: 'Riwayat', desc: 'Buku yang dibuka', icon: 'M12 8v4l3 2m6-2a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z' },
    { to: '/profil', title: 'Profil Akun', desc: 'Data diri + catatan', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0' },
    { to: '/wallpaper', title: 'Wallpaper', desc: 'Latar foto custom', icon: 'M4 5h16v14H4zM4 15l4-4 3 3 3-3 6 6M9 9h.01' },
];

// Menu utama akun, gaya kios layanan ala referensi SALAM PAY milik yayasan:
// ombak merah-oranye sebagai identitas, kartu putih, ikon oranye, jam live.
// Alasan (R-01, R-31): santri sudah kenal bahasa visual ini dari layanan
// yayasan lain, jadi menu langsung terasa familiar.
function useClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    const date = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return { date, time };
}

export default function Menu({ onRead, wallpaper }) {
    const { member, token, logout } = useSession();
    const { date, time } = useClock();
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

    const custom = wallpaper && wallpaper !== 'polos';
    const [tones, setTones] = useState({ top: 'light', mid: 'light', bottom: 'light' });

    useEffect(() => {
        if (!custom) return;
        detectTones(wallpaper).then(setTones);
    }, [wallpaper, custom]);

    return (
        <div
            className={
                custom
                    ? `kiosk kiosk-custom wp-top-${tones.top} wp-mid-${tones.mid} wp-bottom-${tones.bottom}`
                    : 'kiosk'
            }
            style={custom ? { '--wp': `url("${wallpaper}")` } : undefined}
        >
            <header className="kiosk-head">
                <div className="kiosk-brand">
                    <img src="/images/logo-wbs.png" alt="" className="site-logo" />
                    <div>
                        <p className="kiosk-title">Perpustakaan WBS</p>
                        <p className="kiosk-user">Halo, {member?.name || 'Santri'}</p>
                    </div>
                </div>
                <div className="kiosk-clock">
                    <p className="kiosk-date">{date}</p>
                    <p className="kiosk-time">{time}</p>
                </div>
            </header>

            <main className="kiosk-main">
                <h1 className="kiosk-heading">Pilih Layanan</h1>
                {resume && (
                    <button type="button" className="kiosk-resume" onClick={() => onRead(resume.book, resume.page)}>
                        Lanjutkan: {resume.book.title} (halaman {resume.page})
                    </button>
                )}
                <nav className="kiosk-grid" aria-label="Layanan">
                    {CARDS.map((c) => (
                        <Link key={c.to} to={c.to} className="kiosk-card">
                            <span className="kiosk-icon">
                                <Icon d={c.icon} />
                            </span>
                            <span className="kiosk-card-title">{c.title}</span>
                            <span className="kiosk-card-desc">{c.desc}</span>
                        </Link>
                    ))}
                </nav>
                <button type="button" className="kiosk-exit" onClick={logout}>
                    Keluar
                </button>
            </main>
        </div>
    );
}
