import { PRODUCTS, CATEGORIES, RARITY, DROP_TABLE, rarityOdds, SCRATCH_PRIZES, LEVEL_NAMES, MAX_LEVEL } from "./data.js";
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
}
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
  if (r.img) return `<span class="reward__tile reward__tile--img"><img src="${r.img}" alt="" /></span>`;
  return `<span class="reward__tile" style="--tile:${r.tile}">${icon(r.icon)}</span>`;
}
function readyHTML(r, i) {
  const active = state.active[r.id];
  return `<article class="reward reward--ready ${r.fresh ? "is-new" : ""} ${active ? "is-active" : ""}" data-reward="${r.id}" style="--i:${i}">
    <button class="reward__main" aria-expanded="false">
      ${rewardTile(r)}
      <div class="reward__body"><h5>${r.title}</h5><p>${r.sub}</p>${r.exp ? `<small>${r.exp}</small>` : ""}</div>
      <span class="reward__side">${r.rarity ? `<span class="rarity-dot" style="--rc:${RARITY[r.rarity].color}" title="${RARITY[r.rarity].label}"></span>` : ""}<span class="reward__chev">${icon("chevron-right")}</span></span>
    </button>
    <div class="reward__more"><div>
      <p>${r.detail || "Tap Use now to apply this reward to your account."}</p>
      <button class="btn btn--primary btn--small" data-activate>${active ? "Active" : "Use now"}</button>
    </div></div>
    <span class="stamp">Active</span>
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
          <div class="promo__foot"><b>Open a drop, win big</b><span>Every drop rolls Common, Rare, Epic or Legendary rewards.</span><span class="promo__optin">OPEN A DROP ${icon("chevron-right")}</span></div>
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
          return p ? `<button class="redeemed__item" data-open="${p.id}" style="--i:${i}"><span class="redeemed__img"><img src="${p.img}" alt="" /></span><b>${p.name}</b><small>${o.order} · Processing</small></button>` : "";
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
    activate.textContent = "Active";
    toast("Reward activated", "check");
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
    <p class="lead">Every drop you open earns credits. Fill the bar to level up and improve your odds.</p>
    ${steps([
      ["trophy", "Earn credits", `Each drop adds ${CREDITS_PER_DROP} credits to your bar.`],
      ["gift", "Open drops", "Tap the banner, then tap the box three times."],
      ["sparkles", "Roll a rarity", "Common, Rare, Epic or Legendary. Higher tiers include Lucky You boxes."],
      ["zap", "Level up", "Reach 10 credits to level up, all the way to Signature."],
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
      ["gift", "Open Reward Drops", "Drops can include thousands of bonus points."],
      ["unity", "Redeem in the Store", "Spend points on anything in the Rewards Store."],
    ])}
    <button class="btn btn--primary btn--block" data-close>Start earning</button>`);
});

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

function rollPrize(level) {
  const odds = rarityOdds(level);
  const total = odds.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  let rarity = "common";
  for (const [r, w] of odds) {
    if ((roll -= w) <= 0) {
      rarity = r;
      break;
    }
  }
  const entry = pick(DROP_TABLE[rarity]);
  if (entry.kind === "product") {
    const p = productById(entry.productId);
    return { ...entry, rarity, title: p.name, sub: "Added to your Ready to Use rewards", img: p.img };
  }
  if (entry.kind === "points") return { ...entry, rarity, title: `+${fmt(entry.amount)} Unity Points`, sub: "Added to your balance" };
  return { ...entry, rarity };
}

function openDrop() {
  if (!drop.hidden) return;
  let hits = 0;
  drop.hidden = false;
  drop.classList.remove("is-leaving");
  drop.style.removeProperty("--rc");
  document.body.classList.add("is-locked");
  drop.innerHTML = `
    <div class="drop__rays"></div>
    <button class="icon-btn icon-btn--light drop__close" aria-label="Close">${icon("x")}</button>
    <div class="drop__eyebrow">${LEVEL_NAMES[state.level]} Drop</div>
    <h2 class="drop__title">Legendary<br/>Reward Drop</h2>
    <div class="drop__stage"><img class="drop__box" src="assets/img/box-full-size.webp" alt="Lucky You drop box" /></div>
    <p class="drop__hint">Tap the box to open it</p>
    <div class="drop__taps"><span></span><span></span><span></span></div>
    <div class="drop__flash"></div>`;
  const box = $(".drop__box", drop);
  const dots = $$(".drop__taps span", drop);
  $(".drop__close", drop).addEventListener("click", () => closeDrop());
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
      revealPrize(box);
    }
  });
}

async function revealPrize(box) {
  const prize = rollPrize(state.level);
  const R = RARITY[prize.rarity];
  const big = prize.rarity === "legendary" || prize.rarity === "epic";
  buzz(big ? [40, 50, 40, 50, 120] : [30, 40, 60]);
  drop.style.setProperty("--rc", R.color);
  drop.style.setProperty("--rd", R.deep);
  box.classList.add("burst");
  $(".drop__flash", drop).classList.add("go");
  $(".drop__hint", drop).style.opacity = 0;
  $(".drop__taps", drop).style.opacity = 0;
  drop.classList.add("is-revealing", `is-${prize.rarity}`);
  const stage = $(".drop__stage", drop);
  await wait(380);
  stage.insertAdjacentHTML("beforeend", `<div class="drop__beam"></div><div class="drop__rarity">${R.label}</div>`);
  confetti({ colors: R.confetti, count: big ? 240 : 140, power: big ? 1.25 : 1 });
  await wait(prize.rarity === "legendary" ? 1250 : 900);
  const tile = prize.img
    ? `<div class="prize__tile prize__tile--img"><img src="${prize.img}" alt="" /></div>`
    : `<div class="prize__tile">${icon(prize.kind === "points" ? "unity" : prize.kind === "boost" ? "zap" : "sparkles")}</div>`;
  stage.innerHTML = `<div class="drop__reveal"><div class="prize">
      <span class="prize__rarity">${R.label}</span>
      ${tile}
      <small>You unlocked</small>
      <h3>${prize.title}</h3>
      <p>${prize.sub}</p>
      <button class="btn btn--primary btn--block" id="collect">Collect</button>
    </div></div>`;
  $(".drop__title", drop).innerHTML = prize.rarity === "legendary" ? "Legendary!" : prize.rarity === "epic" ? "Epic pull!" : "Nice pull!";
  $("#collect").addEventListener("click", (e) => collect(prize, e.currentTarget), { once: true });
}

async function collect(prize, btn) {
  buzz(12);
  btn.disabled = true;
  state.drops++;
  const tileRect = $(".prize__tile", drop).getBoundingClientRect();
  const leveledUp = state.progress + CREDITS_PER_DROP >= 10 && state.level < MAX_LEVEL;
  state.progress = leveledUp ? 10 : Math.min(10, state.progress + CREDITS_PER_DROP);
  if (prize.kind !== "points") {
    state.rewards.unshift({
      id: `drop-${Date.now()}`,
      title: prize.title,
      sub: prize.kind === "product" ? "Won from a Reward Drop. Ready to claim." : prize.sub,
      exp: `${RARITY[prize.rarity].label} · ${LEVEL_NAMES[state.level]} Drop`,
      icon: prize.kind === "boost" ? "zap" : "sparkles",
      tile: `linear-gradient(180deg,${RARITY[prize.rarity].color},${RARITY[prize.rarity].deep})`,
      img: prize.img,
      rarity: prize.rarity,
      fresh: true,
      detail: prize.kind === "product" ? "Claim this box and we'll ship it to the address on your account." : "Applies automatically to your next qualifying bet.",
    });
  }
  save();
  closeDrop({ keepLock: true });
  await wait(120);
  if (prize.kind === "points") {
    await flyPoints(tileRect, prize.amount);
  } else {
    const tab = $('[data-tab="rewards"]', segmented);
    await fly(tileRect, tab, {
      count: 1,
      size: 64,
      spread: 0,
      html: prize.img ? `<img class="flyer__img" src="${prize.img}" alt="" />` : `<span class="flyer__chip" style="--rc:${RARITY[prize.rarity].color}">${icon(prize.kind === "boost" ? "zap" : "sparkles")}</span>`,
      onLand: () => {
        bump(tab);
        if (activePane !== "rewards") tab.classList.add("has-new");
      },
    });
    toast("Added to My Rewards", "gift");
    if (activePane === "rewards" && !$(`[data-reward="${state.rewards[0].id}"]`)) renderRewards();
  }
  renderProgress();
  if (leveledUp) {
    await wait(1000);
    levelUp();
  } else {
    document.body.classList.remove("is-locked");
    recharge();
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

function redeemButtonHTML(p) {
  const owned = state.redeemed.some((o) => o.productId === p.id);
  if (state.points < p.price) return `<button class="btn btn--block btn--disabled" data-redeem>Not enough Online Unity Points</button>`;
  return `<button class="btn btn--block btn--primary hold" data-redeem data-hold>
    <span class="hold__fill"></span>
    <span class="hold__label">${owned ? "Redeem another" : "Hold to redeem"} · ${fmt(p.price)} pts</span>
  </button>`;
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
    <div class="detail__media"><button class="detail__media-inner" data-zoom aria-label="View full screen"><img class="${p.type === "box" ? "is-box" : ""}" src="${p.img}" alt="${p.name}" /><span class="zoom-hint">${icon("sparkles")}Tap to zoom</span></button></div>
    <div class="detail__body">
      <h1 class="detail__title" style="--i:0">${p.name}</h1>
      <div class="detail__tags" style="--i:1"><span class="tag">${TYPE_LABEL[p.type]}</span>${p.badge && p.badge !== "Mystery" ? `<span class="tag">${p.badge === "1/1" ? "One of One" : p.badge}</span>` : ""}<span class="tag">Authenticated</span></div>
      <section style="--i:2"><h3>Description</h3><p class="detail__desc">${p.description}</p></section>
      <section style="--i:3"><h3>Terms</h3><ul class="detail__terms">${p.terms.map((t) => `<li>${t}</li>`).join("")}</ul></section>
      <section class="related" style="--i:4"><h3>You may also like</h3><div class="related__row">${related.map(cardHTML).join("")}</div></section>
    </div>
    <div class="buybar"><div class="buybar__inner">
      <div class="buybar__row"><span>Cost</span><span class="price">${icon("unity")}<span>${fmt(p.price)}</span></span></div>
      <div class="buybar__cta">${redeemButtonHTML(p)}</div>
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
  setTimeout(() => {
    openSheet(
      `<div class="success">
        <svg class="success__check" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-16" /></svg>
        <h2>You got it!</h2>
        <p class="lead">${p.name} is on its way. We'll email your shipping details.</p>
        <div class="success__item"><span><img src="${p.img}" alt="" /></span><div><b>${p.name}</b><small>Order ${order} · ${fmt(p.price)} pts</small></div></div>
        <button class="btn btn--primary btn--block" id="view-redeemed">View in My Rewards</button>
        <button class="btn btn--ghost btn--block" data-close>Keep browsing</button>
      </div>`,
      () => {
        const cta = $(".buybar__cta", detail);
        if (cta && currentId === p.id) {
          cta.innerHTML = redeemButtonHTML(p);
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
  }, 650);
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
  const zoomBtn = e.target.closest("[data-zoom]");
  if (zoomBtn) {
    const img = $("img", zoomBtn);
    openLightbox(img.src, img);
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
  else if (!drop.hidden && !drop.classList.contains("is-levelup")) closeDrop();
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
