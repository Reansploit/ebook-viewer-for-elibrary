// Lencana ketersediaan, cermin dari katalog elibrary:
// habis (merah), sisa sebagian (lembut), penuh (garis tepi).
export function AvailabilityBadge({ book }) {
    if (!book.remaining || book.remaining <= 0) {
        return <span className="badge badge-red">Habis dipinjam</span>;
    }
    if (book.remaining < (book.stock ?? 0)) {
        return <span className="badge badge-soft">Tersedia, sisa {book.remaining}</span>;
    }
    return <span className="badge">Tersedia</span>;
}

// Kartu buku: foto atau blok inisial, judul, ID, pengarang, lokasi,
// kategori, lencana. Tanpa tombol Baca: berkas digital belum ada di data
// (R-26: tidak ada kontrol mati).
export default function BookCard({ book }) {
    return (
        <article className="book-card">
            {book.photo ? (
                <img src={book.photo} alt={book.title} className="book-photo" loading="lazy" />
            ) : (
                <div className="book-photo book-photo-empty" aria-hidden="true">
                    {(book.title || '?').trim().charAt(0).toUpperCase()}
                </div>
            )}
            <div className="book-body">
                <p className="book-title">{book.title}</p>
                <p className="book-meta">
                    <span className="book-id">{book.id}</span>
                    {book.author ? `, ${book.author}` : ''}
                </p>
                {book.location && <p className="book-meta">Lokasi: {book.location}</p>}
                {book.category && <p className="book-meta">Kategori: {book.category}</p>}
                <div className="book-badge">
                    <AvailabilityBadge book={book} />
                </div>
            </div>
        </article>
    );
}
