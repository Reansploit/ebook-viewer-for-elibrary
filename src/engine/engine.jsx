// Kontrak engine viewer: useEngine(source) -> {
//   title, pageCount, page, status, error, goTo, next, prev, renderPage }.
// source.fileUrl (URL absolut PDF/EPUB dari API) dibuka via Reo-Engine
// parseFile. Tanpa fileUrl = demo stub (buka langsung #/baca).
import { parseFile } from '@reo-engine/loader';
import { openPdfSource } from '@reo-engine/parser-pdf';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReoPage from './ReoPage.jsx';
import ReoPdfPage from './ReoPdfPage.jsx';

// Unduh dengan progres (kitab 200+ halaman puluhan MB).
async function fetchBytes(url, signal, onProgress) {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Gagal mengambil berkas (HTTP ${res.status}).`);
    const total = Number(res.headers.get('content-length')) || 0;
    if (!res.body || !total) {
        onProgress?.(null);
        return new Uint8Array(await res.arrayBuffer());
    }
    const reader = res.body.getReader();
    const chunks = [];
    let done = 0;
    for (;;) {
        const { done: end, value } = await reader.read();
        if (end) break;
        chunks.push(value);
        done += value.length;
        onProgress?.(Math.round((done / total) * 100));
    }
    const all = new Uint8Array(done);
    let offset = 0;
    for (const c of chunks) {
        all.set(c, offset);
        offset += c.length;
    }
    onProgress?.(100);
    return all;
}

export function useEngine(source = {}, startPage = 1) {
    const title = source.title || 'Dokumen tanpa judul';
    const [doc, setDoc] = useState(null);
    const [status, setStatus] = useState(source.fileUrl ? 'loading' : 'ready');
    const [error, setError] = useState(null);
    // Persen unduh (null = tak diketahui). Tampil di "Menyiapkan...".
    const [progress, setProgress] = useState(null);
    const handleRef = useRef(null);

    useEffect(() => {
        if (!source.fileUrl) return;
        const controller = new AbortController();
        setStatus('loading');
        setError(null);
        setProgress(null);
        const isPdf = /\.pdf($|[?#])/i.test(source.fileUrl);
        (async () => {
            // PDF: buka sumber langsung (pageCount kilat), halaman dirender
            // sesuai dibuka. EPUB kecil: parseFile seperti biasa.
            const handle = isPdf
                ? await (async () => {
                    const sourceObj = await openPdfSource(
                        await fetchBytes(source.fileUrl, controller.signal, setProgress),
                        { workerSrc: workerUrl, wasmUrl: '/wasm/', signal: controller.signal },
                    );
                    return {
                        ir: null,
                        pageCount: sourceObj.pageCount,
                        format: 'pdf',
                        source: sourceObj,
                        close: () => sourceObj.close(),
                    };
                })()
                : await parseFile(source.fileUrl, {
                    title: source.title,
                    signal: controller.signal,
                    pdf: { workerSrc: workerUrl, wasmUrl: '/wasm/' },
                });
            if (controller.signal.aborted) {
                handle.close();
                return;
            }
            handleRef.current?.close().catch(() => {});
            handleRef.current = handle;
            setDoc({
                ir: handle.ir,
                pageCount: handle.pageCount,
                format: handle.format,
                source: handle.source,
            });
            setStatus('ready');
        })().catch((err) => {
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
            // PDF lewat kanvas adaptif (piksel asli kitab scan tetap utuh).
            // Tanpa key per halaman: kanvas diperbarui di tempat agar
            // pindah halaman tidak terasa refresh (halaman lama tampil
            // sampai yang baru siap).
            if (doc?.format === 'pdf' && doc?.source) {
                return <ReoPdfPage key={source.fileUrl} source={doc.source} page={n} theme={source.theme} />;
            }
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

    return { title, pageCount, page, status, error, progress, goTo, next, prev, renderPage };
}
