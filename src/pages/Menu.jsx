import { useEffect, useRef, useState } from 'react';
import { api, readerApi } from '../api.js';
import { useHashRoute } from '../router.jsx';
import { CatatanBody, MacWindow, WinOpen } from '../components/AppWindow.jsx';
import { useSession } from '../session.jsx';
import { useTheme } from '../theme.jsx';
import { detectTone } from '../wp.js';

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
    return { date, time, now };
}

// Kisi kalender bulan berjalan, Senin dulu (id-ID).
// Sel kosong mengisi hari sebelum tanggal 1.
const CAL_WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function monthCells(year, month) {
    const first = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= count; d++) cells.push(d);
    return cells;
}

// Panel jam + kalender: jam besar detik hidup, tanggal penuh,
// kisi bulan ini dengan hari ini ditandai. Alasan (R-31): pembaca
// cek waktu tanpa keluar menu, gaya panel notifikasi macOS.
// marks = Set 'y-m-d' tanggal berriwayat baca bulan ini (titik di bawah angka).
function ClockPanel({ now, open, marks }) {
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const fullDate = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const bigTime = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    const cells = monthCells(year, month);
    const monthCount = marks ? cells.filter((d) => d !== null && marks.has(`${year}-${month}-${d}`)).length : 0;
    return (
        <span
            className={open ? 'mac-clockpop open' : 'mac-clockpop'}
            role="dialog"
            aria-hidden={!open}
            aria-label={`Jam dan kalender: ${fullDate}`}
        >
            <span className="mac-clockbig">{bigTime}</span>
            <span className="mac-clockfull">{fullDate}</span>
            <span className="mac-calhead">{monthName}</span>
            <span className="mac-calgrid" aria-hidden="true">
                {CAL_WEEKDAYS.map((w) => (
                    <span key={w} className="mac-calweek">
                        {w}
                    </span>
                ))}
                {cells.map((d, i) =>
                    d === null ? (
                        <span key={`e-${i}`} className="mac-calday" />
                    ) : (
                        <span key={d} className={d === now.getDate() ? 'mac-calday mac-caltoday' : 'mac-calday'}>
                            {d}
                            {marks?.has(`${year}-${month}-${d}`) && <span className="mac-caldot" />}
                        </span>
                    ),
                )}
            </span>
            {monthCount > 0 && <span className="mac-calfoot">{monthCount} hari membaca bulan ini</span>}
        </span>
    );
}

// Spotlight: cari cepat ala macOS, hasil digital langsung dibuka.
// Alasan (R-31): jalan tercepat ke buku tanpa pindah halaman dulu.
function Spotlight({ open, onClose, onRead }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [active, setActive] = useState(0);
    const timer = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        setQuery('');
        setResults(null);
        setSearching(false);
        setActive(0);
        const t = setTimeout(() => inputRef.current?.focus(), 30);
        return () => clearTimeout(t);
    }, [open]);

    useEffect(() => () => clearTimeout(timer.current), []);

    const liveSearch = (q) => {
        setQuery(q);
        setActive(0);
        clearTimeout(timer.current);
        if (q.trim().length < 2) {
            setResults(null);
            setSearching(false);
            return;
        }
        setSearching(true);
        timer.current = setTimeout(() => {
            api.search(q.trim(), '1')
                .then((d) => {
                    setResults(d.books || []);
                    setSearching(false);
                })
                .catch(() => setSearching(false));
        }, 350);
    };

    const openBook = (b) => {
        if (!b || !b.file) return;
        onClose();
        onRead(b, 1);
    };

    const onKey = (e) => {
        if (e.key === 'Escape') {
            onClose();
            return;
        }
        if (!results || results.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => (a + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => (a - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            openBook(results[active]);
        }
    };

    if (!open) return null;
    return (
        <div className="spot-overlay" onClick={onClose}>
            <div
                className="spot-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Cari cepat buku"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={onKey}
            >
                <div className="spot-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5" />
                    </svg>
                    <input
                        ref={inputRef}
                        className="spot-input"
                        type="text"
                        value={query}
                        onChange={(e) => liveSearch(e.target.value)}
                        placeholder="Cari judul atau pengarang"
                        aria-label="Kata kunci buku"
                        autoComplete="off"
                    />
                    {searching && <span className="spot-state">Mencari...</span>}
                </div>
                {query.trim().length >= 2 && !searching && results && results.length === 0 && (
                    <p className="spot-state">Tidak ditemukan. Coba kata kunci lain.</p>
                )}
                {results && results.length > 0 && (
                    <ul className="spot-list">
                        {results.slice(0, 7).map((b, i) => (
                            <li key={b.id}>
                                <button
                                    type="button"
                                    className={i === active ? 'spot-item spot-item-active' : 'spot-item'}
                                    onMouseEnter={() => setActive(i)}
                                    onClick={() => openBook(b)}
                                    disabled={!b.file}
                                    title={!b.file ? 'Belum ada berkas digital' : b.title}
                                >
                                    <span className="spot-title">{b.title}</span>
                                    {(b.author || b.pengarang) && (
                                        <span className="spot-meta">{b.author || b.pengarang}</span>
                                    )}
                                    {!b.file && <span className="spot-meta">Fisik saja</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <p className="spot-hint">Panah pilih, Enter buka, Esc tutup</p>
            </div>
        </div>
    );
}

// Control Center: wallpaper cepat + aksi cepat dari bar menu.
// Alasan (R-31): yang sering diubah (wallpaper, layar penuh) tidak
// perlu pindah halaman. PUT sama seperti halaman Wallpaper.
const CC_WALLPAPERS = [
    { id: 'polos', name: 'Polos' },
    { id: '/mac.jpg', name: 'Mac' },
    { id: '/wallpapers/malham.jpg', name: 'Malham' },
    { id: '/wallpapers/golden.jpg', name: 'Golden' },
    { id: '/wallpapers/sur.jpg', name: 'Sur' },
];

function ControlCenter({ open, wallpaper, setWallpaper, onLock, onSpotlight }) {
    const { token } = useSession();
    const { setTheme } = useTheme();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [full, setFull] = useState(() => !!document.fullscreenElement);

    useEffect(() => {
        if (!open) return undefined;
        const onChange = () => setFull(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, [open]);

    const pick = async (id) => {
        if (!token || busy) return;
        setBusy(true);
        setError('');
        try {
            const data = await readerApi(token, 'PUT', '/api/v1/reader/settings', { wallpaper: id });
            setWallpaper(data.wallpaper);
            if (data.wallpaper === 'polos') setTheme('light');
            else detectTone(data.wallpaper).then((t) => setTheme(t));
        } catch {
            setError('Gagal menyimpan wallpaper.');
        } finally {
            setBusy(false);
        }
    };

    const toggleFull = () => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else document.documentElement.requestFullscreen?.().catch(() => {});
    };

    const current =
        wallpaper === 'polos'
            ? 'polos'
            : (CC_WALLPAPERS.find((w) => w.id !== 'polos' && String(wallpaper || '').endsWith(w.id))?.id ||
                'custom');

    return (
        <span className={open ? 'cc-panel open' : 'cc-panel'} aria-hidden={!open}>
            <span className="cc-title">Wallpaper</span>
            <span className="cc-wallpapers">
                {CC_WALLPAPERS.map((w) => (
                    <button
                        key={w.id}
                        type="button"
                        tabIndex={open ? 0 : -1}
                        className={current === w.id ? 'cc-wp cc-wp-active' : 'cc-wp'}
                        aria-pressed={current === w.id}
                        aria-label={`Wallpaper ${w.name}`}
                        title={token ? w.name : 'Masuk untuk ganti wallpaper'}
                        disabled={busy || !token}
                        onClick={() => pick(w.id)}
                    >
                        {w.id === 'polos' ? <span className="cc-wp-polos" aria-hidden="true" /> : <img src={w.id} alt="" loading="lazy" />}
                    </button>
                ))}
            </span>
            {!token && <span className="cc-note">Masuk untuk ganti wallpaper.</span>}
            {token && current === 'custom' && <span className="cc-note">Foto custom terpasang.</span>}
            {error && <span className="cc-note">{error}</span>}
            <span className="cc-title">Cepat</span>
            <span className="cc-actions">
                <button type="button" tabIndex={open ? 0 : -1} onClick={onSpotlight}>
                    Cari cepat
                </button>
                <button type="button" tabIndex={open ? 0 : -1} onClick={toggleFull}>
                    {full ? 'Keluar penuh' : 'Layar penuh'}
                </button>
                <button type="button" tabIndex={open ? 0 : -1} onClick={onLock}>
                    Kunci
                </button>
            </span>
        </span>
    );
}

export default function Menu({ onRead, wallpaper, setWallpaper, route, onLock }) {
    const { member, token, logout } = useSession();
    const { date, time, now } = useClock();
    const [resume, setResume] = useState(null);
    const [dismissed, setDismissed] = useState([]);
    // Tanggal berriwayat baca bulan ini ('y-m-d' lokal) untuk titik kalender.
    // null = tamu / belum dimuat: kalender tetap jalan tanpa titik.
    const [readDays, setReadDays] = useState(null);
    const [powerOpen, setPowerOpen] = useState(false);
    // Panel jam/kalender: hover buka (macOS), klik untuk sentuh.
    const [clockOpen, setClockOpen] = useState(false);
    // Spotlight: Ctrl+K / Cmd+K global di desktop ini.
    const [spotOpen, setSpotOpen] = useState(false);
    // Control Center: panel wallpaper + aksi cepat.
    const [ccOpen, setCcOpen] = useState(false);
    const { go } = useHashRoute();
    // Jendela aplikasi: `to` yang terbuka (urutan = tumpuk z) + yang diringkas.
    const [wins, setWins] = useState([]);
    const [minWins, setMinWins] = useState([]);
    // Bacaan terakhir untuk jendela Riwayat.
    const [lastRead, setLastRead] = useState(null);

    const toggleWin = (to) => {
        setWins((w) => (w.includes(to) ? [...w.filter((x) => x !== to), to] : [...w, to]));
    };
    const focusWin = (to) => {
        setWins((w) => (w.includes(to) ? [...w.filter((x) => x !== to), to] : w));
    };
    const closeWin = (to) => {
        setWins((w) => w.filter((x) => x !== to));
        setMinWins((m) => m.filter((x) => x !== to));
    };
    const minWin = (to) => {
        setMinWins((m) => (m.includes(to) ? m.filter((x) => x !== to) : [...m, to]));
    };

    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setSpotOpen((o) => !o);
            } else if (e.key === 'Escape') {
                setSpotOpen(false);
                setCcOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);
    // Pembesaran dock ala macOS: ikon dekat kursor membesar mulus.
    // Mousemove dibatasi satu per frame agar tidak patah-patah.
    const [mouseX, setMouseX] = useState(null);
    const dockRef = useRef(null);
    const rafRef = useRef(0);

    useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

    const trackMouse = (e) => {
        const x = e.clientX;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => setMouseX(x));
    };
    // Jendela lanjutkan: minimize = ciutkan isi, zoom = lebarkan.
    const [winMin, setWinMin] = useState(false);
    const [winZoom, setWinZoom] = useState(false);
    // Seret jendela lewat titlebar seperti OS beneran. Lebar dikunci
    // saat mulai diseret agar tidak menciut.
    const [winPos, setWinPos] = useState(null);
    const [winW, setWinW] = useState(null);
    // Lebar normal terakhir (untuk kembali dari zoom saat diseret).
    const normalW = useRef(null);
    const winRef = useRef(null);

    const dismiss = (bookId) => {
        setDismissed((d) => (d.includes(bookId) ? d : [...d, bookId]));
        setResume(null);
    };

    useEffect(() => {
        if (!token) {
            setReadDays(null);
            setLastRead(null);
            return;
        }
        readerApi(token, 'GET', '/api/v1/reader/history')
            .then((d) => {
                const days = new Set();
                for (const h of d.history || []) {
                    const t = new Date(h.at);
                    if (!Number.isNaN(t)) days.add(`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`);
                }
                setReadDays(days);
                setLastRead((d.history || [])[0] || null);
            })
            .catch(() => {});
    }, [token]);

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

    // Lencana playlist: total isi daftar + simpanan (data nyata, 0 = sembunyi).
    const [plCount, setPlCount] = useState(0);
    // Ikon Baca memantul sekali saat jendela Lanjutkan muncul.
    const [bounce, setBounce] = useState(null);

    useEffect(() => {
        if (!token) {
            setPlCount(0);
            return undefined;
        }
        let live = true;
        Promise.all([
            readerApi(token, 'GET', '/api/v1/reader/lists').catch(() => ({ lists: [] })),
            readerApi(token, 'GET', '/api/v1/reader/saves').catch(() => ({ saves: [] })),
        ]).then(([l, s]) => {
            if (!live) return;
            setPlCount(
                (l.lists || []).reduce((t, x) => t + (Number(x.count) || 0), 0) + (s.saves || []).length,
            );
        });
        return () => {
            live = false;
        };
    }, [token]);

    useEffect(() => {
        if (!resume) return undefined;
        setBounce('/cari');
        const t = setTimeout(() => setBounce(null), 850);
        return () => clearTimeout(t);
    }, [resume]);

    // Banner "Terakhir dibaca": muncul sekali tiap ada lanjutan,
    // hilang sendiri 10 detik atau ditutup. Alasan (R-31): menyapa
    // saat masuk seperti notifikasi macOS, jendela tetap jadi jalur tetap.
    const [noticeGone, setNoticeGone] = useState(false);

    useEffect(() => {
        setNoticeGone(false);
        if (!resume) return undefined;
        const t = setTimeout(() => setNoticeGone(true), 10000);
        return () => clearTimeout(t);
    }, [resume]);

    // Tanpa wallpaper custom = mac.jpg bawaan (bukan putih polos).
    const bg = wallpaper && wallpaper !== 'polos' ? wallpaper : '/mac.jpg';

    const dragStart = (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        const el = winRef.current;
        if (!el) return;
        // Maximize ikut bisa diseret ala macOS: keluar zoom dulu.
        if (winZoom) {
            setWinZoom(false);
            if (normalW.current) setWinW(normalW.current);
        } else {
            setWinW(el.offsetWidth);
        }
        // Jangkar dari posisi visual saat ini (bukan 0,0) agar tidak teleport.
        const rect = el.getBoundingClientRect();
        const base = {
            x: rect.left + rect.width / 2 - window.innerWidth / 2,
            y: rect.top - window.innerHeight * 0.3,
        };
        setWinPos(base);
        normalW.current = el.offsetWidth;
        const startX = e.clientX;
        const startY = e.clientY;
        const orig = base;
        // Containment ala jQuery UI: jendela tidak boleh hilang dari layar.
        const clamp = (x, y) => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            return {
                x: Math.min(vw / 2 - 140, Math.max(-(vw / 2 - 140), x)),
                y: Math.min(vh * 0.7 - 120, Math.max(-(vh * 0.3 - 80), y)),
            };
        };
        const move = (ev) => {
            setWinPos(clamp(orig.x + ev.clientX - startX, orig.y + ev.clientY - startY));
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    // Isi per jendela aplikasi: status nyata + tombol yang jalan.
    // Zoom (hijau) selalu mengarah ke halaman penuhnya.
    const winDef = (to) => {
        const zoom = () => go(to);
        if (to === '/cari')
            return {
                title: 'Baca',
                body: (
                    <>
                        <span className="win-status">
                            {resume ? `${resume.book.title} — halaman ${resume.page}` : 'Cari ebook lalu baca di sini.'}
                        </span>
                        <span className="win-actions">
                            <button type="button" className="win-openbtn" onClick={() => go('/cari')}>
                                Cari ebook
                            </button>
                            <WinOpen onZoom={zoom} />
                        </span>
                    </>
                ),
                mini: (
                    <>
                        <span className="win-status">{resume ? `Hal. ${resume.page}` : 'Baca'}</span>
                        <WinOpen onZoom={zoom}>Buka</WinOpen>
                    </>
                ),
            };
        if (to === '/playlist')
            return {
                title: 'Playlist',
                body: (
                    <>
                        <span className="win-status">
                            {token ? `${plCount} simpanan di daftar dan tandaan` : 'Masuk untuk memakai playlist.'}
                        </span>
                        <WinOpen onZoom={zoom} />
                    </>
                ),
                mini: (
                    <>
                        <span className="win-status">{token ? `${plCount} simpanan` : 'Playlist'}</span>
                        <WinOpen onZoom={zoom}>Buka</WinOpen>
                    </>
                ),
            };
        if (to === '/riwayat') {
            const last = lastRead
                ? `${lastRead.book.title} — ${new Date(lastRead.at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`
                : 'Belum ada riwayat.';
            return {
                title: 'Riwayat',
                body: (
                    <>
                        <span className="win-status">{last}</span>
                        <WinOpen onZoom={zoom} />
                    </>
                ),
                mini: (
                    <>
                        <span className="win-status">{token ? last : 'Riwayat'}</span>
                        <WinOpen onZoom={zoom}>Buka</WinOpen>
                    </>
                ),
            };
        }
        if (to === '/profil')
            return {
                title: 'Profil',
                body: (
                    <>
                        <span className="win-status">{member?.name ? `Masuk sebagai ${member.name}` : 'Belum masuk.'}</span>
                        <WinOpen onZoom={zoom} />
                    </>
                ),
                mini: (
                    <>
                        <span className="win-status">{member?.name || 'Profil'}</span>
                        <WinOpen onZoom={zoom}>Buka</WinOpen>
                    </>
                ),
            };
        if (to === '/catatan')
            return {
                title: 'Catatan',
                body: <CatatanBody onZoom={zoom} />,
                mini: (
                    <>
                        <span className="win-status">Catatan</span>
                        <WinOpen onZoom={zoom}>Buka</WinOpen>
                    </>
                ),
            };
        const wpName =
            wallpaper === 'polos'
                ? 'Polos'
                : (CC_WALLPAPERS.find((w) => w.id !== 'polos' && String(wallpaper || '').endsWith(w.id))?.name ||
                    'Foto custom');
        return {
            title: 'Wallpaper',
            body: (
                <>
                    <img
                        src={wallpaper === 'polos' ? '/mac.jpg' : wallpaper}
                        alt={`Wallpaper ${wpName}`}
                        className="win-wp"
                        loading="lazy"
                    />
                    <span className="win-status">{wpName}</span>
                    <WinOpen onZoom={zoom} />
                </>
            ),
            mini: (
                <>
                    <span className="win-status">{wpName}</span>
                    <WinOpen onZoom={zoom}>Buka</WinOpen>
                </>
            ),
        };
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
                    <button
                        type="button"
                        className="mac-spotbtn"
                        aria-label="Cari cepat buku"
                        title="Cari cepat (Ctrl+K)"
                        onClick={() => {
                            setClockOpen(false);
                            setPowerOpen(false);
                            setCcOpen(false);
                            setSpotOpen(true);
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" />
                            <path d="m20 20-3.5-3.5" />
                        </svg>
                    </button>
                    <span
                        className="mac-clockwrap"
                        onMouseEnter={() => setClockOpen(true)}
                        onMouseLeave={() => setClockOpen(false)}
                    >
                        <button
                            type="button"
                            className="mac-clockbtn"
                            aria-expanded={clockOpen}
                            aria-haspopup="dialog"
                            aria-label="Tampilkan jam dan kalender"
                            onClick={() => {
                                setPowerOpen(false);
                                setCcOpen(false);
                                setClockOpen((o) => !o);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setClockOpen(false);
                            }}
                        >
                            {date} {time}
                        </button>
                        <ClockPanel now={now} open={clockOpen} marks={readDays} />
                    </span>
                    <button
                        type="button"
                        className="mac-spotbtn"
                        aria-label="Pusat kontrol"
                        title="Pusat kontrol"
                        aria-expanded={ccOpen}
                        onClick={() => {
                            setClockOpen(false);
                            setPowerOpen(false);
                            setSpotOpen(false);
                            setCcOpen((o) => !o);
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M4 8h10M18 8h2M4 16h2M10 16h10" strokeLinecap="round" />
                            <circle cx="16" cy="8" r="2.2" />
                            <circle cx="8" cy="16" r="2.2" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        className="os-exit"
                        onClick={() => {
                            setClockOpen(false);
                            setCcOpen(false);
                            setPowerOpen((o) => !o);
                        }}
                        aria-expanded={powerOpen}
                        aria-label="Menu daya"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M12 3v9" strokeLinecap="round" />
                            <path d="M6.3 6.5a8 8 0 1 0 11.4 0" strokeLinecap="round" />
                        </svg>
                    </button>
                    <span className={powerOpen ? 'os-menu open' : 'os-menu'} aria-hidden={!powerOpen}>
                        <button type="button" tabIndex={powerOpen ? 0 : -1} onClick={() => { setPowerOpen(false); onLock(); }}>
                            Kunci
                        </button>
                        <button type="button" tabIndex={powerOpen ? 0 : -1} onClick={logout}>
                            Keluar
                        </button>
                    </span>
                    <ControlCenter
                        open={ccOpen}
                        wallpaper={wallpaper}
                        setWallpaper={setWallpaper}
                        onLock={() => {
                            setCcOpen(false);
                            onLock();
                        }}
                        onSpotlight={() => {
                            setCcOpen(false);
                            setSpotOpen(true);
                        }}
                    />
                </span>
            </header>

            <Spotlight open={spotOpen} onClose={() => setSpotOpen(false)} onRead={onRead} />

            {resume && !noticeGone && (
                <div
                    className="mac-notice"
                    role="status"
                    aria-label={`Terakhir dibaca ${resume.book.title}, halaman ${resume.page}`}
                >
                    <button
                        type="button"
                        className="mac-notice-main"
                        onClick={() => onRead(resume.book, resume.page)}
                    >
                        <span className="mac-notice-label">Terakhir dibaca</span>
                        <span className="mac-notice-title">{resume.book.title}</span>
                        <span className="mac-notice-meta">Halaman {resume.page} — ketuk untuk lanjut</span>
                    </button>
                    <button
                        type="button"
                        className="mac-notice-close"
                        aria-label="Tutup pemberitahuan"
                        onClick={() => setNoticeGone(true)}
                    >
                        <span aria-hidden="true">×</span>
                    </button>
                </div>
            )}

            <main className="os-desktop">
                {wins.map((to, i) => {
                    const def = winDef(to);
                    return (
                        <MacWindow
                            key={to}
                            title={def.title}
                            order={i}
                            minimized={minWins.includes(to)}
                            onFocus={() => focusWin(to)}
                            onClose={() => closeWin(to)}
                            onToggleMin={() => minWin(to)}
                            onZoom={() => go(to)}
                            mini={def.mini}
                        >
                            {def.body}
                        </MacWindow>
                    );
                })}
                {resume && (
                    <div
                        ref={winRef}
                        className={winZoom ? 'mac-window mac-zoom' : 'mac-window'}
                        role="group"
                        aria-label="Lanjutkan bacaan"
                        style={
                            winPos && !winZoom
                                ? {
                                    position: 'fixed',
                                    left: `calc(50% + ${winPos.x}px)`,
                                    top: `calc(30% + ${winPos.y}px)`,
                                    translate: '-50% 0',
                                    zIndex: 5,
                                    margin: 0,
                                    width: winW || undefined,
                                }
                                : undefined
                        }
                    >
                        <div className="mac-titlebar" onPointerDown={dragStart} style={{ touchAction: 'none', cursor: 'move' }}>
                            <span className="mac-traffic">
                                <button type="button" className="mac-dot mac-close" onClick={() => dismiss(resume.book.id)} aria-label="Tutup">
                                    <span aria-hidden="true">×</span>
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
                onMouseMove={trackMouse}
                onMouseLeave={() => setMouseX(null)}
            >
                {APPS.map((a, i) => {
                    let scale = 1;
                    let push = 0;
                    if (mouseX !== null && dockRef.current) {
                        const kids = dockRef.current.children;
                        const el = kids[i];
                        if (el) {
                            const r = el.getBoundingClientRect();
                            const center = r.left + r.width / 2;
                            const dist = Math.abs(mouseX - center);
                            const near = Math.max(0, 1 - dist / 120);
                            scale = 1 + 0.6 * near;
                            // Ikon tetangga minggir menjauhi kursor.
                            push = Math.sign(center - mouseX || 1) * 14 * Math.max(0, 1 - dist / 140);
                        }
                    }
                    return (
                        <button
                            key={a.to}
                            type="button"
                            onClick={() => toggleWin(a.to)}
                            onDoubleClick={() => go(a.to)}
                            className={
                                (route === a.to || wins.includes(a.to) ? 'mac-app mac-active' : 'mac-app') +
                                (bounce === a.to ? ' mac-bounce' : '')
                            }
                            aria-label={
                                a.to === '/playlist' && plCount > 0
                                    ? `${a.title}, ${plCount} simpanan`
                                    : a.title
                            }
                            title={`${a.title} (klik ganda untuk buka penuh)`}
                        >
                            <span className="mac-tip" aria-hidden="true">
                                {a.title}
                            </span>
                            <span className="mac-icon" style={{ background: a.tile, scale, translate: `${push}px 0` }}>
                                <a.Art />
                            </span>
                            {a.to === '/playlist' && plCount > 0 && (
                                <span className="mac-badge" aria-hidden="true">
                                    {plCount > 99 ? '99+' : plCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
