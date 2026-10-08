// Cangkang Tauri: memuat web viewer dari server (lihat frontendDist di
// tauri.conf.json), jadi update web ikut otomatis tanpa rebuild aplikasi.
// Titik masuk desktop ada di main.rs.
//
// Mode kios: jendela tidak bisa ditutup seperti biasa (Alt+F4, tombol tutup,
// klik kanan taskbar) karena CloseRequested selalu diblokir. Satu-satunya
// jalan keluar adalah chord Ctrl+Shift+Alt+Q lalu H (dalam 3 detik).
//
// CATATAN jujur: yang dikunci di sini hanya lapisan aplikasi. Shortcut
// kernel Windows (Ctrl+Shift+Del, Alt+Tab, Win+Tab) tidak bisa dicek dari
// aplikasi; untuk itu lihat docs/KIOSK.md (Windows Assigned Access).
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use tauri::WindowEvent;
use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutState};

/// Benar setelah chord pembuka ditekan, jadi listener keluar boleh lewat.
static CLOSE_UNLOCKED: AtomicBool = AtomicBool::new(false);

/// Jeda maksimum antara Q dan H pada chord pembuka.
const CHORD_WINDOW: Duration = Duration::from_millis(3000);

/// Shortcut yang ditelan supaya tidak membuka apa pun.
const BLOCKED: [&str; 6] = ["ctrl+shift+esc", "f12", "ctrl+shift+i", "ctrl+shift+j", "ctrl+r", "f5"];

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            use tauri_plugin_global_shortcut::GlobalShortcutExt;

            let handle = app.handle().clone();

            // Update cangkang dicek diam-diam, dipasang untuk dipakai
            // pada peluncuran berikutnya.
            tauri::async_runtime::spawn(async move {
                use tauri_plugin_updater::UpdaterExt;
                let Ok(updater) = handle.updater() else {
                    return;
                };
                let Ok(Some(update)) = updater.check().await else {
                    return;
                };
                let _ = update.download_and_install(|_, _| {}, || {}).await;
            });

            // Chord pembuka: Q menandai waktu, H dalam 3 detik = keluar.
            let chord_at: Arc<Mutex<Option<Instant>>> = Arc::new(Mutex::new(None));
            let chord_state = Arc::clone(&chord_at);
            let unlock_mods = Modifiers::CONTROL | Modifiers::SHIFT | Modifiers::ALT;

            handle.plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |app, shortcut, event| {
                        if !matches!(event.state(), ShortcutState::Pressed) {
                            return;
                        }
                        if shortcut.matches(unlock_mods, Code::KeyQ) {
                            if let Ok(mut guard) = chord_state.lock() {
                                *guard = Some(Instant::now());
                            }
                        } else if shortcut.matches(unlock_mods, Code::KeyH) {
                            let fresh = chord_state
                                .lock()
                                .ok()
                                .and_then(|mut guard| guard.take())
                                .map(|start| start.elapsed() <= CHORD_WINDOW)
                                .unwrap_or(false);
                            if fresh {
                                CLOSE_UNLOCKED.store(true, Ordering::SeqCst);
                                app.exit(0);
                            }
                        }
                    })
                    .build(),
            )?;

            // Pendaftaran satu per satu: kegagalan satu hotkey tidak boleh
            // menggagalkan start aplikasi.
            for accel in BLOCKED {
                if let Ok(sc) = accel.parse::<tauri_plugin_global_shortcut::Shortcut>() {
                    let _ = handle.global_shortcut().register(sc);
                }
            }
            for code in [Code::KeyQ, Code::KeyH] {
                let sc = tauri_plugin_global_shortcut::Shortcut::new(Some(unlock_mods), code);
                let _ = handle.global_shortcut().register(sc);
            }

            Ok(())
        })
        .on_window_event(|_window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if !CLOSE_UNLOCKED.load(Ordering::SeqCst) {
                    api.prevent_close();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("gagal menjalankan Ebook Viewer");
}