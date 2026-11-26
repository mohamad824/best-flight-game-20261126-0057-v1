// people.js — REAL 3D people. Every figure is built from volume — capsule torso,
// sphere helmet/head, cylinder limbs, box vest — with real depth and lighting.
// No flat drawings: each person reads as a body from any camera angle.
import { G } from './state.js';

function std(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.05, roughness: 0.85, ...opts });
}

// A deck-crew figure, ~1.8 m tall. vest = shirt colour (yellow/green/red/blue),
// helmet colour matches the job. pose: 'idle' | 'marshal' (arms raised with wands) | 'wave'.
export function buildCrew({ vest = 0xffd21f, helmet = 0xffffff, skin = 0xc98d64, pose = 'idle' } = {}) {
  const p = new THREE.Group();
  const vestMat = std(vest), darkMat = std(0x22262e), skinMat = std(skin);
  const helmetMat = new THREE.MeshStandardMaterial({ color: helmet, metalness: 0.3, roughness: 0.35 });

  // legs (two cylinders) + boots
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.78, 8), darkMat);
    leg.position.set(s * 0.13, 0.39, 0); p.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.3), std(0x14161a));
    boot.position.set(s * 0.13, 0.05, 0.04); p.add(boot);
  }
  // torso: capsule with a coloured vest panel
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.5, 4, 10), vestMat);
  torso.position.set(0, 1.12, 0); p.add(torso);
  const vestPanel = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.06), std(0xffffff, { emissive: 0xdddddd, emissiveIntensity: 0.15 }));
  vestPanel.position.set(0, 1.12, 0.24); p.add(vestPanel);
  // head + helmet + visor strip
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), skinMat);
  head.position.set(0, 1.62, 0); p.add(head);
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.185, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), helmetMat);
  helm.position.set(0, 1.64, 0); p.add(helm);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 12), helmetMat);
  brim.position.set(0, 1.66, 0); p.add(brim);

  // arms: shoulder pivots so marshal/wave poses can animate
  const arms = {};
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.28, 1.42, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.62, 8), vestMat);
    arm.position.set(0, -0.31, 0);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), skinMat);
    hand.position.set(0, -0.64, 0);
    pivot.add(arm, hand);
    p.add(pivot);
    arms[s < 0 ? 'L' : 'R'] = pivot;
  }
  if (pose === 'marshal') {
    arms.L.rotation.z = 2.4; arms.R.rotation.z = -2.4; // both arms up, wands out
    for (const s of [-1, 1]) {
      const wand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6),
        new THREE.MeshBasicMaterial({ color: 0xff3020 }));
      wand.position.set(s * 0.62, 2.15, 0); wand.rotation.z = s * 0.5; p.add(wand);
    }
  } else if (pose === 'wave') {
    arms.R.rotation.z = -2.6; arms.R.rotation.x = 0.4;
  }
  p.userData.arms = arms;
  p.userData.phase = Math.random() * Math.PI * 2;
  return p;
}

// The pilot, seated in the cockpit: helmet, oxygen mask, torso, arms reaching to the
// stick and throttle, legs bent to the rudder pedals. Built from the same volume parts.
export function buildPilot() {
  const p = new THREE.Group();
  const suitMat = std(0x3a4a2e), skinMat = std(0xc98d64);
  const helmetMat = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, metalness: 0.25, roughness: 0.3 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x0d1420, metalness: 0.9, roughness: 0.08, emissive: 0x1a3a5a, emissiveIntensity: 0.4 });

  // seat + harness
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.9, 0.3), std(0x1c1f24));
  seat.position.set(0, 0.45, -0.28); seat.rotation.x = -0.18; p.add(seat);
  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.18), std(0x1c1f24));
  headrest.position.set(0, 1.0, -0.34); p.add(headrest);

  // torso (seated, leaning slightly forward) + harness straps
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.42, 4, 10), suitMat);
  torso.position.set(0, 0.78, 0.02); torso.rotation.x = 0.12; p.add(torso);
  for (const s of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.5, 0.03), std(0x22262e));
    strap.position.set(s * 0.12, 0.82, 0.26); p.add(strap);
  }
  // helmet + visor + oxygen mask + hose
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), helmetMat);
  helmet.position.set(0, 1.28, 0.06); p.add(helmet);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 10), visorMat);
  visor.scale.set(1, 0.72, 0.62); visor.position.set(0, 1.29, 0.12); p.add(visor);
  const mask = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), std(0x2c3138));
  mask.scale.set(1, 0.8, 0.7); mask.position.set(0, 1.16, 0.2); p.add(mask);
  const hose = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 6, 12, Math.PI), std(0x14161a));
  hose.position.set(0.12, 1.02, 0.18); hose.rotation.set(0.4, 0.5, 0); p.add(hose);

  // arms: shoulders -> stick (right hand) and throttle (left hand)
  const arms = {};
  for (const [side, s] of [['R', 1], ['L', -1]]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.3, 1.02, 0.08);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 8), suitMat);
    upper.position.set(0, -0.2, 0.05); upper.rotation.x = 0.7;
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.4, 8), suitMat);
    fore.position.set(s * 0.02, -0.48, 0.28); fore.rotation.x = 1.1;
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), std(0x22262e));
    glove.position.set(s * 0.03, -0.55, 0.48);
    pivot.add(upper, fore, glove);
    p.add(pivot); arms[side] = pivot;
  }
  // legs: thighs forward, shins down to pedals
  for (const s of [-1, 1]) {
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.36, 4, 8), suitMat);
    thigh.position.set(s * 0.16, 0.42, 0.32); thigh.rotation.x = 1.35; p.add(thigh);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.34, 4, 8), suitMat);
    shin.position.set(s * 0.16, 0.16, 0.55); shin.rotation.x = 0.25; p.add(shin);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.3), std(0x14161a));
    boot.position.set(s * 0.16, 0.06, 0.68); p.add(boot);
  }
  p.userData.arms = arms;
  return p;
}
