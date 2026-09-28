// Kartu buku: foto/sampul, judul, penulis, lokasi, lencana, rating,
// dan aksi akun (suka/tidak/simpan). Rating tampil sebelum diklik;
// suara satu akun satu buku berlaku di Katalog dan Baca sekaligus.
// Jempol di sini tombol fungsi (R-04), bukan hiasan.
export function Rating({ book, myVote, onVote }) {
    const likes = book.likes ?? 0;
    const dislikes = book.dislikes ?? 0;

    if (!onVote) {
        return (
            <p className="book-meta" aria-label={`${likes} suka, ${dislikes} tidak suka`}>
                👍 {likes} • 👎 {dislikes}
            </p>
        );
    }

    const send = (v) => onVote(book.id, myVote === v ? 0 : v);

    return (
        <div className="vote-row">
            <button
                type="button"
                className={myVote === 1 ? 'vote-btn vote-active' : 'vote-btn'}
                onClick={() => send(1)}
                aria-pressed={myVote === 1}
                aria-label={`Suka ${book.title}`}
            >
                👍 {likes}
            </button>
            <button
                type="button"
                className={myVote === -1 ? 'vote-btn vote-active' : 'vote-btn'}
                onClick={() => send(-1)}
                aria-pressed={myVote === -1}
                aria-label={`Tidak suka ${book.title}`}
            >
                👎 {dislikes}
            </button>
        </div>
    );
}

export function AvailabilityBadge({ book }) {
    if (!book.remaining || book.remaining <= 0) {
        return <span className="badge badge-red">Habis dipinjam</span>;
    }
    if (book.remaining < (book.stock ?? 0)) {
        return <span className="badge badge-soft">Tersedia, sisa {book.remaining}</span>;
    }
    return <span className="badge">Tersedia</span>;
}

// myVote: 1|-1|0. onVote dipasang hanya saat masuk akun.
// showSave: hanya jalur ebook. saved + onToggleSave untuk statusnya.
export default function BookCard({ book, myVote = 0, onVote, showSave = false, saved = false, onToggleSave }) {
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
                <Rating book={book} myVote={myVote} onVote={onVote} />
                {showSave && onToggleSave && (
                    <button
                        type="button"
                        className={saved ? 'mini-btn save-active' : 'mini-btn'}
                        onClick={() => onToggleSave(book)}
                        aria-pressed={saved}
                    >
                        {saved ? 'Tersimpan' : 'Simpan'}
                    </button>
                )}
            </div>
        </article>
    );
}
