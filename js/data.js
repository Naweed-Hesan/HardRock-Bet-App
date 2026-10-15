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

export const DROP_REWARDS = [
  { kind: "points", amount: 500, title: "+500 Online Unity Points", sub: "Added to your balance" },
  { kind: "boost", title: "10% Profit Boost", sub: "Use on a 3+ leg parlay" },
  { kind: "points", amount: 1000, title: "+1,000 Online Unity Points", sub: "Added to your balance" },
  { kind: "spins", title: "25 Bonus Spins", sub: "Valid on featured slots" },
];
