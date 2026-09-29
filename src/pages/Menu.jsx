import { useEffect, useState } from 'react';
import { readerApi } from '../api.js';
import { Link } from '../router.jsx';
import { useSession } from '../session.jsx';

// Ikon garis oranye per aplikasi (R-04): bentuk mengikuti isi.
function Icon({ d }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d={d} />
        </svg>
    );
}

const APPS = [
    { to: '/cari', title: 'Baca', icon: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM21 21l-4.3-4.3' },
    { to: '/playlist', title: 'Playlist', icon: 'M4 6h16M4 12h16M4 18h10' },
    { to: '/riwayat', title: 'Riwayat', icon: 'M12 8v4l3 2m6-2a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z' },
    { to: '/profil', title: 'Profil', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0' },
    { to: '/catatan', title: 'Catatan', icon: 'M5 4h14v12H5zM5 16l-2 5 5-2M9 9h6M9 12h6' },
    { to: '/wallpaper', title: 'Wallpaper', icon: 'M4 5h16v14H4zM4 15l4-4 3 3 3-3 6 6M9 9h.01' },
];

// Layar utama gaya Ubuntu: bar atas (Activities, jam live, daya),
// dock kiri (ikon aplikasi + titik aktif), desktop wallpaper.
// Alasan (R-31): santri warnet/lab sekolah sudah hafal pola ini.
function useClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    const date = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
}

export default function Menu({ onRead, wallpaper, route, onLock }) {
    const { member, token, logout } = useSession();
    const { date, time } = useClock();
    const [resume, setResume] = useState(null);
    const [dismissed, setDismissed] = useState([]);
    const [powerOpen, setPowerOpen] = useState(false);

    const dismiss = (bookId) => {
        setDismissed((d) => (d.includes(bookId) ? d : [...d, bookId]));
        setResume(null);
    };

    useEffect(() => {
        if (!token) return;
        readerApi(token, 'GET', '/api/v1/reader/progress')
            .then((d) => {
                const current = (d.progress || []).find(
                    (p) => p.status === 'baca' && p.book && !dismissed.includes(p.book.id),
                );
                setResume(current || null);
            })
            .catch(() => {});
    }, [token]);

    const bg = wallpaper && wallpaper !== 'polos' ? wallpaper : '/base.jpg';

    return (
        <div className="kiosk kiosk-custom" style={{ '--wp': `url("${bg}")` }}>
            <header className="os-bar">
                <span className="os-activities">Activities</span>
                <span className="os-clock">
                    {date} • {time}
                </span>
                <span className="os-power">
                    <button
                        type="button"
                        className="os-exit"
                        onClick={() => setPowerOpen((o) => !o)}
                        aria-expanded={powerOpen}
                        aria-label="Menu daya"
                    >
                        ⏻
                    </button>
                    {powerOpen && (
                        <span className="os-menu">
                            <button type="button" onClick={() => { setPowerOpen(false); onLock(); }}>
                                Kunci
                            </button>
                            <button type="button" onClick={logout}>
                                Keluar
                            </button>
                        </span>
                    )}
                </span>
            </header>

            <div className="os-body">
                <nav className="os-dock" aria-label="Aplikasi">
                    {APPS.map((a) => (
                        <Link
                            key={a.to}
                            to={a.to}
                            className={route === a.to ? 'os-dock-app os-active' : 'os-dock-app'}
                            aria-label={a.title}
                            title={a.title}
                        >
                            <span className="os-dock-icon">
                                <Icon d={a.icon} />
                            </span>
                        </Link>
                    ))}
                </nav>

                <main className="os-desktop">
                    <p className="os-hello">Halo, {member?.name || 'Santri'}</p>
                    {resume && (
                        <div className="kiosk-resume" role="group" aria-label="Lanjutkan bacaan">
                            <button type="button" className="kiosk-resume-main" onClick={() => onRead(resume.book, resume.page)}>
                                Lanjutkan: {resume.book.title} (halaman {resume.page})
                            </button>
                            <button
                                type="button"
                                className="kiosk-resume-x"
                                onClick={() => dismiss(resume.book.id)}
                                aria-label="Tutup notifikasi lanjutan"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                    <nav className="os-grid" aria-label="Aplikasi">
                        {APPS.map((a) => (
                            <Link key={a.to} to={a.to} className="os-app">
                                <span className="os-icon">
                                    <Icon d={a.icon} />
                                </span>
                                <span className="os-label">{a.title}</span>
                            </Link>
                        ))}
                    </nav>
                </main>
            </div>
        </div>
    );
}
