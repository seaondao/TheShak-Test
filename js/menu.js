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

  function samePrices(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  // When every item in a category has the same sizes (the açaí bowls),
  // show them once in the category line instead of on every item.
  function sharedItemPrices(cat) {
    if (cat.prices.length || !cat.items.length) return null;
    var first = cat.items[0].prices;
    if (!first.length) return null;
    var all = cat.items.every(function (item) { return samePrices(item.prices, first); });
    return all ? first : null;
  }

  // "16 oz $6 · 24 oz $8", or "$1.50 each" for one unlabeled price.
  function priceLine(prices) {
    if (prices.length === 1 && !prices[0].label) {
      return showPrices ? price(prices[0].amount) + " each" : "";
    }
    return prices.map(function (p) {
      return showPrices ? p.label + " " + price(p.amount) : p.label;
    }).join(" · ");
  }

  // Right side of an item row: "$15" or "Single Scoop $3 / Double Scoop $5".
  function itemPrice(prices) {
    if (!prices.length) return null;
    if (prices.length === 1 && !prices[0].label) {
      return showPrices ? el("p", "price", price(prices[0].amount)) : null;
    }
    var text = prices.map(function (p) {
      return showPrices ? p.label + " " + price(p.amount) : p.label;
    }).join(" / ");
    return el("p", showPrices ? "price" : "price-label", text);
  }

  // Dirty sodas lead with the soda: "Mountain Dew · Strawberry Syrup, Mango Syrup, Pineapple Juice".
  function ingredientsText(item) {
    if (!item.ingredients.length) return "";
    if (!item.base) return item.ingredients.join(", ");
    var rest = item.ingredients.filter(function (x) { return x !== item.base; });
    return item.base + (rest.length ? " · " + rest.join(", ") : "");
  }

  function isPlain(item) {
    return !item.description && !item.prices.length && !item.badge && item.number === null &&
      !item.ingredients.length && !item.options && !item.includes;
  }

  function renderItem(item, hidePrices) {
    var row = el("div", "menu-item");
    var head = el("div", "menu-item-head");
    var name = el("h3", "menu-item-name", (item.number !== null ? item.number + " " : "") + item.name);
    if (item.badge) name.appendChild(el("span", "badge", item.badge));
    head.appendChild(name);
    var right = hidePrices ? null : itemPrice(item.prices);
    if (right) head.appendChild(right);
    row.appendChild(head);

    var desc = item.description || ingredientsText(item);
    if (desc) row.appendChild(el("p", "menu-item-desc", desc));
    if (item.options) {
      row.appendChild(el("p", "menu-item-sub", item.options.label + ": " + item.options.choices.join(", ")));
    }
    if (item.toppedWith.length) {
      row.appendChild(el("p", "menu-item-sub", "Topped with " + item.toppedWith.join(", ")));
    }
    return row;
  }

  // Items with only a name (sides) share one row: "Mild Sauce · Hot Sauce · …".
  function renderPlainItems(items, note) {
    var row = el("div", "menu-item");
    row.appendChild(el("h3", "menu-item-name", items.map(function (i) { return i.name; }).join(" · ")));
    if (note) row.appendChild(el("p", "menu-item-desc", note));
    return row;
  }

  function chipList(names) {
    var ul = el("ul", "chips");
    names.forEach(function (n) { ul.appendChild(el("li", null, n)); });
    return ul;
  }

  function extraText(x) {
    return x.name + (showPrices && x.amount !== null ? " +" + price(x.amount) : "");
  }

  function isPricedGroup(g) {
    return g.items.some(function (x) { return x.amount !== null; });
  }

  function renderByoCard(item, extras) {
    var card = el("div", "byo-card");
    card.appendChild(el("h3", null, item.name));
    var text = "Includes: " + item.includes + ".";
    extras.filter(isPricedGroup).forEach(function (g) {
      text += " " + g.items.map(extraText).join(", ") + ".";
    });
    card.appendChild(el("p", null, text));
    extras.filter(function (g) { return !isPricedGroup(g); }).forEach(function (g) {
      card.appendChild(el("h4", null, g.group));
      card.appendChild(chipList(g.items.map(function (x) { return x.name; })));
    });
    return card;
  }

  function renderCategory(cat) {
    var article = el("article", "menu-cat");
    article.id = cat.id;
    article.setAttribute("aria-labelledby", cat.id + "-title");

    var head = el("div", "menu-cat-head");
    var title = el("h2", "title", cat.name);
    title.id = cat.id + "-title";
    head.appendChild(title);
    if (cat.tagline) head.appendChild(el("p", "cat-tagline", cat.tagline));
    var shared = sharedItemPrices(cat);
    head.appendChild(el("p", "cat-prices", priceLine(cat.prices.length ? cat.prices : shared || [])));
    article.appendChild(head);

    if (cat.image) {
      var photo = el("div", "menu-cat-photo");
      var img = el("img");
      img.src = cat.image;
      img.alt = cat.name;
      img.loading = "lazy";
      photo.appendChild(img);
      article.appendChild(photo);
    }

    var byo = cat.items.filter(function (i) { return i.includes; })[0];
    var regular = cat.items.filter(function (i) { return i !== byo && !isPlain(i); });
    var plain = cat.items.filter(isPlain);

    if (regular.length || plain.length) {
      var list = el("div", "menu-items");
      regular.forEach(function (item) { list.appendChild(renderItem(item, !!shared)); });
      if (plain.length) list.appendChild(renderPlainItems(plain, cat.note));
      article.appendChild(list);
    }

    if (byo) {
      article.appendChild(renderByoCard(byo, cat.extras));
    } else {
      cat.extras.forEach(function (g) {
        if (isPricedGroup(g)) {
          var line = el("p", "addons");
          g.items.forEach(function (x) { line.appendChild(el("span", null, extraText(x))); });
          article.appendChild(line);
        } else {
          var group = el("div", "chip-group");
          group.appendChild(el("h3", null, g.group));
          group.appendChild(chipList(g.items.map(function (x) { return x.name; })));
          article.appendChild(group);
        }
      });
    }
    if (cat.note && !plain.length) article.appendChild(el("p", "menu-item-sub", cat.note));
    return article;
  }

  // Highlight the chip for the section at the top of the screen.
  var chips = [];
  var lockSpy = 0;

  function setActive(id) {
    chips.forEach(function (a) { a.classList.toggle("is-active", a.hash === "#" + id); });
  }

  function spy() {
    if (Date.now() < lockSpy) return;
    var limit = (jump.getBoundingClientRect().bottom || 0) + 40;
    var current = chips.length ? chips[0].hash.slice(1) : null;
    var bestTop = -Infinity;
    chips.forEach(function (a) {
      var section = document.getElementById(a.hash.slice(1));
      var top = section.getBoundingClientRect().top;
      if (top <= limit && top > bestTop) { bestTop = top; current = section.id; }
    });
    if (current) setActive(current);
  }

  ShackData.load().then(function (menu) {
    showPrices = menu.settings.showPrices;
    root.textContent = "";
    jumpList.textContent = "";

    for (var i = 0; i < menu.categories.length; i += 2) {
      var row = el("section", "menu-row");
      var grid = el("div", "wrap menu-row-grid");
      menu.categories.slice(i, i + 2).forEach(function (cat) { grid.appendChild(renderCategory(cat)); });
      row.appendChild(grid);
      root.appendChild(row);
    }

    menu.categories.forEach(function (cat) {
      var li = el("li");
      var a = el("a", null, cat.navLabel);
      a.href = "#" + cat.id;
      a.addEventListener("click", function () {
        lockSpy = Date.now() + 900;
        setActive(cat.id);
      });
      li.appendChild(a);
      jumpList.appendChild(li);
      chips.push(a);
    });
    jump.hidden = false;
    setActive(menu.categories[0] && menu.categories[0].id);
    window.addEventListener("scroll", function () { window.requestAnimationFrame(spy); }, { passive: true });

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
