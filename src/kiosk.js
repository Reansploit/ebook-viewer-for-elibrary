// Lapisan kios sisi web: tutup menu konteks dan pintasan yang bisa
// membuka DevTools atau memuat ulang tampilan. Lapisan native (lihat
// src-tauri/lib.rs) yang menahan Alt+F4, tombol tutup jendela, dan Task
// Manager. Alasan (R-31): PC kios hanya untuk membaca, bukan alat kerja.
export function lockKiosk() {
    const stop = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    document.addEventListener('contextmenu', stop, true);
    document.addEventListener('dragstart', stop, true);

    window.addEventListener(
        'keydown',
        (e) => {
            const k = (e.key || '').toLowerCase();
            if (e.key === 'F5' || e.key === 'F12') {
                stop(e);
                return;
            }
            if ((e.ctrlKey || e.metaKey) && (k === 'r' || k === 'i' || k === 'j')) {
                stop(e);
                return;
            }
            // Chord pembuka sengaja ditelan di sini juga supaya tidak
            // bocor ke halaman web.
            if (e.ctrlKey && e.shiftKey && e.altKey && (k === 'q' || k === 'h')) {
                stop(e);
            }
        },
        true,
    );
}