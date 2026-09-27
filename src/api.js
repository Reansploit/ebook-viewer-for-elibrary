// Akses API katalog elibrary. Basis URL dari env build (VITE_API_URL),
// default server lokal. Semua endpoint publik + throttle di sisi elibrary.
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

async function get(path, params = {}) {
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(params)) {
        if (v !== '' && v !== null && v !== undefined) url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export const api = {
    catalog: () => get('/api/v1/katalog'),
    all: ({ q = '', kategori = '', page = 1 } = {}) => get('/api/v1/katalog/semua', { q, kategori, page }),
    search: (q) => get('/api/v1/katalog/cari', { q }),
};
