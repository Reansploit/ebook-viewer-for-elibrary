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

## Status: tersambung penuh (engine e68209e)

- `parseFile(url)` dari paket `loader` membuka PDF/EPUB → `{ ir,
  pageCount }`. Viewer memanggilnya di `src/engine/engine.jsx`
  (butuh `pdfjs-dist` + `fflate` di viewer).
- PDF dirender sebagai IR via `ReoPage`; `mountAdaptivePage` (kanvas
  adaptif) belum dipakai — langkah berikutnya bila IR kurang pas
  untuk kitab scan.
- EPUB dihitung sebagai dokumen spine (tanpa konsep halaman).

## Catatan

- Cabang yang dilacak `main` (produksi). Untuk ikut lebih cepat:
  `git submodule set-branch -b develop vendor/reo-engine`.
