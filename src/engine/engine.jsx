// Kontrak engine viewer. Tim engine mengganti `useStubEngine` dengan
// implementasi asli selama bentuk kembaliannya sama. `source` bebas
// bentuknya (URL, File, Blob); stub hanya membaca title dan pageCount.
//
import { useCallback, useState } from 'react';

export function useStubEngine(source = {}) {
    const title = source.title || 'Dokumen tanpa judul';
    const pageCount = Math.max(1, source.pageCount || 1);
    const [page, setPage] = useState(1);

    const goTo = useCallback(
        (n) => {
            setPage(Math.min(pageCount, Math.max(1, Number(n) || 1)));
        },
        [pageCount],
    );
    const next = useCallback(() => goTo(page + 1), [goTo, page]);
    const prev = useCallback(() => goTo(page - 1), [goTo, page]);

    const renderPage = useCallback(
        (n) => (
            <div className="page-placeholder">
                <p>Halaman {n}</p>
                <p className="page-placeholder-sub">Engine asli belum dipasang.</p>
            </div>
        ),
        [],
    );

    return { title, pageCount, page, status: 'ready', error: null, goTo, next, prev, renderPage };
}

// Alias yang dipakai UI. Tim engine: arahkan ke hook asli di sini.
export const useEngine = useStubEngine;
