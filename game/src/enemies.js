// enemies.js — bandit AI: red aggressor jets that fly at the carrier, weave, and
// shoot back. Each has a name, HP, and a status the roster panel shows.
import { G } from './state.js';
import { buildBanditJet } from './jet.js';
import { explosion, sparks, tracer } from './particles.js';
import { addScore, bumpChain, damageHull } from './physics.js';
import { sfx } from './audio.js';

const NAMES = ['ADDER-1', 'ADDER-2', 'FALCON-3', 'COBRA-4', 'HAVOC-5', 'DART-6'];

export function spawnBandits() {
  clearBandits();
  for (let i = 0; i < 6; i++) {
    const jet = buildBanditJet();
    const b = {
      id: i, name: NAMES[i], mesh: jet, hp: 100, alive: true,
      pos: new THREE.Vector3((Math.random() - 0.5) * 500, 90 + Math.random() * 120, 900 + i * 160),
      speed: 150 + Math.random() * 40, weave: Math.random() * Math.PI * 2,
      fireTimer: 2 + Math.random() * 3, status: 'INBOUND',
    };
    jet.position.copy(b.pos);
    G.scene.add(jet);
    G.bandits.push(b);
  }
}
export function clearBandits() {
  for (const b of G.bandits || []) G.scene.remove(b.mesh);
  G.bandits = [];
}

// Player guns: hitscan cone ahead of the nose, with tracers and a fire rate.
let fireCooldown = 0;
export function fireGuns(dt) {
  fireCooldown -= dt;
  if (!G.firing || fireCooldown > 0) return;
  fireCooldown = 0.14 / G.mod.guns;
  G.stats.shots++;
  sfx.gun();
  const origin = G.playerJet.position.clone().add(new THREE.Vector3(0, 0.4, 4));
  const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(G.playerJet.quaternion);
  const end = origin.clone().addScaledVector(dir, 420);
  tracer(origin, end);
  // hit test: bandits, then the ace
  let best = null, bestD = 1e9;
  const targets = [...(G.bandits || []).filter((b) => b.alive)];
  if (G.ace && G.ace.alive) targets.push(G.ace);
  for (const t of targets) {
    const to = t.mesh.position.clone().sub(origin);
    const along = to.dot(dir);
    if (along < 10 || along > 420) continue;
    const perp = to.clone().addScaledVector(dir, -along).length();
    if (perp < 14 && along < bestD) { best = t; bestD = along; }
  }
  if (best) {
    G.stats.hits++;
    const dmg = 22 * G.mod.guns;
    best.hp -= dmg;
    sparks(best.mesh.position);
    sfx.hit();
    if (best.hp <= 0) killTarget(best);
    else { addScore(25, 'hit'); }
  }
}

function killTarget(t) {
  t.alive = false; t.status = 'DOWN';
  explosion(t.mesh.position, true);
  sfx.explosion();
  G.scene.remove(t.mesh);
  G.stats.kills++;
  bumpChain();
  addScore(500, 'kill');
  if (t.isAce) { import('./ace.js').then((m) => m.onAceDown()); }
}

export function updateBandits(dt) {
  for (const b of G.bandits || []) {
    if (!b.alive) continue;
    b.weave += dt * 1.4;
    // fly toward the carrier (z decreasing), weaving in x, slowly descending
    b.pos.z -= b.speed * dt;
    b.pos.x += Math.sin(b.weave) * 22 * dt;
    b.pos.y = Math.max(28, b.pos.y - 4 * dt);
    b.mesh.position.copy(b.pos);
    b.mesh.rotation.y = Math.PI + Math.sin(b.weave) * 0.25; // nose toward -z
    b.mesh.rotation.z = Math.sin(b.weave) * 0.5;
    const distToCarrier = b.pos.z; // carrier at z=0
    b.status = distToCarrier < 350 ? 'ON CARRIER!' : distToCarrier < 700 ? 'CLOSING' : 'INBOUND';
    // reached the carrier: it bombs the deck
    if (b.pos.z < 130) {
      b.alive = false; b.status = 'STRUCK';
      explosion(new THREE.Vector3(b.pos.x, 20, 120), true);
      G.scene.remove(b.mesh);
      G.carrierHp = Math.max(0, G.carrierHp - 22);
      damageHull(6, 'carrier strike');
      sfx.explosion();
    }
    // return fire when close to the player
    b.fireTimer -= dt;
    const dPlayer = b.pos.distanceTo(G.playerJet.position);
    if (b.fireTimer <= 0 && dPlayer < 320) {
      b.fireTimer = 1.6 + Math.random() * 1.4;
      tracer(b.pos.clone(), G.playerJet.position.clone());
      if (Math.random() < 0.45) { damageHull(4 + Math.random() * 4, 'bandit fire'); sparks(G.playerJet.position); }
    }
  }
  // all bandits resolved?
  if (G.sortie === 1 && G.mode === 'fly' && G.bandits.length > 0 && G.bandits.every((b) => !b.alive)) {
    import('./missions.js').then((m) => m.sortieComplete());
  }
  if (G.sortie === 1 && G.mode === 'fly' && G.carrierHp <= 0) {
    import('./physics.js').then((m) => m.crash('USS AURORA was overrun'));
  }
}
