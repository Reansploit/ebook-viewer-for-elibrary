import { useState } from 'react';

// Kontrol pindah halaman. Semua tombol berfungsi sungguhan terhadap engine:
// di halaman pertama tombol Mundur mati, di terakhir tombol Maju mati.
// Alasan satu baris (R-31): pembaca kitab berpindah halaman terus-menerus,
// jadi kontrolnya selalu terlihat di bawah viewport (tangan santri di HP).
export default function Controls({ page, pageCount, onPrev, onNext, onGoTo }) {
    const [draft, setDraft] = useState(String(page));

    const submit = (e) => {
        e.preventDefault();
        onGoTo(draft);
        setDraft(String(Math.min(pageCount, Math.max(1, Number(draft) || 1))));
    };

    return (
        <nav className="reader-controls" aria-label="Navigasi halaman">
            <button type="button" onClick={onPrev} disabled={page <= 1} aria-label="Halaman sebelumnya">
                Mundur
            </button>
            <form className="reader-jump" onSubmit={submit}>
                <label className="reader-jump-label" htmlFor="page-input">
                    Ke halaman
                </label>
                <input
                    id="page-input"
                    className="reader-jump-input"
                    type="number"
                    min={1}
                    max={pageCount}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                />
                <span className="reader-jump-total">dari {pageCount}</span>
            </form>
            <button
                type="button"
                onClick={onNext}
                disabled={page >= pageCount}
                aria-label="Halaman berikutnya"
            >
                Maju
            </button>
        </nav>
    );
}
