(() => {
  const products = window.PRODUCTS || [];
  const grid = document.getElementById("productGrid");
  const searchInput = document.getElementById("searchInput");
  const searchForm = document.getElementById("searchForm");
  const resultLine = document.getElementById("resultLine");
  const emptyState = document.getElementById("emptyState");
  let activeCategory = "全部";
  let activeFilter = "all";
  let keyword = "";

  function render() {
    const list = products.filter(p => {
      const matchesCategory = activeCategory === "全部" || p.category === activeCategory;
      const haystack = [p.name, p.category, p.description].join(" ").toLowerCase();
      const matchesKeyword = !keyword || haystack.includes(keyword.toLowerCase());
      const matchesFilter = activeFilter === "all" || (activeFilter === "deals" && p.deal) || (activeFilter === "new" && p.new);
      return matchesCategory && matchesKeyword && matchesFilter;
    });
    grid.innerHTML = list.map(p => {
      const safeUrl = /^https?:\/\//i.test(p.affiliateUrl || "") ? p.affiliateUrl : "#";
      const tagClass = p.new ? "tag new" : "tag";
      return `<article class="product-card">
        <div class="product-visual"><span class="${tagClass}">${p.tag || "精选好物"}</span><span class="product-emoji" aria-hidden="true">${p.emoji || "🎁"}</span></div>
        <div class="product-info"><div class="product-category">${p.category}</div><div class="product-name">${p.name}</div><div class="product-desc">${p.description || ""}</div>
        <div class="product-bottom"><div class="price"><small>¥</small>${p.price}</div><a class="buy-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer sponsored">去看看 ↗</a></div></div>
      </article>`;
    }).join("");
    resultLine.textContent = keyword ? `“${keyword}” 搜索结果：${list.length} 件商品` : `共 ${list.length} 件精选好物`;
    emptyState.hidden = list.length !== 0;
  }

  searchForm.addEventListener("submit", event => { event.preventDefault(); keyword = searchInput.value.trim(); render(); document.getElementById("products").scrollIntoView({behavior:"smooth"}); });
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
  document.querySelector('[data-filter="deals"].text-button').addEventListener("click", () => {
    activeCategory = "全部"; activeFilter = "deals"; keyword = ""; searchInput.value = "";
    document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.category === "全部"));
    document.querySelectorAll("#filterTabs button").forEach(item => item.classList.toggle("selected", item.dataset.filter === "deals"));
    render(); document.getElementById("products").scrollIntoView({behavior:"smooth"});
  });
  document.getElementById("year").textContent = new Date().getFullYear();
  render();
})();