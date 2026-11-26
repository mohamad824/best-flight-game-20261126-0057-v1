// physics.js — real flight mechanics: throttle discipline, stall, G-bleed in hard
// turns, fuel burn tied to throttle, afterburner cost, damage from hits and terrain.
import { G } from './state.js';
import { clamp, rad } from './util.js';
import { input, steer } from './input.js';
import { updateEngine } from './audio.js';

const STALL_KTS = 118;      // below this, the wing quits
const MAX_KTS = 720;        // top speed, before afterburner bonus
const DECK_Y = 18;          // carrier deck height (m)

export function updateFlight(dt) {
  const s = steer();
  const ab = (input.keys.ShiftLeft || input.keys.ShiftRight) && G.fuel > 0;
  G.afterburner = ab;

  // --- throttle (W/S), clamped; afterburner needs throttle above 70%
  if (input.keys.KeyW) G.throttle = clamp(G.throttle + dt * 0.45, 0, 1);
  if (input.keys.KeyS) G.throttle = clamp(G.throttle - dt * 0.55, 0, 1);

  // --- speed: thrust vs drag; hard bank bleeds speed and builds G
  const target = (60 + G.throttle * (MAX_KTS - 60) * G.mod.thrust) * (ab ? 1.18 : 1);
  const drag = 0.25 + Math.abs(G.bank) / 90 * 0.9 / G.mod.turn + (G.onDeck ? 0.6 : 0);
  G.speed += (target - G.speed) * clamp(dt * drag, 0, 1);
  if (G.speed > target) G.speed = Math.max(target, G.speed - dt * 40);
  G.stalled = !G.onDeck && G.speed < STALL_KTS;

  // --- turn: bank rolls the jet, heading follows bank; pitch follows stick
  const rollRate = 55 * G.mod.turn;
  G.bank = clamp(G.bank + s.roll * rollRate * dt - G.bank * dt * 0.6, -75, 75);
  const turnRate = G.bank * 0.55 * (G.speed / 300); // deg/s, scales with speed (bank right = turn right)
  G.heading = (G.heading + turnRate * dt + 360) % 360;
  const pitchRate = 26;
  G.pitch = clamp(G.pitch + s.pitch * pitchRate * dt - G.pitch * dt * 0.35, -28, 32);
  if (G.stalled) G.pitch = Math.min(G.pitch, -6); // nose drops in a stall

  // --- G force: 1 + bank + pitch pull
  G.gForce = clamp(1 + Math.abs(G.bank) / 38 + Math.abs(s.pitch) * 0.9 + (ab ? 0.6 : 0), 1, 9);
  if (G.gForce > 7) damageHull(dt * 1.5, 'over-G');

  // --- velocity from heading + pitch
  const h = rad(G.heading), p = rad(G.pitch);
  const ms = G.speed * 0.514; // kts -> m/s
  G.vel.x = Math.sin(h) * Math.cos(p) * ms;
  G.vel.z = Math.cos(h) * Math.cos(p) * ms;
  G.vel.y = Math.sin(p) * ms * (G.stalled ? 0.4 : 1) - (G.stalled ? 14 : 0);
  G.pos.x += G.vel.x * dt;
  G.pos.y += G.vel.y * dt;
  G.pos.z += G.vel.z * dt;

  // --- deck: rolling takeoff, then airborne
  if (G.onDeck) {
    G.pos.y = DECK_Y;
    if (G.speed > 165 && G.pitch > 2) { G.onDeck = false; }
    if (G.pos.z > 130) { // ran off the bow
      if (G.speed > 165) G.onDeck = false; else crash('Ran off the bow too slow');
    }
  }

  // --- fuel: burn rises with throttle, afterburner drinks it
  const burn = (0.35 + G.throttle * 1.15 + (ab ? 2.6 : 0)) * G.mod.fuel;
  G.fuel = Math.max(0, G.fuel - burn * dt);
  if (G.fuel <= 0) { G.throttle = Math.max(0, G.throttle - dt * 0.5); if (G.speed < STALL_KTS + 20 && !G.onDeck) G.stalled = true; }

  // --- sea + terrain handled by missions/world via checkTerrain()
  G.alt = Math.max(0, (G.pos.y - 0) * 3.28084);
  updateEngine(G.throttle, G.speed, ab);
}

export function damageHull(amount, cause) {
  if (G.mode !== 'fly') return;
  G.hull = Math.max(0, G.hull - amount * G.mod.armour);
  G.shake = Math.min(1, G.shake + 0.35);
  G.chain = 1; G.chainTimer = 0;
  if (G.hull <= 0) crash('Hull destroyed' + (cause ? ' — ' + cause : ''));
}

export function crash(why) {
  if (G.mode !== 'fly') return;
  G.stats.crashes++;
  G.mode = 'results'; G.runOver = true;
  G.crashReason = why || 'Crashed';
  import('./screens.js').then((m) => m.showResults(false, G.crashReason));
  import('./audio.js').then((m) => m.sfx.explosion());
}

export function addScore(n, why) {
  G.score += Math.round(n * G.chain);
  G.chainTimer = 6;
}
export function bumpChain() {
  G.chain = Math.min(12, G.chain + 1);
  G.chainTimer = 6;
}
export function tickChain(dt) {
  if (G.chainTimer > 0) { G.chainTimer -= dt; if (G.chainTimer <= 0) G.chain = 1; }
}
