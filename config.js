/*
 * KONFIGURASI WEBSITE LOFFEE
 * 1. Tempel URL Web App Apps Script yang berakhiran /exec pada API_URL.
 * 2. Jangan masukkan URL editor Apps Script atau URL script.googleusercontent.com.
 * 3. Untuk menu publik, Apps Script sebaiknya hanya mengirim kolom yang memang boleh ditampilkan.
 * 4. Tab "Favorit" di spreadsheet mengatur isi carousel Favorit Pelanggan
 *    (kolom: id_menu, urutan, aktif, label). Lihat apps-script.txt.
 */
window.LOFFEE_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbwo1ty5R-6e47RZsL6aQmCVMDe0v--qHZ-gp55VOvsscfGe1EIMHkOVVuzju2xQ9RE/exec",
  CURRENCY: "IDR",
  SHOW_UNVERIFIED_NOTICE: true,
  /* Nomor WhatsApp resmi Loffee — dipakai checkout keranjang & reservasi. */
  WA_NUMBER: "628979311696",
  WA_DISPLAY: "+62 897-9311-696",
  /* Tautan platform pemesanan — PLACEHOLDER DEMO.
     Ganti dengan URL listing resmi Loffee sebelum publikasi. */
  GOFOOD_URL: "https://example.com/demo-gofood",
  GRABFOOD_URL: "https://example.com/demo-grabfood",
  SHOPEEFOOD_URL: "https://example.com/demo-shopeefood",
  /* Kredit / promosi web developer (PortoWeb.id) — terpisah dari identitas Loffee. */
  PORTOWEB_WA: "6282195670441",
  PORTOWEB_WA_DISPLAY: "0821-9567-0441",
  PORTOWEB_IG: "https://www.instagram.com/portoweb.id/"
};
