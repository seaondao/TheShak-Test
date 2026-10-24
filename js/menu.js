// Menu page: renders every category and item from menu data, plus the printed-menu lightbox.
(function () {
  "use strict";

  var root = document.querySelector("[data-menu]");
  var jump = document.querySelector(".menu-jump");
  var jumpList = document.querySelector("[data-menu-jump]");
  var printedLink = document.querySelector("[data-printed-menu]");
  if (!root) return;

  var showPrices = true;
  var price = ShackData.formatPrice;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null && text !== "") node.textContent = text;
    return node;
  }

  function priceEl(amount, prefix) {
    return el("span", "price", (prefix || "") + price(amount));
  }

  // "16 oz $6 · 24 oz $8" for category sizes, "$1.50 each" for one unlabeled price.
  function renderCatPrices(prices) {
    var meta = el("p", "cat-meta");
    prices.forEach(function (p) {
      var part = el("span");
      if (p.label) part.appendChild(document.createTextNode(p.label + (showPrices ? " " : "")));
      if (showPrices) part.appendChild(priceEl(p.amount));
      if (!p.label && prices.length === 1) part.appendChild(document.createTextNode(" each"));
      if (part.textContent.trim()) meta.appendChild(part);
    });
    return meta.childNodes.length ? meta : null;
  }

  function renderItemPrices(prices) {
    if (!prices.length) return null;
    if (prices.length === 1 && !prices[0].label) {
      return showPrices ? el("p", "price", price(prices[0].amount)) : null;
    }
    var list = el("ul", "price-list");
    prices.forEach(function (p) {
      var li = el("li");
      li.appendChild(el("span", "price-label", p.label));
      if (showPrices) li.appendChild(priceEl(p.amount));
      list.appendChild(li);
    });
    return list;
  }

  function detail(label, text) {
    var p = el("p", "item-detail");
    if (label) {
      p.appendChild(el("strong", null, label + ": "));
    }
    p.appendChild(document.createTextNode(text));
    return p;
  }

  function renderItem(item) {
    var article = el("article", "menu-item");
    var head = el("div", "item-head");
    var name = el("h3", "item-name item-title");
    if (item.number !== null) name.appendChild(el("span", "item-number", "#" + item.number));
    name.appendChild(el("span", null, item.name));
    if (item.badge) name.appendChild(el("span", "badge", item.badge));
    head.appendChild(name);
    var prices = renderItemPrices(item.prices);
    if (prices) head.appendChild(prices);
    article.appendChild(head);

    if (item.description) article.appendChild(el("p", "item-desc", item.description));
    if (item.includes) article.appendChild(detail("Includes", item.includes));
    if (item.options) article.appendChild(detail(item.options.label, item.options.choices.join(", ")));
    if (item.ingredients.length) article.appendChild(el("p", "item-desc", item.ingredients.join(", ")));
    if (item.toppedWith.length) article.appendChild(detail("Topped with", item.toppedWith.join(", ")));
    return article;
  }

  function renderExtras(groups) {
    var wrap = el("div", "extras");
    groups.forEach(function (g) {
      var box = el("div");
      box.appendChild(el("h3", null, g.group));
      var ul = el("ul");
      g.items.forEach(function (x) {
        var li = el("li", null, x.name);
        if (showPrices && x.amount !== null) li.appendChild(priceEl(x.amount, "+"));
        ul.appendChild(li);
      });
      box.appendChild(ul);
      wrap.appendChild(box);
    });
    return wrap;
  }

  function renderCategory(cat) {
    var section = el("section", "menu-cat");
    section.id = cat.id;
    section.setAttribute("aria-labelledby", cat.id + "-title");
    var wrap = el("div", "wrap");

    var head = el("div", "menu-cat-head");
    var title = el("h2", "title", cat.name);
    title.id = cat.id + "-title";
    head.appendChild(title);
    var meta = renderCatPrices(cat.prices);
    if (meta) head.appendChild(meta);
    if (cat.note) head.appendChild(el("p", "cat-meta", cat.note));
    if (cat.image) {
      var photo = el("div", "menu-cat-photo");
      var img = el("img");
      img.src = cat.image;
      img.alt = cat.name;
      img.loading = "lazy";
      photo.appendChild(img);
      head.appendChild(photo);
    }
    wrap.appendChild(head);

    var body = el("div", "menu-cat-body");
    if (cat.items.length) {
      var grid = el("div", "menu-items menu-item-grid");
      cat.items.forEach(function (item) { grid.appendChild(renderItem(item)); });
      body.appendChild(grid);
    }
    if (cat.extras.length) body.appendChild(renderExtras(cat.extras));
    wrap.appendChild(body);

    section.appendChild(wrap);
    return section;
  }

  ShackData.load().then(function (menu) {
    showPrices = menu.settings.showPrices;
    root.textContent = "";
    jumpList.textContent = "";
    menu.categories.forEach(function (cat) {
      root.appendChild(renderCategory(cat));
      var li = el("li");
      var a = el("a", null, cat.name);
      a.href = "#" + cat.id;
      li.appendChild(a);
      jumpList.appendChild(li);
    });
    jump.hidden = false;
    // The printed menu shows prices, so it is hidden when prices are off.
    if (printedLink) printedLink.hidden = !showPrices;
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  }).catch(function (err) {
    console.error(err);
    root.innerHTML = '<p class="wrap menu-status">Sorry, the menu didn’t load. Please refresh the page.</p>';
  });

  // ---------- Printed menu lightbox ----------

  var dialog = document.querySelector(".lightbox");
  if (!printedLink || !dialog || typeof dialog.showModal !== "function") return;

  var stage = dialog.querySelector(".lightbox-stage");
  var img = stage.querySelector("img");
  var ZOOMS = [1, 1.5, 2, 3, 4];
  var level = 0;

  function fitWidth() {
    var w = img.naturalWidth || 877;
    var h = img.naturalHeight || 586;
    var scale = Math.min(stage.clientWidth / w, stage.clientHeight / h);
    return w * scale;
  }

  // Zoom around a point in the stage (defaults to the center).
  function setZoom(next, cx, cy) {
    next = Math.max(0, Math.min(ZOOMS.length - 1, next));
    if (cx === undefined) { cx = stage.clientWidth / 2; cy = stage.clientHeight / 2; }
    var oldW = img.getBoundingClientRect().width || fitWidth();
    var fx = (stage.scrollLeft + cx) / oldW;
    var fy = (stage.scrollTop + cy) / (oldW * (img.naturalHeight || 586) / (img.naturalWidth || 877));
    level = next;
    var newW = fitWidth() * ZOOMS[level];
    img.style.width = newW + "px";
    stage.classList.toggle("is-zoomed", level > 0);
    var newH = newW * (img.naturalHeight || 586) / (img.naturalWidth || 877);
    stage.scrollLeft = fx * newW - cx;
    stage.scrollTop = fy * newH - cy;
  }

  printedLink.addEventListener("click", function (e) {
    e.preventDefault();
    dialog.showModal();
    document.body.style.overflow = "hidden";
    setZoom(0);
  });

  dialog.addEventListener("close", function () {
    document.body.style.overflow = "";
  });

  dialog.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (btn && btn.hasAttribute("data-close")) dialog.close();
    else if (btn && btn.dataset.zoom) setZoom(level + Number(btn.dataset.zoom));
    else if (e.target === stage) dialog.close();
  });

  img.addEventListener("click", function (e) {
    var r = stage.getBoundingClientRect();
    setZoom(level > 0 ? 0 : 2, e.clientX - r.left, e.clientY - r.top);
  });

  window.addEventListener("resize", function () {
    if (dialog.open) setZoom(level);
  });
})();
