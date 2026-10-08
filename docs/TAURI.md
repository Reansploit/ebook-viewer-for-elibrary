# Aplikasi Tauri (Ebook Viewer)

Cangkang desktop untuk viewer. Web dimuat langsung dari server
(`frontendDist` berupa URL), jadi **update web ikut otomatis**:
server pull + `npm run build` + deploy, aplikasi di kios langsung
berubah tanpa install ulang. Rebuild cangkang hanya bila bagian
native berubah (URL bawaan, ikon, updater, fullscreen).

## Arsitektur

- `src-tauri/tauri.conf.json` → `build.frontendDist` = URL viewer server.
  Tidak ada aset web yang dibundel ke installer.
- Update cangkang: plugin updater, dicek diam-diam tiap start,
  dipasang dan berlaku pada peluncuran berikutnya.
- Target: Windows (NSIS). Build lewat GitHub Actions, bukan PC dev.

## Ganti URL viewer server

Bawaan: `https://viewer.elibrary.local` (placeholder).

- Cara cepat: isi repo variable `VIEWER_URL` di GitHub
  (Settings → Secrets and variables → Actions → Variables).
  Workflow otomatis menukarnya saat build.
- Cara manual: ubah `frontendDist` di `src-tauri/tauri.conf.json`.

URL boleh HTTP untuk LAN (mis. `http://192.168.1.10:4173`).
Serve folder `dist/` hasil `npm run build` di server itu.

## Kunci updater (sekali saja)

Jalankan di PC yang ada Node (boleh PC dev):

```bash
npx tauri signer generate -w $HOME/.tauri-ebook-viewer.key
```

Isi password saat diminta, lalu:

1. Salin **public key** ke `plugins.updater.pubkey`
   di `src-tauri/tauri.conf.json` (ganti `ISI_DENGAN_PUBLIC_KEY`).
2. Simpan **isi file `.key`** ke GitHub secret `TAURI_PRIVATE_KEY`,
   passwordnya ke `TAURI_PRIVATE_KEY_PASSWORD`.
3. Commit config, push. Jangan commit file `.key` (sudah di gitignore).

Tanpa kunci ini build tetap jalan, tapi artefak updater tidak
ditandatangani dan auto-update cangkang tidak aktif.

## Rilis cangkang baru

```bash
git tag tauri-v0.2.0
git push origin tauri-v0.2.0
```

Workflow `Tauri Release` membangun installer + `latest.json`,
menyimpannya sebagai **draft release** di GitHub. Periksa,
lalu Publish. Klien mengambil update dari:

```
https://github.com/Reansploit/ebook-viewer-for-elibrary/releases/latest/download/latest.json
```

Versi config + Cargo disamakan otomatis dari nama tag.

## Build lokal (di PC lain / server)

1. Install Rust stable (rustup) + Node 24.
2. `npm ci`
3. `npm run tauri:build` (butuh kunci hanya untuk updater bertanda).
4. Installer: `src-tauri/target/release/bundle/nsis/`.

WebView2 sudah bawaan Windows 10/11, tidak perlu install.

## Dev lokal

`npm run tauri:dev` (perlu Rust). Jendela memuat `devUrl`
(Vite dev server), bukan URL server.

## Troubleshooting

- Jendela putih/kosong: URL viewer salah atau server mati.
  Cek URL itu di browser biasa dulu.
- Fullscreen: `app.windows[0].fullscreen` di `tauri.conf.json`.
- Updater wajib HTTPS untuk endpoint: GitHub Releases sudah HTTPS,
  jadi aman walau konten viewer-nya HTTP LAN.
