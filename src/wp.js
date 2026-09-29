// Detektor terang-gelap wallpaper per area: rata-rata global menipu untuk
// foto campuran (mis. atas gelap, tengah terang). Sampel tiga pita:
// atas (kepala), tengah (judul), bawah (tombol keluar).
// Hasil di-cache per URL agar tidak dihitung ulang tiap buka menu.
// Butuh CORS dari elibrary (sudah dibuka untuk wallpaper-reader/*).
const toneCache = new Map();

function bandLuminance(ctx, y0, y1) {
    const h = 16;
    const data = ctx.getImageData(0, Math.floor(y0 * h), 32, Math.max(1, Math.floor((y1 - y0) * h))).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
        // Luminansi perseptual (sRGB linearization), bukan rata-rata mentah.
        const lin = (v) => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        sum += 0.2126 * lin(data[i]) + 0.7152 * lin(data[i + 1]) + 0.0722 * lin(data[i + 2]);
    }
    return sum / (data.length / 4);
}

export function detectTones(url) {
    const fallback = { top: 'light', mid: 'light', bottom: 'light' };
    if (toneCache.has(url)) return Promise.resolve(toneCache.get(url));
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const c = document.createElement('canvas');
                c.width = 32;
                c.height = 16;
                const ctx = c.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, 32, 16);
                const tone = (v) => (v < 0.18 ? 'dark' : 'light');
                const result = {
                    top: tone(bandLuminance(ctx, 0, 0.18)),
                    mid: tone(bandLuminance(ctx, 0.3, 0.5)),
                    bottom: tone(bandLuminance(ctx, 0.85, 1)),
                };
                toneCache.set(url, result);
                resolve(result);
            } catch {
                resolve(fallback);
            }
        };
        img.onerror = () => resolve(fallback);
        img.src = url;
    });
}

// Kompatibel mundur: satu nada untuk seluruh layar.
export function detectTone(url) {
    return detectTones(url).then((t) => t.mid);
}
