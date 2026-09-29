import { useEffect, useRef, useState } from 'react';
import { readerApi } from '../api.js';
import { Link } from '../router.jsx';
import { useSession } from '../session.jsx';

// Ikon ala app macOS: ubin solid identitas + glyph putih. Bukan kaca
// (kaca + zoom terlihat ngebug), jadi tile solid dengan bayangan.
function BooksArt() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
            <path d="M12 6c-2-1.5-4.5-2-8-2v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V4c-3.5 0-6 .5-8 2Zm0 0v14" />
        </svg>
    );
}

function MusicArt() {
    return (
        <svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
            <circle cx="8" cy="17" r="3.2" />
            <circle cx="19" cy="14" r="3.2" />
            <path d="M11 17V6l8-2.5V14h-2.2V6.4L13 7.5V17h-2Z" />
        </svg>
    );
}

function CompassArt() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="#fff" />
            <polygon points="15.5,8.5 13.2,13.2 8.5,15.5 10.8,10.8" fill="#ff3b30" />
            <polygon points="15.5,8.5 13.2,13.2 10.8,10.8" fill="#fff" />
        </svg>
    );
}

function PersonArt() {
    return (
        <svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5v1H4v-1Z" />
        </svg>
    );
}

function NotesArt() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="3" width="14" height="18" rx="2" fill="#fff" />
            <rect x="5" y="3" width="14" height="6" rx="2" fill="#ffd60a" />
            <rect x="8" y="12" width="8" height="1.6" rx="0.8" fill="#c7c7cc" />
            <rect x="8" y="15" width="8" height="1.6" rx="0.8" fill="#c7c7cc" />
            <rect x="8" y="18" width="5" height="1.6" rx="0.8" fill="#c7c7cc" />
        </svg>
    );
}

function PhotosArt() {
    const petals = [0, 45, 90, 135, 180, 225, 270, 315];
    const colors = ['#ff9f0a', '#ffd60a', '#34c759', '#64d2ff', '#0a84ff', '#bf5af2', '#ff375f', '#ff6482'];
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            {petals.map((r, i) => (
                <ellipse
                    key={r}
                    cx="12"
                    cy="7.5"
                    rx="2.6"
                    ry="4.2"
                    fill={colors[i]}
                    opacity="0.85"
                    transform={`rotate(${r} 12 12)`}
                />
            ))}
        </svg>
    );
}

// Ubin warna per aplikasi seperti dock macOS (bukan seragam):
// tiap app punya identitas warna sendiri.
const APPS = [
    { to: '/cari', title: 'Baca', tile: 'linear-gradient(180deg,#ff9f0a,#ff6b00)', Art: BooksArt },
    { to: '/playlist', title: 'Playlist', tile: 'linear-gradient(180deg,#ff6482,#fc3c44)', Art: MusicArt },
    { to: '/riwayat', title: 'Riwayat', tile: 'linear-gradient(180deg,#0a84ff,#0060d0)', Art: CompassArt },
    { to: '/profil', title: 'Profil', tile: 'linear-gradient(180deg,#8e8e93,#636366)', Art: PersonArt },
    { to: '/catatan', title: 'Catatan', tile: 'linear-gradient(180deg,#ffffff,#e5e5ea)', Art: NotesArt },
    { to: '/wallpaper', title: 'Wallpaper', tile: 'linear-gradient(180deg,#ffffff,#d1d1d6)', Art: PhotosArt },
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
    // Seret jendela lewat titlebar seperti OS beneran.
    const [winPos, setWinPos] = useState(null);

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

    // Tanpa wallpaper custom = mac.jpg bawaan (bukan putih polos).
    const bg = wallpaper && wallpaper !== 'polos' ? wallpaper : '/mac.jpg';

    const dragStart = (e) => {
        if (winZoom || e.button !== undefined && e.button !== 0) return;
        const startX = e.clientX;
        const startY = e.clientY;
        const orig = winPos || { x: 0, y: 0 };
        const move = (ev) => {
            setWinPos({ x: orig.x + ev.clientX - startX, y: orig.y + ev.clientY - startY });
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

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
                {resume && (
                    <div
                        className={winZoom ? 'mac-window mac-zoom' : 'mac-window'}
                        role="group"
                        aria-label="Lanjutkan bacaan"
                        style={winPos && !winZoom ? { position: 'fixed', left: `calc(50% + ${winPos.x}px)`, top: `calc(30% + ${winPos.y}px)`, translate: '-50% 0', zIndex: 5, margin: 0 } : undefined}
                    >
                        <div className="mac-titlebar" onPointerDown={dragStart} style={{ touchAction: 'none', cursor: 'move' }}>
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
                            <span className="mac-icon" style={{ background: a.tile, scale }}>
                                <a.Art />
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
