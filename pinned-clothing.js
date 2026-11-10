(() => {
  const items = (window.PRODUCTS || []).filter(p => p.category === "服饰");
  const grid = document.getElementById("clothingGrid");
  if (!grid) return;
  grid.innerHTML = items.map(p => {
    const visual = p.imageUrl
      ? '<img class="product-image" src="' + p.imageUrl + '" alt="' + p.name + '" loading="lazy">'
      : '<span class="product-emoji" aria-hidden="true">' + (p.emoji || "👕") + '</span>';
    const url = /^https?:\/\//i.test(p.affiliateUrl || "") ? p.affiliateUrl : "#";
    return '<article class="product-card clothing-card"><a class="product-image-link" href="' + url + '" target="_blank" rel="noopener noreferrer sponsored"><div class="product-visual">' + visual + '</div></a><div class="product-info"><div class="product-category">PEX 自营服饰</div><div class="product-name">' + p.name + '</div><div class="product-desc">' + (p.description || "") + '</div><div class="product-bottom"><span class="external-note">服饰展示</span><a class="buy-link" href="' + url + '" target="_blank" rel="noopener noreferrer sponsored">查看详情 ↗</a></div></div></article>';
  }).join("");
})();