import { useCallback, useEffect, useState } from 'react';

// Router hash mungil: #/ #/katalog #/semua #/cari #/baca.
// Tanpa dependensi; query (?q=) dibaca manual per halaman.
function parseHash() {
    const raw = window.location.hash.replace(/^#/, '') || '/';
    const [path, query] = raw.split('?');
    return { path: path || '/', params: new URLSearchParams(query || '') };
}

export function useHashRoute() {
    const [route, setRoute] = useState(parseHash);

    useEffect(() => {
        const onChange = () => setRoute(parseHash());
        window.addEventListener('hashchange', onChange);
        return () => window.removeEventListener('hashchange', onChange);
    }, []);

    const go = useCallback((to) => {
        window.location.hash = to;
    }, []);

    return { ...route, go };
}

export function Link({ to, className, children }) {
    return (
        <a href={`#${to}`} className={className}>
            {children}
        </a>
    );
}
