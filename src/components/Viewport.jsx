// Area baca. Seluruh isi halaman datang dari engine lewat renderPage.
// Geser mouse/jari ke kiri = maju, ke kanan = mundur (ambang 60px).
// Tombol samping ‹ › mengapit kertas untuk yang suka klik.
export default function Viewport({ page, pageCount, renderPage, onPrev, onNext }) {
    const startX = useRef(null);

    const down = (e) => {
        startX.current = e.clientX;
    };

    const up = (e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (dx <= -60) onNext?.();
        else if (dx >= 60) onPrev?.();
    };

    return (
        <main
            className="reader-viewport"
            onPointerDown={down}
            onPointerUp={up}
            style={{ touchAction: 'pan-y' }}
        >
            <button
                type="button"
                className="page-side"
                onClick={onPrev}
                disabled={page <= 1}
                aria-label="Halaman sebelumnya"
            >
                <span aria-hidden="true">‹</span>
            </button>
            <div className="page-side-main">{renderPage(page)}</div>
            <button
                type="button"
                className="page-side"
                onClick={onNext}
                disabled={pageCount !== undefined && page >= pageCount}
                aria-label="Halaman berikutnya"
            >
                <span aria-hidden="true">›</span>
            </button>
        </main>
    );
}
