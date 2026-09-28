import { Link } from '../router.jsx';
import { ThemeToggle } from '../theme.jsx';

// Kepala halaman ala katalog elibrary: logo + nama (tautan ke portal)
// + keterangan konteks dan toggle tema di kanan.
export default function ViewerHeader({ library, backTo = '/', backLabel = 'Portal', right, theme, toggle }) {
    return (
        <header className="reader-header">
            <Link to={backTo} className="site-brand" aria-label={backLabel}>
                <img src="/images/logo-wbs.png" alt="" className="site-logo" />
                <span className="site-name">{library}</span>
            </Link>
            <div className="header-right">
                {right && <p className="reader-position">{right}</p>}
                {theme && <ThemeToggle theme={theme} toggle={toggle} />}
            </div>
        </header>
    );
}
