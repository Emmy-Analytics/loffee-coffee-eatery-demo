/* LOFFEE LANG & RESERVE — penerapan terjemahan (lapisan tampilan) + form reservasi.
   Tidak mengubah data menu/harga/alamat; hanya teks UI. */
(function () {
  const LANG_KEY = "loffeeLang";
  const dict = window.LOFFEE_I18N || { id: {}, en: {} };
  let lang = "id";
  try { lang = localStorage.getItem(LANG_KEY) === "en" ? "en" : "id"; } catch (_) { }

  const t = key => (dict[lang] && dict[lang][key]) ?? (dict.id && dict.id[key]) ?? key;

  function applyStatic() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      const val = t(key);
      if (typeof val === "string") {
        if (el.hasAttribute("data-i18n-html")) el.innerHTML = val; else el.textContent = val;
      }
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(el => {
      const val = t(el.dataset.i18nPh);
      if (typeof val === "string") el.placeholder = val;
    });
    document.documentElement.lang = lang;
  }

  function applyDynamic() {
    // Elemen yang teksnya dirender oleh script.js — diberi tanda data-i18n-dyn
    document.querySelectorAll("[data-i18n-dyn]").forEach(el => {
      const val = t(el.dataset.i18nDyn);
      if (typeof val === "string") el.textContent = val;
    });
    // Placeholder pencarian
    const search = document.getElementById("menuSearch");
    if (search) search.placeholder = t("searchPlaceholder");
    // Tombol tambah & hint galeri
    document.querySelectorAll(".gallery-add").forEach(b => { if (!b.disabled) b.textContent = t("galAdd"); });
    document.querySelectorAll(".add-to-cart:not(.gallery-add)").forEach(b => { if (!b.disabled) b.textContent = t("addToCart"); });
    const hint = document.querySelector(".gallery-hint");
    if (hint) hint.textContent = t("galHint");
  }

  window.LoffeeLang = {
    get: () => lang,
    apply() { applyStatic(); applyDynamic(); },
    set(next) {
      lang = next === "en" ? "en" : "id";
      try { localStorage.setItem(LANG_KEY, lang); } catch (_) { }
      applyStatic(); applyDynamic();
      document.querySelectorAll("#langSwitch button").forEach(b => {
        const on = b.dataset.lang === lang;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      document.dispatchEvent(new CustomEvent("loffee:langchange", { detail: { lang } }));
    }
  };
  // Jembatan untuk script.js (status, empty state, dsb.) — fungsi kamus diteruskan apa adanya
  window.LoffeeI18nT = key => {
    const v = dict[lang] && dict[lang][key];
    return typeof v === "function" ? v : (typeof v === "string" ? v : key);
  };

  // Toggle navbar
  const sw = document.getElementById("langSwitch");
  if (sw) {
    sw.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => window.LoffeeLang.set(b.dataset.lang));
      b.classList.toggle("active", b.dataset.lang === lang);
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });
  }
  window.LoffeeLang.apply();

  /* ================= RESERVASI ================= */
  const form = document.getElementById("reserveForm");
  if (!form) return;
  const errEl = document.getElementById("reserveError");
  const waNumber = String((window.LOFFEE_CONFIG || {}).WA_NUMBER || "").replace(/\D/g, "");

  function showErr(msg) {
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.hidden = !msg;
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    showErr("");
    const name = document.getElementById("rsvName").value.trim();
    const phone = document.getElementById("rsvPhone").value.replace(/\D/g, "");
    const branch = document.getElementById("rsvBranch").value;
    const room = document.getElementById("rsvRoom").value;
    const date = document.getElementById("rsvDate").value;
    const time = document.getElementById("rsvTime").value;
    const guests = Number(document.getElementById("rsvGuests").value);
    const note = document.getElementById("rsvNote").value.trim();

    if (!name || !phone || !date || !time || !guests) return showErr(t("rsvErrRequired"));
    if (phone.length < 8 || phone.length > 15) return showErr(t("rsvErrPhone"));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(date + "T00:00:00") < today) return showErr(t("rsvErrDate"));
    if (!(guests >= 1 && guests <= 30)) return showErr(t("rsvErrGuests"));

    if (!waNumber) return showErr(t("rsvWANotConfigured"));
    const dateFmt = new Date(date + "T00:00:00").toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "long", year: "numeric" });
    const text = t("rsvSummary")(name, phone, dateFmt, time, guests, note, branch, room);
    window.open(`https://wa.me/${waNumber}?text=${text}`, "_blank", "noopener");
    // Tidak ada klaim konfirmasi — hanya membuka WhatsApp dengan ringkasan.
  });
})();
