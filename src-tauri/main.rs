// Cangkang Tauri: memuat web viewer dari server (lihat frontendDist di
// tauri.conf.json), jadi update web ikut otomatis tanpa rebuild aplikasi.
// Update cangkang sendiri dicek diam-diam saat start dan dipasang untuk
// dipakai pada peluncuran berikutnya.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_updater::UpdaterExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let Ok(updater) = handle.updater() else {
                    return;
                };
                let Ok(Some(update)) = updater.check().await else {
                    return;
                };
                let _ = update
                    .download_and_install(|_, _| {}, || {})
                    .await;
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("gagal menjalankan Ebook Viewer");
}
