// debug.js — screenshot presets (?shot=cover|title|takeoff|results) and the
// window.__game handle the play-test uses. The pixels are always the game's own
// code running live; a preset only sets the state, never draws anything.
import { G } from './state.js';
import { startSortie } from './missions.js';
import { spawnAce } from './ace.js';
import { showResults } from './screens.js';
import { resetRun } from './state.js';

export function applyShot() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (!shot) return;
  if (shot === 'title') { resetRun(); G.mode = 'title'; return; }
  if (shot === 'takeoff') {
    resetRun();
    startSortie(0);
    G.view = 'cockpit';
    G.throttle = 0.85; G.speed = 140; G.afterburner = true;
    G.fuel = 96; G.hull = 100; G.score = 0;
    return;
  }
  if (shot === 'results') {
    resetRun();
    G.score = 18480; G.chain = 6;
    G.stats = { rings: 8, ringsTotal: 8, kills: 6, shots: 41, hits: 33, traps: 1, bolters: 0, crashes: 0, aceHits: 12 };
    G.hull = 82; G.fuel = 34; G.carrierHp = 88; G.time = 412;
    G.upgrades = ['afterburner', 'armour', 'guns'];
    G.sortie = 3;
    showResults(true, 'NIGHTHAWK is down — the sky is yours.');
    return;
  }
  if (shot === 'cover') {
    // Mid ace duel, phase 3, ace HP low, big score, CHAIN popup, carrier + coast below.
    resetRun();
    startSortie(3);
    G.pos = { x: 55, y: 140, z: 420 }; // offset right of the carrier centreline so USS AURORA reads beside the jet
    G.heading = 180; G.pitch = -4; G.bank = 12;
    G.speed = 420; G.throttle = 0.82; G.afterburner = true;
    G.onDeck = false; G.fuel = 62; G.hull = 82;
    G.score = 12480; G.chain = 8; G.chainTimer = 5;
    G.stats.kills = 6; G.stats.rings = 8;
    G.ace.hp = 26; G.ace.phase = 3;
    G.ace.angle = -Math.PI / 2 - 0.35; G.ace.radius = 120; // start ahead, drift through centre
    G.ace.pos.set(-18, 162, 300);
    G.ace.mesh.position.copy(G.ace.pos);
    setTimeout(() => import('./hud.js').then((m) => m.chainPop(8)), 400);
    return;
  }
}

export function exposeGame() {
  window.__game = { G, startSortie, resetRun };
}
