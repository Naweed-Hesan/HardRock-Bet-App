# Hard Rock Bet Rewards — Lucky You prototype

A clickable, mobile-first prototype of the Hard Rock Bet Rewards store featuring the Real Autograph **Lucky You** collection. It is a static site (HTML, CSS and vanilla JS modules, no build step, no backend) deployed on Vercel.

**Live:** https://hardrockbet.vercel.app/

## What you can try

- **Reward Drops (repeatable)** – every drop is a Lucky You box (Full Size Helmet, Mini Helmet or Football Jersey Pack). Tap it three times to break it open and the signed helmet or jersey inside rises out, with a Common, Rare, Epic or Legendary beam and confetti. The item flies into My Rewards and bonus Unity Points fly into your balance. Each drop adds credits, and a full bar triggers a Level Up that improves your odds, up to Signature.
- **Redeem a mystery box** – the five boxes (Full Size Helmet, Mini Helmet, Football Jersey Pack, Hot Hands, Hyped Up Sneaker Box) are redeemed with Unity Points only. Hold to redeem, the box drops in and one tap sets it off: it rumbles, bursts, and the product rises out into a showcase you can tilt, with Back, Add to my collection and Redeem another.
- **500,000 points to start** – every demo starts with 500,000 Unity Points so you can redeem freely. Box product pages list what's inside with the odds for your level.
- **Desktop layout** – on screens 1024px and wider: top navigation, the banner beside a level/points/drop panel, a two-column My Rewards, a split product page and centered dialogs.
- **Daily Scratch** – in My Rewards, scratch the foil with your finger, collect the prize and get a fresh card.
- **Hold to redeem** – once you have enough points, press and hold the redeem button on a product page. Redeemed items show up in My Rewards with an order number.
- **Store** – filter by category, open any product with a shared-element transition, tap the photo for a full-screen viewer (double-tap to zoom, swipe down to close), swipe from the left edge to go back.
- **My Rewards** – auto-advancing promo carousel, expandable rewards you can activate, redeemed items and in-progress rewards.
- **Odds and reset** – the ⓘ button shows how drops work, your odds at your current level, and a **Reset demo** button that clears all saved progress.
- **Add to Home Screen** – on iPhone/iPad use Share → Add to Home Screen; on Android use the browser menu → Install app.

Everything is saved in the browser's local storage, so progress survives a refresh. Layouts: 2-column grid on phones, 4 columns on tablets (700px+), 5 on wide screens. Animations respect the system Reduce Motion setting.

## Run locally

```sh
npx serve .
```

Then open the printed URL. Opening `index.html` directly from disk will not work because the app uses ES modules.

## Structure

```
index.html              App shell
css/app.css             Design tokens, layout and motion
js/app.js               Rendering, routing, interactions
js/data.js              Products, categories, drop odds and prize tables
js/icons.js             Inline SVG icons (Lucide, Phosphor, Unity mark)
assets/img/             Optimized WebP product and banner images
assets/icons/           App icons and the Featured chip icon
manifest.webmanifest    Home screen install settings
```

Product copy, prices, odds and promo text are placeholders for the prototype.
