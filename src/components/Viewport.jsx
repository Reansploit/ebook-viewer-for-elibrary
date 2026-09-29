// Area baca. Seluruh isi halaman datang dari engine lewat renderPage.
import { useRef } from 'react';

// Geser mouse/jari ke kiri = maju, ke kanan = mundur (ambang 60px).
export default function Viewport({ page, renderPage, onPrev, onNext }) {
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
            {renderPage(page)}
        </main>
    );
}
