const IMG = "assets/img/";

const guitar = (player, team, extra = "") =>
  `A full-size guitar finished in custom ${team} artwork and hand signed by ${player}. ${extra}Built for display as much as for playing, it's a centerpiece for any fan's game room or office. Ships ready to hang, with a certificate of authenticity.`;

const paintedHelmet = (player, team) =>
  `A one-of-one Riddell Speedflex helmet, hand painted by our artists in ${team} colors and signed by ${player}. No two are alike, and this exact piece will never be made again. Includes a certificate of authenticity and a display case.`;

const crystalHelmet = (team) =>
  `A full-size Riddell Speedflex helmet covered by hand in genuine Swarovski crystals in ${team} colors, then signed. Every helmet takes days of hand setting and catches the light from every angle. Includes a certificate of authenticity and a display case.`;

const jersey = (player, club) =>
  `An authentic ${club} jersey hand signed by ${player}. A must-have for any collector, ready to frame. Includes a certificate of authenticity.`;

const MYSTERY_TERMS = [
  "Contents are randomly selected at the time of redemption.",
  "Every box contains at least one authenticated signed item.",
  "Sales are final.",
];
const MERCH_TERMS = ["No refunds or exchanges.", "Sales are final.", "Allow 2–3 weeks for delivery."];

export const PRODUCTS = [
  {
    id: "lucky-you-full-size-helmet-box",
    name: "Lucky You Full Size Helmet Box",
    price: 15000,
    img: "box-full-size.webp",
    type: "box",
    badge: "Mystery",
    description:
      "Roll the dice on a Lucky You mystery box. Every Full Size Helmet Box hides a signed, authenticated full-size football helmet from the Real Autograph vault, from rising stars to Hall of Famers.",
    terms: MYSTERY_TERMS,
  },
  {
    id: "lucky-you-mini-helmet-box",
    name: "Lucky You Mini Helmet Box",
    price: 5000,
    img: "box-mini.webp",
    type: "box",
    badge: "Mystery",
    description:
      "The Lucky You Mini Helmet Box packs a signed, authenticated mini helmet. Small box, big names. Will you pull a legend?",
    terms: MYSTERY_TERMS,
  },
  {
    id: "lucky-you-football-jersey-pack",
    name: "Lucky You Football Jersey Pack",
    price: 10000,
    img: "box-jersey.webp",
    type: "box",
    badge: "Mystery",
    description:
      "Tear open a Lucky You Football Jersey Pack to reveal a signed, authenticated football jersey. Every pack is a surprise, every jersey is the real thing.",
    terms: MYSTERY_TERMS,
  },
  {
    id: "hot-hands",
    name: "Hot Hands",
    price: 5000,
    img: "box-hot-hands.webp",
    type: "box",
    badge: "New",
    description:
      "Do you have the Hot Hands? Each box contains one slabbed and graded trading card, sealed and authenticated. Roll with us and see what you pull.",
    terms: MYSTERY_TERMS,
  },
  { id: "troy-aikman-signed-guitar", name: "Troy Aikman Signed Guitar", price: 45000, img: "guitar-aikman.webp", type: "guitar", description: guitar("Troy Aikman", "Dallas Cowboys"), terms: MERCH_TERMS },
  { id: "patrick-mahomes-signed-guitar", name: "Patrick Mahomes Signed Guitar", price: 42000, img: "guitar-mahomes-1.webp", type: "guitar", description: guitar("Patrick Mahomes", "Kansas City Chiefs"), terms: MERCH_TERMS },
  { id: "peyton-manning-signed-guitar", name: "Peyton Manning Signed Guitar", price: 44000, img: "guitar-peyton.webp", type: "guitar", description: guitar("Peyton Manning", "Denver Broncos"), terms: MERCH_TERMS },
  { id: "eli-manning-signed-guitar", name: "Eli Manning Signed Guitar", price: 38000, img: "guitar-eli.webp", type: "guitar", description: guitar("Eli Manning", "New York Giants"), terms: MERCH_TERMS },
  { id: "charles-woodson-signed-guitar", name: "Charles Woodson Signed Guitar", price: 38000, img: "guitar-woodson.webp", type: "guitar", description: guitar("Charles Woodson", "Las Vegas Raiders"), terms: MERCH_TERMS },
  { id: "patrick-mahomes-signed-guitar-2", name: "Patrick Mahomes Signed Guitar", price: 42000, img: "guitar-mahomes-2.webp", type: "guitar", description: guitar("Patrick Mahomes", "Kansas City Chiefs"), terms: MERCH_TERMS },
  { id: "patrick-mahomes-signed-electric-guitar", name: "Patrick Mahomes Signed Guitar", price: 49000, img: "guitar-mahomes-electric.webp", type: "guitar", description: guitar("Patrick Mahomes", "Kansas City Chiefs", "This electric edition features a full-body wrap. "), terms: MERCH_TERMS },
  { id: "lionel-messi-signed-inter-miami-jersey", name: "Lionel Messi Signed Inter Miami Jersey", price: 85000, img: "jersey-messi.webp", type: "jersey", description: jersey("Lionel Messi", "Inter Miami"), terms: MERCH_TERMS },
  { id: "cristiano-ronaldo-signed-real-madrid-jersey", name: "Cristiano Ronaldo Signed Real Madrid Jersey", price: 75000, img: "jersey-ronaldo.webp", type: "jersey", description: jersey("Cristiano Ronaldo", "Real Madrid"), terms: MERCH_TERMS },
  { id: "erling-haaland-signed-manchester-city-jersey", name: "Erling Haaland Signed Manchester City Jersey", price: 45000, img: "jersey-haaland.webp", type: "jersey", description: jersey("Erling Haaland", "Manchester City"), terms: MERCH_TERMS },
  { id: "patrick-mahomes-signed-chiefs-championship-belt", name: "Patrick Mahomes Signed Chiefs Championship Belt", price: 60000, img: "belt-mahomes.webp", type: "belt", description: "A full-size Kansas City Chiefs championship belt, hand signed by Patrick Mahomes. Heavy metal plates, team colors and a signature that says it all. Includes a certificate of authenticity.", terms: MERCH_TERMS },
  { id: "ladainian-tomlinson-signed-helmet", name: "LaDainian Tomlinson Signed 1/1 Hand Painted Speedflex Helmet", price: 28000, img: "helmet-tomlinson.webp", type: "helmet", badge: "1/1", description: paintedHelmet("LaDainian Tomlinson", "Los Angeles Chargers"), terms: MERCH_TERMS },
  { id: "brock-purdy-signed-helmet", name: "Brock Purdy Signed 1/1 Hand Painted Speedflex Helmet", price: 32000, img: "helmet-purdy.webp", type: "helmet", badge: "1/1", description: paintedHelmet("Brock Purdy", "San Francisco 49ers"), terms: MERCH_TERMS },
  { id: "swarovski-crystal-bengals-helmet", name: "Swarovski Crystal Signed Speedflex Helmet", price: 120000, img: "helmet-bengals-crystal.webp", type: "helmet", badge: "Crystal", description: crystalHelmet("Cincinnati Bengals"), terms: MERCH_TERMS },
  { id: "drew-brees-signed-helmet", name: "Drew Brees Signed 1/1 Hand Painted Speedflex Helmet", price: 30000, img: "helmet-brees.webp", type: "helmet", badge: "1/1", description: paintedHelmet("Drew Brees", "New Orleans Saints"), terms: MERCH_TERMS },
  { id: "patrick-mahomes-signed-helmet", name: "Patrick Mahomes Signed 1/1 Hand Painted Speedflex Helmet", price: 55000, img: "helmet-mahomes-lviii.webp", type: "helmet", badge: "1/1", description: paintedHelmet("Patrick Mahomes", "Super Bowl LVIII"), terms: MERCH_TERMS },
  { id: "swarovski-crystal-chargers-helmet", name: "Swarovski Crystal Signed Speedflex Helmet", price: 95000, img: "helmet-chargers-crystal.webp", type: "helmet", badge: "Crystal", description: crystalHelmet("Los Angeles Chargers"), terms: MERCH_TERMS },
].map((p) => ({ ...p, img: IMG + p.img }));

export const CATEGORIES = [
  { id: "featured", label: "Featured", icon: "featured-hand", match: () => true },
  { id: "bonuses", label: "Bonuses", icon: "gift-fill", tint: "linear-gradient(180deg,#7A45E6,#4A1FB5)", match: (p) => p.type === "box" },
  { id: "merch", label: "Merch", icon: "t-shirt-fill", tint: "linear-gradient(180deg,#7B72FF,#4C3FD8)", match: (p) => p.type !== "box" },
  { id: "hotels", label: "Hotels", icon: "building-2", color: "#3B7DDD", match: () => false, empty: "Hotel stays are checking in soon." },
  { id: "live", label: "Hard Rock Live", icon: "guitar", color: "#E2457E", match: () => false, empty: "Hard Rock Live tickets are coming soon." },
];

export const RARITY = {
  common: { label: "Common", color: "#a7b0c4", deep: "#5d6780", confetti: ["#ffffff", "#c9d1e0", "#a7b0c4", "#b9a8ff"] },
  rare: { label: "Rare", color: "#3d9bff", deep: "#1659c7", confetti: ["#ffffff", "#7cc0ff", "#3d9bff", "#b9a8ff"] },
  epic: { label: "Epic", color: "#b45cff", deep: "#6a1fd1", confetti: ["#ffffff", "#e0b3ff", "#b45cff", "#ff6aa2"] },
  legendary: { label: "Legendary", color: "#ffc233", deep: "#c47a00", confetti: ["#fff7d6", "#ffe08a", "#ffc233", "#ff9d00", "#ffffff"] },
};

/* What each Lucky You box can contain. Items reuse the store photos; rarity is set per item. */
const HELMETS = [
  { productId: "ladainian-tomlinson-signed-helmet", player: "LaDainian Tomlinson", rarity: "rare" },
  { productId: "drew-brees-signed-helmet", player: "Drew Brees", rarity: "rare" },
  { productId: "brock-purdy-signed-helmet", player: "Brock Purdy", rarity: "rare" },
  { productId: "patrick-mahomes-signed-helmet", player: "Patrick Mahomes", rarity: "epic" },
  { productId: "swarovski-crystal-chargers-helmet", player: "Swarovski Crystal", rarity: "legendary" },
  { productId: "swarovski-crystal-bengals-helmet", player: "Swarovski Crystal", rarity: "legendary" },
];
const DOWNGRADE = { rare: "common", epic: "rare", legendary: "epic" };

export const BOXES = {
  "lucky-you-full-size-helmet-box": {
    short: "Full Size Helmet Box",
    noun: "helmet",
    weight: 40,
    pool: HELMETS.map((h) => ({ ...h })),
  },
  "lucky-you-mini-helmet-box": {
    short: "Mini Helmet Box",
    noun: "mini helmet",
    weight: 35,
    pool: HELMETS.map((h) => ({ ...h, rarity: DOWNGRADE[h.rarity], name: `${h.player} Signed Mini Helmet` })),
  },
  "lucky-you-football-jersey-pack": {
    short: "Football Jersey Pack",
    noun: "jersey",
    weight: 25,
    pool: [
      { productId: "erling-haaland-signed-manchester-city-jersey", rarity: "rare" },
      { productId: "cristiano-ronaldo-signed-real-madrid-jersey", rarity: "epic" },
      { productId: "lionel-messi-signed-inter-miami-jersey", rarity: "legendary" },
    ],
  },
};

export const BONUS_POINTS = { common: 100, rare: 250, epic: 750, legendary: 2000 };

/* Base odds for Level 1. Each level above 1 moves weight from Common to the higher tiers. */
export function rarityOdds(level) {
  const shift = Math.min(level - 1, 7) * 4;
  return [
    ["common", 55 - shift * 1.5],
    ["rare", 28 + shift * 0.5],
    ["epic", 13 + shift * 0.6],
    ["legendary", 4 + shift * 0.4],
  ];
}

export const SCRATCH_PRIZES = [
  { kind: "points", amount: 150 },
  { kind: "points", amount: 300 },
  { kind: "points", amount: 750 },
  { kind: "points", amount: 1500 },
  { kind: "boost", title: "5% Profit Boost", sub: "Use on any single bet" },
];

export const LEVEL_NAMES = ["", "Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 7", "Signature"];
export const MAX_LEVEL = 8;
