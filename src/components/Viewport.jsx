// Area baca. Seluruh isi halaman datang dari engine lewat renderPage,
// UI tidak tahu format dokumen (PDF/EPUB) dan tidak perlu tahu.
export default function Viewport({ page, renderPage }) {
    return <main className="reader-viewport">{renderPage(page)}</main>;
}
