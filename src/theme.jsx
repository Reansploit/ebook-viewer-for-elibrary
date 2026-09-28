import { useEffect, useState } from 'react';

// Tema mengikuti wallpaper akun: foto gelap = gelap, terang/polos = terang.
// Tanpa toggle manual dan tanpa ikut sistem.
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

    return { theme, setTheme };
}
