import { Link } from '../router.jsx';

// Bilah atas reader: kembali + judul + posisi halaman + mata mode baca.
export default function Header({ title, page, pageCount, onFocus }) {
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
                {onFocus && (
                    <button
                        type="button"
                        className="eye-btn"
                        onClick={onFocus}
                        aria-label="Mode baca"
                        title="Mode baca"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </button>
                )}
            </div>
        </header>
    );
}
