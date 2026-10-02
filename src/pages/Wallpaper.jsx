import { useState } from 'react';
import { deleteWallpaper, readerApi, uploadWallpaper } from '../api.js';
import Footer from '../components/Footer.jsx';
import ViewerHeader from '../components/ViewerHeader.jsx';
import { useSession } from '../session.jsx';

// Wallpaper milik akun: bawaan (2 gelap, 2 terang, SVG ringan buatan
// sendiri agar offline + bebas lisensi) atau foto custom (maks 8MB).
// Tersimpan di backend sehingga berlaku semua perangkat. Polos = base.jpg.
const BUILT_IN = [
    { id: '/mac.jpg', name: 'Mac (bawaan)' },
    { id: '/wallpapers/malham.jpg', name: 'Malham (gelap)' },
    { id: '/wallpapers/golden.jpg', name: 'Golden (terang)' },
    { id: '/wallpapers/sur.jpg', name: 'Sur (terang)' },
];
export default function Wallpaper({ wallpaper, wpSrc, setWallpaper }) {
    const { member, token } = useSession();
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    // Wallpaper bawaan = simpan path-nya seperti custom (backend terima).
    const applyBuiltIn = async (id) => {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
            const data = await readerApi(token, 'PUT', '/api/v1/reader/settings', { wallpaper: id });
            setWallpaper(data.wallpaper);
        } catch {
            setError('Gagal menyimpan wallpaper.');
        } finally {
            setBusy(false);
        }
    };

    const save = async (e) => {
        e.preventDefault();
        if (!file || busy) return;
        setBusy(true);
        setError('');
        try {
            const data = await uploadWallpaper(token, file);
            setWallpaper(data.wallpaper);
            setFile(null);
        } catch {
            setError('Gagal mengunggah. Maksimal 8MB, format gambar.');
        } finally {
            setBusy(false);
        }
    };

    const reset = async () => {
        if (busy) return;
        setBusy(true);
        try {
            const data = await deleteWallpaper(token);
            setWallpaper(data.wallpaper);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="reader">
            <ViewerHeader
                library={member?.name || 'Perpustakaan WBS'}
                backTo="/"
                backLabel="Menu"
                right="Wallpaper"
               
               
            />
            <main className="page">
                <section className="section">
                    <h2 className="section-title">Bawaan</h2>
                    <div className="wp-builtin">
                        {BUILT_IN.map((w) => (
                            <button
                                key={w.id}
                                type="button"
                                className={String(wallpaper || '').endsWith(w.id) ? 'wp-thumb wp-active' : 'wp-thumb'}
                                onClick={() => applyBuiltIn(w.id)}
                                aria-pressed={String(wallpaper || '').endsWith(w.id)}
                            >
                                <img src={w.id} alt={w.name} loading="lazy" />
                                <span>{w.name}</span>
                            </button>
                        ))}
                    </div>
                </section>
                {wallpaper !== 'polos' && !BUILT_IN.some((w) => String(wallpaper || '').endsWith(w.id)) && (
                    <img src={wpSrc !== 'polos' ? wpSrc : wallpaper} alt="Wallpaper saat ini" className="wp-preview" />
                )}
                <form className="section" onSubmit={save}>
                    <label className="section-title" htmlFor="wp-file">
                        Foto custom
                    </label>
                    <input
                        id="wp-file"
                        className="search-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <div className="gate-actions">
                        <button type="submit" className="btn-solid" disabled={!file || busy}>
                            {busy ? 'Mengunggah...' : 'Pasang'}
                        </button>
                        {wallpaper !== 'polos' && (
                            <button type="button" className="btn-outline" onClick={reset} disabled={busy}>
                                Kembali polos
                            </button>
                        )}
                    </div>
                </form>
                {error && (
                    <div className="reader-state">
                        <p>{error}</p>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
