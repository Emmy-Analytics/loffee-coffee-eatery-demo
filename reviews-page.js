/* LOFFEE REVIEWS PAGE — filter, paginasi, render kartu. Data demo dari reviews-data.js. */
(function () {
  const grid = document.getElementById("reviewsGrid");
  if (!grid || !window.LoffeeReviews) return;
  const api = window.LoffeeReviews;
  const items = api.data.items || [];
  const demoActive = api.isDemoActive();
  const PAGE_SIZE = 6;
  let activeFilter = "semua";
  let shown = PAGE_SIZE;

  const filterBar = document.getElementById("reviewFilters");
  const moreBtn = document.getElementById("reviewMore");
  const countEl = document.getElementById("reviewCount");

  // Filter hanya dibuat jika data punya kategori nyata.
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
  if (filterBar) {
    const defs = [["semua", "Semua"], ...categories.map(c => [c, c.charAt(0).toUpperCase() + c.slice(1)])];
    defs.forEach(([key, label], i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `filter review-filter${i === 0 ? " active" : ""}`;
      b.dataset.category = key;
      b.textContent = label;
      b.addEventListener("click", () => {
        activeFilter = key;
        shown = PAGE_SIZE;
        filterBar.querySelectorAll(".filter").forEach(f => f.classList.toggle("active", f === b));
        render();
      });
      filterBar.appendChild(b);
    });
  }

  function filtered() {
    return activeFilter === "semua" ? items : items.filter(i => i.category === activeFilter);
  }

  function render() {
    const list = filtered();
    if (countEl) countEl.textContent = `${list.length} ulasan${demoActive ? " (contoh DEMO)" : ""}`;
    api.renderInto(grid, list.slice(0, shown), demoActive);
    if (moreBtn) moreBtn.hidden = shown >= list.length;
    grid.querySelectorAll(".reveal-child").forEach(c => c.classList.add("is-visible"));
  }

  if (moreBtn) moreBtn.addEventListener("click", () => { shown += PAGE_SIZE; render(); });
  render();
})();
