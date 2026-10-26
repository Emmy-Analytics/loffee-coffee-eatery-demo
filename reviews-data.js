/*
 * LOFFEE REVIEWS — KONTEN DEMO SAJA.
 * Semua nama, rating, komentar, tanggal, dan foto di file ini adalah
 * CONTOH UNTUK DEMONSTRASI LAYOUT, bukan ulasan pelanggan asli.
 *
 * CARA MENGGANTI DENGAN ULASAN ASLI:
 * 1. Setelah ulasan pelanggan asli tersedia (mis. dari formulir review
 *    atau Google Reviews yang disetujui), salin ke array di bawah
 *    dengan field: name, rating (1-5), date, category, text, photo.
 * 2. Ubah window.LOFFEE_REVIEWS_DEMO.active dari true menjadi false
 *    supaya banner DEMO hilang, atau biarkan true selama masih demo.
 * 3. Jangan tampilkan konten demo sebagai ulasan asli di produksi.
 */
window.LOFFEE_REVIEWS_DEMO = {
  active: true,
  note: "Contoh ulasan untuk demonstrasi layout — bukan ulasan pelanggan asli.",
  items: [
    {
      name: "Pelanggan Demo A",
      rating: 5,
      date: "Mei 2026",
      category: "makanan",
      text: "Contoh ulasan — DEMO. Deskripsi pengalaman makan di sini akan ditulis ulang oleh pelanggan asli setelah data tersedia.",
      photo: "assets/reviews/demo-dish-1.svg"
    },
    {
      name: "Pelanggan Demo B",
      rating: 4,
      date: "Mei 2026",
      category: "minuman",
      text: "Contoh ulasan — DEMO. Komentar tentang kopi dan minuman akan menggantikan teks contoh ini.",
      photo: "assets/reviews/demo-dish-2.svg"
    },
    {
      name: "Pelanggan Demo C",
      rating: 5,
      date: "April 2026",
      category: "suasana",
      text: "Contoh ulasan — DEMO. Cerita tentang suasana kafe untuk demonstrasi tampilan halaman review.",
      photo: "assets/reviews/demo-dish-3.svg"
    },
    {
      name: "Pelanggan Demo D",
      rating: 4,
      date: "April 2026",
      category: "pelayanan",
      text: "Contoh ulasan — DEMO. Komentar tentang pelayanan staff hanya untuk keperluan demonstrasi layout.",
      photo: "assets/reviews/demo-dish-4.svg"
    },
    {
      name: "Pelanggan Demo E",
      rating: 5,
      date: "Maret 2026",
      category: "makanan",
      text: "Contoh ulasan — DEMO. Ulasan contoh tambahan agar layout grid terlihat lengkap.",
      photo: "assets/reviews/demo-dish-5.svg"
    },
    {
      name: "Pelanggan Demo F",
      rating: 4,
      date: "Maret 2026",
      category: "minuman",
      text: "Contoh ulasan — DEMO. Ulasan contoh tambahan agar layout grid terlihat lengkap.",
      photo: "assets/reviews/demo-dish-6.svg"
    }
  ]
};
