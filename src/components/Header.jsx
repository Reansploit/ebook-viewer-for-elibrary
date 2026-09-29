import { Link } from '../router.jsx';

// Bilah atas reader: kembali + judul + posisi + mata (hangat) + penuh.
export default function Header({ title, page, pageCount, warm, onWarm, onFull, full }) {
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
                {onWarm && (
                    <button
                        type="button"
                        className={warm ? 'eye-btn eye-on' : 'eye-btn'}
                        onClick={onWarm}
                        aria-label="Mode nyaman mata"
                        aria-pressed={!!warm}
                        title="Mode nyaman mata"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </button>
                )}
                {onFull && (
                    <button
                        type="button"
                        className="eye-btn"
                        onClick={onFull}
                        aria-label={full ? 'Keluar layar penuh' : 'Layar penuh'}
                        title={full ? 'Keluar layar penuh' : 'Layar penuh'}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            {full ? (
                                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                            ) : (
                                <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
                            )}
                        </svg>
                    </button>
                )}
            </div>
        </header>
    );
}
