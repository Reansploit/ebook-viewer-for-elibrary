# Yang dibutuhkan viewer dari Reo-Engine (untuk diforward)

Halo, viewer sudah tersambung ke engine via submodule (`mountDocumentReader`
terpakai, build lolos). Yang menghalangi baca PDF/EPUB dari URL:

1. **Ekstraktor PDF**: fungsi `extractPdf(url) -> PdfPageInput[]`
   (atau langsung `DocumentIR`). `analyzePdfPage` butuh input yang sudah
   diekstrak, tapi tidak ada yang mengekstrak. Boleh pakai pdf.js atau apa saja.
2. **Parser EPUB**: berkas yang diunggah petugas bisa `.epub`, belum ada
   pintu masuknya sama sekali.
3. **Info halaman**: viewer butuh `pageCount` nyata + render halaman ke-N
   (lompat halaman, simpan progres). Saat ini tidak ada API halaman.
4. **Contoh ujung-ke-ujung**: satu contoh `mountAdaptivePage` dari URL PDF
   (termasuk dari mana `canvas` + `analysis` didapat) agar kami tidak menebak.

Kontrak yang viewer harapkan (tidak berubah, tinggal diisi):

```ts
parseFile(url: string) -> Promise<{ ir: DocumentIR; pageCount: number }>
```

Berkas contoh + URL API tersedia. Begitu poin 1 (atau 4) ada, viewer
langsung bisa baca PDF tanpa ubah UI.
