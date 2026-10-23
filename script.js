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

  function showStatus(message, kind = "") {
    status.textContent = message;
    status.className = `menu-status ${kind}`.trim();
  }

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
    button.textContent = "← Semua kategori";

    button.addEventListener("click", () => {
      activeCategory = "Semua";
      search.value = "";
      renderFilters();
      renderMenu();
    });

    filters.appendChild(button);
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
      empty.innerHTML = "<span>✳</span><h3>Belum ada menu untuk ditampilkan</h3><p>Coba kata kunci lain atau periksa kembali data menu.</p>";
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
      addBtn.textContent = "+ Tambah";
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
    { keys: ["bburinkle"], photo: "images/korean-chicken.svg" },
    { keys: ["korean chicken", "yangnyeom", "chicken basket", "chibab", "buldak", "ufo chickin", "schnitzel", "fish & chips"], photo: "images/korean-chicken.svg" },
    { keys: ["gelato", "es krim"], photo: "images/strawberry-drink.svg" }
  ];
  function localPhotoFor(item) {
    const name = String(item.name || "").toLowerCase();
    for (const entry of PHOTO_BY_NAME) {
      if (entry.keys.some(key => name.includes(key))) return entry.photo;
    }
    const categoryKey = String(item.category || "").toLowerCase();
    if (categoryKey.includes("gimbap")) return "images/gimbap.svg";
    if (categoryKey.includes("k-pot") || categoryKey.includes("korean dish") || categoryKey.includes("tteokbokki")) return "images/tteokbokki.svg";
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
      showStatus("Menu belum terhubung. Tempel URL Web App Apps Script di file config.js.", "notice");
      grid.innerHTML = '<div class="empty-menu"><span>↗</span><h3>Siap terhubung ke Google Sheets</h3><p>Website ini belum menampilkan harga contoh. Setelah URL API dipasang, menu aktif dari tab Menu akan muncul di sini.</p></div>';
      return;
    }

    try {
      showStatus("Memuat menu dari Google Sheets…");
      const response = await fetch(endpoint, { method: "GET", cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.success === false) throw new Error(result.message || "API mengembalikan error.");

      const rawItems = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : []);
      menuItems = rawItems.map(normalizeItem)
        .filter(item => item.name && item.available)
        .sort((a, b) => a.order - b.order);

      if (config.SHOW_UNVERIFIED_NOTICE && menuItems.some(item => !item.verified)) {
        showStatus("Menu aktif berhasil dimuat. Pastikan harga, foto, dan ketersediaan sudah disetujui pihak Loffee sebelum website dipublikasikan.", "notice");
      } else if (menuItems.length) {
        showStatus(`${menuItems.length} menu tersedia`, "success");
      } else {
        showStatus("API berhasil terhubung, tetapi belum ada menu dengan status tersedia = TRUE di Google Sheets.", "notice");
      }
      renderFilters();
      renderMenu();
    } catch (error) {
      console.error("Gagal memuat menu Loffee:", error);
      showStatus("Menu belum bisa dimuat. Periksa URL Web App, akses deployment, dan izin API.", "error");
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
    if (search.value.trim()) {
      activeCategory = "Semua";
    }

    renderMenu();
  });
  loadMenu();

  /* ============================================================
     LOFFEE INTERACTIONS — scroll reveal, scroll-spy nav, hero
     parallax. Modul terisolasi; tidak menyentuh loadMenu(),
     skema kolom Google Sheets, atau URL Apps Script.
     ============================================================ */
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("reveal-ready");

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

  // Kartu menu: stagger reveal setiap kali renderMenu selesai
  const childObserver = prefersReduced || !("IntersectionObserver" in window) ? null : new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const siblings = [...entry.target.parentElement.children].filter(c => c.classList.contains("reveal-child"));
        entry.target.style.transitionDelay = `${Math.min(siblings.indexOf(entry.target), 7) * 55}ms`;
        entry.target.classList.add("is-visible");
        childObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });

  const originalRenderMenu = renderMenu;
  renderMenu = function () {
    originalRenderMenu();
    const cards = grid.querySelectorAll(".reveal-child");
    if (childObserver) cards.forEach(card => childObserver.observe(card));
    else cards.forEach(card => card.classList.add("is-visible"));
  };
  renderFilters();
  renderMenu();

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

  // --- Hero parallax halus (rAF) ---
  const heroMain = document.querySelector(".hero-image-main");
  const heroSmall = document.querySelector(".hero-image-small");
  if (heroMain && !prefersReduced) {
    let rafPending = false;
    window.addEventListener("scroll", () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 900) {
          heroMain.style.transform = `translateY(${y * 0.06}px)`;
          if (heroSmall) heroSmall.style.transform = `translateY(${y * 0.1}px)`;
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
  const cartKasir = document.getElementById("cartCheckoutKasir");
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
    showCartToast(`+1 ${item.name || "menu"} ditambahkan`);
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
      minus.type = "button"; minus.textContent = "−"; minus.setAttribute("aria-label", `Kurangi ${item.name}`);
      minus.addEventListener("click", () => setQty(item.id, qty - 1));
      const qtyLabel = document.createElement("span");
      qtyLabel.textContent = qty;
      const plus = document.createElement("button");
      plus.type = "button"; plus.textContent = "+"; plus.setAttribute("aria-label", `Tambah ${item.name}`);
      plus.addEventListener("click", () => setQty(item.id, qty + 1));
      qtyBox.append(minus, qtyLabel, plus);
      const remove = document.createElement("button");
      remove.type = "button"; remove.className = "cart-item-remove"; remove.textContent = "×";
      remove.setAttribute("aria-label", `Hapus ${item.name} dari keranjang`);
      remove.addEventListener("click", () => setQty(item.id, 0));
      row.append(info, qtyBox, remove);
      cartItemsEl.appendChild(row);
    });
  }

  function toggleCart(open) {
    const willOpen = open !== undefined ? open : !cartPanel.classList.contains("is-open");
    cartPanel.classList.toggle("is-open", willOpen);
    cartPanel.setAttribute("aria-hidden", String(!willOpen));
    cartFab.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) cartCloseBtn.focus();
  }

  function checkoutWhatsApp() {
    if (!waNumber) { showCartToast("Nomor WhatsApp belum dikonfigurasi."); return; }
    const lines = menuItems.filter(i => cart[i.id]).map(i => `• ${i.name} ×${cart[i.id]} — ${rupiah(i.price * cart[i.id])}`);
    if (!lines.length) return;
    const text = `Halo Loffee Coffee & Eatery! Saya ingin memesan:%0A%0A${lines.join("%0A")}%0A%0ATotal: ${encodeURIComponent(rupiah(cartTotal()))}%0A%0ATerima kasih!`;
    window.open(`https://wa.me/${waNumber}?text=${text}`, "_blank", "noopener");
  }

  function checkoutKasir() {
    if (!cartItemCount()) return;
    const lines = menuItems.filter(i => cart[i.id]).map(i => `• ${i.name} ×${cart[i.id]} — ${rupiah(i.price * cart[i.id])}`).join("\n");
    showCartToast(`Pesanan siap ditunjukkan di kasir:\n${lines.split("\n").slice(0, 2).join("\n")}${lines.split("\n").length > 2 ? "\n..." : ""}`);
  }

  if (cartFab) {
    cartFab.addEventListener("click", () => toggleCart());
    cartCloseBtn.addEventListener("click", () => toggleCart(false));
    if (waNumber) cartWA.disabled = false; else cartWA.disabled = true;
    cartWA.addEventListener("click", checkoutWhatsApp);
    cartKasir.addEventListener("click", checkoutKasir);
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
