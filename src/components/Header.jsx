import { Link } from '../router.jsx';

// Bilah atas reader: kembali + judul + posisi halaman.
export default function Header({ title, page, pageCount }) {
    return (
        <header className="reader-header">
            <span className="site-brand">
                <Link to="/" className="mac-back" aria-label="Kembali ke menu" title="Kembali ke menu">
                    ‹
                </Link>
                <h1 className="reader-title">{title}</h1>
            </span>
            <div className="header-right">
                <p className="reader-position" aria-live="polite">
                    Halaman {page} dari {pageCount}
                </p>
            </div>
        </header>
    );
}
