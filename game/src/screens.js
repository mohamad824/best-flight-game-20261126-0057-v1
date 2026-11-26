// screens.js — title / upgrade / results overlays. The grade is earned from the run:
// score, kills, rings, traps, hull left and carrier health.
import { G, SORTIES } from './state.js';
import { fmt } from './util.js';
import { pickThree, renderUpgradeCards } from './upgrades.js';
import { startSortie } from './missions.js';
import { resetRun } from './state.js';
import { sfx } from './audio.js';

export function hideAll() {
  for (const id of ['title', 'upgrade', 'results', 'paused']) document.getElementById(id).classList.add('hidden');
}
export function showTitle() {
  hideAll();
  G.mode = 'title';
  document.getElementById('title').classList.remove('hidden');
}
export function showUpgrade(nextSortie) {
  hideAll();
  G.mode = 'upgrade';
  document.getElementById('upgrade-kicker').textContent =
    nextSortie <= 2 ? `SORTIE ${G.sortie + 1} COMPLETE — NEXT: ${SORTIES[nextSortie].name}` : 'ALL SORTIES COMPLETE — THE ACE WAITS';
  const three = pickThree();
  renderUpgradeCards(three);
  document.getElementById('upgrade').classList.remove('hidden');
}
export function gradeRun(won) {
  if (!won) return 'F';
  let pts = G.score / 1000 + G.stats.kills * 2 + G.stats.rings + G.stats.traps * 3 + G.hull / 20 + G.carrierHp / 25;
  if (pts >= 34) return 'S';
  if (pts >= 26) return 'A';
  if (pts >= 18) return 'B';
  return 'C';
}
export function showResults(won, reason) {
  hideAll();
  G.mode = 'results';
  document.getElementById('results-kicker').textContent = won ? 'AFTER ACTION REPORT — VICTORY' : 'AFTER ACTION REPORT — RUN OVER';
  document.getElementById('results-title').textContent = won ? 'NIGHTHAWK IS DOWN' : (reason || 'MISSION FAILED');
  document.getElementById('grade').textContent = gradeRun(won);
  const acc = G.stats.shots ? Math.round(G.stats.hits / G.stats.shots * 100) : 0;
  document.getElementById('results-stats').innerHTML = `
    <div><span>FINAL SCORE</span><b>${fmt(G.score)}</b></div>
    <div><span>GRADE</span><b>${gradeRun(won)}</b></div>
    <div><span>RINGS FLOWN</span><b>${G.stats.rings} / 8</b></div>
    <div><span>BANDITS DOWN</span><b>${G.stats.kills}</b></div>
    <div><span>GUN ACCURACY</span><b>${acc}% (${G.stats.hits}/${G.stats.shots})</b></div>
    <div><span>CARRIER TRAPS</span><b>${G.stats.traps}</b></div>
    <div><span>BOLTERS</span><b>${G.stats.bolters}</b></div>
    <div><span>HULL REMAINING</span><b>${Math.round(G.hull)}%</b></div>
    <div><span>FUEL REMAINING</span><b>${Math.round(G.fuel)}%</b></div>
    <div><span>CARRIER HEALTH</span><b>${Math.round(G.carrierHp)}%</b></div>
    <div><span>UPGRADES HELD</span><b>${G.upgrades.length ? G.upgrades.join(', ') : 'none'}</b></div>
    <div><span>TIME</span><b>${Math.round(G.time)}s</b></div>`;
  document.getElementById('results').classList.remove('hidden');
}
export function bindScreens() {
  document.getElementById('btn-fly').onclick = () => { sfx.click(); resetRun(); startSortie(0); };
  document.getElementById('btn-again').onclick = () => { sfx.click(); resetRun(); showTitle(); };
}
