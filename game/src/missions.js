// missions.js — the three sorties + ace duel: ring run, intercept, carrier landing.
// Rings are glowing gold toruses over the island canyon; landing is judged on speed,
// alignment and sink rate — TRAP, BOLTER or CRASH, each with its own banner.
import { G, SORTIES } from './state.js';
import { terrainHeight, overDeck } from './world.js';
import { addScore, bumpChain, crash, damageHull } from './physics.js';
import { spawnBandits, clearBandits } from './enemies.js';
import { spawnAce, clearAce } from './ace.js';
import { sfx } from './audio.js';

let ringIndex = 0;
const RING_DEFS = [
  { x: -40, y: 70, z: 420 }, { x: 120, y: 95, z: 780 }, { x: -90, y: 80, z: 1150 },
  { x: 160, y: 120, z: 1520 }, { x: -160, y: 90, z: 1900 }, { x: 60, y: 130, z: 2280 },
  { x: -60, y: 100, z: 2650 }, { x: 0, y: 110, z: 3020 },
];

export function buildRings() {
  clearRings();
  const geo = new THREE.TorusGeometry(18, 1.6, 10, 28);
  RING_DEFS.forEach((d, i) => {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: 0xffb62e, emissive: 0xff8a1a, emissiveIntensity: 0.9, metalness: 0.4, roughness: 0.3 }));
    m.position.set(d.x, d.y, d.z);
    m.userData = { passed: false, index: i };
    G.scene.add(m);
    G.rings.push(m);
  });
}
export function clearRings() {
  for (const r of G.rings || []) G.scene.remove(r);
  G.rings = []; ringIndex = 0;
}

export function startSortie(n) {
  G.sortie = n; G.missionDone = false;
  clearBandits(); clearAce();
  G.pos = { x: 0, y: 18, z: -70 };
  G.heading = 0; G.pitch = 0; G.bank = 0; G.speed = 0; G.throttle = 0;
  G.onDeck = true; G.fuel = Math.max(G.fuel, 55); G.stalled = false;
  if (n === 0) { buildRings(); G.missionTime = 120; }
  if (n === 1) { clearRings(); spawnBandits(); G.missionTime = 180; }
  if (n === 2) { clearRings(); G.missionTime = 150; }
  if (n === 3) { clearRings(); spawnAce(); G.missionTime = 0; }
  G.mode = 'fly';
  showBanner(SORTIES[n].name, 'good', 2.2);
  import('./hud.js').then((m) => m.refreshObjective());
  import('./screens.js').then((m) => m.hideAll());
}

export function showBanner(text, kind, secs) {
  G.banner = text; G.bannerKind = kind || ''; G.bannerUntil = G.time + (secs || 2);
  import('./hud.js').then((m) => m.showBannerDom(text, kind));
}

export function updateMissions(dt) {
  if (G.mode !== 'fly') return;
  if (G.missionTime > 0) {
    G.missionTime -= dt;
    if (G.missionTime <= 0 && !G.missionDone) {
      if (G.sortie === 0) return failSortie('Out of time on the ring run');
      if (G.sortie === 1) return failSortie('Bandits reached the carrier');
      if (G.sortie === 2) return failSortie('Out of time — diverted, run over');
    }
  }
  // --- ring run: pass detection (crossing the ring plane inside the torus)
  if (G.sortie === 0) {
    for (const r of G.rings) {
      if (r.userData.passed) continue;
      const d = RING_DEFS[r.userData.index];
      const dz = G.pos.z - d.z;
      if (Math.abs(dz) < 6) {
        const dist = Math.hypot(G.pos.x - d.x, G.pos.y - d.y);
        if (dist < 18) {
          r.userData.passed = true;
          r.material = r.material.clone(); r.material.color.set(0x37d67a); r.material.emissive.set(0x1a8a3a);
          G.stats.rings++;
          bumpChain(); addScore(300, 'ring');
          sfx.ring();
          showBanner(`RING ${G.stats.rings}/8 — +${300 * G.chain}`, 'good', 1.2);
          import('./hud.js').then((m) => m.chainPop(G.chain));
          if (G.stats.rings >= 8) return sortieComplete();
        } else if (dz > 6 && G.pos.z > d.z + 6) {
          // flew past the ring without going through: it dims, chain breaks
          r.userData.passed = true; G.chain = 1;
          r.material = r.material.clone(); r.material.color.set(0x5a5a5a); r.material.emissive.set(0x000000);
          showBanner('RING MISSED', 'bad', 1.2);
        }
      }
    }
  }
  // --- landing: judge the approach over the deck (once per sortie)
  if (G.sortie === 2 && !G.missionDone && !G.onDeck && G.pos.z > -140 && G.pos.z < 130 && Math.abs(G.pos.x) < 30) {
    const h = G.pos.y - 18;
    if (h < 2.5 && G.pos.z > -110) {
      const aligned = Math.abs(G.pos.x + 8) < 7 && Math.abs(G.heading) < 12;
      const spdOk = G.speed >= 125 && G.speed <= 175;
      if (aligned && spdOk) {
        G.stats.traps++;
        addScore(800, 'trap'); bumpChain();
        sfx.trap();
        return sortieComplete('TRAP! WIRE CAUGHT');
      }
      if (h < 1.2) { // touched down badly
        if (!spdOk || !aligned) { G.stats.bolters++; sfx.bolter(); showBanner('BOLTER — GO AROUND!', 'bad', 2); G.pos.z = -320; G.pos.y = 60; G.speed = Math.max(G.speed, 220); }
      }
    }
  }
  // --- terrain / sea collision
  if (!G.onDeck) {
    const th = terrainHeight(G.pos.x, G.pos.z);
    if (G.pos.y <= th + 1 && th > 0) { damageHull(100, 'terrain'); return crash('Flew into the island'); }
    if (G.pos.y <= 1.5) { damageHull(100, 'sea'); return crash('Ditched in the sea'); }
    if (overDeck(G.pos.x, G.pos.z) && G.pos.y < 17.2 && G.vel.y < 0 && G.sortie !== 2) {
      // descending into the deck outside a landing sortie: a real crash, not a liftoff
      // (just after takeoff y sits at deck level while climbing, so require below-deck + sinking)
      damageHull(100, 'deck'); return crash('Hit the carrier deck');
    }
  }
  // --- fuel out
  if (G.fuel <= 0 && G.speed < 100 && !G.onDeck) return crash('Flamed out — no fuel');
}

function failSortie(why) {
  G.mode = 'results'; G.runOver = true;
  import('./screens.js').then((m) => m.showResults(false, why));
}
export function sortieComplete(bannerText) {
  if (G.missionDone) return;
  G.missionDone = true;
  if (bannerText) showBanner(bannerText, 'good', 2);
  addScore(500, 'sortie');
  const next = G.sortie + 1;
  setTimeout(() => {
    if (G.mode !== 'fly') return;
    if (next <= 2) import('./screens.js').then((m) => m.showUpgrade(next));
    else if (next === 3) import('./screens.js').then((m) => m.showUpgrade(3));
  }, 900);
}
export function aceDown() {
  G.mode = 'results'; G.runOver = true;
  import('./screens.js').then((m) => m.showResults(true, 'NIGHTHAWK is down — the sky is yours.'));
}
