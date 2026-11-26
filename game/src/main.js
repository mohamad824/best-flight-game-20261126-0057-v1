// main.js — bootstrap + render loop. Builds the 3D world (sea, islands, carrier with
// its 3D deck crew, the player's 3D jet, the 3D cockpit with its pilot), drives the
// chase and cockpit cameras, and runs the game loop.
import { G, resetRun } from './state.js';
import { initInput, input, pressed } from './input.js';
import { initAudio, resumeAudio, toggleMute, sfx } from './audio.js';
import { updateFlight, tickChain, damageHull } from './physics.js';
import { buildWorld } from './world.js';
import { buildCarrier, updateCrew } from './carrier.js';
import { buildPlayerJet } from './jet.js';
import { buildCockpit, updatePilot } from './cockpit.js';
import { updateBandits, fireGuns } from './enemies.js';
import { updateAce } from './ace.js';
import { updateMissions, startSortie } from './missions.js';
import { updateParticles, smokePuff } from './particles.js';
import { updateHud, refreshObjective } from './hud.js';
import { bindScreens, showTitle } from './screens.js';
import { applyShot, exposeGame } from './debug.js';
import { clamp, rad } from './util.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 12000);
scene.add(camera);
G.scene = scene; G.camera = camera; G.renderer = renderer;

buildWorld();
buildCarrier();
const playerJet = buildPlayerJet();
scene.add(playerJet);
G.playerJet = playerJet;
buildCockpit();
G.cockpit.position.set(0, -0.9, -3.4); // pilot's helmet + hands sit low in the frame, dash ahead

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let smokeTimer = 0, titleAngle = 0, camInit = false;
const clock = new THREE.Clock();

function syncJetMesh() {
  playerJet.position.set(G.pos.x, G.pos.y, G.pos.z);
  playerJet.rotation.order = 'YXZ';
  playerJet.rotation.y = rad(G.heading);
  playerJet.rotation.x = -rad(G.pitch);
  playerJet.rotation.z = -rad(G.bank);
  const flame = playerJet.userData.flame;
  const ab = G.afterburner && G.throttle > 0.7;
  flame.visible = ab || G.speed > 380;
  flame.scale.z = ab ? 1.5 + Math.sin(G.time * 31) * 0.18 : 1;
  playerJet.userData.glow.intensity = flame.visible ? (ab ? 2.6 : 1.2) : 0;
}

function updateCamera(dt) {
  const h = rad(G.heading), p = rad(G.pitch);
  const fwd = new THREE.Vector3(Math.sin(h) * Math.cos(p), Math.sin(p), Math.cos(h) * Math.cos(p));
  if (G.view === 'cockpit') {
    // In cockpit view the exterior jet is hidden: the cockpit rig + pilot replace it
    // (otherwise the camera sits inside the fuselage and the pilot fills the frame).
    playerJet.visible = false;
    const head = new THREE.Vector3(G.pos.x, G.pos.y + 1.15, G.pos.z)
      .addScaledVector(fwd, -0.55);
    camera.position.copy(head);
    camera.up.set(0, 1, 0);
    // look slightly down: the pilot drops to the lower third, the deck fills the view
    camera.lookAt(head.clone().addScaledVector(fwd, 60).add(new THREE.Vector3(0, -6 - G.bank * 0.06, 0)));
    camera.rotation.z += rad(-G.bank * 0.35);
    G.cockpit.visible = true;
    updatePilot();
  } else {
    playerJet.visible = true;
    G.cockpit.visible = false;
    const back = fwd.clone().multiplyScalar(-14);
    const target = new THREE.Vector3(G.pos.x + back.x, G.pos.y + 4.0 + back.y * 0.4, G.pos.z + back.z);
    // Locked chase cam: hard-attach every frame (a lerped cam trails ~30 m behind
    // a 460 kt jet and the jet shrinks to a speck). Shake is added after.
    camera.position.copy(target);
    camInit = true;
    if (G.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * G.shake * 0.7;
      camera.position.y += (Math.random() - 0.5) * G.shake * 0.7;
      G.shake = Math.max(0, G.shake - dt * 2);
    }
    camera.up.set(0, 1, 0);
    camera.lookAt(G.pos.x + fwd.x * 60, G.pos.y + 1.5 + fwd.y * 60, G.pos.z + fwd.z * 60);
    camera.rotation.z += rad(-G.bank * 0.22);
  }
}

function updateTitleCamera(dt) {
  titleAngle += dt * 0.05;
  const r = 260;
  camera.position.set(Math.sin(titleAngle) * r, 55 + Math.sin(titleAngle * 0.6) * 12, -60 + Math.cos(titleAngle) * r);
  camera.lookAt(0, 22, 0);
  G.cockpit.visible = false;
}

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (G.mode === 'title') { updateTitleCamera(dt); updateCrew(G.time); }
  if (!G.paused && G.mode === 'fly') {
    G.time += dt;
    G.firing = pressed('Space') || !!input.keys.Mouse0;
    updateFlight(dt);
    fireGuns(dt);
    updateBandits(dt);
    updateAce(dt);
    updateMissions(dt);
    tickChain(dt);
    if (G.hull < 60 && !G.onDeck) {
      smokeTimer -= dt;
      if (smokeTimer <= 0) { smokeTimer = 0.14; smokePuff(playerJet.position.clone().add(new THREE.Vector3(0, 0, -4))); }
    }
    if (G.stalled && Math.random() < dt * 2) sfx.warn();
  }
  if (G.mode === 'fly' || G.mode === 'results' || G.mode === 'upgrade') {
    syncJetMesh();
    updateCamera(dt);
    // sea + glitter follow the player so the ocean never ends
    const sea = scene.getObjectByName('sea');
    if (sea) { sea.position.x = G.pos.x; sea.position.z = G.pos.z; }
    const glitter = scene.getObjectByName('glitter');
    if (glitter) { glitter.position.x = G.pos.x - 900; glitter.position.z = G.pos.z - 2200; }
    for (const c of G.clouds || []) { c.position.x -= dt * 3; if (c.position.x < G.pos.x - 1800) c.position.x = G.pos.x + 1800; }
    updateCrew(G.time);
  }
  updateParticles(dt);
  updateHud();
  renderer.render(scene, camera);
}

function onKey(code, down) {
  if (!down) return;
  initAudio(); resumeAudio();
  if (code === 'KeyM') { toggleMute(); return; }
  if (code === 'KeyC' && G.mode === 'fly') { G.view = G.view === 'chase' ? 'cockpit' : 'chase'; return; }
  if (code === 'KeyP' && (G.mode === 'fly' || G.paused)) {
    G.paused = !G.paused;
    document.getElementById('paused').classList.toggle('hidden', !G.paused);
    return;
  }
  if (code === 'Enter' && G.mode === 'title') { resetRun(); startSortie(0); return; }
  if (code === 'Enter' && G.mode === 'results') { resetRun(); showTitle(); return; }
  if (G.mode === 'upgrade' && ['Digit1', 'Digit2', 'Digit3'].includes(code)) {
    const i = Number(code.slice(-1)) - 1;
    if (window.__upgradeChoice) window.__upgradeChoice(i);
  }
}

initInput(onKey);
bindScreens();
resetRun();
showTitle();
refreshObjective();
applyShot();
exposeGame();
frame();
