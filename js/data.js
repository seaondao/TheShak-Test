/*
 * The only place that loads menu data.
 *
 * Today the rows come from menu.json. Later they will come from a Google Sheet
 * with the same tabs (settings, categories, items, extras, featured). To switch, only
 * change fetchTables() below so it returns the same four tables of rows.
 *
 * Every page calls ShackData.load() and gets back the same normalized shape:
 *
 * {
 *   settings: { showPrices, currency },
 *   categories: [{
 *     id, name, navLabel, tagline, note, image,
 *     prices: [{ label, amount }],          // category-wide sizes (Dirty Sodas, Refreshers, Sides)
 *     items: [{
 *       id, number, name, badge, description, base,
 *       ingredients: [], toppedWith: [],
 *       options: { label, choices: [] } | null,
 *       includes, image,
 *       prices: [{ label, amount }]         // empty when the category prices apply
 *     }],
 *     extras: [{ group, items: [{ name, amount }] }]   // add-ons, toppings, drizzles, flavors
 *   }],
 *   featured: [{ item, title, blurb, image, price }],  // home page signature items
 *   items: { [id]: item }                    // quick lookup by item id
 * }
 */
(function (root) {
  "use strict";

  var MENU_URL = "menu.json";

  function fetchTables() {
    return fetch(MENU_URL, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error("Could not load " + MENU_URL + " (" + res.status + ")");
      return res.json();
    });
  }

  // Spreadsheet cells come back as strings, so treat "" and null the same.
  function text(value) {
    return value === undefined || value === null ? "" : String(value).trim();
  }

  function number(value) {
    if (text(value) === "") return null;
    var n = Number(value);
    return isNaN(n) ? null : n;
  }

  function bool(value) {
    if (typeof value === "boolean") return value;
    return /^(true|yes|1)$/i.test(text(value));
  }

  function list(value) {
    return text(value) === "" ? [] : text(value).split(",").map(function (s) { return s.trim(); });
  }

  function prices(row) {
    var out = [];
    [1, 2].forEach(function (i) {
      var amount = number(row["price" + i]);
      if (amount !== null) out.push({ label: text(row["priceLabel" + i]), amount: amount });
    });
    return out;
  }

  function normalize(tables) {
    var settings = tables.settings || {};
    var byId = {};

    var categories = (tables.categories || []).map(function (row) {
      return {
        id: text(row.id),
        name: text(row.name),
        navLabel: text(row.navLabel) || text(row.name),
        tagline: text(row.tagline),
        note: text(row.note),
        image: text(row.image) || null,
        prices: prices(row),
        items: [],
        extras: []
      };
    });
    var catById = {};
    categories.forEach(function (c) { catById[c.id] = c; });

    (tables.items || []).forEach(function (row) {
      var cat = catById[text(row.category)];
      if (!cat || text(row.name) === "") return;
      var choices = list(row.options);
      var item = {
        id: text(row.id),
        number: number(row.number),
        name: text(row.name),
        badge: text(row.badge) || null,
        description: text(row.description),
        base: text(row.base),
        ingredients: list(row.ingredients),
        toppedWith: list(row.toppedWith),
        options: choices.length ? { label: text(row.optionLabel), choices: choices } : null,
        includes: text(row.includes),
        image: text(row.image) || null,
        prices: prices(row)
      };
      cat.items.push(item);
      byId[item.id] = item;
    });

    (tables.extras || []).forEach(function (row) {
      var cat = catById[text(row.category)];
      if (!cat || text(row.name) === "") return;
      var groupName = text(row.group);
      var group = cat.extras.filter(function (g) { return g.group === groupName; })[0];
      if (!group) {
        group = { group: groupName, items: [] };
        cat.extras.push(group);
      }
      group.items.push({ name: text(row.name), amount: number(row.price) });
    });

    // Featured rows point at an item; the price always comes from that item.
    var featured = (tables.featured || []).map(function (row) {
      var item = byId[text(row.item)] || null;
      var first = item && item.prices[0];
      return {
        item: item,
        title: text(row.title) || (item ? item.name : ""),
        blurb: text(row.blurb),
        image: text(row.image) || null,
        price: first ? first.amount : null
      };
    });

    return {
      featured: featured,
      settings: {
        showPrices: settings.showPrices === undefined ? true : bool(settings.showPrices),
        currency: text(settings.currency) || "USD"
      },
      categories: categories,
      items: byId
    };
  }

  var cached = null;

  function load() {
    if (!cached) cached = fetchTables().then(normalize);
    return cached;
  }

  // "$15", "$18.50", "$1.50"
  function formatPrice(amount) {
    if (amount === null || amount === undefined) return "";
    return "$" + (amount % 1 === 0 ? String(amount) : amount.toFixed(2));
  }

  var api = { load: load, normalize: normalize, formatPrice: formatPrice };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ShackData = api;
})(this);
