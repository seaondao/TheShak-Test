# The Shack website

Website for The Shack, a Hawaiian style food truck in Laie, Oahu (locals call it L-Town).
Read this file at the start of every session and follow it.

## Real business info (do not change)
- Name: The Shack
- Address: 55-164 Kamehameha Hwy, Laie, HI
- Hours: Mon–Thu 11am–1am, Fri–Sat 11am–3am, Sunday closed
- Instagram: https://www.instagram.com/theshack808/
- Tagline: "Home of the California Burrito. The best Açaí Bowls on Oahu."

## Stack
- Plain HTML, CSS, and JavaScript. No framework, no build step, no npm dependencies for the site itself.
- Pages: index.html (home), menu.html (full menu), order.html ("Coming Soon").
- Will be hosted on GitHub Pages under a subfolder, so ALL paths must be relative (never start a path with "/").
- To preview locally: `python -m http.server 8080` in the project folder, then open http://localhost:8080 (menu data is loaded with fetch, so opening the HTML file directly will not work).

## Shared header and footer
The header and footer are copied into each HTML page. They must stay identical on every page.
When you change one, change all three pages in the same commit.

## Menu data
- All menu content comes from `menu.json`. Never hard-code menu items or prices in HTML.
- `settings.showPrices = false` must hide every price on the whole site.
- The menu will move to a Google Sheet later. Keep that switch easy:
  - `menu.json` is shaped like spreadsheet tabs: flat lists of rows, one row per item, plain values only (strings, numbers, booleans). No deep nesting.
  - All data loading goes through ONE module, `js/data.js`, which returns the same normalized structure no matter where the data comes from. Pages never read `menu.json` directly.
  - Switching to Google Sheets later should only require changing `js/data.js`.

## Design
- Source of truth: the Figma exports in `reference/figma/`. Match them closely.
  - Home page: desktop.png (1440px), phone-1.png to phone-4.png (390px, top to bottom; the phone footer follows the desktop footer)
  - Menu page: menu-desktop.png (1440px), menu-phone.png (390px)
- Phone first. Most visitors are on phones.
- Colors: red #A61E17 (brand, buttons, eyebrows), dark brown #1A1412 (text), cream #FAF3E7 (main background), deeper cream #F2E6D2 (alternate sections), yellow #E9C46A (badges, footer band).
- Fonts (Google Fonts): Alfa Slab One for headings, Work Sans for body.
- Style: big stacked headlines with tight line height, small uppercase red eyebrow labels above headings, rounded photo corners, thin light dividers.
- Never: thick black borders around boxes, drop shadows, gradients, generic AI-looking decoration.

## Images (imgs/)
- hero-shack.png: the red building (home hero)
- caliBurrito.png, crazyFries.png (Carne Asada Fries), acai.png: signature items
- breakfastBurrito.png, fullMenue.png (original printed menu)
- owners.png: owner photo for the About section. Only use it if the file exists in imgs/ (that means the owner said OK). If it is missing, keep an empty rounded box with a code comment.
- Images keep their real proportions. Never stretch them.

## Writing
- Short, plain, specific to this place. No generic marketing filler, no fake reviews.
- Mark any placeholder copy with a code comment so it can be replaced with the owner's words.

## Git
- Never commit: reference/, variants/, screenshots, shots/, *_NOTES.md, WORK_LOG.md, session-log.md, .claude/, .agents/, .playwright/, node_modules/, .env files, OS junk files.
- Never push the design-variants branch.
- Commit after each finished step with a clear message. Don't push unless asked.

## Not built yet
- Online ordering (order.html stays "Coming Soon"; later it will link to a service like Toast or Square, never a custom payment system).
- Publishing to GitHub Pages.
