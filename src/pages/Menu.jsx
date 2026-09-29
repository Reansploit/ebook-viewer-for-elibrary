import { useEffect, useRef, useState } from 'react';
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

// Ubin warna per aplikasi seperti dock macOS (bukan seragam):
// tiap app punya identitas warna sendiri.
const APPS = [
    { to: '/cari', title: 'Baca', tile: '#ea580c', icon: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM21 21l-4.3-4.3' },
    { to: '/playlist', title: 'Playlist', tile: '#e11d48', icon: 'M4 6h16M4 12h16M4 18h10' },
    { to: '/riwayat', title: 'Riwayat', tile: '#2563eb', icon: 'M12 8v4l3 2m6-2a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z' },
    { to: '/profil', title: 'Profil', tile: '#6b7280', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0' },
    { to: '/catatan', title: 'Catatan', tile: '#ca8a04', icon: 'M5 4h14v12H5zM5 16l-2 5 5-2M9 9h6M9 12h6' },
    { to: '/wallpaper', title: 'Wallpaper', tile: '#16a34a', icon: 'M4 5h16v14H4zM4 15l4-4 3 3 3-3 6 6M9 9h.01' },
];

// Layar utama gaya macOS: bar menu atas (logo, jam live, daya),
// dock bawah tengah (ikon + titik aktif), desktop wallpaper.
// Alasan (R-31): pola yang dikenal, tidak perlu dipelajari.
function useClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    const date = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
}

export default function Menu({ onRead, wallpaper, route, onLock }) {
    const { member, token, logout } = useSession();
    const { date, time } = useClock();
    const [resume, setResume] = useState(null);
    const [dismissed, setDismissed] = useState([]);
    const [powerOpen, setPowerOpen] = useState(false);
    // Pembesaran dock ala macOS: ikon dekat kursor membesar mulus.
    const [mouseX, setMouseX] = useState(null);
    const dockRef = useRef(null);
    // Jendela lanjutkan: minimize = ciutkan isi, zoom = lebarkan.
    const [winMin, setWinMin] = useState(false);
    const [winZoom, setWinZoom] = useState(false);

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
            <header className="mac-bar">
                <span className="mac-brand">
                    <img src="/images/logo-wbs.png" alt="" className="site-logo" />
                    <span className="site-name">elibrary</span>
                </span>
                <span className="mac-appname">Menu</span>
                <span className="os-power os-right">
                    <span className="mac-clock">
                        {date} {time}
                    </span>
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

            <main className="os-desktop">
                <p className="os-hello">Halo, {member?.name || 'Santri'}</p>
                {resume && (
                    <div className={winZoom ? 'mac-window mac-zoom' : 'mac-window'} role="group" aria-label="Lanjutkan bacaan">
                        <div className="mac-titlebar">
                            <span className="mac-traffic">
                                <button type="button" className="mac-dot mac-close" onClick={() => dismiss(resume.book.id)} aria-label="Tutup">
                                    <span aria-hidden="true">✕</span>
                                </button>
                                <button
                                    type="button"
                                    className="mac-dot mac-min"
                                    onClick={() => setWinMin((m) => !m)}
                                    aria-label={winMin ? 'Buka jendela' : 'Ciutkan jendela'}
                                    aria-pressed={winMin}
                                >
                                    <span aria-hidden="true">–</span>
                                </button>
                                <button
                                    type="button"
                                    className="mac-dot mac-zoom-btn"
                                    onClick={() => setWinZoom((z) => !z)}
                                    aria-label={winZoom ? 'Kecilkan jendela' : 'Lebarkan jendela'}
                                    aria-pressed={winZoom}
                                >
                                    <span aria-hidden="true">+</span>
                                </button>
                            </span>
                            <span className="mac-wintitle">Lanjutkan</span>
                        </div>
                        {!winMin && (
                            <button type="button" className="mac-winbody" onClick={() => onRead(resume.book, resume.page)}>
                                <span className="resume-title">{resume.book.title}</span>
                                <span className="resume-meta">Halaman {resume.page}</span>
                            </button>
                        )}
                    </div>
                )}
            </main>

            <nav
                className="mac-dock"
                aria-label="Aplikasi"
                ref={dockRef}
                onMouseMove={(e) => setMouseX(e.clientX)}
                onMouseLeave={() => setMouseX(null)}
            >
                {APPS.map((a, i) => {
                    let scale = 1;
                    if (mouseX !== null && dockRef.current) {
                        const kids = dockRef.current.children;
                        const el = kids[i];
                        if (el) {
                            const r = el.getBoundingClientRect();
                            const dist = Math.abs(mouseX - (r.left + r.width / 2));
                            scale = 1 + 0.6 * Math.max(0, 1 - dist / 120);
                        }
                    }
                    return (
                        <Link
                            key={a.to}
                            to={a.to}
                            className={route === a.to ? 'mac-app mac-active' : 'mac-app'}
                            aria-label={a.title}
                            title={a.title}
                        >
                            <span className="mac-icon" style={{ scale }}>
                                <Icon d={a.icon} />
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
