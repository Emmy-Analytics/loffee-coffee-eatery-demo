LOFFEE INTRO ANIMATION — ASSET PACK
====================================

ISI
- images/*.png : aset makanan/drink hasil crop dan background removal otomatis untuk animasi intro
- images/food-composition-reference.png : referensi komposisi asli
- PROMPT-UNTUK-CODING-AGENT.txt : instruksi siap tempel untuk menambahkan animasi ke project website yang sudah ada
- SNIPPET-INTRO.html, SNIPPET-INTRO.css, SNIPPET-INTRO.js : contoh implementasi terpisah

PENTING
Aset PNG sudah diproses otomatis dari gambar komposisi. Karena background removal otomatis, periksa tepi transparan sebelum produksi; sebagian objek bisa punya sisa halo atau potongan kurang sempurna.
Aset visual ini adalah konsep, bukan foto produk resmi Loffee. Pastikan izin penggunaan visual sebelum website dipublikasikan.

CARA PAKAI
1. Ekstrak ZIP.
2. Salin folder `images` ke folder project website Loffee yang sekarang (jangan mengganti index.html/style.css/script.js seluruhnya).
3. Buka PROMPT-UNTUK-CODING-AGENT.txt, salin seluruh instruksi ke AI coding assistant di VS Code.
4. Minta agent memeriksa file website yang sudah ada dulu, lalu hanya menambahkan intro overlay dan CSS/JS yang diperlukan.
5. Uji di desktop dan mobile, termasuk tombol Skip dan prefers-reduced-motion.
