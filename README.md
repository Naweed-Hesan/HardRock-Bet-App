# Hard Rock Bet Rewards — Lucky You prototype

A clickable, mobile-first prototype of the Hard Rock Bet Rewards store featuring the Real Autograph **Lucky You** collection. It is a static site (HTML, CSS and vanilla JS modules, no build step) served by GitHub Pages.

**Live:** https://naweed-hesan.github.io/HardRock-Bet-App/

## What you can try

- **Reward Drop** – tap the Legendary Reward Drops banner, tap the box three times to open it, and collect the reward.
- **Store** – filter by category, tap any product to open it with a shared-element transition, swipe from the left edge to go back.
- **My Rewards** – promo carousel, ready-to-use and in-progress rewards. Rewards you collect from a drop appear here.
- **Sheets** – the info button and "See how to earn" open drag-to-dismiss bottom sheets. "Reset demo" in the info sheet clears your saved points.
- **Add to Home Screen** – on iPhone/iPad use Share → Add to Home Screen; on Android use the browser menu → Install app. It opens full screen like a native app.

Layouts: 2-column grid on phones, 4 columns on tablets (700px+), 5 on wide screens. Animations respect the system Reduce Motion setting.

## Run locally

Any static server works, for example:

```sh
npx serve .
```

Then open the printed URL. Opening `index.html` directly from disk will not work because the app uses ES modules.

## Structure

```
index.html              App shell
css/app.css             Design tokens, layout and motion
js/app.js               Rendering, routing, interactions
js/data.js              Products, categories, drop rewards
js/icons.js             Inline SVG icons (Lucide, Phosphor, Unity mark)
assets/img/             Optimized WebP product and banner images
assets/icons/           App icons and the Featured chip icon
manifest.webmanifest    Home screen install settings
```

Product copy, prices and promo text are placeholders for the prototype.
