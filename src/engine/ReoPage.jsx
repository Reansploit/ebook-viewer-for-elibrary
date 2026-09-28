import { useEffect, useRef } from 'react';
import { mountDocumentReader } from '@reo-engine/renderer-web';

// Satu halaman yang dirender Reo-Engine dari Document IR.
// Engine manipulasi DOM langsung, jadi mount/update/destroy manual.
// Dipakai saat source.ir terisi; berkas PDF/EPUB mentah belum bisa
// (lihat docs/ENGINE.md untuk daftar kebutuhan ke tim engine).
export default function ReoPage({ ir, theme }) {
    const ref = useRef(null);
    const mounted = useRef(null);

    useEffect(() => {
        if (!ref.current || !ir) return;
        mounted.current = mountDocumentReader(ref.current, ir, {
            theme: theme === 'dark' ? 'dark' : 'light',
        });
        return () => {
            mounted.current?.destroy();
            mounted.current = null;
        };
    }, [ir, theme]);

    return <div ref={ref} className="reo-page" />;
}
