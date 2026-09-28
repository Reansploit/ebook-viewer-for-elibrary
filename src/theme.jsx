import { useCallback, useEffect, useState } from 'react';

// Tema ala elibrary: terang sebagai default, gelap hanya bila pengguna
// meminta lewat toggle. Tidak mengikuti sistem (itulah keluhan kemarin:
// browser gelap membuat viewer ikut gelap). Pilihan disimpan lokal.
const KEY = 'ebook-viewer-theme';

export function useTheme() {
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
        } catch {
            return 'light';
        }
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        try {
            localStorage.setItem(KEY, theme);
        } catch {
            // abaikan: tema tetap jalan sesi ini
        }
    }, [theme]);

    const toggle = useCallback(() => {
        setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    }, []);

    return { theme, toggle, setTheme };
}
