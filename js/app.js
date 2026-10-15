import { PRODUCTS, CATEGORIES, DROP_REWARDS } from "./data.js";
import { ICONS, icon } from "./icons.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmt = (n) => n.toLocaleString("en-US");
const buzz = (pattern = 8) => navigator.vibrate?.(pattern);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const canMorph = () => "startViewTransition" in document && !reducedMotion.matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const TYPE_LABEL = { box: "Mystery Box", guitar: "Signed Guitar", jersey: "Signed Jersey", belt: "Championship Belt", helmet: "Speedflex Helmet" };

/* ---------- State ---------- */
const STORE_KEY = "hrb-rewards-demo-v1";
const DEFAULT_STATE = { points: 0, dropOpened: false, rewards: [] };
let state = load();

function load() {
  try {
    return { ...DEFAULT_STATE, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_STATE };
  }
}
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {}
}

/* ---------- Static icons ---------- */
$("#info-btn").innerHTML = icon("info");
$(".points-card__logo").innerHTML = icon("unity");
$(".points-card__chev").innerHTML = icon("chevron-right");

/* ---------- Points ---------- */
function animateNumber(el, from, to, duration = 900) {
  if (reducedMotion.matches || from === to) {
    el.textContent = fmt(to);
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = fmt(Math.round(from + (to - from) * eased));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function renderPoints(from = state.points) {
  $$("[data-points]").forEach((el) => animateNumber(el, from, state.points));
  $("[data-points-pill]").innerHTML = `${icon("unity")}<span>${fmt(state.points)}</span>`;
  const head = $("#view-detail h2");
  if (head) head.textContent = `Unity Points: ${fmt(state.points)}`;
}

/* ---------- Toasts ---------- */
function toast(message, iconName = "sparkles", ms = 2400) {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `${icon(iconName)}<span>${message}</span>`;
  $("#toasts").append(el);
  setTimeout(() => {
    el.classList.add("is-leaving");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }, ms);
}

/* ---------- Hero ---------- */
const hero = $("#hero");
const banner = $("#hero-banner");
const bannerImg = $("img", banner);
const topbar = $("#topbar");

function layoutHero() {
  const split = (banner.offsetHeight / hero.offsetHeight) * 100;
  hero.style.setProperty("--hero-split", `${split.toFixed(1)}%`);
}
new ResizeObserver(layoutHero).observe(hero);

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    if (!reducedMotion.matches) {
      if (y >= 0 && y < banner.offsetHeight) bannerImg.style.setProperty("--parallax", `${y * 0.35}px`);
      bannerImg.style.setProperty("--zoom", y < 0 ? 1 + -y / 350 : 1);
    }
    ticking = false;
  });
}
addEventListener("scroll", onScroll, { passive: true });
new IntersectionObserver(([e]) => topbar.classList.toggle("is-condensed", !e.isIntersecting), {
  rootMargin: "-60px 0px 0px 0px",
}).observe(banner);

function animateProgress() {
  setTimeout(() => {
    $("#track-fill").style.width = "50%";
    animateNumber($("[data-progress-now]"), 0, 5, 1300);
  }, 350);
}

function syncDropCta() {
  $("#hero-cta").classList.toggle("is-gone", state.dropOpened);
}

/* ---------- Segmented tabs ---------- */
const segmented = $("#segmented");
let activePane = "store";
function setPane(name, { instant = false } = {}) {
  if (name === activePane && !instant) return;
  const dir = name === "store" ? 1 : -1;
  activePane = name;
  segmented.style.setProperty("--thumb-x", name === "store" ? "100%" : "0%");
  $$("button", segmented).forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
  $$(".pane").forEach((p) => {
    const on = p.dataset.pane === name;
    p.hidden = !on;
    if (on && !instant) {
      p.style.setProperty("--dir", dir);
      p.classList.remove("is-entering");
      void p.offsetWidth;
      p.classList.add("is-entering");
    }
  });
  if (name === "rewards") renderRewards();
}
segmented.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  buzz();
  setPane(b.dataset.tab);
});

/* ---------- Chips & grid ---------- */
const chipsEl = $("#chips");
const grid = $("#grid");
let activeCat = "featured";

function chipIcon(c) {
  if (c.icon === "featured-hand") return `<span class="chip__icon"><img src="assets/icons/featured-hand.png" alt="" /></span>`;
  if (c.tint) {
    const i = ICONS[c.icon];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${i.viewBox}">${i.inner}</svg>`;
    return `<span class="chip__icon chip__icon--tint" style="--mask:url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}');--tint:${c.tint}"></span>`;
  }
  return `<span class="chip__icon" style="color:${c.color}">${icon(c.icon)}</span>`;
}
function renderChips() {
  chipsEl.innerHTML = CATEGORIES.map(
    (c) => `<button class="chip" role="tab" data-cat="${c.id}" aria-selected="${c.id === activeCat}">${chipIcon(c)}<span>${c.label}</span></button>`
  ).join("");
}
chipsEl.addEventListener("click", (e) => {
  const b = e.target.closest(".chip");
  if (!b || b.dataset.cat === activeCat) return;
  buzz();
  activeCat = b.dataset.cat;
  $$(".chip", chipsEl).forEach((c) => c.setAttribute("aria-selected", String(c === b)));
  b.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", inline: "center", block: "nearest" });
  swapGrid();
});

const badgeClass = (b) => `badge--${b.replace(/[^a-z]/gi, "") || "oneofone"}`;
function cardHTML(p, i) {
  return `<button class="card" data-id="${p.id}" style="--i:${i}" aria-label="${p.name}, ${fmt(p.price)} points">
    <div class="card__img${p.type === "box" ? " is-box" : ""}">
      <img src="${p.img}" alt="" loading="lazy" decoding="async" />
      <span class="skeleton"></span>
      ${p.badge ? `<span class="badge ${badgeClass(p.badge)}">${p.badge}</span>` : ""}
    </div>
    <h3 class="card__title">${p.name}</h3>
    <div class="price">${icon("unity")}<span>${fmt(p.price)}</span></div>
  </button>`;
}
function wireImages(root) {
  $$(".card__img img", root).forEach((img) => {
    const done = () => img.classList.add("is-loaded");
    if (img.complete && img.naturalWidth) done();
    else img.addEventListener("load", done, { once: true });
  });
}
function renderGrid() {
  const cat = CATEGORIES.find((c) => c.id === activeCat);
  const items = PRODUCTS.filter(cat.match);
  if (!items.length) {
    grid.innerHTML = `<div class="empty"><span class="empty__icon" style="--tile:${cat.color || "var(--accent)"}">${icon(cat.icon)}</span><h3>${cat.label}</h3><p>${cat.empty}</p></div>`;
    return;
  }
  grid.innerHTML = items.map(cardHTML).join("");
  wireImages(grid);
}
async function swapGrid() {
  grid.style.minHeight = `${grid.offsetHeight}px`;
  grid.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(6px)" }], { duration: reducedMotion.matches ? 0 : 140, fill: "forwards" });
  await wait(reducedMotion.matches ? 0 : 140);
  renderGrid();
  grid.getAnimations().forEach((a) => a.cancel());
  requestAnimationFrame(() => (grid.style.minHeight = ""));
}

/* ---------- My Rewards pane ---------- */
function rewardHTML(r, i, extra = "") {
  return `<article class="reward ${r.isNew ? "is-new" : ""}" style="--i:${i}">
    <span class="reward__tile" style="--tile:${r.tile}">${icon(r.icon)}</span>
    <div class="reward__body"><h5>${r.title}</h5><p>${r.sub}</p>${r.exp ? `<small>${r.exp}</small>` : ""}${extra}</div>
    <div class="reward__side">${icon("info")}${r.action ? `<button class="btn btn--primary btn--small" data-action="${r.action}">${r.action}</button>` : ""}</div>
  </article>`;
}
function renderRewards() {
  const pane = $('[data-pane="rewards"]');
  const ready = [
    ...state.rewards.map((r, i) => ({ ...r, isNew: i === 0 && r.fresh })),
    { title: "10% Profit Boost", sub: "Profit Boost to be used on a 3+ leg parlay.", exp: "Exp: 10/16/26 @ 12:49 PM", icon: "zap", tile: "linear-gradient(180deg,#ffb020,#f27d0c)" },
  ];
  pane.innerHTML = `<div class="rewards">
    <div class="promos">
      <button class="promo promo--bonus" data-promo="bonus">
        <div class="promo__art"><h4>Claim your<br/>$10 bonus</h4><small>Powered by Post Motor Racing</small><span class="promo__big">$10</span></div>
        <div class="promo__foot"><b>Opt in &amp; get a $10 Games Bonus</b><span>Play any featured Post Motor Racing game this week to unlock your bonus.</span><span class="promo__optin">OPT IN ${icon("chevron-right")}</span></div>
      </button>
      <button class="promo promo--sweats" data-promo="sweats">
        <div class="promo__art"><h4>Get up to<br/>$500</h4><small>New customer offer</small><span class="promo__big">$500</span></div>
        <div class="promo__foot"><b>Bet $5 &amp; get up to $500 in No Sweats</b><span>Get $50 in No Sweat Bet tokens each day for 10 days</span><span class="btn btn--primary btn--block">Bet now</span></div>
      </button>
    </div>
    <div class="wrap">
      <h2 class="section-title">Ready to Use Rewards</h2>
      <div class="reward-list">${ready.map((r, i) => rewardHTML(r, i)).join("")}</div>
    </div>
    <div class="wrap">
      <h2 class="section-title">In-Progress Rewards</h2>
      <div class="reward-list">
        ${rewardHTML({ title: "100% Deposit Match up to $25", sub: "Deposit to unlock your match.", exp: "Exp: 10/31/26 @ 11:59 PM", icon: "gift", tile: "linear-gradient(180deg,#1cc9a0,#0a9c8e)", action: "Deposit" }, 0, `<div class="mini-track" style="--p:35%"><span></span></div>`)}
        ${rewardHTML({ title: "Online Unity Points", sub: "Start racking up points this month with every cash wager you make.", icon: "unity", tile: "linear-gradient(180deg,#2b2840,#141221)" }, 1)}
      </div>
    </div>
  </div>`;
  state.rewards.forEach((r) => (r.fresh = false));
  save();
}
$('[data-pane="rewards"]').addEventListener("click", (e) => {
  const promo = e.target.closest("[data-promo]");
  const action = e.target.closest("[data-action]");
  if (action) {
    buzz();
    toast("Deposits aren't live in this prototype", "lock");
  } else if (promo) {
    buzz();
    toast(promo.dataset.promo === "bonus" ? "You're opted in to the $10 bonus" : "Offer saved to your bet slip", "check");
  }
});

/* ---------- Tab bar ---------- */
const TABS = [
  { id: "home", label: "Home", icon: "house" },
  { id: "bets", label: "My Bets", icon: "receipt-text" },
  { id: "rewards", label: "Rewards", icon: "gift" },
  { id: "games", label: "Games", icon: "gamepad-2" },
  { id: "account", label: "$0.00", icon: "circle-user-round", dot: true },
];
const tabbar = $("#tabbar");
tabbar.innerHTML =
  `<span class="tabbar__pill"></span>` +
  TABS.map(
    (t) => `<button data-tab="${t.id}" ${t.id === "rewards" ? 'aria-current="page"' : ""}><span class="${t.dot ? "tabbar__dot" : ""}">${icon(t.icon)}</span>${t.label}</button>`
  ).join("");
tabbar.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  buzz();
  if (b.dataset.tab === "rewards") {
    scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
    return;
  }
  const i = TABS.findIndex((t) => t.id === b.dataset.tab);
  tabbar.style.setProperty("--tab-i", i);
  setTimeout(() => tabbar.style.setProperty("--tab-i", 2), 650);
  toast(`${TABS[i].label === "$0.00" ? "Account" : TABS[i].label} isn't part of this prototype`, "lock");
});

/* ---------- Bottom sheet ---------- */
const sheet = $("#sheet");
const sheetPanel = $(".sheet__panel", sheet);
let sheetOnClose = null;
function openSheet(html, onClose) {
  $(".sheet__body", sheet).innerHTML = html;
  sheetOnClose = onClose;
  sheet.hidden = false;
  document.body.classList.add("is-locked");
  requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add("is-open")));
}
function closeSheet() {
  if (sheet.hidden) return;
  sheet.classList.remove("is-open");
  sheet.style.removeProperty("--drag");
  setTimeout(() => {
    sheet.hidden = true;
    if ($("#view-detail").hidden) document.body.classList.remove("is-locked");
    sheetOnClose?.();
    sheetOnClose = null;
  }, 380);
}
sheet.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) closeSheet();
});
(() => {
  let startY = null;
  sheetPanel.addEventListener("touchstart", (e) => {
    if (sheetPanel.scrollTop > 0) return;
    startY = e.touches[0].clientY;
    sheet.classList.add("is-dragging");
  }, { passive: true });
  sheetPanel.addEventListener("touchmove", (e) => {
    if (startY == null) return;
    const dy = Math.max(0, e.touches[0].clientY - startY);
    sheet.style.setProperty("--drag", `${dy}px`);
  }, { passive: true });
  sheetPanel.addEventListener("touchend", (e) => {
    if (startY == null) return;
    const dy = e.changedTouches[0].clientY - startY;
    startY = null;
    sheet.classList.remove("is-dragging");
    if (dy > 110) closeSheet();
    else sheet.style.setProperty("--drag", "0px");
  });
})();

const steps = (items) =>
  `<ul class="steps">${items.map(([ic, title, text], i) => `<li style="--i:${i}"><span class="step-icon">${icon(ic)}</span><div><b>${title}</b><span>${text}</span></div></li>`).join("")}</ul>`;

$("#info-btn").addEventListener("click", () => {
  buzz();
  openSheet(`<h2>How Reward Drops work</h2>
    <p class="lead">Every cash wager moves you closer to your next Legendary Reward Drop.</p>
    ${steps([
      ["trophy", "Earn credits", "Each qualifying wager adds credits to your monthly bar."],
      ["gift", "Unlock a drop", "Fill the bar to unlock a Reward Drop for your level."],
      ["sparkles", "Open and reveal", "Tap to open your drop and reveal a reward instantly."],
      ["zap", "Level up", "Climb from Level 1 to Signature for bigger drops."],
    ])}
    <button class="btn btn--primary btn--block" data-close>Got it</button>
    <button class="btn btn--ghost btn--block" id="reset-demo">Reset demo</button>`);
  $("#reset-demo").addEventListener("click", () => {
    const before = state.points;
    state = { ...DEFAULT_STATE };
    save();
    closeSheet();
    renderPoints(before);
    syncDropCta();
    if (activePane === "rewards") renderRewards();
    toast("Demo reset", "check");
  });
});

$("#points-card").addEventListener("click", () => {
  buzz();
  openSheet(`<h2>Earn Online Unity Points</h2>
    <p class="lead">You have <b>${fmt(state.points)}</b> Online Unity Points. Redeem them for signed collectibles, Lucky You mystery boxes and more.</p>
    ${steps([
      ["receipt-text", "Bet online", "Earn points on every settled cash wager."],
      ["gamepad-2", "Play casino games", "Slots and table games earn points too."],
      ["gift", "Open Reward Drops", "Some drops include bonus Unity Points."],
      ["unity", "Redeem in the Store", "Spend points on anything in the Rewards Store."],
    ])}
    <button class="btn btn--primary btn--block" data-close>Start earning</button>`);
});

/* ---------- Reward Drop ---------- */
const drop = $("#drop");
banner.addEventListener("click", () => {
  buzz();
  if (state.dropOpened) {
    toast("Your next drop unlocks at 10 / 10 credits", "lock");
    return;
  }
  openDrop();
});

function openDrop() {
  let hits = 0;
  drop.hidden = false;
  drop.classList.remove("is-leaving");
  document.body.classList.add("is-locked");
  drop.innerHTML = `
    <div class="drop__rays"></div>
    <button class="icon-btn icon-btn--light drop__close" aria-label="Close">${icon("x")}</button>
    <div class="drop__eyebrow">Level 1 Drop</div>
    <h2 class="drop__title">Legendary<br/>Reward Drop</h2>
    <div class="drop__stage"><img class="drop__box" src="assets/img/box-full-size.webp" alt="Lucky You drop box" /></div>
    <p class="drop__hint">Tap the box to open it</p>
    <div class="drop__taps"><span></span><span></span><span></span></div>
    <div class="drop__flash"></div>`;
  const box = $(".drop__box", drop);
  const dots = $$(".drop__taps span", drop);
  $(".drop__close", drop).addEventListener("click", closeDrop);
  box.addEventListener("click", () => {
    if (hits >= 3) return;
    hits++;
    dots[hits - 1].classList.add("on");
    box.classList.remove("hit-1", "hit-2");
    void box.offsetWidth;
    if (hits < 3) {
      buzz(hits === 1 ? 15 : [20, 30, 20]);
      box.classList.add(hits === 1 ? "hit-1" : "hit-2");
      $(".drop__hint", drop).textContent = hits === 1 ? "Keep going…" : "One more!";
    } else {
      buzz([30, 40, 60]);
      revealPrize(box);
    }
  });
}

async function revealPrize(box) {
  box.classList.add("burst");
  $(".drop__flash", drop).classList.add("go");
  $(".drop__hint", drop).style.opacity = 0;
  $(".drop__taps", drop).style.opacity = 0;
  confetti();
  await wait(420);
  const prize = DROP_REWARDS[Math.floor(Math.random() * DROP_REWARDS.length)];
  const prizeIcon = prize.kind === "points" ? "unity" : prize.kind === "boost" ? "zap" : "sparkles";
  const stage = $(".drop__stage", drop);
  stage.innerHTML = `<div class="drop__reveal"><div class="prize">
      <div class="prize__tile">${icon(prizeIcon)}</div>
      <small>You unlocked</small>
      <h3>${prize.title}</h3>
      <p>${prize.sub}</p>
      <button class="btn btn--primary btn--block" id="collect">Collect</button>
    </div></div>`;
  $(".drop__title", drop).innerHTML = "Nice pull!";
  $("#collect").addEventListener("click", () => collect(prize, prizeIcon));
}

function collect(prize, prizeIcon) {
  buzz(12);
  const before = state.points;
  if (prize.kind === "points") state.points += prize.amount;
  state.dropOpened = true;
  state.rewards.unshift({
    title: prize.title.replace(/^\+/, ""),
    sub: prize.sub,
    exp: "From your Level 1 Reward Drop",
    icon: prizeIcon,
    tile: "linear-gradient(180deg,#7c5cf0,#4a1fb5)",
    fresh: true,
  });
  save();
  closeDrop();
  syncDropCta();
  setTimeout(() => {
    renderPoints(before);
    if (activePane === "rewards") renderRewards();
    toast("Reward added to My Rewards", "gift");
  }, 300);
}

function closeDrop() {
  drop.classList.add("is-leaving");
  setTimeout(() => {
    drop.hidden = true;
    drop.innerHTML = "";
    document.body.classList.remove("is-locked");
  }, 340);
}

function confetti() {
  if (reducedMotion.matches) return;
  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const colors = ["#ffffff", "#ffcf5c", "#16bf86", "#b9a8ff", "#ff6aa2", "#5d3cf2"];
  const cx = innerWidth / 2;
  const cy = innerHeight / 2;
  const parts = Array.from({ length: 160 }, () => {
    const a = Math.random() * Math.PI * 2;
    const v = 6 + Math.random() * 11;
    return { x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, r: Math.random() * 360, vr: (Math.random() - 0.5) * 18, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, c: colors[(Math.random() * colors.length) | 0] };
  });
  const start = performance.now();
  (function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.32;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / 2600);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.r * Math.PI) / 180);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r / 30)));
      ctx.restore();
    }
    if (t < 2600) requestAnimationFrame(frame);
    else canvas.remove();
  })(start);
}

/* ---------- Product detail ---------- */
const detail = $("#view-detail");
let currentId = null;
let pendingMorphImg = null;
let enteredFromStore = false;

grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  buzz();
  pendingMorphImg = $("img", card);
  enteredFromStore = true;
  location.hash = `#/p/${card.dataset.id}`;
});

function detailHTML(p) {
  const affordable = state.points >= p.price;
  const related = PRODUCTS.filter((x) => x.id !== p.id && x.type === p.type).concat(PRODUCTS.filter((x) => x.type !== p.type && x.type === "box")).slice(0, 8);
  return `
    <header class="detail__head"><div class="detail__head-inner">
      <button class="icon-btn icon-btn--dark" data-back aria-label="Back">${icon("arrow-left")}</button>
      <h2>Unity Points: ${fmt(state.points)}</h2>
      <button class="icon-btn icon-btn--dark" data-share aria-label="Share">${icon("share-2")}</button>
    </div></header>
    <div class="detail__media"><div class="detail__media-inner"><img class="${p.type === "box" ? "is-box" : ""}" src="${p.img}" alt="${p.name}" /></div></div>
    <div class="detail__body">
      <h1 class="detail__title" style="--i:0">${p.name}</h1>
      <div class="detail__tags" style="--i:1"><span class="tag">${TYPE_LABEL[p.type]}</span>${p.badge && p.badge !== "Mystery" ? `<span class="tag">${p.badge === "1/1" ? "One of One" : p.badge}</span>` : ""}<span class="tag">Authenticated</span></div>
      <section style="--i:2"><h3>Description</h3><p class="detail__desc">${p.description}</p></section>
      <section style="--i:3"><h3>Terms</h3><ul class="detail__terms">${p.terms.map((t) => `<li>${t}</li>`).join("")}</ul></section>
      <section class="related" style="--i:4"><h3>You may also like</h3><div class="related__row">${related.map(cardHTML).join("")}</div></section>
    </div>
    <div class="buybar"><div class="buybar__inner">
      <div class="buybar__row"><span>Cost</span><span class="price">${icon("unity")}<span>${fmt(p.price)}</span></span></div>
      <button class="btn btn--block ${affordable ? "btn--primary" : "btn--disabled"}" data-redeem>${affordable ? `Redeem for ${fmt(p.price)} points` : "Not enough Online Unity Points"}</button>
    </div></div>`;
}

function morph(update) {
  if (!canMorph()) {
    update();
    return null;
  }
  return document.startViewTransition(update);
}

function showDetail(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) {
    location.replace("#/");
    return;
  }
  const fromImg = pendingMorphImg;
  pendingMorphImg = null;
  const wasOpen = !detail.hidden;
  const update = () => {
    if (fromImg) fromImg.style.viewTransitionName = "";
    detail.innerHTML = detailHTML(p);
    wireImages(detail);
    detail.hidden = false;
    detail.scrollTop = 0;
    currentId = id;
    tabbar.classList.add("is-hidden");
    document.body.classList.add("is-locked");
    if (fromImg) $(".detail__media img", detail).style.viewTransitionName = "product-hero";
  };
  if (fromImg && canMorph()) {
    fromImg.style.viewTransitionName = "product-hero";
    morph(update).finished.finally(() => {
      const hero = $(".detail__media img", detail);
      if (hero) hero.style.viewTransitionName = "";
    });
  } else {
    update();
    if (!wasOpen) {
      detail.classList.remove("is-entering");
      void detail.offsetWidth;
      detail.classList.add("is-entering");
    }
  }
}

let skipMorphOnce = false;
function hideDetail() {
  if (skipMorphOnce) {
    skipMorphOnce = false;
    detail.innerHTML = "";
    currentId = null;
    tabbar.classList.remove("is-hidden");
    document.body.classList.remove("is-locked");
    return;
  }
  if (detail.hidden) return;
  const heroImg = $(".detail__media img", detail);
  const cardImg = $(`.card[data-id="${currentId}"] img`, grid);
  const visible = cardImg && (() => {
    const r = cardImg.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight;
  })();
  const update = () => {
    if (heroImg) heroImg.style.viewTransitionName = "";
    if (visible) cardImg.style.viewTransitionName = "product-hero";
    detail.hidden = true;
    detail.innerHTML = "";
    currentId = null;
    tabbar.classList.remove("is-hidden");
    document.body.classList.remove("is-locked");
  };
  if (canMorph()) {
    if (visible && heroImg) heroImg.style.viewTransitionName = "product-hero";
    morph(update).finished.finally(() => cardImg && (cardImg.style.viewTransitionName = ""));
  } else {
    detail.classList.add("is-leaving");
    setTimeout(() => {
      detail.classList.remove("is-leaving", "is-entering");
      update();
    }, 280);
  }
}

detail.addEventListener("click", async (e) => {
  if (e.target.closest("[data-back]")) {
    buzz();
    goBack();
    return;
  }
  const rel = e.target.closest(".card");
  if (rel) {
    buzz();
    pendingMorphImg = $("img", rel);
    location.hash = `#/p/${rel.dataset.id}`;
    return;
  }
  if (e.target.closest("[data-share]")) {
    buzz();
    const p = PRODUCTS.find((x) => x.id === currentId);
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.name, text: `${p.name} on Hard Rock Bet Rewards`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Link copied", "check");
      }
    } catch {}
    return;
  }
  const redeem = e.target.closest("[data-redeem]");
  if (redeem) {
    const p = PRODUCTS.find((x) => x.id === currentId);
    if (state.points < p.price) {
      buzz([20, 40, 20]);
      redeem.classList.remove("shake");
      void redeem.offsetWidth;
      redeem.classList.add("shake");
      toast(`You need ${fmt(p.price - state.points)} more Unity Points`, "lock");
    } else {
      buzz(12);
      openSheet(`<h2>Redeem ${p.name}?</h2>
        <p class="lead">${fmt(p.price)} Online Unity Points will be deducted from your balance of ${fmt(state.points)}.</p>
        <button class="btn btn--primary btn--block" id="confirm-redeem">Confirm redemption</button>
        <button class="btn btn--ghost btn--block" data-close>Cancel</button>`);
      $("#confirm-redeem").addEventListener("click", () => {
        const before = state.points;
        state.points -= p.price;
        save();
        closeSheet();
        renderPoints(before);
        confetti();
        toast("Redeemed! We'll email your shipping details.", "check", 3200);
        $("[data-redeem]", detail)?.replaceWith(Object.assign(document.createElement("button"), { className: "btn btn--block btn--disabled", textContent: "Redeemed" }));
      });
    }
  }
});

function goBack() {
  if (enteredFromStore && history.length > 1) history.back();
  else location.hash = "#/";
}

/* Edge swipe to go back */
(() => {
  let sx = null;
  let dx = 0;
  detail.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    if (t.clientX > 28) return;
    sx = t.clientX;
    dx = 0;
    detail.style.transition = "none";
  }, { passive: true });
  detail.addEventListener("touchmove", (e) => {
    if (sx == null) return;
    dx = Math.max(0, e.touches[0].clientX - sx);
    detail.style.transform = `translateX(${dx}px)`;
    detail.style.boxShadow = "-20px 0 40px rgba(0,0,0,.15)";
  }, { passive: true });
  detail.addEventListener("touchend", () => {
    if (sx == null) return;
    sx = null;
    detail.style.transition = "transform .3s cubic-bezier(.22,1,.36,1)";
    if (dx > 90) {
      detail.style.transform = "translateX(100%)";
      setTimeout(() => {
        skipMorphOnce = true;
        detail.hidden = true;
        detail.style.cssText = "";
        goBack();
      }, 260);
    } else {
      detail.style.transform = "";
      setTimeout(() => (detail.style.cssText = ""), 300);
    }
  });
})();

/* ---------- Router ---------- */
function route() {
  const m = location.hash.match(/^#\/p\/([\w-]+)/);
  if (m) showDetail(m[1]);
  else hideDetail();
}
addEventListener("hashchange", route);

addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!sheet.hidden) closeSheet();
  else if (!drop.hidden) closeDrop();
  else if (!detail.hidden) goBack();
});

/* ---------- Boot ---------- */
renderChips();
renderGrid();
setPane("store", { instant: true });
renderPoints(0);
syncDropCta();
animateProgress();
route();
