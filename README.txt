LOFFEE COFFEE & EATERY — CONCEPT WEBSITE
========================================

ISI FOLDER
- index.html : struktur halaman dan footer
- style.css  : desain responsif, minimalis, clean
- script.js  : menu dinamis, pencarian, filter kategori, navigasi mobile
- config.js  : tempat menempel URL API Google Apps Script

CARA MENJALANKAN DI VS CODE
1. Ekstrak ZIP.
2. Buka folder hasil ekstrak di VS Code.
3. Jika menggunakan Live Server, klik kanan index.html > Open with Live Server.
4. Untuk menghubungkan menu, buka config.js dan ganti API_URL dengan URL Web App Apps Script yang berakhiran /exec.
5. Simpan file, lalu refresh halaman browser.

PENTING TENTANG API
- Gunakan URL Web App hasil Deploy > Manage deployments / New deployment, bukan URL editor Apps Script.
- Endpoint API publik hanya boleh mengembalikan data yang aman untuk dilihat publik.
- Website hanya menampilkan item dengan kolom `tersedia` bernilai TRUE.
- Kolom yang dipakai: nama, deskripsi, harga, kategori, foto_url, tersedia, urutan.
- Apps Script yang sekarang mengirim seluruh kolom baris; sebelum publikasi, sebaiknya API diubah agar hanya mengirim kolom publik yang diperlukan.
- Pastikan harga/foto/ketersediaan sudah diverifikasi dan disetujui pihak Loffee sebelum mengaktifkan menu.
- Jangan masukkan password, token admin, atau data pribadi ke config.js.

KONTEN YANG MASIH PERLU DIKONFIRMASI
- Foto Unsplash adalah foto placeholder untuk konsep, bukan foto resmi outlet/menu Loffee.
- Copy bagian hero/tentang adalah konsep.
- Jam operasional, nomor WhatsApp, Instagram, detail reservasi, dan info resmi lainnya belum ditambahkan karena perlu konfirmasi.
- Tautan Google Maps mengarah ke lokasi Loffee Tebet yang diberikan pengguna.
- Halaman ini belum memproses transaksi atau reservasi; fokus saat ini adalah website informasi dan katalog menu.

CARA UPDATE MENU
Ubah data pada Google Sheets tab Menu. Untuk menampilkan menu di website, pastikan `tersedia` bernilai TRUE setelah data menu diverifikasi. Nama kolom harus dipertahankan.

VISUAL UPDATE
- Foto produk lokal diekstrak dari PDF menu Loffee 2026 yang diberikan untuk konsep website. Pastikan izin penggunaan untuk publikasi sudah didapat dari Loffee.
- Jika foto menu sudah tersedia di Google Sheets (foto_url), foto itu diprioritaskan di atas fallback lokal.

OPENING ANIMATION
- Website memiliki opening animation singkat dengan foto menu jatuh, logo muncul, lalu layar pembuka naik.
- Pengunjung dapat klik Skip intro. Animasi dimainkan sekali per sesi tab dan menghormati preferensi reduced-motion.
- Untuk melihat lagi saat tes, buka tab browser baru atau hapus sessionStorage loffeeIntroPlayed dari DevTools.
