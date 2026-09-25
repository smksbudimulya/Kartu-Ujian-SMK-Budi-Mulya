# E-Kartu Ujian — SMKS Budi Mulya

Frontend: GitHub Pages  
Backend + database: Google Apps Script + Google Spreadsheet

## 1. Atur URL backend

Buka `config.js`, lalu ganti:

`PASTE_APPS_SCRIPT_WEB_APP_URL_HERE`

dengan URL Web App Google Apps Script yang berakhiran `/exec`.

Contoh:
`https://script.google.com/macros/s/AKfycb.../exec`

## 2. Upload ke repository GitHub

Letakkan isi folder ini di root repository:
- `index.html`
- `config.js`
- `.nojekyll`
- `.github/workflows/pages.yml`
- `Code.gs` hanya untuk backend Apps Script, bukan untuk dijalankan di GitHub Pages.

## 3. GitHub Pages

Masuk ke:
`Settings` → `Pages`

Pilih:
- Source: **GitHub Actions**

Setelah push ke branch `main`, buka:
`Actions` → **Deploy E-Kartu Ujian to GitHub Pages**

Tunggu workflow sampai **Success**, lalu klik URL Pages.

## 4. Backend Apps Script

Salin `Code.gs` ke project Apps Script yang terhubung dengan Spreadsheet.

Jalankan `setupDatabase()` satu kali.

Deploy:
- Execute as: **Me**
- Who has access: **Anyone**

Salin URL `/exec` ke `config.js`.

## 5. Fitur utama

- Login pengguna
- Role Admin / Guru / Peserta
- Pengaturan identitas ujian
- Import Excel / CSV
- Penggantian data siswa lama dengan data terbaru saat import
- Upload logo
- Tanda tangan: tanpa TTD / gambar / tanda tangan digital
- Kartu Peserta dan Kartu Meja
- QR Code
- Jadwal ujian halaman belakang
- Preview
- Unduh PDF langsung
- Cetak
- Riwayat cetak
- Manajemen pengguna untuk Admin
- Sinkronisasi dengan Google Spreadsheet

## Catatan

GitHub Pages adalah hosting statis. Data dan proses penyimpanan tetap dilakukan oleh Google Apps Script.

Jangan menyimpan data rahasia atau password backend di repository publik. URL Web App Apps Script memang harus dapat diakses browser agar frontend GitHub Pages dapat berkomunikasi dengan backend.
