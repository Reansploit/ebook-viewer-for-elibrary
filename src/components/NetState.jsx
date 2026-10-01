// Status jaringan jujur + tombol coba lagi. Dipakai katalog, semua,
// cari: bedakan "tidak ada koneksi" (offline) dari "server galat".
export default function NetState({ error, retryLabel, onRetry, children }) {
    const offline = !!error?.offline;
    return (
        <div className="reader-state">
            <p>{offline ? 'Tidak ada koneksi ke server.' : 'Gagal memuat dari server.'}</p>
            <p className="page-placeholder-sub">
                {offline ? 'Periksa jaringan pondok lalu coba lagi.' : 'Coba lagi atau tanya petugas.'}
            </p>
            {children}
            {onRetry && (
                <button type="button" className="btn-outline net-retry" onClick={onRetry}>
                    {retryLabel || 'Coba lagi'}
                </button>
            )}
        </div>
    );
}
