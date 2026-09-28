// Detektor terang-gelap wallpaper: sampel 32x32 piksel, rata-rata luminance.
// Gelap (< 0.45) = teks kepala putih + bayangan; terang = teks tinta biasa.
// Butuh CORS dari elibrary (sudah dibuka untuk wallpaper-reader/*).
export function detectTone(url) {
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
                const d = ctx.getImageData(0, 0, 32, 32).data;
                let sum = 0;
                for (let i = 0; i < d.length; i += 4) {
                    sum += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
                }
                resolve(sum / (d.length / 4) < 0.45 ? 'dark' : 'light');
            } catch {
                resolve('light');
            }
        };
        img.onerror = () => resolve('light');
        img.src = url;
    });
}
