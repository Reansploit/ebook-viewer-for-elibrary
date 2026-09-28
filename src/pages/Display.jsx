import ViewerHeader from '../components/ViewerHeader.jsx';
import { useSession } from '../session.jsx';

// Kustomisasi milik akun: wallpaper portal + tema.
// Pilihan tersimpan ke backend saat masuk, ke browser saat tamu.
export const WALLPAPERS = [
    { id: 'polos', name: 'Polos' },
    { id: 'senja', name: 'Senja' },
    { id: 'laut', name: 'Laut' },
    { id: 'hutan', name: 'Hutan' },
];

export default function Display({ theme, toggle, wallpaper, setWallpaper, section }) {
    const { member } = useSession();

    return (
        <div className="reader">
            <ViewerHeader
                library={member?.name || 'Perpustakaan WBS'}
                backTo="/"
                backLabel="Menu"
                right={section === 'tema' ? 'Tema' : 'Wallpaper'}
                theme={theme}
                toggle={toggle}
            />
            <main className="page">
                {section !== 'tema' && (
                    <section className="section">
                        <h2 className="section-title">Wallpaper portal</h2>
                        <div className="wp-grid">
                            {WALLPAPERS.map((w) => (
                                <button
                                    key={w.id}
                                    type="button"
                                    className={wallpaper === w.id ? `wp-swatch wp-${w.id} wp-active` : `wp-swatch wp-${w.id}`}
                                    onClick={() => setWallpaper(w.id)}
                                    aria-pressed={wallpaper === w.id}
                                >
                                    {w.name}
                                </button>
                            ))}
                        </div>
                    </section>
                )}
                {section !== 'wallpaper' && (
                    <section className="section">
                        <h2 className="section-title">Tema</h2>
                        <div className="chip-row">
                            <button
                                type="button"
                                className={theme === 'light' ? 'chip chip-active' : 'chip'}
                                onClick={() => theme !== 'light' && toggle()}
                                aria-pressed={theme === 'light'}
                            >
                                Terang
                            </button>
                            <button
                                type="button"
                                className={theme === 'dark' ? 'chip chip-active' : 'chip'}
                                onClick={() => theme !== 'dark' && toggle()}
                                aria-pressed={theme === 'dark'}
                            >
                                Gelap
                            </button>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
