// Detektor terang-gelap wallpaper per area: rata-rata global menipu untuk
// foto campuran (mis. atas gelap, tengah terang). Sampel tiga pita:
// atas (kepala), tengah (judul), bawah (tombol keluar).
// Butuh CORS dari elibrary (sudah dibuka untuk wallpaper-reader/*).
function bandLuminance(ctx, y0, y1) {
    const h = 32;
    const data = ctx.getImageData(0, Math.floor(y0 * h), 32, Math.max(1, Math.floor((y1 - y0) * h))).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
        sum += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    }
    return sum / (data.length / 4);
}

export function detectTones(url) {
    const fallback = { top: 'light', mid: 'light', bottom: 'light' };
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const c = document.createElement('canvas');
                c.width = 32;
                c.height = 32;
                const ctx = c.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, 32, 32);
                const tone = (v) => (v < 0.45 ? 'dark' : 'light');
                resolve({
                    top: tone(bandLuminance(ctx, 0, 0.18)),
                    mid: tone(bandLuminance(ctx, 0.3, 0.5)),
                    bottom: tone(bandLuminance(ctx, 0.85, 1)),
                });
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
