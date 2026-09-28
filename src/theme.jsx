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

    return { theme, toggle };
}

export function ThemeToggle({ theme, toggle }) {
    const dark = theme === 'dark';
    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            aria-pressed={dark}
            aria-label={dark ? 'Pakai mode terang' : 'Pakai mode gelap'}
            title={dark ? 'Mode terang' : 'Mode gelap'}
        >
            {dark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
            ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
                </svg>
            )}
        </button>
    );
}
