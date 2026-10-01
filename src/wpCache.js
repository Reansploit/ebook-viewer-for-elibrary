// Cache bita wallpaper di IndexedDB: refresh tidak mengunduh ulang
// berkas besar dari elibrary, cukup baca dari disk. Kunci = URL.
const DB = 'ebook-viewer';
const STORE = 'wallpapers';

function openDb() {
    return new Promise((resolve, reject) => {
        try {
            const req = indexedDB.open(DB, 1);
            req.onupgradeneeded = () => req.result.createObjectStore(STORE);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        } catch (e) {
            reject(e);
        }
    });
}

export async function getWallpaperBlob(url) {
    const db = await openDb();
    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE, 'readonly');
            const req = tx.objectStore(STORE).get(url);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
}

// Hapus semua bita tersimpan (dipanggil saat keluar: kios bersama).
export async function clearWallpaperCache() {
    try {
        const db = await openDb();
        await new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE, 'readwrite');
                tx.objectStore(STORE).clear();
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch {
                resolve();
            }
        });
    } catch {
        // abaikan
    }
}

// Unduh lalu simpan. Kembalikan blob segar atau null.
export async function fetchWallpaperBlob(url) {
    try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) return null;
        const blob = await res.blob();
        if (!blob || blob.size === 0) return null;
        const db = await openDb();
        await new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE, 'readwrite');
                tx.objectStore(STORE).put(blob, url);
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch {
                resolve();
            }
        });
        return blob;
    } catch {
        return null;
    }
}
