// Home page: fills the "The good stuff." cards from the featured menu rows.
(function () {
  "use strict";

  var grid = document.querySelector("[data-featured]");
  if (!grid) return;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  ShackData.load().then(function (menu) {
    grid.textContent = "";
    menu.featured.forEach(function (f) {
      var card = el("article", "card");

      var photo = el("div", "card-photo");
      if (f.image) {
        var img = el("img");
        img.src = f.image;
        img.alt = f.title;
        img.loading = "lazy";
        photo.appendChild(img);
      }
      card.appendChild(photo);

      var head = el("div", "item-head");
      head.appendChild(el("h3", "item-name", f.title));
      if (menu.settings.showPrices && f.price !== null) {
        head.appendChild(el("p", "price", ShackData.formatPrice(f.price)));
      }
      card.appendChild(head);

      if (f.blurb) card.appendChild(el("p", "item-desc", f.blurb));
      grid.appendChild(card);
    });
  }).catch(function (err) {
    console.error(err);
    grid.innerHTML = '<p class="lede">See the <a href="menu.html">full menu</a>.</p>';
  });
})();
