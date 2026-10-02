import { Link } from '../router.jsx';

// Kepala halaman: tombol kembali gaya desktop + merek + konteks kanan.
// Kembali selalu ada (kecuali backTo null) dan selalu menuju tempat nyata.
export default function ViewerHeader({ library, logo, backTo = '/', backLabel = 'Kembali', right }) {
    return (
        <header className="reader-header">
            <span className="site-brand">
                {backTo && (
                    <Link to={backTo} className="mac-back" aria-label={backLabel} title={backLabel}>
                        ‹
                    </Link>
                )}
                <img src={logo || '/images/logo-wbs.png'} alt="" className="site-logo" />
                <span className="site-name">{library}</span>
            </span>
            <div className="header-right">
                {right && <p className="reader-position">{right}</p>}
            </div>
        </header>
    );
}
