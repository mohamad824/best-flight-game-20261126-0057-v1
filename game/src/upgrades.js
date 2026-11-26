// upgrades.js — the between-sortie draft: pick 1 of 3. The winners' meta layer in
// flight form: choices that matter, shown with what you already hold.
import { G, UPGRADES } from './state.js';
import { applyUpgrade } from './state.js';
import { sfx } from './audio.js';

export function pickThree() {
  const pool = [...UPGRADES];
  const out = [];
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}
export function renderUpgradeCards(three) {
  const box = document.getElementById('upgrade-cards');
  box.innerHTML = '';
  three.forEach((u, i) => {
    const card = document.createElement('div');
    card.className = 'upcard';
    const owned = G.upgrades.includes(u.id);
    card.innerHTML = `<div class="ic">${u.icon}</div><h3>${u.name}${owned ? ' ✓' : ''}</h3><p>${u.desc}</p><span class="key">${i + 1}</span>`;
    card.onclick = () => chooseUpgrade(u, three);
    box.appendChild(card);
  });
  window.__upgradeChoice = (i) => { if (three[i]) chooseUpgrade(three[i], three); };
}
export function chooseUpgrade(u, three) {
  sfx.click();
  applyUpgrade(u.id);
  import('./missions.js').then((m) => {
    const next = G.sortie + 1;
    m.startSortie(next);
  });
}
