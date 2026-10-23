/*
 * KONFIGURASI WEBSITE LOFFEE
 * 1. Tempel URL Web App Apps Script yang berakhiran /exec pada API_URL.
 * 2. Jangan masukkan URL editor Apps Script atau URL script.googleusercontent.com.
 * 3. Untuk menu publik, Apps Script sebaiknya hanya mengirim kolom yang memang boleh ditampilkan.
 */
window.LOFFEE_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbwo1ty5R-6e47RZsL6aQmCVMDe0v--qHZ-gp55VOvsscfGe1EIMHkOVVuzju2xQ9RE/exec",
  CURRENCY: "IDR",
  SHOW_UNVERIFIED_NOTICE: true,
  /* Nomor WhatsApp untuk checkout (format internasional tanpa +/spasi, contoh: 6281234567890).
     Kosongkan ("") jika nomor belum dikonfirmasi — tombol WA akan otomatis disembunyikan. */
  WA_NUMBER: ""
};
