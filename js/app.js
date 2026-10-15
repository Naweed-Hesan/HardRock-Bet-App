import { PRODUCTS, CATEGORIES, RARITY, BOXES, BONUS_POINTS, rarityOdds, SCRATCH_PRIZES, LEVEL_NAMES, MAX_LEVEL } from "./data.js";
import { ICONS, icon } from "./icons.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmt = (n) => n.toLocaleString("en-US");
const buzz = (pattern = 8) => navigator.vibrate?.(pattern);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const canMorph = () => "startViewTransition" in document && !reducedMotion.matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reducedMotion.matches ? 0 : ms));
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const productById = (id) => PRODUCTS.find((p) => p.id === id);
const TYPE_LABEL = { box: "Mystery Box", guitar: "Signed Guitar", jersey: "Signed Jersey", belt: "Championship Belt", helmet: "Speedflex Helmet" };
const CREDITS_PER_DROP = 2;

/* ---------- State ---------- */
const STORE_KEY = "hrb-rewards-demo-v2";
const DEFAULT_STATE = { points: 0, level: 1, progress: 5, drops: 0, rewards: [], redeemed: [], active: {} };
let state = load();

function load() {
  try {
    return { ...structuredClone(DEFAULT_STATE), ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
  } catch {
    return structuredClone(DEFAULT_STATE);
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

/* ---------- Numbers & points ---------- */
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
let shownPoints = 0;
function renderPoints(duration = 900) {
  const from = shownPoints;
  shownPoints = state.points;
  $$("[data-points]").forEach((el) => animateNumber(el, from, state.points, duration));
  const pill = $("[data-points-pill]");
  if (!pill.firstChild) pill.innerHTML = `${icon("unity")}<span></span>`;
  animateNumber($("span", pill), from, state.points, duration);
  const head = $("#view-detail h2");
  if (head) head.textContent = `Unity Points: ${fmt(state.points)}`;
}
function bump(el) {
  if (!el) return;
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
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

/* ---------- Flying particles ---------- */
function inView(el) {
  if (!el || !el.offsetParent) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 60 && r.top < innerHeight - 90 && r.width > 0;
}
function pointsTarget() {
  const card = $("#points-card");
  if (inView(card)) return $(".points-card__value", card);
  return $("[data-points-pill]");
}
function fly(fromRect, targetEl, { count = 10, html, size = 26, spread = 70, onLand } = {}) {
  const to = targetEl.getBoundingClientRect();
  const tx = to.left + to.width / 2;
  const ty = to.top + to.height / 2;
  const fx = fromRect.left + fromRect.width / 2;
  const fy = fromRect.top + fromRect.height / 2;
  if (reducedMotion.matches) {
    onLand?.(count - 1, true);
    return Promise.resolve();
  }
  const jobs = Array.from({ length: count }, (_, i) => {
    const el = document.createElement("div");
    el.className = "flyer";
    el.style.width = el.style.height = `${size}px`;
    el.innerHTML = html;
    document.body.append(el);
    const sx = fx + (Math.random() - 0.5) * spread;
    const sy = fy + (Math.random() - 0.5) * spread;
    const cx = (sx + tx) / 2 + (Math.random() - 0.5) * 160;
    const cy = Math.min(sy, ty) - 80 - Math.random() * 120;
    const anim = el.animate(
      [
        { transform: `translate(${fx - size / 2}px, ${fy - size / 2}px) scale(0.2)`, opacity: 0 },
        { transform: `translate(${sx - size / 2}px, ${sy - size / 2}px) scale(1.1)`, opacity: 1, offset: 0.22 },
        { transform: `translate(${cx - size / 2}px, ${cy - size / 2}px) scale(1)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${tx - size / 2}px, ${ty - size / 2}px) scale(0.45)`, opacity: 0.9 },
      ],
      { duration: 900 + Math.random() * 250, delay: i * 55, easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" }
    );
    return anim.finished.then(() => {
      el.remove();
      onLand?.(i, i === count - 1);
    });
  });
  return Promise.all(jobs);
}
function flyPoints(fromRect, amount) {
  const target = pointsTarget();
  const count = Math.min(14, 5 + Math.round(Math.log10(amount + 1) * 2.5));
  const start = state.points;
  state.points += amount;
  save();
  return fly(fromRect, target, {
    count,
    html: `<span class="coin">${icon("unity")}</span>`,
    onLand: (i, last) => {
      buzz(4);
      bump(target.closest(".points-card") || target);
      const shown = last ? state.points : Math.round(start + (amount * (i + 1)) / count);
      $$("[data-points]").forEach((el) => (el.textContent = fmt(shown)));
      const pill = $("[data-points-pill] span");
      if (pill) pill.textContent = fmt(shown);
      if (last) shownPoints = state.points;
    },
  });
}

/* ---------- Hero ---------- */
const hero = $("#hero");
const banner = $("#hero-banner");
const bannerImg = $("img", banner);
const topbar = $("#topbar");
const cta = $("#hero-cta");

function layoutHero() {
  const split = (banner.offsetHeight / hero.offsetHeight) * 100;
  hero.style.setProperty("--hero-split", `${split.toFixed(1)}%`);
}
new ResizeObserver(layoutHero).observe(hero);

let ticking = false;
addEventListener(
  "scroll",
  () => {
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
  },
  { passive: true }
);
new IntersectionObserver(([e]) => topbar.classList.toggle("is-condensed", !e.isIntersecting), {
  rootMargin: "-60px 0px 0px 0px",
}).observe(banner);

const hexLabel = (lvl) => (lvl >= MAX_LEVEL ? "S" : String(lvl));
function renderProgress({ animate = true } = {}) {
  const fill = $("#track-fill");
  const now = $("[data-progress-now]");
  $("[data-hex-now]").textContent = hexLabel(state.level);
  $("[data-hex-next]").textContent = hexLabel(Math.min(state.level + 1, MAX_LEVEL));
  if (!animate) fill.style.transition = "none";
  fill.style.width = `${(state.progress / 10) * 100}%`;
  if (!animate) {
    void fill.offsetWidth;
    fill.style.transition = "";
  }
  animateNumber(now, Number(now.textContent.replace(/\D/g, "")) || 0, state.progress, animate ? 900 : 0);
}
let charging = false;
function syncCta() {
  cta.innerHTML = charging
    ? `<span class="hero__cta-ring"></span>Recharging your next drop…`
    : `<span class="hero__cta-dot"></span>${LEVEL_NAMES[state.level]} Drop ready · Tap to open`;
  cta.classList.toggle("is-charging", charging);
  $("[data-level-name]").textContent = `${LEVEL_NAMES[state.level]} Drop`;
  const sideBtn = $("#side-open");
  sideBtn.disabled = charging;
  sideBtn.textContent = charging ? "Recharging…" : "Open drop";
}
$("#side-open").addEventListener("click", () => {
  if (charging) return;
  buzz();
  openDrop();
});
async function recharge() {
  charging = true;
  cta.classList.add("is-gone");
  await wait(500);
  syncCta();
  cta.classList.remove("is-gone");
  await wait(1800);
  charging = false;
  cta.classList.add("is-gone");
  await wait(250);
  syncCta();
  cta.classList.remove("is-gone");
  cta.classList.add("is-ready-pop");
  setTimeout(() => cta.classList.remove("is-ready-pop"), 700);
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
  if (name === "rewards") {
    $('[data-tab="rewards"]', segmented).classList.remove("has-new");
    renderRewards();
  } else stopPromoAutoplay();
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
    <div class="price">${p.usd ? `<b class="price__usd">$${p.usd}</b><span class="price__or">or</span>` : ""}${icon("unity")}<span>${fmt(p.price)}</span></div>
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
  await wait(140);
  renderGrid();
  grid.getAnimations().forEach((a) => a.cancel());
  requestAnimationFrame(() => (grid.style.minHeight = ""));
}

/* ---------- My Rewards pane ---------- */
const rewardsPane = $('[data-pane="rewards"]');
const BASE_READY = [
  { id: "base-boost", title: "10% Profit Boost", sub: "Profit Boost to be used on a 3+ leg parlay.", exp: "Exp: 10/16/26 @ 12:49 PM", icon: "zap", tile: "linear-gradient(180deg,#ffb020,#f27d0c)", detail: "Boosts your winnings by 10% on any parlay with three or more legs. Max bet $50." },
];

function rewardTile(r) {
  if (r.card) return `<span class="reward__tile reward__tile--img reward__tile--slab">${slabHTML(r.card, r.rarity, "slab--mini")}</span>`;
  if (r.img) return `<span class="reward__tile reward__tile--img"><img src="${r.img}" alt="" /></span>`;
  return `<span class="reward__tile" style="--tile:${r.tile}">${icon(r.icon)}</span>`;
}
function readyHTML(r, i) {
  const active = state.active[r.id];
  const isItem = r.kind === "item";
  const done = isItem ? "Claimed" : "Active";
  return `<article class="reward reward--ready ${r.fresh ? "is-new" : ""} ${active ? "is-active" : ""}" data-reward="${r.id}" data-done="${done}" style="--i:${i}">
    <button class="reward__main" aria-expanded="false">
      ${rewardTile(r)}
      <div class="reward__body"><h5>${r.title}</h5><p>${r.sub}</p>${r.exp ? `<small>${r.exp}</small>` : ""}</div>
      <span class="reward__side">${r.rarity ? `<span class="rarity-dot" style="--rc:${RARITY[r.rarity].color}" title="${RARITY[r.rarity].label}"></span>` : ""}<span class="reward__chev">${icon("chevron-right")}</span></span>
    </button>
    <div class="reward__more"><div>
      <p>${r.detail || "Tap Use now to apply this reward to your account."}</p>
      <button class="btn btn--primary btn--small" data-activate>${active ? done : isItem ? "Claim" : "Use now"}</button>
    </div></div>
    <span class="stamp">${done}</span>
  </article>`;
}
function progressHTML(r, i, extra = "") {
  return `<article class="reward" style="--i:${i}">
    ${rewardTile(r)}
    <div class="reward__body"><h5>${r.title}</h5><p>${r.sub}</p>${r.exp ? `<small>${r.exp}</small>` : ""}${extra}</div>
    <div class="reward__side reward__side--col">${icon("info")}${r.action ? `<button class="btn btn--primary btn--small" data-action="${r.action}">${r.action}</button>` : ""}</div>
  </article>`;
}

function renderRewards() {
  const ready = [...state.rewards, ...BASE_READY];
  rewardsPane.innerHTML = `<div class="rewards">
    <div>
      <div class="promos" id="promos">
        <button class="promo promo--bonus" data-promo="bonus">
          <div class="promo__art"><h4>Claim your<br/>$10 bonus</h4><small>Powered by Post Motor Racing</small><span class="promo__big">$10</span></div>
          <div class="promo__foot"><b>Opt in &amp; get a $10 Games Bonus</b><span>Play any featured Post Motor Racing game this week to unlock your bonus.</span><span class="promo__optin">OPT IN ${icon("chevron-right")}</span></div>
        </button>
        <button class="promo promo--sweats" data-promo="sweats">
          <div class="promo__art"><h4>Get up to<br/>$500</h4><small>New customer offer</small><span class="promo__big">$500</span></div>
          <div class="promo__foot"><b>Bet $5 &amp; get up to $500 in No Sweats</b><span>Get $50 in No Sweat Bet tokens each day for 10 days</span><span class="btn btn--primary btn--block">Bet now</span></div>
        </button>
        <button class="promo promo--drops" data-promo="drops">
          <div class="promo__art"><h4>Legendary<br/>Reward Drops</h4><small>Level ${state.level === MAX_LEVEL ? "Signature" : state.level} · ${state.drops} opened</small><span class="promo__big">${icon("gift")}</span></div>
          <div class="promo__foot"><b>Open a Lucky You box</b><span>Every drop reveals a signed helmet or jersey, from Common to Legendary.</span><span class="promo__optin">OPEN A DROP ${icon("chevron-right")}</span></div>
        </button>
      </div>
      <div class="dots" id="promo-dots">${[0, 1, 2].map((i) => `<span class="${i === 0 ? "on" : ""}"></span>`).join("")}</div>
    </div>

    <section class="wrap">
      <h2 class="section-title">Daily Scratch</h2>
      <div class="scratch" id="scratch"></div>
    </section>

    <section class="wrap">
      <h2 class="section-title">Ready to Use Rewards <span class="count">${ready.length}</span></h2>
      <div class="reward-list" id="ready-list">${ready.map(readyHTML).join("")}</div>
    </section>

    ${
      state.redeemed.length
        ? `<section class="wrap" id="redeemed">
      <h2 class="section-title">Redeemed <span class="count">${state.redeemed.length}</span></h2>
      <div class="redeemed">${state.redeemed
        .map((o, i) => {
          const p = productById(o.productId);
          if (!p) return "";
          const it = o.item;
          const rc = it ? `style="--i:${i};--rc:${RARITY[it.rarity].color}"` : `style="--i:${i}"`;
          return `<button class="redeemed__item ${it ? "has-item" : ""}" data-open="${it?.productId || p.id}" ${rc}>
            <span class="redeemed__img ${it?.card ? "is-card" : ""}">${it ? itemVisual(it, "slab--mini") : `<img src="${p.img}" alt="" />`}${it ? `<span class="redeemed__box"><img src="${p.img}" alt="" /></span>` : ""}</span>
            <b>${it ? it.name : p.name}</b><small>${it ? `${RARITY[it.rarity].label} · ` : ""}${o.paid ? `$${o.paid} · ` : ""}${o.order} · Processing</small></button>`;
        })
        .join("")}</div>
    </section>`
        : ""
    }

    <section class="wrap">
      <h2 class="section-title">In-Progress Rewards</h2>
      <div class="reward-list">
        ${progressHTML({ title: "100% Deposit Match up to $25", sub: "Deposit to unlock your match.", exp: "Exp: 10/31/26 @ 11:59 PM", icon: "gift", tile: "linear-gradient(180deg,#1cc9a0,#0a9c8e)", action: "Deposit" }, 0, `<div class="mini-track"><span style="--p:35%"></span></div>`)}
        ${progressHTML({ title: "Online Unity Points", sub: "Start racking up points this month with every cash wager you make.", icon: "unity", tile: "linear-gradient(180deg,#2b2840,#141221)" }, 1)}
      </div>
    </section>
  </div>`;
  state.rewards.forEach((r) => (r.fresh = false));
  save();
  setupScratch();
  setupPromos();
}

rewardsPane.addEventListener("click", (e) => {
  const promo = e.target.closest("[data-promo]");
  const action = e.target.closest("[data-action]");
  const activate = e.target.closest("[data-activate]");
  const main = e.target.closest(".reward__main");
  const open = e.target.closest("[data-open]");
  if (activate) {
    const card = activate.closest(".reward");
    const id = card.dataset.reward;
    if (state.active[id]) return;
    buzz([10, 30, 15]);
    state.active[id] = true;
    save();
    card.classList.add("is-active", "is-stamping");
    activate.textContent = card.dataset.done;
    toast(card.dataset.done === "Claimed" ? "Claimed! We'll email your shipping details." : "Reward activated", "check");
  } else if (main) {
    buzz();
    const card = main.closest(".reward");
    const isOpen = card.classList.toggle("is-open");
    main.setAttribute("aria-expanded", String(isOpen));
  } else if (open) {
    buzz();
    pendingMorphImg = $("img", open);
    enteredFromStore = true;
    location.hash = `#/p/${open.dataset.open}`;
  } else if (action) {
    buzz();
    toast("Deposits aren't live in this prototype", "lock");
  } else if (promo) {
    buzz();
    if (promo.dataset.promo === "drops") {
      scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
      setTimeout(openDrop, reducedMotion.matches ? 0 : 450);
    } else toast(promo.dataset.promo === "bonus" ? "You're opted in to the $10 bonus" : "Offer saved to your bet slip", "check");
  }
});

/* Promo carousel */
let promoTimer = null;
function stopPromoAutoplay() {
  clearInterval(promoTimer);
  promoTimer = null;
}
function setupPromos() {
  const row = $("#promos");
  const dots = $$("#promo-dots span");
  const cards = $$(".promo", row);
  let current = 0;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.intersectionRatio > 0.6) {
          current = cards.indexOf(en.target);
          dots.forEach((d, i) => d.classList.toggle("on", i === current));
        }
      });
    },
    { root: row, threshold: [0.6] }
  );
  cards.forEach((c) => io.observe(c));
  stopPromoAutoplay();
  if (reducedMotion.matches) return;
  promoTimer = setInterval(() => {
    if (activePane !== "rewards" || !document.contains(row)) return stopPromoAutoplay();
    const next = cards[(current + 1) % cards.length];
    row.scrollTo({ left: next.offsetLeft - row.offsetLeft - parseFloat(getComputedStyle(row).paddingLeft), behavior: "smooth" });
  }, 5000);
  ["pointerdown", "touchstart", "wheel"].forEach((ev) => row.addEventListener(ev, stopPromoAutoplay, { passive: true, once: true }));
}

/* Scratch card */
function prizeTitle(p) {
  return p.kind === "points" ? `+${fmt(p.amount)} Unity Points` : p.title;
}
function setupScratch() {
  const host = $("#scratch");
  if (!host) return;
  const prize = pick(SCRATCH_PRIZES);
  host.innerHTML = `
    <div class="scratch__prize">
      <span class="scratch__tile">${icon(prize.kind === "points" ? "unity" : "zap")}</span>
      <div><small>You won</small><b>${prizeTitle(prize)}</b></div>
    </div>
    <canvas class="scratch__foil" aria-label="Scratch to reveal your prize"></canvas>
    <button class="btn btn--primary scratch__collect" hidden>Collect</button>`;
  const canvas = $("canvas", host);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const dpr = Math.min(2, devicePixelRatio || 1);
  const w = host.clientWidth;
  const h = host.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#d9d4f2");
  g.addColorStop(0.45, "#a99fe0");
  g.addColorStop(0.55, "#c7bff0");
  g.addColorStop(1, "#7f72cf");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#fff";
  for (let i = 0; i < 70; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(40,20,110,.75)";
  ctx.font = "800 15px 'Hanken Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "2px";
  ctx.fillText("SCRATCH TO REVEAL", w / 2, h / 2 + 5);

  let last = null;
  let moves = 0;
  let revealed = false;
  const scratchAt = (x, y) => {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 38;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(last ? last.x : x, last ? last.y : y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last = { x, y };
    if (++moves % 8 === 0) check();
  };
  const check = () => {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 24) {
      total++;
      if (data[i] < 40) clear++;
    }
    if (!revealed && clear / total > 0.45) reveal();
  };
  const reveal = () => {
    revealed = true;
    canvas.classList.add("is-cleared");
    host.classList.add("is-revealed");
    buzz([15, 30, 25]);
    const r = host.getBoundingClientRect();
    confetti({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 70, power: 0.6 });
    $(".scratch__collect", host).hidden = false;
  };
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  let down = false;
  canvas.addEventListener("pointerdown", (e) => {
    down = true;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    last = null;
    const p = pos(e);
    scratchAt(p.x, p.y);
    buzz(3);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!down) return;
    const p = pos(e);
    scratchAt(p.x, p.y);
  });
  const lift = () => {
    if (!down) return;
    down = false;
    last = null;
    check();
  };
  canvas.addEventListener("pointerup", lift);
  canvas.addEventListener("pointercancel", lift);

  $(".scratch__collect", host).addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    buzz(10);
    const from = $(".scratch__tile", host).getBoundingClientRect();
    if (prize.kind === "points") await flyPoints(from, prize.amount);
    else {
      state.rewards.unshift({ id: `scratch-${Date.now()}`, title: prize.title, sub: prize.sub, exp: "From your Daily Scratch", icon: "zap", tile: "linear-gradient(180deg,#ffb020,#f27d0c)", fresh: true });
      save();
      toast("Added to Ready to Use Rewards", "gift");
    }
    host.classList.add("is-resetting");
    await wait(350);
    if (prize.kind !== "points") renderRewards();
    else {
      host.classList.remove("is-revealed", "is-resetting");
      setupScratch();
      host.classList.add("is-new");
      setTimeout(() => host.classList.remove("is-new"), 600);
    }
  });
}

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
function onNav(id) {
  buzz();
  if (id === "rewards") {
    if (!detail.hidden) goBack();
    scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
    return;
  }
  const i = TABS.findIndex((t) => t.id === id);
  tabbar.style.setProperty("--tab-i", i);
  setTimeout(() => tabbar.style.setProperty("--tab-i", 2), 650);
  toast(`${id === "account" ? "Account" : TABS[i].label} isn't part of this prototype`, "lock");
}
tabbar.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b) onNav(b.dataset.tab);
});
const topnav = $("#topnav");
topnav.innerHTML = TABS.filter((t) => t.id !== "account")
  .map((t) => `<button data-tab="${t.id}" ${t.id === "rewards" ? 'aria-current="page"' : ""}>${icon(t.icon)}<span>${t.label}</span></button>`)
  .join("");
topnav.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b) onNav(b.dataset.tab);
});
$("[data-balance-icon]").innerHTML = icon("circle-user-round");
$("#balance-btn").addEventListener("click", () => onNav("account"));

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
    if ($("#view-detail").hidden && drop.hidden) document.body.classList.remove("is-locked");
    const cb = sheetOnClose;
    sheetOnClose = null;
    cb?.();
  }, 380);
}
sheet.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) closeSheet();
});
(() => {
  let startY = null;
  sheetPanel.addEventListener(
    "touchstart",
    (e) => {
      if (sheetPanel.scrollTop > 0) return;
      startY = e.touches[0].clientY;
      sheet.classList.add("is-dragging");
    },
    { passive: true }
  );
  sheetPanel.addEventListener(
    "touchmove",
    (e) => {
      if (startY == null) return;
      const dy = Math.max(0, e.touches[0].clientY - startY);
      sheet.style.setProperty("--drag", `${dy}px`);
    },
    { passive: true }
  );
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
  const odds = rarityOdds(state.level)
    .map(([r, w]) => `<span class="odds__row"><i style="--rc:${RARITY[r].color}"></i>${RARITY[r].label}<b>${Math.round(w)}%</b></span>`)
    .join("");
  openSheet(`<h2>How Reward Drops work</h2>
    <p class="lead">Every drop is a Lucky You box with a signed helmet or jersey inside. Opening drops earns credits toward your next level.</p>
    ${steps([
      ["gift", "Open a box", "Tap the banner, then tap the box three times to break it open."],
      ["sparkles", "Reveal the pull", "Each helmet and jersey has a rarity, from Common to Legendary."],
      ["unity", "Earn bonus points", `Rarer pulls pay more: up to ${fmt(BONUS_POINTS.legendary)} bonus Unity Points.`],
      ["trophy", "Level up", `Each drop adds ${CREDITS_PER_DROP} credits. Reach 10 to level up, all the way to Signature.`],
    ])}
    <div class="odds"><h3>Your odds at ${LEVEL_NAMES[state.level]}</h3>${odds}</div>
    <button class="btn btn--primary btn--block" data-close>Got it</button>
    <button class="btn btn--ghost btn--block" id="reset-demo">Reset demo</button>`);
  $("#reset-demo").addEventListener("click", () => {
    state = structuredClone(DEFAULT_STATE);
    save();
    closeSheet();
    renderPoints();
    renderProgress();
    syncCta();
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
      ["gift", "Open Reward Drops", "Every pull from a drop pays bonus points."],
      ["unity", "Redeem in the Store", "Spend points on anything in the Rewards Store."],
    ])}
    <button class="btn btn--primary btn--block" data-close>Start earning</button>`);
});

/* ---------- Item visuals ---------- */
function slabHTML(card, rarity, cls = "") {
  const [c1, c2] = card.colors;
  const last = card.player.split(" ").slice(-1)[0];
  return `<div class="slab ${cls}" style="--c1:${c1};--c2:${c2};--rc:${RARITY[rarity].color}">
    <div class="slab__label"><b>HOT HANDS</b><span>${card.year} · ${card.player.toUpperCase()}</span><em>GEM MT<strong>10</strong></em></div>
    <div class="slab__card">
      <span class="slab__num">${card.number}</span>
      <span class="slab__team">${card.team}</span>
      <span class="slab__name">${last}</span>
      <svg class="slab__sig" viewBox="0 0 120 40" aria-hidden="true"><path d="M5 30 C 20 5, 30 35, 42 18 S 60 8, 66 24 S 84 34, 92 14 L 116 10" /></svg>
      <span class="slab__auto">AUTO</span>
    </div>
  </div>`;
}
function itemVisual(item, cls = "") {
  if (item.card) return slabHTML(item.card, item.rarity, cls);
  return `<img class="${cls}" src="${item.img}" alt="" />`;
}

/* ---------- Reward Drop ---------- */
const drop = $("#drop");
banner.addEventListener("click", () => {
  buzz();
  if (charging) {
    toast("Your next drop is recharging…", "clock");
    return;
  }
  openDrop();
});

function weighted(entries) {
  const live = entries.filter(([, w]) => w > 0);
  const total = live.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [key, w] of live) if ((roll -= w) <= 0) return key;
  return live[live.length - 1][0];
}
const pickBox = () => weighted(Object.entries(BOXES).map(([id, b]) => [id, b.weight]));

function boxOdds(boxId, level) {
  const present = new Set(BOXES[boxId].pool.map((i) => i.rarity));
  return rarityOdds(level).filter(([r]) => present.has(r));
}
function rollItem(boxId, level) {
  const rarity = weighted(boxOdds(boxId, level));
  const entry = pick(BOXES[boxId].pool.filter((i) => i.rarity === rarity));
  if (entry.card) return { card: entry.card, name: entry.name, rarity, boxId, productId: null, img: null };
  if (!entry.productId) return { name: entry.name, img: entry.img, rarity, boxId, productId: null, kind: entry.kind, tags: entry.tags };
  const p = productById(entry.productId);
  return { productId: p.id, name: entry.name || p.name, img: p.img, rarity, boxId };
}

let dropCtx = null;
function openDrop({ boxId = pickBox(), source = "drop", order = null } = {}) {
  if (!drop.hidden) return;
  const oneTap = source === "buy";
  dropCtx = { boxId, source, order };
  const boxProduct = productById(boxId);
  let hits = 0;
  drop.hidden = false;
  drop.className = `drop${oneTap ? " is-arriving" : ""}`;
  drop.style.removeProperty("--rc");
  document.body.classList.add("is-locked");
  const eyebrow = source === "drop" ? `${LEVEL_NAMES[state.level]} Drop` : `Order ${order}`;
  const title = source === "drop" ? "Legendary<br/>Reward Drop" : source === "buy" ? "Your box<br/>is here" : "Open your<br/>Lucky You box";
  drop.innerHTML = `
    <div class="drop__rays"></div>
    ${source === "drop" ? `<button class="icon-btn icon-btn--light drop__close" aria-label="Close">${icon("x")}</button>` : ""}
    <div class="drop__eyebrow">${eyebrow}</div>
    <h2 class="drop__title">${title}</h2>
    <div class="drop__stage"><img class="drop__box" src="${boxProduct.img}" alt="${boxProduct.name}" /></div>
    <p class="drop__boxname">${boxProduct.name}</p>
    <p class="drop__hint">${oneTap ? "Tap the box to open it" : "Tap the box to open it"}</p>
    ${oneTap ? `<div class="drop__taps drop__taps--one"><span></span></div>` : `<div class="drop__taps"><span></span><span></span><span></span></div>`}
    <div class="drop__flash"></div>`;
  const box = $(".drop__box", drop);
  const dots = $$(".drop__taps span", drop);
  $(".drop__close", drop)?.addEventListener("click", () => closeDrop());
  box.addEventListener("click", () => {
    const needed = oneTap ? 1 : 3;
    if (hits >= needed) return;
    hits++;
    dots[hits - 1].classList.add("on");
    box.classList.remove("hit-1", "hit-2");
    void box.offsetWidth;
    if (hits < needed) {
      buzz(hits === 1 ? 15 : [20, 30, 20]);
      box.classList.add(hits === 1 ? "hit-1" : "hit-2");
      $(".drop__hint", drop).textContent = hits === 1 ? "Keep going…" : "One more!";
    } else {
      revealPrize(box);
    }
  });
}

async function revealPrize(box) {
  const { boxId, source } = dropCtx;
  const item = rollItem(boxId, state.level);
  const bonus = source === "drop" ? BONUS_POINTS[item.rarity] : 0;
  const R = RARITY[item.rarity];
  const big = item.rarity === "legendary" || item.rarity === "epic";
  drop.style.setProperty("--rc", R.color);
  drop.style.setProperty("--rd", R.deep);
  ["hint", "taps", "boxname"].forEach((k) => ($(`.drop__${k}`, drop).style.opacity = 0));

  const stage = $(".drop__stage", drop);
  const tall = item.kind === "card";
  stage.innerHTML = `<div class="rig${tall ? " is-tall" : ""}">
      <div class="rig__glow"></div>
      <div class="rig__beam"></div>
      <div class="rig__item">${itemVisual(item)}</div>
      <img class="rig__base" src="${box.src}" alt="" />
      <img class="rig__lid" src="${box.src}" alt="" />
      <div class="rig__sparks">${Array.from({ length: 14 }, (_, i) => `<i style="--a:${(i * 360) / 14}deg;--d:${(i % 5) * 40}ms"></i>`).join("")}</div>
    </div>`;
  const rig = $(".rig", stage);

  // 1. Charge: the box rumbles harder and light leaks out
  rig.classList.add("is-charging");
  drop.classList.add("is-rumble");
  buzz([20, 60, 25, 50, 30, 40, 40, 30, 60]);
  await wait(1150);

  // 2. Burst: lid blows off, beam shoots up, flash and confetti
  drop.classList.remove("is-rumble");
  rig.classList.remove("is-charging");
  rig.classList.add("is-open");
  $(".drop__flash", drop).classList.add("go");
  drop.classList.add("is-revealing", `is-${item.rarity}`);
  buzz(big ? [60, 40, 120] : [50, 30, 60]);
  confetti({ colors: R.confetti, count: big ? 260 : 150, power: big ? 1.3 : 1.05 });
  stage.insertAdjacentHTML("beforeend", `<div class="drop__rarity">${R.label}</div>`);

  // 3. The item rises out of the box and the box falls away
  await wait(item.rarity === "legendary" ? 2000 : 1700);
  rig.classList.add("is-presented");
  await wait(450);

  if (source === "buy") {
    showcase(item);
    return;
  }
  stage.innerHTML = `<div class="drop__reveal"><div class="prize">
      <span class="prize__rarity">${R.label}</span>
      <div class="prize__tile prize__tile--img prize__tile--hero${tall ? " is-tall" : ""}">${itemVisual(item)}</div>
      <small>You pulled a ${BOXES[boxId].noun}</small>
      <h3>${item.name}</h3>
      <p>${bonus ? `${icon("unity")} +${fmt(bonus)} bonus Unity Points` : "It ships to the address on your account."}</p>
      <button class="btn btn--primary btn--block" id="collect">${source === "redeem" ? "Add to my collection" : "Collect"}</button>
    </div></div>`;
  $(".drop__title", drop).innerHTML = item.rarity === "legendary" ? "Legendary!" : item.rarity === "epic" ? "Epic pull!" : "Nice pull!";
  $("#collect").addEventListener("click", (e) => collect(item, bonus, e.currentTarget), { once: true });
}

async function collect(item, bonus, btn) {
  const { source, order, boxId } = dropCtx;
  const R = RARITY[item.rarity];
  buzz(12);
  btn.disabled = true;
  const tileRect = $(".prize__tile", drop).getBoundingClientRect();

  if (source === "redeem") {
    const entry = state.redeemed.find((o) => o.order === order);
    if (entry) entry.item = { productId: item.productId, name: item.name, img: item.img, card: item.card, rarity: item.rarity };
    save();
    closeDrop({ keepLock: true });
    await wait(300);
    successSheet(productById(boxId), order, item);
    return;
  }

  state.drops++;
  const leveledUp = state.progress + CREDITS_PER_DROP >= 10 && state.level < MAX_LEVEL;
  state.progress = leveledUp ? 10 : Math.min(10, state.progress + CREDITS_PER_DROP);
  state.rewards.unshift({
    id: `drop-${Date.now()}`,
    kind: "item",
    productId: item.productId,
    title: item.name,
    sub: `Pulled from a Lucky You ${BOXES[boxId].short}`,
    exp: `${R.label} · ${LEVEL_NAMES[state.level]} Drop`,
    img: item.img,
    card: item.card,
    rarity: item.rarity,
    fresh: true,
    detail: "Claim it and we'll ship it to the address on your account, authenticated and ready to display.",
  });
  save();
  closeDrop({ keepLock: true });
  await wait(120);
  const tab = $('[data-tab="rewards"]', segmented);
  await Promise.all([
    fly(tileRect, tab, {
      count: 1,
      size: 72,
      spread: 0,
      html: item.card
        ? `<div class="flyer__img flyer__slab">${slabHTML(item.card, item.rarity)}</div>`
        : `<img class="flyer__img" src="${item.img}" alt="" style="box-shadow:0 0 0 3px ${R.color},0 10px 30px rgba(0,0,0,.35)" />`,
      onLand: () => {
        bump(tab);
        if (activePane !== "rewards") tab.classList.add("has-new");
      },
    }),
    wait(250).then(() => flyPoints(tileRect, bonus)),
  ]);
  toast(`${item.name} added to My Rewards`, "gift", 2800);
  if (activePane === "rewards" && !$(`[data-reward="${state.rewards[0].id}"]`)) renderRewards();
  renderProgress();
  if (leveledUp) {
    await wait(1000);
    levelUp();
  } else {
    document.body.classList.remove("is-locked");
    recharge();
  }
}

/* ---------- Showcase (after a purchase) ---------- */
const TAGS = { helmet: ["Signed", "Speedflex", "Authenticated"], jersey: ["Signed", "Match style", "Authenticated"], card: ["Signed", "Graded 10", "Slabbed"] };
function showcase(item) {
  const { boxId, order } = dropCtx;
  const box = productById(boxId);
  const R = RARITY[item.rarity];
  const kind = item.card ? "card" : BOXES[boxId].noun.includes("jersey") ? "jersey" : "helmet";
  const tags = item.tags || [...TAGS[kind], ...(item.name.includes("1/1") ? ["One of One"] : []), ...(item.name.includes("Crystal") ? ["Swarovski"] : [])];
  drop.classList.add("is-showcase");
  $(".drop__title", drop).innerHTML = item.rarity === "legendary" ? "Legendary!" : item.rarity === "epic" ? "Epic pull!" : "Nice pull!";
  $(".drop__eyebrow", drop).textContent = `Inside your ${box.name}`;
  $(".drop__stage", drop).outerHTML = `
    <div class="showcase">
      <div class="showcase__stage" id="sc-stage">
        <div class="showcase__glow"></div>
        <div class="showcase__item ${item.card ? "is-card" : ""}${item.kind === "card" ? " is-tall" : ""}" id="sc-item">${itemVisual(item)}<span class="showcase__shine"></span></div>
        <div class="showcase__floor"></div>
      </div>
      <span class="prize__rarity showcase__rarity">${R.label}</span>
      <h3 class="showcase__name">${item.name}</h3>
      <div class="showcase__tags">${tags.map((t, i) => `<span style="--i:${i}">${t}</span>`).join("")}</div>
      <p class="showcase__meta">Order ${order} · Ships in 2–3 weeks</p>
      <div class="showcase__actions">
        <button class="btn btn--primary btn--block" id="sc-keep">Add to my collection</button>
        <div class="showcase__row">
          <button class="btn showcase__ghost" id="sc-again">Buy another · $${box.usd}</button>
          ${item.productId ? `<button class="btn showcase__ghost" id="sc-view">View item</button>` : ""}
        </div>
      </div>
    </div>`;
  wireTilt($("#sc-stage"), $("#sc-item"));

  const keep = () => {
    if (!state.redeemed.some((o) => o.order === order)) {
      state.redeemed.unshift({ productId: boxId, order, at: Date.now(), paid: box.usd, item: { productId: item.productId, name: item.name, img: item.img, card: item.card, rarity: item.rarity } });
      save();
    }
  };
  $("#sc-keep").addEventListener("click", () => {
    buzz(12);
    keep();
    closeDrop({ keepLock: !detail.hidden });
    setTimeout(() => toast(`${item.name} added to your collection`, "check", 2800), 300);
  });
  $("#sc-again").addEventListener("click", () => {
    buzz();
    keep();
    closeDrop({ keepLock: !detail.hidden });
    setTimeout(() => openPurchase(box), 380);
  });
  $("#sc-view")?.addEventListener("click", () => {
    buzz();
    keep();
    closeDrop({ keepLock: true });
    setTimeout(() => {
      enteredFromStore = true;
      location.hash = `#/p/${item.productId}`;
    }, 300);
  });
}

function wireTilt(stage, el) {
  if (reducedMotion.matches) return;
  let raf = null;
  const set = (rx, ry) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      el.style.setProperty("--rx", `${rx}deg`);
      el.style.setProperty("--ry", `${ry}deg`);
      el.style.setProperty("--sx", `${50 + ry * 2.2}%`);
    });
  };
  stage.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.classList.add("is-tilting");
    set(-py * 22, px * 26);
  });
  const reset = () => {
    el.classList.remove("is-tilting");
    set(0, 0);
  };
  stage.addEventListener("pointerleave", reset);
  stage.addEventListener("pointerup", reset);
  stage.addEventListener("pointercancel", reset);
}

/* ---------- iPhone-style checkout ---------- */
const coarse = matchMedia("(pointer: coarse)");
function money(n) {
  return `$${Number(n).toFixed(2)}`;
}
function faceIdSVG() {
  return `<svg class="faceid" viewBox="0 0 64 64" aria-hidden="true">
    <path class="faceid__frame" d="M4 20V12a8 8 0 0 1 8-8h8M44 4h8a8 8 0 0 1 8 8v8M60 44v8a8 8 0 0 1-8 8h-8M20 60h-8a8 8 0 0 1-8-8v-8" />
    <path class="faceid__face" d="M22 24v4M42 24v4M32 24v12h-3M24 44c4 4 12 4 16 0" />
    <circle class="faceid__ok" cx="32" cy="32" r="26" />
    <path class="faceid__check" d="M21 33l7 7 15-16" />
  </svg>`;
}
function openPurchase(p) {
  if ($(".paysheet")) return;
  const order = `HRB-${Math.floor(100000 + Math.random() * 900000)}`;
  const el = document.createElement("div");
  el.className = "paysheet";
  el.innerHTML = `
    <div class="paysheet__scrim"></div>
    <div class="paysheet__panel" role="dialog" aria-modal="true" aria-label="Confirm purchase">
      <header class="paysheet__head">
        <span class="paysheet__brand">${icon("wallet")}<b>Pay</b></span>
        <button class="paysheet__x" aria-label="Cancel">${icon("x")}</button>
      </header>
      <div class="paysheet__group">
        <div class="paysheet__row"><span class="paysheet__card"><i>${icon("unity")}</i></span><div><b>Hard Rock Bet Card</b><small>•••• 4242</small></div>${icon("chevron-right")}</div>
        <div class="paysheet__row"><span class="paysheet__label">Ship to</span><div><b>Demo Customer</b><small>Home address on file</small></div>${icon("chevron-right")}</div>
        <div class="paysheet__row"><span class="paysheet__label">Contact</span><div><b>Demo account</b><small>Email on file</small></div>${icon("chevron-right")}</div>
      </div>
      <div class="paysheet__group">
        <div class="paysheet__row paysheet__item"><span class="paysheet__thumb"><img src="${p.img}" alt="" /></span><div><b>${p.name}</b><small>Hard Rock Bet Rewards</small></div><span>${money(p.usd)}</span></div>
        <div class="paysheet__row paysheet__line"><span>Shipping</span><span>Free</span></div>
        <div class="paysheet__row paysheet__total"><span>Pay Hard Rock Bet</span><span>${money(p.usd)}</span></div>
      </div>
      <div class="paysheet__confirm" id="pay-confirm">
        ${
          coarse.matches
            ? `<div class="paysheet__side">${faceIdSVG()}<span class="paysheet__status">Double-tap to Pay</span></div>`
            : `<div class="paysheet__side">${faceIdSVG()}<span class="paysheet__status">Confirm with Face ID</span></div><button class="paysheet__pay" id="pay-btn">Pay ${money(p.usd)}</button>`
        }
      </div>
      <p class="paysheet__demo">Demo checkout · you won't be charged</p>
    </div>
    ${coarse.matches ? `<span class="paysheet__sidebtn" aria-hidden="true"><span>Double-tap<br/>to Pay</span></span>` : ""}`;
  document.body.append(el);
  document.body.classList.add("is-locked");
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-open")));
  buzz(8);

  let busy = false;
  const close = (keepLock = false) => {
    el.classList.remove("is-open");
    setTimeout(() => {
      el.remove();
      if (!keepLock && detail.hidden && drop.hidden) document.body.classList.remove("is-locked");
    }, 380);
  };
  $(".paysheet__x", el).addEventListener("click", () => !busy && close());
  $(".paysheet__scrim", el).addEventListener("click", () => !busy && close());

  const status = $(".paysheet__status", el);
  const pay = async () => {
    if (busy) return;
    busy = true;
    el.classList.add("is-auth");
    status.textContent = "Face ID";
    buzz(10);
    await wait(1000);
    el.classList.add("is-processing");
    status.textContent = "Processing";
    await wait(700);
    el.classList.add("is-done");
    status.textContent = "Done";
    buzz([15, 40, 25]);
    await wait(900);
    close(true);
    await wait(420);
    openDrop({ boxId: p.id, source: "buy", order });
  };
  $("#pay-btn", el)?.addEventListener("click", pay);
  if (coarse.matches) {
    let last = 0;
    $("#pay-confirm", el).addEventListener("click", () => {
      const now = Date.now();
      if (now - last < 450) pay();
      else {
        last = now;
        el.classList.remove("is-nudge");
        void el.offsetWidth;
        el.classList.add("is-nudge");
        buzz(5);
      }
    });
    $(".paysheet__sidebtn", el)?.addEventListener("click", pay);
  }
}

function closeDrop({ keepLock = false } = {}) {
  drop.classList.add("is-leaving");
  setTimeout(() => {
    drop.hidden = true;
    drop.innerHTML = "";
    drop.className = "drop";
    if (!keepLock) document.body.classList.remove("is-locked");
  }, 340);
}

function levelUp() {
  state.level = Math.min(MAX_LEVEL, state.level + 1);
  state.progress = 0;
  save();
  const name = LEVEL_NAMES[state.level];
  buzz([30, 60, 30, 60, 160]);
  drop.hidden = false;
  drop.className = "drop is-levelup";
  drop.innerHTML = `
    <div class="drop__rays"></div>
    <div class="drop__eyebrow">Level up</div>
    <div class="levelup__hex"><span>${hexLabel(state.level)}</span></div>
    <h2 class="drop__title">${name}<br/>unlocked</h2>
    <p class="drop__hint">Your drops now have better odds of Epic and Legendary rewards.</p>
    <button class="btn btn--primary levelup__btn" id="levelup-done">Let's go</button>`;
  confetti({ colors: RARITY.legendary.confetti, count: 260, power: 1.3 });
  setTimeout(() => confetti({ colors: ["#ffffff", "#b9a8ff", "#5d3cf2", "#16bf86"], count: 160, power: 1 }), 450);
  $("#levelup-done").addEventListener(
    "click",
    () => {
      buzz(10);
      closeDrop();
      renderProgress({ animate: false });
      const hex = $("[data-hex-now]");
      bump(hex);
      recharge();
    },
    { once: true }
  );
}

function confetti({ colors = ["#ffffff", "#ffcf5c", "#16bf86", "#b9a8ff", "#ff6aa2", "#5d3cf2"], count = 160, power = 1, x, y } = {}) {
  if (reducedMotion.matches) return;
  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const cx = x ?? innerWidth / 2;
  const cy = y ?? innerHeight / 2;
  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2;
    const v = (6 + Math.random() * 11) * power;
    return { x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5 * power, r: Math.random() * 360, vr: (Math.random() - 0.5) * 18, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, c: colors[(Math.random() * colors.length) | 0], s: Math.random() < 0.25 };
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
      if (p.s) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2.4, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r / 30)));
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

function redeemButtonHTML(p, secondary = false) {
  const owned = state.redeemed.some((o) => o.productId === p.id);
  if (state.points < p.price)
    return secondary
      ? `<button class="btn btn--block btn--soft btn--muted" data-redeem>Redeem with points · ${fmt(p.price - state.points)} more needed</button>`
      : `<button class="btn btn--block btn--disabled" data-redeem>Not enough Online Unity Points</button>`;
  return `<button class="btn btn--block ${secondary ? "btn--soft" : "btn--primary"} hold" data-redeem data-hold>
    <span class="hold__fill"></span>
    <span class="hold__label">${owned ? "Redeem another" : "Hold to redeem"} · ${fmt(p.price)} pts</span>
  </button>`;
}
function ctaHTML(p) {
  if (!p.usd) return redeemButtonHTML(p);
  return `<button class="btn btn--block btn--buy" data-buy>Buy · ${money(p.usd)}</button>${redeemButtonHTML(p, true)}`;
}

function insideHTML(p) {
  const box = BOXES[p.id];
  if (!box) return "";
  const odds = Object.fromEntries(boxOdds(p.id, state.level));
  const total = Object.values(odds).reduce((s, w) => s + w, 0);
  const order = ["legendary", "epic", "rare", "common"];
  const items = [...box.pool].sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity));
  const tiers = order.filter((r) => odds[r]);
  return `<section class="inside" style="--i:4">
    <h3>What's inside</h3>
    <p class="inside__lead">One ${box.noun}, revealed when you open the box. Odds at ${LEVEL_NAMES[state.level]}:</p>
    <div class="inside__odds">${tiers
      .map((r) => `<span style="--rc:${RARITY[r].color};--w:${(odds[r] / total) * 100}%"><i></i>${RARITY[r].label} <b>${Math.round((odds[r] / total) * 100)}%</b></span>`)
      .join("")}</div>
    <div class="inside__row">${items
      .map((it, i) => {
        const style = `style="--rc:${RARITY[it.rarity].color};--i:${i}"`;
        if (!it.productId)
          return `<button class="inside__item" data-zoom-src="${it.img}" ${style}>
            <span class="inside__img${it.kind === "card" ? " is-tall" : ""}"><img src="${it.img}" alt="" loading="lazy" /></span>
            <small>${RARITY[it.rarity].label}</small>
            <b>${it.name}</b>
          </button>`;
        const ip = productById(it.productId);
        return `<button class="inside__item" data-inside="${ip.id}" ${style}>
          <span class="inside__img"><img src="${ip.img}" alt="" loading="lazy" /></span>
          <small>${RARITY[it.rarity].label}</small>
          <b>${it.name || ip.name}</b>
        </button>`;
      })
      .join("")}</div>
  </section>`;
}

function detailHTML(p) {
  const related = PRODUCTS.filter((x) => x.id !== p.id && x.type === p.type)
    .concat(PRODUCTS.filter((x) => x.type !== p.type && x.type === "box"))
    .slice(0, 8);
  return `
    <header class="detail__head"><div class="detail__head-inner">
      <button class="icon-btn icon-btn--dark" data-back aria-label="Back">${icon("arrow-left")}</button>
      <h2>Unity Points: ${fmt(state.points)}</h2>
      <button class="icon-btn icon-btn--dark" data-share aria-label="Share">${icon("share-2")}</button>
    </div></header>
    <div class="detail__layout">
      <div class="detail__media"><button class="detail__media-inner" data-zoom aria-label="View full screen"><img class="${p.type === "box" ? "is-box" : ""}" src="${p.img}" alt="${p.name}" /><span class="zoom-hint">${icon("sparkles")}Tap to zoom</span></button></div>
      <div class="detail__main">
        <div class="detail__body">
          <h1 class="detail__title" style="--i:0">${p.name}</h1>
          <div class="detail__tags" style="--i:1"><span class="tag">${TYPE_LABEL[p.type]}</span>${p.badge && p.badge !== "Mystery" ? `<span class="tag">${p.badge === "1/1" ? "One of One" : p.badge}</span>` : ""}<span class="tag">Authenticated</span></div>
          <section style="--i:2"><h3>Description</h3><p class="detail__desc">${p.description}</p></section>
          ${insideHTML(p)}
          <section style="--i:3"><h3>Terms</h3><ul class="detail__terms">${p.terms.map((t) => `<li>${t}</li>`).join("")}</ul></section>
          <section class="related" style="--i:5"><h3>You may also like</h3><div class="related__row">${related.map(cardHTML).join("")}</div></section>
        </div>
        <div class="buybar"><div class="buybar__inner">
          <div class="buybar__row"><span>${p.usd ? "Price" : "Cost"}</span><span class="buybar__prices">${p.usd ? `<b>${money(p.usd)}</b><span class="price__or">or</span>` : ""}<span class="price">${icon("unity")}<span>${fmt(p.price)}</span></span></span></div>
          <div class="buybar__cta">${ctaHTML(p)}</div>
        </div></div>
      </div>
    </div>`;
}

function morph(update) {
  if (!canMorph()) {
    update();
    return null;
  }
  return document.startViewTransition(update);
}

function showDetail(id) {
  const p = productById(id);
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
    wireHold();
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
      const heroImg = $(".detail__media img", detail);
      if (heroImg) heroImg.style.viewTransitionName = "";
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
  const scope = activePane === "store" ? grid : rewardsPane;
  const cardImg = $(`[data-id="${currentId}"] img, [data-open="${currentId}"] img`, scope);
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

/* Hold to redeem */
const HOLD_MS = 1100;
function wireHold() {
  const btn = $("[data-hold]", detail);
  if (!btn) return;
  let timer = null;
  let ticks = null;
  const cancel = () => {
    if (!btn.classList.contains("is-holding")) return;
    btn.classList.remove("is-holding");
    clearTimeout(timer);
    clearInterval(ticks);
  };
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    btn.classList.add("is-holding");
    buzz(6);
    ticks = setInterval(() => buzz(4), 220);
    timer = setTimeout(() => {
      clearInterval(ticks);
      btn.classList.remove("is-holding");
      redeem(btn);
    }, reducedMotion.matches ? 300 : HOLD_MS);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, cancel));
  btn.addEventListener("contextmenu", (e) => e.preventDefault());
  btn.addEventListener("click", (e) => {
    if (!btn.classList.contains("is-done") && !btn.dataset.tip) {
      btn.dataset.tip = "1";
      toast("Press and hold to redeem", "sparkles", 1600);
      setTimeout(() => delete btn.dataset.tip, 1600);
    }
  });
}

function redeem(btn) {
  const p = productById(currentId);
  if (!p || state.points < p.price) return;
  buzz([20, 40, 80]);
  state.points -= p.price;
  const order = `HRB-${Math.floor(100000 + Math.random() * 900000)}`;
  state.redeemed.unshift({ productId: p.id, order, at: Date.now() });
  save();
  renderPoints(700);
  btn.classList.add("is-done");
  $(".hold__label", btn).innerHTML = `${icon("check")} Redeemed`;
  const r = btn.getBoundingClientRect();
  confetti({ x: r.left + r.width / 2, y: r.top, count: 180, power: 1.1 });
  if (BOXES[p.id]) setTimeout(() => openDrop({ boxId: p.id, source: "redeem", order }), 750);
  else setTimeout(() => successSheet(p, order), 650);
}

function successSheet(p, order, item) {
  const shown = item || { name: p.name, img: p.img, rarity: "common" };
  openSheet(
    `<div class="success">
      <svg class="success__check" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-16" /></svg>
      <h2>${item ? "What a pull!" : "You got it!"}</h2>
      <p class="lead">${item ? `Your ${p.name} had a ${RARITY[item.rarity].label} ${BOXES[p.id].noun} inside. It's on its way.` : `${p.name} is on its way.`} We'll email your shipping details.</p>
      <div class="success__item"${item ? ` style="--rc:${RARITY[item.rarity].color}"` : ""}><span class="${shown.card ? "is-card" : ""}">${itemVisual(shown, "slab--mini")}</span><div><b>${shown.name}</b><small>Order ${order} · ${fmt(p.price)} pts</small></div></div>
      <button class="btn btn--primary btn--block" id="view-redeemed">View in My Rewards</button>
      <button class="btn btn--ghost btn--block" data-close>Keep browsing</button>
    </div>`,
    () => {
      const cta = $(".buybar__cta", detail);
      if (cta && currentId === p.id) {
        cta.innerHTML = ctaHTML(p);
        wireHold();
      }
    }
  );
  $("#view-redeemed").addEventListener("click", () => {
    sheetOnClose = () => {
      goBack();
      setTimeout(() => {
        setPane("rewards");
        setTimeout(() => $("#redeemed")?.scrollIntoView({ behavior: "smooth", block: "center" }), 450);
      }, 420);
    };
    closeSheet();
  });
}

/* Lightbox */
function openLightbox(src, fromEl) {
  const from = fromEl.getBoundingClientRect();
  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.innerHTML = `<button class="icon-btn icon-btn--light lightbox__close" aria-label="Close">${icon("x")}</button><img src="${src}" alt="" draggable="false" /><p class="lightbox__hint">Double-tap to zoom · Swipe down to close</p>`;
  document.body.append(lb);
  const img = $("img", lb);
  const fit = () => {
    const iw = img.naturalWidth || 1;
    const ih = img.naturalHeight || 1;
    const s = Math.min(innerWidth / iw, (innerHeight * 0.86) / ih);
    return { w: iw * s, h: ih * s };
  };
  let zoom = 1;
  let pan = { x: 0, y: 0 };
  const apply = (anim = true) => {
    img.style.transition = anim ? "transform .35s cubic-bezier(.22,1,.36,1)" : "none";
    img.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  };
  const start = () => {
    const { w, h } = fit();
    img.style.width = `${w}px`;
    img.style.height = `${h}px`;
    const sx = from.width / w;
    const sy = from.height / h;
    const s = Math.min(sx, sy);
    const dx = from.left + from.width / 2 - innerWidth / 2;
    const dy = from.top + from.height / 2 - innerHeight / 2;
    if (!reducedMotion.matches) img.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" });
    lb.classList.add("is-open");
  };
  img.complete ? start() : img.addEventListener("load", start, { once: true });
  buzz();

  const close = () => {
    const { w, h } = fit();
    const s = Math.min(from.width / w, from.height / h);
    const dx = from.left + from.width / 2 - innerWidth / 2;
    const dy = from.top + from.height / 2 - innerHeight / 2;
    lb.classList.remove("is-open");
    img.style.transition = "transform .32s cubic-bezier(.65,0,.35,1)";
    img.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
    setTimeout(() => lb.remove(), reducedMotion.matches ? 0 : 320);
  };
  $(".lightbox__close", lb).addEventListener("click", close);

  let lastTap = 0;
  let drag = null;
  img.addEventListener("pointerdown", (e) => {
    img.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false };
  });
  img.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
    if (zoom > 1) {
      pan = { x: drag.px + dx, y: drag.py + dy };
      apply(false);
    } else {
      pan = { x: 0, y: Math.max(0, dy) };
      apply(false);
      lb.style.setProperty("--bg", Math.max(0, 0.92 - dy / 500));
    }
  });
  img.addEventListener("pointerup", (e) => {
    const d = drag;
    drag = null;
    if (!d) return;
    if (zoom === 1 && pan.y > 110) return close();
    if (zoom === 1) {
      pan = { x: 0, y: 0 };
      lb.style.removeProperty("--bg");
      apply();
    }
    if (d.moved) return;
    const now = Date.now();
    if (now - lastTap < 300) {
      buzz(5);
      if (zoom > 1) {
        zoom = 1;
        pan = { x: 0, y: 0 };
      } else {
        zoom = 2.5;
        pan = { x: (innerWidth / 2 - e.clientX) * 1.5, y: (innerHeight / 2 - e.clientY) * 1.5 };
      }
      apply();
      lastTap = 0;
    } else lastTap = now;
  });
  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });
}

detail.addEventListener("click", async (e) => {
  if (e.target.closest("[data-back]")) {
    buzz();
    goBack();
    return;
  }
  const zoomItem = e.target.closest("[data-zoom-src]");
  if (zoomItem) {
    openLightbox(zoomItem.dataset.zoomSrc, $("img", zoomItem));
    return;
  }
  const zoomBtn = e.target.closest("[data-zoom]");
  if (zoomBtn) {
    const img = $("img", zoomBtn);
    openLightbox(img.src, img);
    return;
  }
  const rel = e.target.closest(".card, [data-inside]");
  if (rel) {
    if (rel.dataset.inside) rel.dataset.id = rel.dataset.inside;
    buzz();
    pendingMorphImg = $("img", rel);
    location.hash = `#/p/${rel.dataset.id}`;
    return;
  }
  if (e.target.closest("[data-share]")) {
    buzz();
    const p = productById(currentId);
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
  if (e.target.closest("[data-buy]")) {
    buzz(8);
    openPurchase(productById(currentId));
    return;
  }
  const redeemBtn = e.target.closest("[data-redeem]:not([data-hold])");
  if (redeemBtn) {
    const p = productById(currentId);
    buzz([20, 40, 20]);
    redeemBtn.classList.remove("shake");
    void redeemBtn.offsetWidth;
    redeemBtn.classList.add("shake");
    toast(`You need ${fmt(p.price - state.points)} more Unity Points. Open a Reward Drop!`, "lock", 2800);
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
  detail.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      if (t.clientX > 28) return;
      sx = t.clientX;
      dx = 0;
      detail.style.transition = "none";
    },
    { passive: true }
  );
  detail.addEventListener(
    "touchmove",
    (e) => {
      if (sx == null) return;
      dx = Math.max(0, e.touches[0].clientX - sx);
      detail.style.transform = `translateX(${dx}px)`;
      detail.style.boxShadow = "-20px 0 40px rgba(0,0,0,.15)";
    },
    { passive: true }
  );
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
  const lb = $(".lightbox");
  if (lb) $(".lightbox__close", lb).click();
  else if (!sheet.hidden) closeSheet();
  else if ($(".paysheet")) $(".paysheet__x").click();
  else if (!drop.hidden && !drop.classList.contains("is-levelup") && dropCtx?.source === "drop") closeDrop();
  else if (!detail.hidden) goBack();
});

segmented.addEventListener("click", (e) => {
  if (e.target.closest('[data-tab="rewards"]')) $('[data-tab="rewards"]', segmented).classList.remove("has-new");
});

/* ---------- Boot ---------- */
renderChips();
renderGrid();
setPane("store", { instant: true });
renderPoints();
syncCta();
setTimeout(() => renderProgress(), 350);
route();
