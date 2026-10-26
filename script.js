(() => {

  // Loffee intro reveal: play once per tab/session, always skippable, reduced-motion aware.
  (function loffeeIntro() {
    const intro = document.getElementById("loffeeIntro");
    if (!intro) return;
    let alreadyPlayed = false;
    try { alreadyPlayed = sessionStorage.getItem("loffeeIntroPlayed") === "yes"; } catch (_) {}
    let storageOk = true;
    try { sessionStorage.setItem("loffeeIntroPlayed", alreadyPlayed ? "yes" : "pending"); } catch (_) { storageOk = false; }
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (alreadyPlayed || prefersReduced) { intro.remove(); return; }

    document.body.classList.add("loffee-intro-lock");
    let closed = false;
    const closeIntro = () => {
      if (closed || !intro.isConnected) return;
      closed = true;
      intro.classList.add("is-closing");
      document.body.classList.remove("loffee-intro-lock");
      if (storageOk) { try { sessionStorage.setItem("loffeeIntroPlayed", "yes"); } catch (_) {} }
      window.setTimeout(() => intro.remove(), 1100);
    };
    const skipButton = document.getElementById("loffeeIntroSkip");
    if (skipButton) skipButton.addEventListener("click", closeIntro);
    intro.addEventListener("click", event => { if (event.target === intro) closeIntro(); });
    window.addEventListener("keydown", event => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") closeIntro();
    }, { once: true });
    window.setTimeout(closeIntro, 3400);
  })();
  const config = window.LOFFEE_CONFIG || {};
  const grid = document.getElementById("menuGrid");
  const status = document.getElementById("menuStatus");
  const filters = document.getElementById("categoryFilters");
  const search = document.getElementById("menuSearch");
  const menuToggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");
  let menuItems = [];
  let activeCategory = "Semua";

  /* Flag bersama yang dipakai modul interaksi di bawah. Dipindah ke sini
     agar tidak ada deklarasi ulang / TDZ antar-blok. */
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const introWasPlayed = !!document.getElementById("loffeeIntro");
  const childObserver = prefersReduced || !("IntersectionObserver" in window) ? null : new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const siblings = entry.target.parentElement ? [...entry.target.parentElement.children].filter(c => c.classList.contains("reveal-child")) : [];
        entry.target.style.transitionDelay = `${Math.min(siblings.indexOf(entry.target), 7) * 55}ms`;
        entry.target.classList.add("is-visible");
        childObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });

  document.getElementById("year").textContent = new Date().getFullYear();

  menuToggle.addEventListener("click", () => {
    const opened = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(opened));
  });
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));

  const rupiah = value => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0
  }).format(Number(value) || 0);

  const t = key => (window.LoffeeI18nT ? window.LoffeeI18nT(key) : key);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function showStatus(message, kind = "") {
    status.textContent = message;
    status.className = `menu-status ${kind}`.trim();
  }
  // Simpan pesan status terakhir agar bisa dipenerjemahkan ulang saat ganti bahasa
  let lastStatus = { msg: "", kind: "" };
  const showStatusT = (key, kind = "") => {
    const msg = window.LoffeeI18nT ? window.LoffeeI18nT(key) : key;
    lastStatus = { key, kind };
    showStatus(msg, kind);
  };

  // Ganti bahasa: perbarui tombol kategori & status terakhir
  document.addEventListener("loffee:langchange", () => {
    renderFilters();
    if (lastStatus.key === "catCount") showStatus(t("catCount")(lastStatus.count || 0), lastStatus.kind);
    else if (lastStatus.key) showStatus(t(lastStatus.key), lastStatus.kind);
  });

  function getField(item, ...keys) {
    for (const key of keys) {
      if (item[key] !== undefined && item[key] !== null && item[key] !== "") return item[key];
    }
    return "";
  }

  function normalizeItem(item) {
    return {
      id: String(getField(item, "id", "ID")),
      name: String(getField(item, "nama", "name", "nama_menu")),
      description: String(getField(item, "deskripsi", "description")),
      price: Number(getField(item, "harga", "price")) || 0,
      category: String(getField(item, "kategori", "category") || "Lainnya").trim() || "Lainnya",
      photo: String(getField(item, "foto_url", "photo", "foto", "image_url")).trim(),
      available: String(getField(item, "tersedia", "available")).toUpperCase() === "TRUE",
      verified: String(getField(item, "status_verifikasi", "verified_status")).toUpperCase().includes("TERVERIFIKASI"),
      order: Number(getField(item, "urutan", "order")) || 9999
    };
  }

  function safeImageUrl(url) {
    const value = String(url || "").trim();
    // Abaikan nilai placeholder dari spreadsheet ("-", "yes", "true", "0", dsb.)
    if (!value || /^(?:-|yes|ya|true|false|no|tidak|0|belum|-+)$/i.test(value)) return "";
    try {
      const parsed = new URL(value, window.location.href);
      return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : "";
    } catch { return ""; }
  }

  
  function renderFilters() {
    filters.replaceChildren();

    const button = document.createElement("button");
    button.className = `filter${activeCategory === "Semua" ? " active" : ""}`;
    button.dataset.category = "Semua";
    button.textContent = t("catAll");

    button.addEventListener("click", () => {
      activeCategory = "Semua";
      search.value = "";
      updateSearchClear();
      renderFilters();
      renderMenu();
    });

    filters.appendChild(button);

    /* Chip kategori dari data asli: klik = pilih kategori + gulir
       halus ke grid. Tidak ada kategori karangan. --- */
    const seen = new Set();
    menuItems.forEach(item => {
      if (seen.has(item.category)) return;
      seen.add(item.category);
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `filter category-chip${activeCategory === item.category ? " active" : ""}`;
      chip.dataset.category = item.category;
      chip.textContent = item.category;
      chip.addEventListener("click", () => {
        activeCategory = item.category;
        search.value = "";
        updateSearchClear();   // FIX: sembunyikan tombol close saat kata kunci dihapus lewat chip
        renderFilters();
        renderMenu();
        grid.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
        const active = filters.querySelector(".filter.active");
        if (active && active.scrollIntoView) active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      });
      filters.appendChild(chip);
    });

    /* Mobile: tombol "Lihat semua kategori" + bottom sheet daftar lengkap.
       Daftar di sheet adalah salinan chip; pemilihannya sinkron dengan utama. */
    const toggleWrap = document.querySelector(".cat-all-toggle-wrap");
    const sheetFilters = document.getElementById("categoryFiltersSheet");
    if (toggleWrap && sheetFilters) {
      const isMobile = () => window.matchMedia("(max-width: 650px)").matches;
      toggleWrap.style.display = isMobile() ? "block" : "none";
      sheetFilters.replaceChildren();
      const cloneInto = (srcBtn, label) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = srcBtn.className;
        b.textContent = label;
        b.addEventListener("click", () => { srcBtn.click(); closeSheet(); });
        sheetFilters.appendChild(b);
      };
      [...filters.children].forEach(b => cloneInto(b, b.textContent));
      const backdrop = document.getElementById("catSheetBackdrop");
      const openSheet = () => {
        if (!isMobile()) return;
        backdrop.hidden = false;
        requestAnimationFrame(() => backdrop.classList.add("open"));
        document.getElementById("catAllToggle").setAttribute("aria-expanded", "true");
        document.getElementById("catSheetClose").focus();
      };
      const closeSheet = () => {
        backdrop.classList.remove("open");
        document.getElementById("catAllToggle").setAttribute("aria-expanded", "false");
        setTimeout(() => { backdrop.hidden = true; }, 260);
      };
      document.getElementById("catAllToggle").onclick = openSheet;
      document.getElementById("catSheetClose").onclick = closeSheet;
      backdrop.addEventListener("click", e => { if (e.target === backdrop) closeSheet(); });
      document.addEventListener("keydown", e => { if (e.key === "Escape" && !backdrop.hidden) closeSheet(); });
    }
  }


  function renderMenu() {
    const keyword = search.value.trim().toLocaleLowerCase("id-ID");
    // Tanpa kata kunci + "Semua": tampilkan pilihan kategori dulu, bukan 151 item sekaligus
    if (!keyword && activeCategory === "Semua") {
      renderCategoryBrowser();
      return;
    }
    const visible = menuItems.filter(item => {
      const matchesCategory =
        keyword !== "" ||
        activeCategory === "Semua" ||
        item.category === activeCategory;
      const haystack = `${item.name} ${item.description} ${item.category}`.toLocaleLowerCase("id-ID");
      return matchesCategory && haystack.includes(keyword);
    });
    grid.replaceChildren();

    if (!visible.length) {
      const empty = document.createElement("div");
      empty.className = "empty-menu";
      empty.innerHTML = "<span aria-hidden=\"true\">·</span><h3>" + esc(t("errSearchTitle")) + "</h3><p>" + esc(t("errSearchBody")) + "</p>";
      grid.appendChild(empty);
      return;
    }

    visible.forEach(item => {
      const card = document.createElement("article");
      card.className = "menu-card reveal-child";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-haspopup", "dialog");
      card.dataset.itemId = item.id;
      card.addEventListener("click", () => openMenuModal(item));
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openMenuModal(item); }
      });
      const image = document.createElement("div");
      image.className = "menu-card-image";
      const imageUrl = safeImageUrl(item.photo) || localPhotoFor(item);
      if (imageUrl) {
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = item.name;
        img.loading = "lazy";
        img.onerror = () => { img.remove(); image.classList.add("no-photo"); image.textContent = "LOFFEE"; };
        image.appendChild(img);
      } else {
        image.classList.add("no-photo");
        image.textContent = "LOFFEE";
      }
      const content = document.createElement("div");
      content.className = "menu-card-content";
      const category = document.createElement("p");
      category.className = "menu-card-category";
      category.textContent = item.category;
      const title = document.createElement("h3");
      title.textContent = item.name || "Menu Loffee";
      const description = document.createElement("p");
      description.className = "menu-card-description";
      description.textContent = item.description || "Pilihan dari menu Loffee.";
      const bottom = document.createElement("div");
      bottom.className = "menu-card-bottom";
      const price = document.createElement("strong");
      price.textContent = item.price > 0 ? rupiah(item.price) : "Harga belum tersedia";
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "add-to-cart";
      addBtn.textContent = "Tambah";
      addBtn.setAttribute("aria-label", `Tambah ${item.name || "menu"} ke keranjang`);
      addBtn.disabled = item.price <= 0;
      addBtn.title = item.price <= 0 ? "Harga belum tersedia" : "Tambah ke keranjang";
      addBtn.addEventListener("click", event => {
        event.stopPropagation();
        addToCart(item);
      });
      bottom.append(price, addBtn);
      content.append(category, title, description, bottom);
      card.append(image, content);
      grid.appendChild(card);
    });
  }

  /* --- Pemetaan foto lokal (prioritas: foto_url dari Sheets, lalu nama, lalu kategori).
     Aset dipakai = cutout SVG bersih dari images/ (tanpa teks/harga PDF). --- */
  const PHOTO_BY_NAME = [
    { keys: ["gimbap"], photo: "images/gimbap.svg" },
    { keys: ["tteokbokki"], photo: "images/tteokbokki.svg" },
    { keys: ["croffle"], photo: "images/croffle.svg" },
    { keys: ["matcha"], photo: "images/matcha.svg" },
    { keys: ["pasta", "spaghetti", "carbonara", "bolognese"], photo: "images/creamy-pasta.svg" },
    { keys: ["korean chicken", "yangnyeom", "chicken basket", "chibab", "buldak", "ufo chickin", "schnitzel", "fish & chips", "bburinkle"], photo: "assets/loffee_image_004_p01.png" },
    { keys: ["gelato", "es krim"], photo: "images/strawberry-drink.svg" }
  ];
  function localPhotoFor(item) {
    const name = String(item.name || "").toLowerCase();
    for (const entry of PHOTO_BY_NAME) {
      if (entry.keys.some(key => name.includes(key))) return entry.photo;
    }
    const categoryKey = String(item.category || "").toLowerCase();
    if (categoryKey.includes("gimbap")) return "images/gimbap.svg";
    // K-Pot Add-ons: tanpa foto spesifik -> placeholder netral (jangan pinjam foto produk lain)
    if (categoryKey.includes("k-pot")) return "images/no-photo.svg";
    if (categoryKey.includes("korean dish") || categoryKey.includes("tteokbokki")) return "images/tteokbokki.svg";
    // K-Pot Add-ons: tanpa foto spesifik -> placeholder netral (jangan pinjam foto produk lain)
    if (categoryKey.includes("matcha")) return "images/matcha.svg";
    if (categoryKey.includes("croffle") || categoryKey.includes("gelato") || categoryKey.includes("dessert")) return "images/croffle.svg";
    if (categoryKey.includes("coffee")) return "images/iced-coffee.svg";
    if (categoryKey.includes("non-coffee") || categoryKey.includes("tea") || categoryKey.includes("juice") || categoryKey.includes("avocado")) return "images/lemon-tea.svg";
    if (categoryKey.includes("pasta") || categoryKey.includes("western")) return "images/creamy-pasta.svg";
    if (categoryKey.includes("korean") || categoryKey.includes("sharing") || categoryKey.includes("signature") || categoryKey.includes("noodle") || categoryKey.includes("snack") || categoryKey.includes("fritters") || categoryKey.includes("fried") || categoryKey.includes("kids") || categoryKey.includes("indonesian") || categoryKey.includes("platter") || categoryKey.includes("bundling") || categoryKey.includes("add-on") || categoryKey.includes("bburinkle")) return "images/korean-chicken.svg";
    return "";
  }

  /* --- Browser kategori: kartu kategori dengan foto & jumlah item --- */
  function renderCategoryBrowser() {
    // (dipanggil dari renderMenu)
    const counts = {};
    const sample = {};
    menuItems.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
      if (!sample[item.category]) sample[item.category] = item;
    });
    const categories = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    grid.replaceChildren();
    const hint = document.createElement("div");
    hint.className = "category-browser-hint";
    hint.textContent = "Pilih kategori untuk melihat menu";
    grid.appendChild(hint);
    categories.forEach(category => {
      const card = document.createElement("article");
      card.className = "menu-card category-card reveal-child";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Lihat menu kategori ${category}, ${counts[category]} item`);
      const open = () => {
        activeCategory = category;
        renderFilters();
        renderMenu();
        document.getElementById("menu").scrollIntoView({ behavior: "smooth", block: "start" });
      };
      card.addEventListener("click", open);
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
      });
      const image = document.createElement("div");
      image.className = "menu-card-image";
      const photo = localPhotoFor(sample[category]);
      if (photo) {
        const img = document.createElement("img");
        img.src = photo;
        img.alt = "";
        img.loading = "lazy";
        img.onerror = () => { img.remove(); image.classList.add("no-photo"); image.textContent = "LOFFEE"; };
        image.appendChild(img);
      } else {
        image.classList.add("no-photo");
        image.textContent = "LOFFEE";
      }
      const content = document.createElement("div");
      content.className = "menu-card-content";
      const name = document.createElement("h3");
      name.textContent = category;
      const meta = document.createElement("p");
      meta.className = "category-card-meta";
      meta.textContent = `${counts[category]} menu tersedia`;
      content.append(name, meta);
      card.append(image, content);
      grid.appendChild(card);
    });
    const cards = grid.querySelectorAll(".reveal-child");
    if (childObserver) cards.forEach(c => childObserver.observe(c));
    else cards.forEach(c => c.classList.add("is-visible"));
  }

  async function loadMenu() {
    const endpoint = String(config.API_URL || "").trim();
    if (!endpoint || endpoint.includes("TEMPEL_URL_")) {
      showStatusT("statusLoading", "notice");
      grid.innerHTML = '<div class="empty-menu"><span aria-hidden="true">·</span><h3>Siap terhubung ke Google Sheets</h3><p>Website ini belum menampilkan harga contoh. Setelah URL API dipasang, menu aktif dari tab Menu akan muncul di sini.</p></div>';
      return;
    }

    try {
      showStatusT("statusLoading");
      const response = await fetch(endpoint, { method: "GET", cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.success === false) throw new Error(result.message || "API mengembalikan error.");

      const rawItems = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : []);
      menuItems = rawItems.map(normalizeItem)
        .filter(item => item.name && item.available)
        .sort((a, b) => a.order - b.order);

      if (config.SHOW_UNVERIFIED_NOTICE && menuItems.some(item => !item.verified)) {
        showStatusT("statusNotice", "notice");
      } else if (menuItems.length) {
        const n = menuItems.length;
        const msg = (window.LoffeeI18nT && window.LoffeeI18nT("catCount")(n)) || `${n} menu tersedia`;
        lastStatus = { key: "catCount", kind: "success", count: n };
        showStatus(msg, "success");
      } else {
        showStatusT("statusEmpty", "notice");
      }
      renderFilters();
      renderMenu();
      renderCart();   // FIX BUG KERANJANG: isi ulang daftar & total setelah data menu termuat
      loadFavorites(); // muat tab Favorit untuk carousel
    } catch (error) {
      console.error("Gagal memuat menu Loffee:", error);
      showStatusT("statusApiError", "error");
      grid.innerHTML = '<div class="empty-menu"><span>!</span><h3>Menu belum dapat dimuat</h3><p>Pastikan URL Apps Script berakhiran /exec dan deployment dapat dibaca publik. Buka Console browser untuk detail teknis.</p></div>';
    }
  }

  /* --- Modal detail menu (aksesibel: close, backdrop, Escape, focus) --- */
  const modalBackdrop = document.getElementById("menuModalBackdrop");
  const modalImageEl = document.getElementById("menuModalImage");
  const modalTitleEl = document.getElementById("menuModalTitle");
  const modalCategoryEl = document.getElementById("menuModalCategory");
  const modalDescEl = document.getElementById("menuModalDesc");
  const modalPriceEl = document.getElementById("menuModalPrice");
  const modalCloseBtn = document.getElementById("menuModalClose");
  let lastFocused = null;

  function openMenuModal(item) {
    if (!modalBackdrop) return;
    lastFocused = document.activeElement;
    modalImageEl.replaceChildren();
    modalImageEl.classList.remove("no-photo");
    const url = safeImageUrl(item.photo) || localPhotoFor(item);
    if (url) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = item.name || "Foto menu";
      img.onerror = () => { img.remove(); modalImageEl.classList.add("no-photo"); modalImageEl.textContent = (item.category || "LOFFEE").toUpperCase(); };
      modalImageEl.appendChild(img);
    } else {
      modalImageEl.classList.add("no-photo");
      modalImageEl.textContent = (item.category || "LOFFEE").toUpperCase();
    }
    modalCategoryEl.textContent = item.category || "";
    modalTitleEl.textContent = item.name || "Menu Loffee";
    modalDescEl.textContent = item.description || "Deskripsi menu belum tersedia.";
    modalPriceEl.textContent = item.price > 0 ? rupiah(item.price) : "Harga belum tersedia";
    // tombol tambah sudah ada di markup modal; update state + handler
    const modalAdd = document.getElementById("menuModalAdd");
    if (modalAdd) {
      modalAdd.disabled = item.price <= 0;
      modalAdd.replaceWith(modalAdd.cloneNode(true)); // buang listener lama
      const fresh = document.getElementById("menuModalAdd");
      fresh.addEventListener("click", () => addToCart(item));
    }
    modalBackdrop.hidden = false;
    requestAnimationFrame(() => modalBackdrop.classList.add("is-open"));
    document.body.classList.add("modal-open");
    modalCloseBtn.focus();
  }

  function closeMenuModal() {
    if (!modalBackdrop || modalBackdrop.hidden) return;
    modalBackdrop.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => { modalBackdrop.hidden = true; };
    if (prefersReducedMotion) finish(); else window.setTimeout(finish, 280);
    if (lastFocused && lastFocused.isConnected) lastFocused.focus();
  }

  if (modalBackdrop) {
    modalCloseBtn.addEventListener("click", closeMenuModal);
    modalBackdrop.addEventListener("click", event => { if (event.target === modalBackdrop) closeMenuModal(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !modalBackdrop.hidden) closeMenuModal(); });
  }

  search.addEventListener("input", () => {
    updateSearchClear();
    if (search.value.trim()) {
      if (activeCategory !== "Semua") {
        activeCategory = "Semua";
        renderFilters();   // sinkronkan chip kategori saat mulai mencari
      }
    }
    renderMenu();
  });
  const searchClearBtn = document.getElementById("searchClear");
  function updateSearchClear() {
    if (searchClearBtn) searchClearBtn.hidden = search.value.length === 0;
  }
  if (searchClearBtn) {
    searchClearBtn.addEventListener("click", () => {
      search.value = "";
      activeCategory = "Semua";
      updateSearchClear();
      renderFilters();
      renderMenu();
      search.focus();
    });
  }
  loadMenu();

  /* ============================================================
     LOFFEE INTERACTIONS — scroll reveal, scroll-spy nav, hero
     parallax. Modul terisolasi; tidak menyentuh loadMenu(),
     skema kolom Google Sheets, atau URL Apps Script.
     ============================================================ */

  /* --- Hero entrance: mainkan setelah intro selesai / langsung
     jika intro dilewati. Fallback timer memastikan hero tidak
     pernah tersembunyi selamanya (aman untuk reduced-motion). --- */
  const heroSection = document.getElementById("home");
  let heroPlayed = false;
  function playHero() {
    if (heroPlayed || !heroSection) return;
    heroPlayed = true;
    requestAnimationFrame(() => heroSection.classList.add("hero-play"));
  }
  if (prefersReduced || !introWasPlayed) {
    playHero();
  } else {
    window.setTimeout(playHero, 900); // intro mulai menutup ~900ms setelah DOM siap
  }
  window.setTimeout(playHero, 2500); // safety net

  /* --- Pilihan Loffee (galeri): scroll-snap horizontal + drag-to-scroll.
     Sumber utama = tab "Favorit" di Google Sheets (id_menu/urutan/aktif/label),
     dicocokkan ke data Menu untuk nama/harga/foto. Fallback: pilihan demo
     hardcoded HANYA jika tab Favorit belum tersedia/gagal dibaca. --- */
  const galleryTrack = document.getElementById("galleryTrack");
  /* Fallback demo — dipakai hanya jika tab Favorit tidak tersedia.
     Dicocokkan ke produk ASLI di database Google Sheets. */
  const GALLERY_PICKS_DEMO = ["gimbap", "tteokbokki", "croffle", "matcha", "pasta", "coffee"];
  let gallerySource = "fallback";   // "sheets" | "fallback"
  function renderGallery() {
    if (!galleryTrack) return;
    galleryTrack.replaceChildren();
    if (menuItems.length) {
      let picks = [];
      if (window.LOFFEE_FAVORIT && window.LOFFEE_FAVORIT.length) {
        // Sumber utama: tab Favorit via API (LOFFEE_FAVORIT berisi {item,label}
        // yang sudah dicocokkan & difilter di loadFavorites).
        picks = window.LOFFEE_FAVORIT.slice(0, 8);
        gallerySource = "sheets";
      }
      if (!picks.length) {
        // Fallback demo: cocokkan kata kunci ke menu asli
        gallerySource = "fallback";
        const picked = [];
        const used = new Set();
        for (const key of GALLERY_PICKS_DEMO) {
          const found = menuItems.find(item => !used.has(item.id) && item.name.toLowerCase().includes(key));
          if (found) { picked.push(found); used.add(found.id); }
        }
        for (const item of menuItems) {
          if (picked.length >= 6) break;
          if (used.has(item.id)) continue;
          if (safeImageUrl(item.photo) || localPhotoFor(item)) { picked.push(item); used.add(item.id); }
        }
        picks = picked.slice(0, 6).map(item => ({ item, label: "" }));
      }
      picks.forEach(({ item, label }) => {
        const card = document.createElement("article");
        card.className = "gallery-card reveal-child";
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Lihat detail ${item.name}`);
        card.addEventListener("click", () => openMenuModal(item));
        card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openMenuModal(item); } });
        const image = document.createElement("div");
        image.className = "menu-card-image";
        if (label) {
          const tag = document.createElement("span");
          tag.className = "gallery-card-tag";
          tag.textContent = label;
          image.appendChild(tag);
        }
        const url = safeImageUrl(item.photo) || localPhotoFor(item);
        if (url) {
          const img = document.createElement("img");
          img.src = url; img.alt = item.name; img.loading = "lazy"; img.draggable = false;
          img.onerror = () => { img.remove(); image.classList.add("no-photo"); image.textContent = "LOFFEE"; };
          image.appendChild(img);
        } else { image.classList.add("no-photo"); image.textContent = "LOFFEE"; }
        const meta = document.createElement("div");
        meta.className = "gallery-card-meta";
        const name = document.createElement("strong");
        name.textContent = item.name || "Menu Loffee";
        const price = document.createElement("span");
        price.textContent = item.price > 0 ? rupiah(item.price) : item.category;
        meta.append(name, price);
        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "add-to-cart gallery-add";
        addBtn.textContent = "Tambah";
        if (item.price > 0) {
          addBtn.setAttribute("aria-label", `Tambah ${item.name} ke keranjang`);
          addBtn.addEventListener("click", e => { e.stopPropagation(); addToCart(item); });
        } else {
          addBtn.disabled = true;
          addBtn.title = "Harga belum tersedia";
        }
        const foot = document.createElement("div");
        foot.className = "gallery-card-foot";
        foot.append(meta, addBtn);
        card.append(image, foot);
        galleryTrack.appendChild(card);
      });
    } else {
      const fallbacks = ["images/gimbap.svg", "images/tteokbokki.svg", "images/iced-coffee.svg", "images/creamy-pasta.svg", "images/matcha.svg", "images/croffle.svg", "images/korean-chicken.svg", "images/tiramisu.svg"];
      fallbacks.forEach((src, i) => {
        const card = document.createElement("div");
        card.className = "gallery-card gallery-card-deco reveal-child";
        card.style.transitionDelay = `${i * 45}ms`;
        const image = document.createElement("div");
        image.className = "menu-card-image";
        const img = document.createElement("img");
        img.src = src; img.alt = ""; img.loading = "lazy"; img.draggable = false;
        image.appendChild(img);
        card.appendChild(image);
        galleryTrack.appendChild(card);
      });
    }
    if (typeof childObserver !== "undefined" && childObserver) galleryTrack.querySelectorAll(".reveal-child").forEach(c => childObserver.observe(c));
    else galleryTrack.querySelectorAll(".reveal-child").forEach(c => c.classList.add("is-visible"));
    // Keterangan demo hanya jika sumbernya fallback, bukan tab Favorit
    const note = document.querySelector(".gallery-demo-note");
    if (note) note.hidden = gallerySource === "sheets";
  }

  /* --- Muat tab "Favorit" dari Apps Script (endpoint sama, ?resource=favorit).
     API mengembalikan data yang SUDAH digabung dengan tab Menu (nama/harga/foto).
     Fallback ?tab= dipertahankan untuk Apps Script versi lama. --- */
  async function loadFavorites() {
    const endpoint = String(config.API_URL || "").trim();
    if (!endpoint || endpoint.includes("TEMPEL_URL_")) return;
    const attempts = [endpoint + "?resource=favorit", endpoint + "?tab=Favorit"];
    for (const url of attempts) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.success === false) throw new Error(json.message || "Tab Favorit tidak tersedia");
        const rows = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
        if (!rows.length) throw new Error("Tab Favorit kosong");
        // Jika respons sudah digabung API (ada kolom nama), pakai langsung.
        // Jika respons mentah (id_menu/urutan/aktif/label), cocokkan sendiri.
        const enriched = rows.map(r => {
          if (r.nama !== undefined) {
            // sudah digabung di server
            return { item: normalizeItem(r), label: String(r.label ?? "").trim() };
          }
          const aktif = String(r.aktif ?? "").trim().toUpperCase() === "TRUE";
          if (!aktif) return null;
          const item = menuItems.find(m => m.id === String(r.id_menu ?? "").trim());
          if (!item) { console.warn("[Favorit] id_menu tidak ditemukan di tab Menu:", r.id_menu); return null; }
          return { item, label: String(r.label ?? "").trim() };
        }).filter(Boolean);
        if (!enriched.length) throw new Error("Tidak ada baris aktif/valid di tab Favorit");
        window.LOFFEE_FAVORIT = enriched.sort((a, b) => (Number(a.item.order ?? 9999)) - (Number(b.item.order ?? 9999)));
        // Urutan server-side sudah benar utk API gabungan; fallback tetap terurut
        window.LOFFEE_FAVORIT_SORTED = rows.map(r => ({ id_menu: String(r.id_menu ?? "").trim(), urutan: Number(r.urutan) || 9999, label: String(r.label ?? "").trim() }));
        if (window.LOFFEE_FAVORIT_SORTED.length) {
          window.LOFFEE_FAVORIT_SORTED.sort((a, b) => a.urutan - b.urutan);
          const ordered = [];
          for (const f of window.LOFFEE_FAVORIT_SORTED) {
            const hit = window.LOFFEE_FAVORIT.find(x => x.item.id === f.id_menu);
            if (hit) ordered.push(hit);
          }
          window.LOFFEE_FAVORIT = ordered;
        }
        gallerySource = "sheets";
        renderGallery();
        console.info("[Favorit] " + enriched.length + " kartu dimuat dari Google Sheets.");
        return;
      } catch (err) {
        console.info("[Favorit] " + url.split("?")[1] + ": " + err.message);
        // coba pola berikutnya
      }
    }
    console.info("[Favorit] memakai pilihan demo sementara (fallback).");
  }

  /* --- Drag-to-scroll untuk track galeri (desktop mouse; trackpad &
     touch memakai scroll native). Klik pada kartu/tombol tetap bekerja:
     drag yang bergerak >6px dibatalkan sebagai klik. --- */
  function enableDragScroll(track) {
    if (!track) return;
    let down = false, dragged = false, startX = 0, startScroll = 0;
    track.addEventListener("pointerdown", e => {
      if (e.pointerType === "touch" || e.button !== 0) return;
      const interactive = e.target.closest("button, a");
      if (interactive) return;               // tombol/a tetap normal
      down = true; dragged = false;
      startX = e.clientX; startScroll = track.scrollLeft;
      try { track.setPointerCapture(e.pointerId); } catch (_) {}   // drag tetap aktif walau kursor keluar track
    });
    track.addEventListener("pointermove", e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!dragged && Math.abs(dx) > 6) {    // dragging baru aktif setelah benar-benar bergeser
        dragged = true;
        track.classList.add("dragging");
      }
      if (dragged) track.scrollLeft = startScroll - dx;
    });
    const end = e => {
      if (!down) return;
      down = false;
      track.classList.remove("dragging");
      try { track.releasePointerCapture(e.pointerId); } catch (_) {}
      if (dragged) {
        // cegah klik-akibat-drag pada kartu (role=button)
        const suppress = ev => { ev.stopPropagation(); ev.preventDefault(); };
        track.addEventListener("click", suppress, { capture: true, once: true });
        setTimeout(() => track.removeEventListener("click", suppress, { capture: true }), 100);
      }
    };
    track.addEventListener("pointerup", end);
    track.addEventListener("pointerleave", end);
    // Shift + wheel -> horizontal scroll nyaman di desktop
    track.addEventListener("wheel", e => {
      if (!e.shiftKey) return;               // tanpa Shift: biarkan scroll vertikal halaman
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    }, { passive: false });
    track.addEventListener("dragstart", e => e.preventDefault());
  }
  enableDragScroll(galleryTrack);
  const originalRenderMenu2 = renderMenu;   // galeri ikut segar setelah menu termuat
  renderMenu = function () {
    originalRenderMenu2();
    const cards = grid.querySelectorAll(".reveal-child");
    cards.forEach(card => {
      const siblings = [...grid.children].filter(c => c.classList.contains("reveal-child"));
      card.style.transitionDelay = `${Math.min(siblings.indexOf(card), 7) * 55}ms`;
    });
    if (childObserver) cards.forEach(card => childObserver.observe(card));
    else cards.forEach(card => card.classList.add("is-visible"));
    renderGallery();
  };
  document.body.classList.add("reveal-ready");

  /* --- Preview review di homepage (dari reviews-ui.js) --- */
  if (window.LoffeeReviews && window.LoffeeReviews.data.items.length) {
    const rp = document.getElementById("reviewPreviewGrid");
    if (rp) {
      window.LoffeeReviews.renderInto(rp, window.LoffeeReviews.data.items.slice(0, 3), window.LoffeeReviews.isDemoActive());
      if (childObserver) rp.querySelectorAll(".review-card").forEach(c => childObserver.observe(c));
      else rp.querySelectorAll(".review-card").forEach(c => c.classList.add("is-visible"));
    }
  }

  const revealTargets = document.querySelectorAll(
    ".hero-copy, .hero-visual, .marquee, .section-heading, .section-intro, .menu-tools, .story-image, .story-copy, .visit-copy, .map-card, .footer-top, .footer-bottom"
  );
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealTargets.forEach(el => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealTargets.forEach(el => revealObserver.observe(el));
  }

  // Kartu menu: observer-nya sudah dibuat di atas (lihat flag bersama).
  // Stagger delay ditambahkan saat kartu baru dirender via renderMenu().

  renderFilters();
  renderMenu();   // memanggil versi terbungkus -> kartu menu + galeri ikut di-observe

  // --- Scroll-spy nav ---
  const navLinks = [...document.querySelectorAll(".main-nav a[href^='#']")];
  const sections = navLinks.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (sections.length && "IntersectionObserver" in window && !prefersReduced) {
    const spyObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(s => spyObserver.observe(s));
  }

  // --- Hero parallax halus (rAF) pada layer cutout ---
  const heroDrink = document.querySelector(".hero-cutout-drink");
  const heroFood = document.querySelector(".hero-cutout-food");
  if (heroDrink && !prefersReduced) {
    let rafPending = false;
    window.addEventListener("scroll", () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 900) {
          heroDrink.style.transform = `translateY(${y * 0.05}px)`;
          if (heroFood) heroFood.style.transform = `translateY(${y * 0.09}px)`;
        }
        rafPending = false;
      });
    }, { passive: true });
  }

  /* ============================================================
     LOFFEE CART — keranjang float yang bisa digeser, checkout
     via WhatsApp (jika nomor terkonfigurasi) atau bayar di kasir.
     ============================================================ */
  const cartFab = document.getElementById("cartFab");
  const cartPanel = document.getElementById("cartPanel");
  const cartFabCount = document.getElementById("cartFabCount");
  const cartCountLabel = document.getElementById("cartCountLabel");
  const cartItemsEl = document.getElementById("cartItems");
  const cartEmptyEl = document.getElementById("cartEmpty");
  const cartFooterEl = document.getElementById("cartFooter");
  const cartTotalEl = document.getElementById("cartTotal");
  const cartCloseBtn = document.getElementById("cartClose");
  const cartWA = document.getElementById("cartCheckoutWA");
  const cartToastEl = document.getElementById("cartToast");
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem("loffeeCart") || "{}") || {}; } catch (_) { cart = {}; }
  const waNumber = String(config.WA_NUMBER || "").replace(/\D/g, "");
  let toastTimer = null;

  const cartItemCount = () => Object.values(cart).reduce((sum, q) => sum + q, 0);
  const cartTotal = () => menuItems.reduce((sum, item) => {
    const q = cart[item.id] || 0;
    return sum + q * (item.price > 0 ? item.price : 0);
  }, 0);

  function saveCart() {
    try { localStorage.setItem("loffeeCart", JSON.stringify(cart)); } catch (_) {}
  }

  function showCartToast(message) {
    if (!cartToastEl) return;
    cartToastEl.textContent = message;
    cartToastEl.hidden = false;
    cartToastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      cartToastEl.classList.remove("show");
      toastTimer = setTimeout(() => { cartToastEl.hidden = true; }, 300);
    }, 1800);
  }

  function addToCart(item) {
    if (!item || !(item.price > 0)) return;
    cart[item.id] = (cart[item.id] || 0) + 1;
    saveCart();
    renderCart();
    showCartToast(`1 ${item.name || "menu"} ditambahkan ke keranjang`);
  }

  function setQty(id, qty) {
    if (qty <= 0) delete cart[id];
    else cart[id] = qty;
    saveCart();
    renderCart();
  }

  function renderCart() {
    const count = cartItemCount();
    const total = cartTotal();
    cartFabCount.textContent = count;
    cartFabCount.hidden = count === 0;
    cartFab.classList.toggle("has-items", count > 0);
    cartCountLabel.textContent = count ? `(${count})` : "";
    cartTotalEl.textContent = rupiah(total);
    cartFooterEl.style.display = count ? "" : "none";
    cartEmptyEl.hidden = count > 0;
    cartItemsEl.replaceChildren();
    const inCart = menuItems.filter(item => cart[item.id]);
    inCart.forEach(item => {
      const qty = cart[item.id];
      const row = document.createElement("div");
      row.className = "cart-item";
      // Foto produk (fallback rapi jika gagal/tidak ada)
      const thumb = document.createElement("div");
      thumb.className = "cart-item-thumb";
      const purl = safeImageUrl(item.photo) || localPhotoFor(item);
      if (purl) {
        const pimg = document.createElement("img");
        pimg.src = purl; pimg.alt = ""; pimg.loading = "lazy";
        pimg.onerror = () => { pimg.remove(); thumb.classList.add("no-photo"); thumb.textContent = "L"; };
        thumb.appendChild(pimg);
      } else { thumb.classList.add("no-photo"); thumb.textContent = "L"; }
      const info = document.createElement("div");
      info.className = "cart-item-info";
      const name = document.createElement("strong");
      name.textContent = item.name || "Menu";
      const price = document.createElement("small");
      price.textContent = `${rupiah(item.price)} × ${qty} = ${rupiah(item.price * qty)}`;
      info.append(name, price);
      const qtyBox = document.createElement("div");
      qtyBox.className = "cart-item-qty";
      const minus = document.createElement("button");
      minus.type = "button"; minus.className = "cart-step"; minus.setAttribute("aria-label", `Kurangi ${item.name}`);
      minus.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M19 13H5v-2h14z"/></svg>';
      minus.addEventListener("click", () => setQty(item.id, qty - 1));
      const qtyLabel = document.createElement("span");
      qtyLabel.textContent = qty;
      const plus = document.createElement("button");
      plus.type = "button"; plus.className = "cart-step"; plus.setAttribute("aria-label", `Tambah ${item.name}`);
      plus.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>';
      plus.addEventListener("click", () => setQty(item.id, qty + 1));
      qtyBox.append(minus, qtyLabel, plus);
      const remove = document.createElement("button");
      remove.type = "button"; remove.className = "cart-item-remove"; remove.textContent = "×";
      remove.setAttribute("aria-label", `Hapus ${item.name} dari keranjang`);
      remove.addEventListener("click", () => setQty(item.id, 0));
      row.append(thumb, info, qtyBox, remove);
      cartItemsEl.appendChild(row);
    });
  }

  function toggleCart(open) {
    const willOpen = open !== undefined ? open : !cartPanel.classList.contains("is-open");
    if (willOpen) renderCart();   // FIX: pastikan daftar & total segar setiap kali panel dibuka
    cartPanel.classList.toggle("is-open", willOpen);
    cartPanel.setAttribute("aria-hidden", String(!willOpen));
    cartFab.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) cartCloseBtn.focus();
  }

  function checkoutWhatsApp() {
    if (!cartItemCount()) return;
    if (!waNumber) { showCartToast("Nomor WhatsApp belum dikonfigurasi."); return; }
    const inCart = menuItems.filter(i => cart[i.id]);
    const lines = inCart.map((i, idx) => {
      const q = cart[i.id];
      return `${idx + 1}. ${i.name} — ${q} × ${rupiah(i.price)} = ${rupiah(i.price * q)}`;
    });
    const total = cartTotal();
    const body = [
      "Halo Loffee Coffee & Eatery, saya ingin memesan:",
      "",
      ...lines,
      "",
      `Total pesanan: ${rupiah(total)}`,
      "",
      "Mohon konfirmasi pesanan saya. Terima kasih."
    ].join("\n");
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(body)}`, "_blank", "noopener");
    // WhatsApp terbuka dengan pesan terisi — pelanggan memeriksa & mengirim sendiri.
  }

  // (checkout lama "bayar di kasir" dihapus — WA satu-satunya CTA pemesanan)

  if (cartFab) {
    cartFab.addEventListener("click", () => toggleCart());
    cartCloseBtn.addEventListener("click", () => toggleCart(false));
    cartWA.disabled = true; // sinkron di setiap toggle (lihat bawah)
    cartWA.addEventListener("click", checkoutWhatsApp);
    const origToggle = toggleCart;
    toggleCart = function (open) {
      const willOpen = open !== undefined ? open : !cartPanel.classList.contains("is-open");
      if (cartWA) cartWA.disabled = !willOpen || !cartItemCount() || !waNumber;
      origToggle(willOpen);
    };
  }

  // --- Drag / geser keranjang FAB (mouse & touch) ---
  if (cartFab && "PointerEvent" in window) {
    let dragging = false, moved = false, startX = 0, startY = 0;
    const dragMove = e => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      const maxX = window.innerWidth - cartFab.offsetWidth - 8;
      const maxY = window.innerHeight - cartFab.offsetHeight - 8;
      cartFab.style.left = `${Math.min(Math.max(8, cartFab.offsetLeft + dx), maxX)}px`;
      cartFab.style.top = `${Math.min(Math.max(8, cartFab.offsetTop + dy), maxY)}px`;
      cartFab.style.right = "auto"; cartFab.style.bottom = "auto";
      startX = e.clientX; startY = e.clientY;
    };
    const dragEnd = () => {
      dragging = false;
      document.removeEventListener("pointermove", dragMove);
      document.removeEventListener("pointerup", dragEnd);
    };
    cartFab.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      dragging = true; moved = false;
      startX = e.clientX; startY = e.clientY;
      document.addEventListener("pointermove", dragMove);
      document.addEventListener("pointerup", dragEnd);
    });
    cartFab.addEventListener("click", e => {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    });
  }
  renderCart();
})();
