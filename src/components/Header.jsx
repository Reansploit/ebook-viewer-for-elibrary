
// Bilah atas reader: judul + posisi halaman. Toggle tema ikut di sini
// agar pembaca bisa gelapkan layar saat baca tanpa keluar halaman.
export default function Header({ title, page, pageCount }) {
    return (
        <header className="reader-header">
            <h1 className="reader-title">{title}</h1>
            <div className="header-right">
                <p className="reader-position" aria-live="polite">
                    Halaman {page} dari {pageCount}
                </p>
            </div>
        </header>
    );
}
