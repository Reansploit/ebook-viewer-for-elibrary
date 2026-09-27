// Bilah atas: judul dokumen + posisi halaman. Tanpa tombol,
// jadi tidak ada kontrol mati (R-26).
export default function Header({ title, page, pageCount }) {
    return (
        <header className="reader-header">
            <h1 className="reader-title">{title}</h1>
            <p className="reader-position" aria-live="polite">
                Halaman {page} dari {pageCount}
            </p>
        </header>
    );
}
