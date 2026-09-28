# Integrasi Reo-Engine

Engine dipasang sebagai submodule (`vendor/reo-engine`, cabang `main`)
dan diimpor langsung sebagai sumber TS via alias Vite. Tanpa build,
tanpa publish npm.

## Update

```bash
git submodule update --remote vendor/reo-engine
git add vendor/reo-engine
npm run build
```

Submodule mengunci commit: update eksplisit per perintah di atas, jadi
versi engine yang dipakai selalu ketahuan (lihat `git ls-files -s`).

## Yang sudah tersambung

- `src/engine/ReoPage.jsx` memakai `mountDocumentReader` asli untuk
  `source.ir` (Document IR). Kontrak UI tidak berubah.

## Yang belum bisa (ke tim engine)

1. **Berkas PDF/EPUB mentah belum dirender.** Viewer memberi
   `source.fileUrl` (URL absolut dari API elibrary). Yang dibutuhkan:
   pintu masuk berkas-ke-IR (`parseFile(url) -> DocumentIR`) atau
   contoh pemakaian `mountAdaptivePage` + analisis dari pdf.js.
2. **EPUB belum ada parser.** Berkas yang diunggah petugas bisa EPUB.
3. **Nomor halaman.** Kontrak UI butuh `pageCount` nyata dan lompat ke
   halaman N. Perlu API engine: total halaman + render halaman ke-N.
4. **Cabang yang dilacak `main` (produksi).** Kalau ingin viewer ikut
   lebih cepat, pindahkan submodule ke `develop`:
   `git submodule set-branch -b develop vendor/reo-engine`.
