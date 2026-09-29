import { mountAdaptivePage } from '@reo-engine/renderer-web';
import { useEffect, useRef, useState } from 'react';

// Halaman PDF via kanvas adaptif: piksel asli (penting untuk kitab scan)
// + sheet teks yang dijamin kontras. Butuh source + analysis per halaman.
export default function ReoPdfPage({ source, page, theme }) {
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let mounted = null;
        setFailed(false);
        (async () => {
            try {
                await source.renderPage(page, canvasRef.current, { scale: 1.5 });
                if (cancelled) return;
                const analysis = await source.getPageAnalysis(page);
                if (cancelled) return;
                mounted = mountAdaptivePage(overlayRef.current, canvasRef.current, analysis, {
                    theme: theme === 'dark' ? 'dark' : 'light',
                });
            } catch {
                if (!cancelled) setFailed(true);
            }
        })();
        return () => {
            cancelled = true;
            mounted?.destroy();
        };
    }, [source, page, theme]);

    if (failed) {
        return (
            <div className="page-placeholder">
                <p>Halaman {page}</p>
                <p className="page-placeholder-sub">Halaman gagal dirender. Coba halaman lain.</p>
            </div>
        );
    }

    return (
        <div className="reo-pdf">
            <canvas ref={canvasRef} />
            <div ref={overlayRef} />
        </div>
    );
}
