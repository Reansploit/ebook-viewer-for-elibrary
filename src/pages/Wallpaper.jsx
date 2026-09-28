import { useState } from 'react';
import { deleteWallpaper, uploadWallpaper } from '../api.js';
import ViewerHeader from '../components/ViewerHeader.jsx';
import { useSession } from '../session.jsx';

// Wallpaper milik akun: foto custom (maks 2MB), tersimpan di backend
// sehingga berlaku di semua perangkat. Polos = latar putih.
export default function Wallpaper({ theme, toggle, wallpaper, setWallpaper }) {
    const { member, token } = useSession();
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

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
                theme={theme}
                toggle={toggle}
            />
            <main className="page">
                {wallpaper !== 'polos' && (
                    <img src={wallpaper} alt="Wallpaper saat ini" className="wp-preview" />
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
        </div>
    );
}
