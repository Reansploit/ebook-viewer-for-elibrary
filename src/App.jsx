import { useEffect, useRef, useState } from 'react';
import Controls from './components/Controls.jsx';
import Header from './components/Header.jsx';
import Viewport from './components/Viewport.jsx';
import { useEngine } from './engine/engine.jsx';
import { readerApi } from './api.js';
import { useHashRoute } from './router.jsx';
import { SessionProvider, useSession } from './session.jsx';
import { detectTone } from './wp.js';
import { useTheme } from './theme.jsx';
import Browse from './pages/Browse.jsx';
import Catalog from './pages/Catalog.jsx';
import Wallpaper from './pages/Wallpaper.jsx';
import Gate from './pages/Gate.jsx';
import Continue from './pages/Continue.jsx';
import History from './pages/History.jsx';
import Menu from './pages/Menu.jsx';
import Notes from './pages/Notes.jsx';
import Playlists from './pages/Playlists.jsx';
import Profile from './pages/Profile.jsx';
import Search from './pages/Search.jsx';
import './index.css';

// Portal viewer: #/ gerbang/menu, #/katalog, #/semua, #/cari, #/baca,
// #/playlist, #/riwayat, #/profil, #/wallpaper, #/tema.
// Design Read: portal baca santri, tenang mengikuti elibrary.
// Dial ENERGY 1 / RHYTHM 1 / MOTION 1.
const demoSource = { title: 'Contoh Kitab', pageCount: 24 };

function Reader({ source, bookId, startPage }) {
    const { token } = useSession();
    const engine = useEngine(source, startPage);
    // Mata = layar hangat saja. Penuh = fullscreen browser beneran.
    // Dua mode terpisah sesuai permintaan.
    const [warm, setWarm] = useState(false);
    const [full, setFull] = useState(false);
    const readerRef = useRef(null);
    const [noteOpen, setNoteOpen] = useState(false);
    const [note, setNote] = useState('');
    const [noteSaved, setNoteSaved] = useState(false);

    // Buka buku = catat riwayat + simpan progres (hanya saat masuk akun).
    useEffect(() => {
        if (!token || !bookId) return;
        readerApi(token, 'POST', '/api/v1/reader/history', { id_buku: bookId }).catch(() => {});
        readerApi(token, 'POST', '/api/v1/reader/progress', {
            id_buku: bookId,
            page: startPage || 1,
            status: 'baca',
        }).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, bookId]);

    // Pindah halaman = simpan halaman terakhir (hanya saat masuk akun).
    useEffect(() => {
        if (!token || !bookId) return;
        const timer = setTimeout(() => {
            readerApi(token, 'POST', '/api/v1/reader/progress', {
                id_buku: bookId,
                page: engine.page,
                status: 'baca',
            }).catch(() => {});
        }, 1500);
        return () => clearTimeout(timer);
    }, [token, bookId, engine.page]);

    useEffect(() => {
        document.body.style.background = warm ? '#F4ECD8' : '';
        return () => {
            document.body.style.background = '';
        };
    }, [warm]);

    useEffect(() => {
        const onChange = () => setFull(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const toggleFull = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        } else {
            readerRef.current?.requestFullscreen?.().catch(() => {});
        }
    };

    const saveNote = (e) => {
        e.preventDefault();
        const text = note.trim();
        if (!text || !token || !bookId) return;
        readerApi(token, 'POST', '/api/v1/reader/notes', {
            id_buku: bookId,
            page: engine.page,
            catatan: text,
        })
            .then(() => {
                setNote('');
                setNoteSaved(true);
                setTimeout(() => setNoteSaved(false), 2500);
            })
            .catch(() => {});
    };

    if (engine.status === 'loading') {
        return (
            <div className="reader">
                <Header title={engine.title} page={engine.page} pageCount={engine.pageCount} warm={warm} onWarm={() => setWarm((w) => !w)} onFull={toggleFull} full={full} />
                <main className="reader-viewport">
                    <p className="reader-state">
                        Menyiapkan dokumen{engine.progress !== null && engine.progress !== undefined ? `... ${engine.progress}%` : '...'}
                    </p>
                </main>
            </div>
        );
    }

    if (engine.status === 'error') {
        return (
            <div className="reader">
                <Header title={engine.title} page={engine.page} pageCount={engine.pageCount} warm={warm} onWarm={() => setWarm((w) => !w)} onFull={toggleFull} full={full} />
                <main className="reader-viewport">
                    <div className="reader-state">
                        <p>Dokumen gagal dibuka{engine.error ? `: ${engine.error}` : '.'}</p>
                        <p className="page-placeholder-sub">Periksa berkasnya lalu muat ulang halaman ini.</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div ref={readerRef} className={warm ? 'reader reading-warm' : 'reader'}>
            <Header
                title={engine.title}
                page={engine.page}
                pageCount={engine.pageCount}
                warm={warm}
                onWarm={() => setWarm((w) => !w)}
                onFull={toggleFull}
                full={full}
            />
            <Viewport page={engine.page} renderPage={engine.renderPage} onPrev={engine.prev} onNext={engine.next} />
            <Controls
                page={engine.page}
                pageCount={engine.pageCount}
                onPrev={engine.prev}
                onNext={engine.next}
                onGoTo={engine.goTo}
            />
            <div className="note-bar">
                {token && bookId && !noteOpen && (
                    <button type="button" className="btn-outline" onClick={() => setNoteOpen(true)}>
                        Catat halaman ini
                    </button>
                )}
            </div>
            {token && bookId && noteOpen && (
                <div className="note-bar">
                    <form className="note-form" onSubmit={saveNote}>
                        <label className="reader-jump-label" htmlFor="note-text">
                            Catatan halaman {engine.page}
                        </label>
                        <input
                            id="note-text"
                            className="search-input"
                            type="text"
                            placeholder={`Catatan halaman ${engine.page}`}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                        <button type="submit" className="btn-solid">
                            Simpan
                        </button>
                    </form>
                    {noteSaved && <p className="reader-state">Catatan tersimpan.</p>}
                </div>
            )}
        </div>
    );
}

function Shell() {
    const { path, params, go } = useHashRoute();
    const { token, authed, logout } = useSession();
    const { setTheme } = useTheme();
    // Status masuk bertahan lewat refresh (tokennya pun begitu).
    // Keluar benar = tombol Keluar di Profil (logout menghapus ini).
    const [entered, setEntered] = useState(() => {
        try {
            return localStorage.getItem('reader_entered') === '1';
        } catch {
            return false;
        }
    });
    const enter = () => {
        setEntered(true);
        try {
            localStorage.setItem('reader_entered', '1');
        } catch {
            // abaikan
        }
    };
    // Wallpaper milik akun: 'polos' atau URL foto. Polos = latar putih.
    const [wallpaper, setWallpaperState] = useState('polos');
    // Aset milik viewer (mac.jpg, base.jpg, wallpapers/*) tidak pernah
    // absolut ke elibrary: normalkan URL basi dari sesi lama.
    const setWallpaper = (v) => {
        if (typeof v === 'string') {
            const path = v.includes('://') ? new URL(v).pathname : v;
            if (path === '/mac.jpg' || path === '/base.jpg' || path.startsWith('/wallpapers/')) {
                v = path;
            }
        }
        setWallpaperState(v);
    };
    // Buku yang dibuka: bertahan lewat refresh (kalau tidak, jatuh ke demo).
    const [reading, setReading] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('reading_book') || 'null');
        } catch {
            return null;
        }
    });

    // Keluar = kembali ke gerbang.
    useEffect(() => {
        if (!authed) {
            setEntered(false);
            try {
                localStorage.removeItem('reader_entered');
            } catch {
                // abaikan
            }
        }
    }, [authed]);

    // Wallpaper akun dimuat saat masuk; tema mengikuti terang-gelapnya.
    // Tanpa toggle manual: foto gelap = mode gelap, foto terang/polos = terang.
    useEffect(() => {
        if (!token) {
            setWallpaper('polos');
            setTheme('light');
            return;
        }
        readerApi(token, 'GET', '/api/v1/reader/settings')
            .then((s) => {
                const wp = typeof s.wallpaper === 'string' && s.wallpaper !== '' ? s.wallpaper : 'polos';
                setWallpaper(wp);
                if (wp === 'polos') {
                    setTheme('light');
                } else {
                    detectTone(wp).then((t) => setTheme(t));
                }
            })
            .catch((e) => {
                if (e.unauthorized) logout();
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const openBook = (book, startPage) => {
        const next = { id: book.id, title: book.title, file: book.file || null, startPage: startPage || 1 };
        setReading(next);
        try {
            localStorage.setItem('reading_book', JSON.stringify(next));
        } catch {
            // abaikan
        }
        go('/baca');
    };

    const authedRoute = (el) => {
        if (!authed || !entered) {
            go('/');
            return null;
        }
        return el;
    };

    let page = null;
    if (path === '/katalog') page = <Catalog go={go} />;
    else if (path === '/semua') page = <Browse params={params} go={go} />;
    else if (path === '/cari') page = <Search onRead={openBook} />;
    else if (path === '/baca') {
        const source = reading
            ? { ...demoSource, title: reading.title, fileUrl: reading.file }
            : demoSource;
        page = (
            <Reader
                source={source}
                bookId={reading?.id || null}
                startPage={reading?.startPage || 1}
               
               
            />
        );
    } else if (path === '/playlist')
        page = authedRoute(<Playlists onRead={openBook} />);
    else if (path === '/lanjutkan')
        page = authedRoute(<Continue onRead={openBook} />);
    else if (path === '/riwayat')
        page = authedRoute(<History onRead={openBook} />);
    else if (path === '/profil') page = authedRoute(<Profile />);
    else if (path === '/catatan') page = authedRoute(<Notes />);
    else if (path === '/wallpaper')
        page = authedRoute(
            <Wallpaper wallpaper={wallpaper} setWallpaper={setWallpaper} />,
        );
    else if (!authed) page = <Gate onEnter={enter} />;
    else if (!entered) page = <Gate onEnter={enter} />;
    else page = <Menu onRead={openBook} wallpaper={wallpaper} route={path} onLock={() => setEntered(false)} />;

    return <>{page}</>;
}

export default function App() {
    return (
        <SessionProvider>
            <Shell />
        </SessionProvider>
    );
}
