// Paginasi server: Mundur/Maju + nomor. Tombol mati di ujung (R-26).
export default function Pagination({ page, lastPage, onGo }) {
    if (!lastPage || lastPage <= 1) return null;
    return (
        <nav className="pager" aria-label="Halaman daftar">
            <button type="button" onClick={() => onGo(page - 1)} disabled={page <= 1}>
                Mundur
            </button>
            <span className="pager-info">
                {page} dari {lastPage}
            </span>
            <button type="button" onClick={() => onGo(page + 1)} disabled={page >= lastPage}>
                Maju
            </button>
        </nav>
    );
}
