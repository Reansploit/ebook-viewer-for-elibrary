import { useEffect, useState } from 'react';
import Controls from './components/Controls.jsx';
import Header from './components/Header.jsx';
import Viewport from './components/Viewport.jsx';
import { useEngine } from './engine/engine.jsx';
import { readerApi } from './api.js';
import { useHashRoute } from './router.jsx';
import { SessionProvider, useSession } from './session.jsx';
import { useTheme } from './theme.jsx';
import Browse from './pages/Browse.jsx';
import Catalog from './pages/Catalog.jsx';
import Display from './pages/Display.jsx';
import Gate from './pages/Gate.jsx';
import History from './pages/History.jsx';
import Menu from './pages/Menu.jsx';
import Playlists from './pages/Playlists.jsx';
import Profile from './pages/Profile.jsx';
import Search from './pages/Search.jsx';
import './index.css';

// Portal viewer: #/ gerbang/menu, #/katalog, #/semua, #/cari, #/baca,
// #/playlist, #/riwayat, #/profil, #/wallpaper, #/tema.
// Design Read: portal baca santri, tenang mengikuti elibrary.
// Dial ENERGY 1 / RHYTHM 1 / MOTION 1.
const demoSource = { title: 'Contoh Kitab', pageCount: 24 };

function Reader({ source, bookId, startPage, theme, toggle }) {
    const { token } = useSession();
    const engine = useEngine(source, startPage);
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
                <Header title={engine.title} page={engine.page} pageCount={engine.pageCount} theme={theme} toggle={toggle} />
                <main className="reader-viewport">
                    <p className="reader-state">Menyiapkan dokumen...</p>
                </main>
            </div>
        );
    }

    if (engine.status === 'error') {
        return (
            <div className="reader">
                <Header title={engine.title} page={engine.page} pageCount={engine.pageCount} theme={theme} toggle={toggle} />
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
        <div className="reader">
            <Header title={engine.title} page={engine.page} pageCount={engine.pageCount} theme={theme} toggle={toggle} />
            <Viewport page={engine.page} renderPage={engine.renderPage} />
            <Controls
                page={engine.page}
                pageCount={engine.pageCount}
                onPrev={engine.prev}
                onNext={engine.next}
                onGoTo={engine.goTo}
            />
            {token && bookId && (
                <div className="note-bar">
                    {!noteOpen ? (
                        <button type="button" className="btn-outline" onClick={() => setNoteOpen(true)}>
                            Catat halaman ini
                        </button>
                    ) : (
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
                    )}
                    {noteSaved && <p className="reader-state">Catatan tersimpan.</p>}
                </div>
            )}
        </div>
    );
}

function Shell() {
    const { path, params, go } = useHashRoute();
    const { token, authed, logout } = useSession();
    const { theme, toggle, setTheme } = useTheme();
    const [entered, setEntered] = useState(false);
    const [wallpaper, setWallpaperState] = useState('polos');
    // Buku yang dibuka dari hasil cari / riwayat / playlist.
    const [reading, setReading] = useState(null);

    // Keluar = kembali ke gerbang.
    useEffect(() => {
        if (!authed) setEntered(false);
    }, [authed]);

    // Pengaturan akun menimpa lokal saat masuk; perubahan ditulis balik.
    useEffect(() => {
        if (!token) return;
        readerApi(token, 'GET', '/api/v1/reader/settings')
            .then((s) => {
                if (s.theme === 'light' || s.theme === 'dark') setTheme(s.theme);
                if (s.wallpaper) setWallpaperState(s.wallpaper);
            })
            .catch((e) => {
                if (e.unauthorized) logout();
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const persistSettings = (patch) => {
        if (!token) return;
        readerApi(token, 'PUT', '/api/v1/reader/settings', patch).catch(() => {});
    };

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        toggle();
        persistSettings({ theme: next });
    };

    const setWallpaper = (id) => {
        setWallpaperState(id);
        persistSettings({ wallpaper: id });
    };

    const openBook = (book, startPage) => {
        setReading({ ...book, startPage: startPage || 1 });
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
    if (path === '/katalog') page = <Catalog go={go} theme={theme} toggle={toggleTheme} />;
    else if (path === '/semua') page = <Browse params={params} go={go} theme={theme} toggle={toggleTheme} />;
    else if (path === '/cari') page = <Search onRead={openBook} theme={theme} toggle={toggleTheme} />;
    else if (path === '/baca') {
        const source = reading
            ? { ...demoSource, title: reading.title, fileUrl: reading.file }
            : demoSource;
        page = (
            <Reader
                source={source}
                bookId={reading?.id || null}
                startPage={reading?.startPage || 1}
                theme={theme}
                toggle={toggleTheme}
            />
        );
    } else if (path === '/playlist')
        page = authedRoute(<Playlists theme={theme} toggle={toggleTheme} onRead={openBook} />);
    else if (path === '/riwayat')
        page = authedRoute(<History theme={theme} toggle={toggleTheme} onRead={openBook} />);
    else if (path === '/profil') page = authedRoute(<Profile theme={theme} toggle={toggleTheme} />);
    else if (path === '/wallpaper')
        page = authedRoute(
            <Display theme={theme} toggle={toggleTheme} wallpaper={wallpaper} setWallpaper={setWallpaper} section="wallpaper" />,
        );
    else if (path === '/tema')
        page = authedRoute(
            <Display theme={theme} toggle={toggleTheme} wallpaper={wallpaper} setWallpaper={setWallpaper} section="tema" />,
        );
    else if (!authed) page = <Gate onEnter={() => setEntered(true)} />;
    else if (!entered) page = <Gate onEnter={() => setEntered(true)} />;
    else page = <Menu theme={theme} toggle={toggleTheme} onRead={openBook} />;

    return <div className={`wp-${wallpaper}`}>{page}</div>;
}

export default function App() {
    return (
        <SessionProvider>
            <Shell />
        </SessionProvider>
    );
}
