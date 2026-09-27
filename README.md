# E-Kartu Ujian SMK Budi Mulya V11

Fokus V11: Manajemen Data Ujian untuk menjaga Spreadsheet dan Google Drive tetap ringan.

## Fitur Admin
- Backup Data Ujian: membuat folder backup berisi JSON data + salinan foto.
- Hapus Foto Peserta: menghapus foto pada folder yang dikelola aplikasi dan mengosongkan URL foto pada DataSiswa.
- Reset Data Ujian: menghapus peserta, foto, jadwal, dan riwayat cetak; akun pengguna dan identitas sekolah tetap.
- Semua tindakan manajemen data memerlukan login Admin.

## Instalasi
1. Ganti `Code.gs` pada Apps Script dengan V11.
2. Deploy Apps Script sebagai versi baru Web App.
3. Ganti `index.html` pada GitHub dengan V11.
4. `config.js` tetap.
5. Backup sebelum melakukan reset.

Folder foto dan backup dibuat otomatis oleh Apps Script. Reset hanya menghapus file di folder foto yang dikelola aplikasi, bukan file Drive lain.
