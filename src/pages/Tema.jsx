import ViewerHeader from '../components/ViewerHeader.jsx';
import { useSession } from '../session.jsx';

// Tema milik akun: Terang atau Gelap. Wallpaper ditangani pemilik sendiri.
export default function Tema({ theme, toggle }) {
    const { member } = useSession();

    return (
        <div className="reader">
            <ViewerHeader
                library={member?.name || 'Perpustakaan WBS'}
                backTo="/"
                backLabel="Menu"
                right="Tema"
                theme={theme}
                toggle={toggle}
            />
            <main className="page">
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
            </main>
        </div>
    );
}
