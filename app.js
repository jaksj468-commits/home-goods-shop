(() => {
  const products = window.PRODUCTS || [];
  const grid = document.getElementById("productGrid");
  const searchInput = document.getElementById("searchInput");
  const searchForm = document.getElementById("searchForm");
  const resultLine = document.getElementById("resultLine");
  const emptyState = document.getElementById("emptyState");
  let activeCategory = "All";
  let activeFilter = "all";
  let keyword = "";

  function render() {
    const list = products.filter(p => {
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      const haystack = [p.name, p.category, p.description].join(" ").toLowerCase();
      const matchesKeyword = !keyword || haystack.includes(keyword.toLowerCase());
      const matchesFilter = activeFilter === "all" || (activeFilter === "deals" && p.deal) || (activeFilter === "new" && p.new);
      return matchesCategory && matchesKeyword && matchesFilter;
    });
    grid.innerHTML = list.map(p => {
      const safeUrl = /^https?:\/\//i.test(p.affiliateUrl || "") ? p.affiliateUrl : "#";
      const tagClass = p.new ? "tag new" : "tag";
      const visual = p.imageUrl
        ? `<img class="product-image" src="${p.imageUrl}" alt="${p.name}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="product-emoji" aria-hidden="true" hidden>${p.emoji || "🎁"}</span>`
        : `<span class="product-emoji" aria-hidden="true">${p.emoji || "🎁"}</span>`;
      return `<article class="product-card">
        <a class="product-image-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer sponsored" aria-label="View ${p.name} on our partner platform">
          <div class="product-visual"><span class="${tagClass}">${p.tag || "Editor's Pick"}</span>${visual}</div>
        </a>
        <div class="product-info"><div class="product-category">${p.category || "Featured Product"}</div><div class="product-name">${p.name}</div><div class="product-desc">${p.description || ""}</div>
        <div class="product-bottom"><span class="external-note">Details provided by our partner</span><a class="buy-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer sponsored">View Product ↗</a></div></div>
      </article>`;
    }).join("");
    resultLine.textContent = keyword ? `Search results for “${keyword}”: ${list.length} products` : `${list.length} curated picks`;
    emptyState.hidden = list.length !== 0;
  }

  searchForm.addEventListener("submit", event => {
    event.preventDefault();
    keyword = searchInput.value.trim();
    render();
    document.getElementById("products").scrollIntoView({behavior:"smooth"});
  });
  document.getElementById("categoryNav").addEventListener("click", event => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item === button));
    render();
    document.getElementById("products").scrollIntoView({behavior:"smooth"});
  });
  document.getElementById("filterTabs").addEventListener("click", event => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    activeFilter = button.dataset.filter;
    document.querySelectorAll("#filterTabs button").forEach(item => item.classList.toggle("selected", item === button));
    render();
  });
  document.getElementById("year").textContent = new Date().getFullYear();
  render();
})();