// ace.js — NIGHTHAWK, the named ace rival. Three phases, one HP bar:
//   Phase 1 (HP 300→200): fast passes, probes the player.
//   Phase 2 (HP 200→100): aggressive, fires bursts, high-G turns.
//   Phase 3 (HP 100→0):   desperate — afterburner runs, snap turns, heavy fire.
// The cover shot is phase 3 with his bar nearly empty.
import { G } from './state.js';
import { buildAceJet } from './jet.js';
import { explosion, tracer, sparks } from './particles.js';
import { damageHull, addScore, bumpChain } from './physics.js';
import { sfx } from './audio.js';

export function spawnAce() {
  const jet = buildAceJet();
  const ace = {
    isAce: true, name: 'NIGHTHAWK', mesh: jet, hp: 300, maxHp: 300, alive: true,
    phase: 1, angle: 0, radius: 160, alt: 150, fireTimer: 2, status: 'DUEL',
    pos: new THREE.Vector3(60, 150, 320),
  };
  jet.position.copy(ace.pos);
  G.scene.add(jet);
  G.ace = ace;
  return ace;
}
export function clearAce() {
  if (G.ace) { G.scene.remove(G.ace.mesh); G.ace = null; }
}

export function updateAce(dt) {
  const a = G.ace;
  if (!a || !a.alive || G.mode !== 'fly') return;
  // phase transitions
  const phase = a.hp > 200 ? 1 : a.hp > 100 ? 2 : 3;
  if (phase !== a.phase) {
    a.phase = phase;
    sfx.phase();
    import('./missions.js').then((m) => m.showBanner(`NIGHTHAWK — PHASE ${phase}/3`, 'bad', 1.6));
  }
  // orbit the player at a phase-dependent radius and speed, changing altitude
  const speed = [0.5, 0.8, 0.9][a.phase - 1];
  a.angle += dt * speed;
  const p = G.playerJet.position;
  a.radius += ((a.phase === 3 ? 110 : 170) - a.radius) * dt * 0.5;
  a.alt += (Math.sin(a.angle * 0.7) * 60 + 150 - a.alt) * dt * 0.4;
  a.pos.set(
    p.x + Math.cos(a.angle) * a.radius,
    Math.max(30, a.alt),
    p.z + Math.sin(a.angle) * a.radius);
  a.mesh.position.copy(a.pos);
  // bank into the turn, nose along the orbit tangent
  a.mesh.rotation.y = -a.angle + (Math.cos(a.angle) > 0 ? 0 : Math.PI);
  a.mesh.rotation.z = 0.7;
  a.mesh.rotation.x = Math.sin(a.angle * 0.7) * 0.15;
  a.mesh.userData.flame.visible = a.phase >= 2;
  a.mesh.userData.glow.intensity = a.phase >= 2 ? 2.2 : 0;
  // fire bursts at the player, more often in later phases
  a.fireTimer -= dt;
  const d = a.pos.distanceTo(p);
  if (a.fireTimer <= 0 && d < 380) {
    a.fireTimer = [2.2, 1.5, 0.9][a.phase - 1];
    tracer(a.pos.clone(), p.clone());
    if (Math.random() < [0.3, 0.45, 0.6][a.phase - 1]) {
      damageHull(5 + a.phase * 2, 'NIGHTHAWK fire');
      sparks(p);
    }
  }
}

export function onAceDown() {
  // ace killed: explosion already played; the run is won.
  G.ace.alive = false;
  G.ace.status = 'DOWN';
  addScore(2000, 'ace');
  bumpChain();
  import('./missions.js').then((m) => m.aceDown());
}
