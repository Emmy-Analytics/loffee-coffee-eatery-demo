/* LOFFEE REVIEW CARDS — shared renderer untuk preview homepage dan halaman review.
   Data demo dari reviews-data.js. Untuk data asli: ganti sumber data dengan
   array ulasan terverifikasi, set LOFFEE_REVIEWS_DEMO.active=false, dan
   banner DEMO otomatis disembunyikan. */
(function () {
  const data = window.LOFFEE_REVIEWS_DEMO || { active: false, items: [] };

  function starRow(rating) {
    // Bintang penuh/sesuai rating, dibangun dengan SVG — bukan karakter panah.
    const wrap = document.createElement("div");
    wrap.className = "review-stars";
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", `Rating ${rating} dari 5 bintang`);
    for (let i = 1; i <= 5; i++) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("width", "14");
      svg.setAttribute("height", "14");
      svg.classList.add(i <= rating ? "star-on" : "star-off");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z");
      svg.appendChild(path);
      wrap.appendChild(svg);
    }
    return wrap;
  }

  function avatarEl(name) {
    // Avatar inisial — bukan foto orang nyata, tanpa aset eksternal.
    const av = document.createElement("div");
    av.className = "review-avatar";
    av.setAttribute("aria-hidden", "true");
    av.textContent = (name || "?").trim().charAt(0).toUpperCase();
    return av;
  }

  function reviewCard(item) {
    const card = document.createElement("article");
    card.className = "review-card";

    const head = document.createElement("div");
    head.className = "review-card-head";
    head.append(avatarEl(item.name));
    const meta = document.createElement("div");
    meta.className = "review-card-meta";
    const name = document.createElement("strong");
    name.textContent = item.name;
    const sub = document.createElement("small");
    sub.textContent = [item.date, item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : ""].filter(Boolean).join(" · ");
    meta.append(name, sub);
    head.append(meta, starRow(item.rating || 0));

    const text = document.createElement("p");
    text.className = "review-card-text";
    text.textContent = item.text || "";

    card.append(head, text);

    if (item.photo) {
      const img = document.createElement("img");
      img.className = "review-card-photo";
      img.loading = "lazy";
      img.alt = "Foto contoh untuk demonstrasi — bukan foto pelanggan asli";
      img.src = item.photo;
      img.onerror = () => img.remove(); // fallback: kartu tetap rapi tanpa foto
      card.appendChild(img);
    }
    return card;
  }

  function renderInto(container, items, demoActive) {
    if (!container) return;
    container.replaceChildren();
    items.forEach((item, i) => {
      const card = reviewCard(item);
      if (demoActive) {
        const badge = document.createElement("span");
        badge.className = "review-demo-badge";
        badge.textContent = "DEMO";
        badge.title = "Contoh ulasan — bukan ulasan pelanggan asli";
        card.appendChild(badge);
      }
      if (container.classList.contains("reveal-child-supported")) card.classList.add("reveal-child");
      container.appendChild(card);
    });
  }

  window.LoffeeReviews = {
    renderInto,
    data,
    isDemoActive: () => !!data.active
  };
})();
