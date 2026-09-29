// Kontrak engine viewer: useEngine(source) -> {
//   title, pageCount, page, status, error, goTo, next, prev, renderPage }.
// source.fileUrl (URL absolut PDF/EPUB dari API) dibuka via Reo-Engine
// parseFile. Tanpa fileUrl = demo stub (buka langsung #/baca).
import { parseFile } from '@reo-engine/loader';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReoPage from './ReoPage.jsx';

export function useEngine(source = {}, startPage = 1) {
    const title = source.title || 'Dokumen tanpa judul';
    const [doc, setDoc] = useState(null);
    const [status, setStatus] = useState(source.fileUrl ? 'loading' : 'ready');
    const [error, setError] = useState(null);
    const handleRef = useRef(null);

    useEffect(() => {
        if (!source.fileUrl) return;
        const controller = new AbortController();
        setStatus('loading');
        setError(null);
        parseFile(source.fileUrl, {
            title: source.title,
            signal: controller.signal,
            pdf: { workerSrc: workerUrl },
        })
            .then((handle) => {
                if (controller.signal.aborted) {
                    handle.close();
                    return;
                }
                handleRef.current?.close().catch(() => {});
                handleRef.current = handle;
                setDoc({ ir: handle.ir, pageCount: handle.pageCount });
                setStatus('ready');
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
                setError(err?.message || 'Gagal membuka berkas.');
                setStatus('error');
            });
        return () => {
            controller.abort();
            handleRef.current?.close().catch(() => {});
            handleRef.current = null;
        };
    }, [source.fileUrl]);

    const pageCount = Math.max(1, doc?.pageCount || source.pageCount || 1);
    const [page, setPage] = useState(Math.min(pageCount, Math.max(1, startPage || 1)));

    const goTo = useCallback(
        (n) => {
            setPage(Math.min(pageCount, Math.max(1, Number(n) || 1)));
        },
        [pageCount],
    );
    const next = useCallback(() => goTo(page + 1), [goTo, page]);
    const prev = useCallback(() => goTo(page - 1), [goTo, page]);

    const renderPage = useCallback(
        (n) => {
            if (doc?.ir) return <ReoPage key={source.fileUrl} ir={doc.ir} theme={source.theme} />;
            if (source.ir) return <ReoPage ir={source.ir} theme={source.theme} />;
            return (
                <div className="page-placeholder">
                    <p>Halaman {n}</p>
                    <p className="page-placeholder-sub">
                        {status === 'loading' ? 'Menyiapkan dokumen...' : 'Engine asli belum dipasang.'}
                    </p>
                </div>
            );
        },
        [doc, source.ir, source.theme, source.fileUrl, status],
    );

    return { title, pageCount, page, status, error, goTo, next, prev, renderPage };
}
