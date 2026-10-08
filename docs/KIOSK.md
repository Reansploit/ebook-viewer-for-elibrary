# Mode kios

PC perpustakaan hanya untuk membuka viewer. Dua lapis penguncian:
lapisan aplikasi (sudah di-build ke dalam installer) dan lapis sistem
(yang harus dipasang manual di tiap PC).

## Lapisan aplikasi (otomatis, sudah di dalam build)

| Pintasan | Status |
|---|---|
| Alt+F4 | Tertutup (jendela menolak `CloseRequested`) |
| Tombol tutup jendela | Tertutup (`decorations: false`, tombol tidak ada) |
| Klik kanan taskbar lalu Close | Tertutup (juga `CloseRequested`) |
| Ctrl+Shift+Esc (Task Manager) | Ditelan (global hotkey tanpa aksi) |
| F12, Ctrl+Shift+I, Ctrl+Shift+J | Ditelan |
| F5, Ctrl+R (muat ulang) | Ditelan |
| Klik kanan dan seret halaman | Diblokir (`src/kiosk.js`) |

Cara keluar yang sah: chord **Ctrl+Shift+Alt+Q lalu H** dalam 3
detik. Chord ini hanya satu, jadi tidak bisa ditebak tanpa disengaja.

Chord tetap bekerja walau tidak ada halaman web yang terbuka, karena
ditangani plugin native.

## Lapisan sistem (wajib untuk kunci total)

Ctrl+Shift+Del, Alt+Tab, dan Win+Tab ditangani kernel dan shell
Windows, bukan oleh aplikasi. Tidak ada kode aplikasi yang bisa
mencegahnya. Dua langkah berikut yang menutup celah tersebut.

### 1. Matikan Task Manager, Registry Editor, dan Run

Buka PowerShell **sebagai Administrator**, jalankan sekali per PC:

```powershell
$sys = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\System"
New-Item -Path $sys -Force | Out-Null
New-ItemProperty -Path $sys -Name DisableTaskMgr -Value 1 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path $sys -Name DisableRegistryTools -Value 1 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path $sys -Name NoRun -Value 1 -PropertyType DWord -Force | Out-Null
```

Cara-balik kalau perlu:

```powershell
Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\System" -Name DisableTaskMgr,DisableRegistryTools,NoRun
```

### 2. Kiosk mode Windows (Assigned Access)

Ini satu-satunya cara resmi untuk menahan Alt+Tab, Win+Tab, dan
desktop. Butuh Windows 10 atau 11 edisi Pro atau Edu.

1. Jalankan `msconfig`, tab **Boot**, centang **Safe boot**, pilih
   **Minimal**, lalu Restart.
2. Setelah restart, di pojok kanan bawah tekan **Yes** saat diminta
   masuk ke mode kios. PC hanya menerima aplikasi yang ditentukan.
3. Tambahkan viewer ke daftar yang boleh jalan: pakai
   `AssignedAccess.cmd` dengan nama pengguna kios, atau lewat
   **Settings - Accounts - Family & other users - Set up a kiosk
   account - Assign an app**.
4. Setelah beres, buka `msconfig` lagi lalu matikan Safe boot.

Setelah aktif, Alt+Tab, Win+Tab, Win+D, dan task Ctrl+Alt+Del tidak
berfungsi karena shell desktop tidak pernah tampil.

### Batas yang tidak bisa ditutup

- **Ctrl+Shift+Del** adalah Secure Attention Sequence, dipanggil
  kernel sebelum aplikasi apa pun berjalan. Secara teknis tidak ada
  aplikasi yang bisa memblokirnya.
- Ctrl+Alt+Delete untuk ganti pengguna (`tselect-user`) tetap ada di
  kiosk mode; untuk menutupnya perlu Group Policy Computer
  Configuration - Administrative Templates - Windows Components -
  Logon - Deny log on locally, di luar cakupan panduan ini.
- Pengguna bisa log off atau memutus listrik. Untuk kios di ruang
  publik, gunakan UPS dan akun tanpa hak admin.
- Akses fisik ke PC selalu menjadi celah: orang bisa masuk dari
  account lain, memakai recovery Windows, atau mengganti drive. Kunci
  dengan password BIOS dan enkripsi disk bila perlu.

## Verifikasi setelah dipasang

- [ ] Alt+F4 tidak menutup
- [ ] Ctrl+Shift+Esc tidak membuka Task Manager
- [ ] Win+E tidak membuka File Explorer
- [ ] Ctrl+Alt+Del menampilkan layar biru SAS (hanya di kiosk mode)
- [ ] Chord Ctrl+Shift+Alt+Q lalu H menutup dengan rapi