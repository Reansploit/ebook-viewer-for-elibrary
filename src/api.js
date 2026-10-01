// Akses API katalog elibrary. Basis URL dari env build (VITE_API_URL),
// default server lokal. Semua endpoint publik + throttle di sisi elibrary.
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

async function get(path, params = {}) {
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(params)) {
        if (v !== '' && v !== null && v !== undefined) url.searchParams.set(k, v);
    }
    try {
        const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    } catch (err) {
        throw netError(err);
    }
}

// Gagal jaringan (fetch melempar TypeError) dibedakan dari galat server
// agar halaman bisa menulis "tidak ada koneksi" dengan jujur.
export function netError(err) {
    if (err instanceof TypeError) {
        const offline = new Error('Tidak ada koneksi ke server.');
        offline.offline = true;
        offline.cause = err;
        return offline;
    }
    return err;
}

export const api = {
    catalog: () => get('/api/v1/katalog'),
    all: ({ q = '', kategori = '', page = 1, digital = '' } = {}) => get('/api/v1/katalog/semua', { q, kategori, page, digital }),
    search: (q, digital = '') => get('/api/v1/katalog/cari', { q, digital }),

    readerLogin: (rfid, signal) =>
        fetch(BASE + '/api/v1/reader/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ rfid }),
            signal,
        }).then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
            return data;
        }).catch((err) => {
            throw netError(err);
        }),
    logout: (token) =>
        fetch(BASE + '/api/v1/reader/logout', {
            method: 'POST',
            headers: { ...authHeader(token), Accept: 'application/json' },
        }).catch(() => {}),
};

function authHeader(token) {
    return { Authorization: `Bearer ${token}` };
}

export async function uploadWallpaper(token, file) {
    const form = new FormData();
    form.append('photo', file);
    const res = await fetch(BASE + '/api/v1/reader/wallpaper', {
        method: 'POST',
        headers: { ...authHeader(token), Accept: 'application/json' },
        body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
}

export async function deleteWallpaper(token) {
    const res = await fetch(BASE + '/api/v1/reader/wallpaper', {
        method: 'DELETE',
        headers: { ...authHeader(token), Accept: 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
}

// Panggilan akun (butuh token). GET/POST/PUT/DELETE sederhana.
export async function readerApi(token, method, path, body) {
    let res;
    try {
        res = await fetch(BASE + path, {
            method,
            headers: {
                ...authHeader(token),
                Accept: 'application/json',
                ...(body ? { 'Content-Type': 'application/json' } : {}),
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
        });
    } catch (err) {
        throw netError(err);
    }
    if (res.status === 401) {
        const err = new Error('Sesi berakhir, masuk lagi.');
        err.unauthorized = true;
        throw err;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
}
