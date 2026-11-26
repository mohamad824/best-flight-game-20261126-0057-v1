// state.js — the single shared game state (one object, imported by every module).
// Units: metres, seconds, knots for speed display. World: +z forward along the course,
// +x right, +y up. The carrier deck sits at y = 18, sea at y = 0.

export const G = {
  // flow
  mode: 'title',            // title | upgrade | fly | results | paused
  paused: false,
  sortie: 0,                // 0 ring run, 1 intercept, 2 landing, 3 ace duel
  runOver: false,
  time: 0,                  // total run time
  missionTime: 0,           // time left on the current sortie clock (0 = no clock)
  missionDone: false,
  banner: '', bannerKind: '', bannerUntil: 0,

  // scoring
  score: 0, chain: 1, chainTimer: 0,
  stats: { rings: 0, ringsTotal: 8, kills: 0, shots: 0, hits: 0, traps: 0, bolters: 0, crashes: 0, aceHits: 0 },

  // aircraft
  throttle: 0,              // 0..1 (0.55 cruise on deck start)
  speed: 0,                 // knots
  alt: 0,                   // feet (display)
  heading: 0,               // degrees 0..360
  pitch: 0, bank: 0,        // degrees, visual + flight
  gForce: 1,
  fuel: 100, hull: 100,     // percent
  stalled: false, onDeck: true,
  pos: { x: 0, y: 18, z: -70 },
  vel: { x: 0, y: 0, z: 0 },
  afterburner: false,
  firing: false,

  // upgrades held (names) + derived modifiers
  upgrades: [],
  mod: { thrust: 1, armour: 1, fuel: 1, guns: 1, turn: 1 },

  // world refs (filled by main.js)
  scene: null, camera: null, renderer: null,
  playerJet: null, playerFlame: null, playerGlow: null,
  pilot: null, cockpit: null,
  carrier: null, carrierCrew: [],
  rings: [], islands: [], bandits: [], ace: null,
  carrierHp: 100,

  // view
  view: 'chase',            // chase | cockpit
  shake: 0,
};

export const SORTIES = [
  { name: 'SORTIE 1 — RING RUN', obj: 'Fly through all 8 rings before the clock runs out. Low and fast pays.' },
  { name: 'SORTIE 2 — INTERCEPT', obj: 'Down all 6 bandits before they reach USS AURORA. The carrier must survive.' },
  { name: 'SORTIE 3 — CARRIER LANDING', obj: 'Come home. Slow to 130–160 kts, line up the deck, trap the wire.' },
  { name: '★ ACE DUEL — NIGHTHAWK', obj: 'NIGHTHAWK is here. Three phases. Put him in the sea.' },
];

export const UPGRADES = [
  { id: 'afterburner', icon: '🔥', name: 'AFTERBURNER Mk-II', desc: '+25% thrust. Afterburner burns hotter and pushes top speed past 700 kts.' },
  { id: 'armour', icon: '🛡', name: 'TITANIUM ARMOUR', desc: 'Hull takes 35% less damage. Hard turns and hard hits hurt less.' },
  { id: 'fueltank', icon: '⛽', name: 'DROP TANK', desc: '+40% fuel capacity and slower burn. Stay on station longer.' },
  { id: 'guns', icon: '💥', name: '30MM CANNON', desc: '+50% gun damage and faster fire. Bandits fall in half the time.' },
  { id: 'turn', icon: '🌀', name: 'FLIGHT CONTROL+', desc: 'Tighter turns, less speed bleed, lower G in hard banks.' },
  { id: 'repair', icon: '🔧', name: 'FIELD REPAIR', desc: 'Restore 45% hull and 30% fuel right now. The crew works fast.' },
];

export function resetRun() {
  G.mode = 'title'; G.sortie = 0; G.runOver = false;
  G.time = 0; G.missionTime = 0; G.missionDone = false;
  G.score = 0; G.chain = 1; G.chainTimer = 0;
  G.stats = { rings: 0, ringsTotal: 8, kills: 0, shots: 0, hits: 0, traps: 0, bolters: 0, crashes: 0, aceHits: 0 };
  G.throttle = 0; G.speed = 0; G.alt = 0; G.heading = 0; G.pitch = 0; G.bank = 0; G.gForce = 1;
  G.fuel = 100; G.hull = 100; G.stalled = false; G.onDeck = true;
  G.pos = { x: 0, y: 18, z: -70 }; G.vel = { x: 0, y: 0, z: 0 };
  G.afterburner = false; G.firing = false;
  G.upgrades = []; G.mod = { thrust: 1, armour: 1, fuel: 1, guns: 1, turn: 1 };
  G.bandits = []; G.ace = null; G.carrierHp = 100; G.view = 'chase'; G.shake = 0;
}

export function applyUpgrade(id) {
  if (id === 'repair') { G.hull = Math.min(100, G.hull + 45); G.fuel = Math.min(100, G.fuel + 30); return; }
  if (G.upgrades.includes(id)) return;
  G.upgrades.push(id);
  if (id === 'afterburner') G.mod.thrust = 1.25;
  if (id === 'armour') G.mod.armour = 0.65;
  if (id === 'fueltank') { G.mod.fuel = 0.6; G.fuel = 100; }
  if (id === 'guns') G.mod.guns = 1.5;
  if (id === 'turn') G.mod.turn = 1.35;
}
