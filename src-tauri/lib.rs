// Pustaka cangkang Tauri: memuat web viewer dari server (lihat
// frontendDist di tauri.conf.json), jadi update web ikut otomatis tanpa
// rebuild aplikasi. Titik masuk desktop ada di main.rs.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            use tauri_plugin_updater::UpdaterExt;
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let Ok(updater) = handle.updater() else {
                    return;
                };
                let Ok(Some(update)) = updater.check().await else {
                    return;
                };
                let _ = update.download_and_install(|_, _| {}, || {}).await;
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("gagal menjalankan Ebook Viewer");
}