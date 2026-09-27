import { Link } from '../router.jsx';

// Kepala halaman ala katalog elibrary: logo + nama (tautan ke portal)
// + keterangan konteks di kanan. Satu bentuk di semua halaman.
export default function ViewerHeader({ library, backTo = '/', backLabel = 'Portal', right }) {
    return (
        <header className="reader-header">
            <Link to={backTo} className="site-brand" aria-label={backLabel}>
                <img src="/images/logo-wbs.png" alt="" className="site-logo" />
                <span className="site-name">{library}</span>
            </Link>
            {right && <p className="reader-position">{right}</p>}
        </header>
    );
}
