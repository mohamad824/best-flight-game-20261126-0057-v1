// hud.js — the DOM instrument layer: score + CHAIN, mission top bar, bandit roster,
// ALT/SPD/HDG tapes, fuel/hull/G/throttle gauges, ace HP bar, banners, warnings.
// Updated every frame from the shared state; the 3D view stays pure Three.js.
import { G, SORTIES } from './state.js';
import { fmt, pad3, mmss } from './util.js';

const $ = (id) => document.getElementById(id);
let last = {};

function setText(id, v) { if (last[id] !== v) { last[id] = v; const el = $(id); if (el) el.textContent = v; } }
function setWidth(id, v) { const el = $(id); if (el) el.style.width = v; }

export function refreshObjective() {
  const s = SORTIES[G.sortie];
  setText('mission-name', s.name);
  setText('objective', s.obj);
}
export function showBannerDom(text, kind) {
  const b = $('banner');
  b.textContent = text;
  b.className = kind || '';
  b.classList.remove('hidden');
  setTimeout(() => b.classList.add('hidden'), 2100);
}
export function chainPop(chain) {
  const el = $('chain-pop');
  el.textContent = `CHAIN ×${chain}!`;
  el.classList.remove('hidden');
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  setTimeout(() => el.classList.add('hidden'), 900);
}

export function updateHud() {
  const hud = $('hud');
  hud.classList.toggle('hidden', G.mode !== 'fly');
  if (G.mode !== 'fly') return;
  setText('score', fmt(G.score));
  const chainEl = $('chain');
  setText('chain', `CHAIN ×${G.chain}`);
  chainEl.classList.toggle('hot', G.chain >= 4);
  setText('timer', G.missionTime > 0 ? `TIME ${mmss(G.missionTime)}` : 'TIME --:--');
  setText('alt-val', fmt(G.alt));
  setText('spd-val', fmt(G.speed));
  setText('hdg-val', pad3(G.heading) + '°');
  setWidth('alt-fill', Math.min(100, G.alt / 120) + '%');
  setWidth('spd-fill', Math.min(100, G.speed / 7.2) + '%');
  setWidth('hdg-fill', (G.heading / 3.6) + '%');
  setWidth('fuel-fill', G.fuel + '%');
  setWidth('hull-fill', G.hull + '%');
  setWidth('g-fill', Math.min(100, G.gForce / 9 * 100) + '%');
  setWidth('thr-fill', G.throttle * 100 + '%');
  setText('fuel-val', Math.round(G.fuel) + '%');
  setText('hull-val', Math.round(G.hull) + '%');
  setText('g-val', G.gForce.toFixed(1) + ' G');
  setText('thr-val', Math.round(G.throttle * 100) + '%');
  setText('carrier-hp', Math.round(G.carrierHp) + '%');

  // roster: bandits with per-unit status (or the ace in the duel)
  const list = $('roster-list');
  let html = '';
  if (G.sortie === 1 || G.sortie === 3) {
    const units = G.sortie === 3
      ? (G.ace ? [{ name: 'NIGHTHAWK', hp: G.ace.hp, alive: G.ace.alive, status: G.ace.status, phase: G.ace.phase }] : [])
      : G.bandits;
    for (const u of units) {
      const cls = !u.alive ? 'st-down' : (u.status === 'ON CARRIER!' ? 'st-in' : 'st-far');
      const label = !u.alive ? 'DOWN ✖' : (u.status || 'INBOUND');
      html += `<div class="roster-row"><span>${u.name}${u.phase ? ' · P' + u.phase : ''}</span><span class="${cls}">${label}</span></div>`;
    }
    if (!units.length) html = '<div class="roster-row"><span>— clear skies —</span><span class="st-far">✓</span></div>';
  } else if (G.sortie === 0) {
    html = `<div class="roster-row"><span>RINGS</span><span class="st-in">${G.stats.rings} / 8</span></div>
      <div class="roster-row"><span>BEST CHAIN</span><span class="st-far">×${G.chain}</span></div>`;
  } else {
    html = `<div class="roster-row"><span>LANDING</span><span class="st-in">TRAP THE WIRE</span></div>
      <div class="roster-row"><span>TARGET SPD</span><span class="st-far">130–160 KTS</span></div>`;
  }
  if (last.roster !== html) { last.roster = html; list.innerHTML = html; }

  // ace bar
  const acebar = $('acebar');
  if (G.sortie === 3 && G.ace) {
    acebar.classList.remove('hidden');
    setText('ace-phase', String(G.ace.phase));
    setWidth('ace-hp-fill', Math.max(0, G.ace.hp / G.ace.maxHp * 100) + '%');
  } else acebar.classList.add('hidden');

  // upgrades held
  const held = $('upgrades-held');
  const uh = G.upgrades.map((u) => `<span class="up">${u.toUpperCase()}</span>`).join('');
  if (last.held !== uh) { last.held = uh; held.innerHTML = uh ? 'HANGAR: ' + uh : ''; }

  // stall warning
  $('warn').classList.toggle('hidden', !(G.stalled && G.mode === 'fly'));
  $('crosshair').style.display = G.view === 'cockpit' ? 'none' : 'block';
}
