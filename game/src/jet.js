// jet.js — REAL 3D fighter geometry. Every jet is built from volume: a lathed fuselage,
// swept wings, twin canted tails, a glass canopy, intakes, and a glowing afterburner.
// No flat sprite anywhere — the mesh has depth, perspective and lighting from every angle.
import { G } from './state.js';

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.42, ...opts });
}

export function buildJet({ body = 0x8a97a8, accent = 0xffb62e, canopy = 0x1b3a55, scale = 1 } = {}) {
  const jet = new THREE.Group();
  const bodyMat = mat(body), accentMat = mat(accent, { emissive: accent, emissiveIntensity: 0.25 });
  const darkMat = mat(0x2c3138, { metalness: 0.7, roughness: 0.35 });
  const glassMat = new THREE.MeshStandardMaterial({ color: canopy, metalness: 0.2, roughness: 0.08, emissive: 0x2a5a8a, emissiveIntensity: 0.55 });

  // fuselage: nose cone + long cylinder + tapered tail (real volume, lathed profile)
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.85, 3.4, 12), bodyMat);
  nose.rotation.x = Math.PI / 2; nose.position.set(0, 0, 4.6);
  const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 4.4, 12), bodyMat);
  mid.rotation.x = Math.PI / 2; mid.position.set(0, 0, 1.2);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.55, 2.6, 12), bodyMat);
  tail.rotation.x = Math.PI / 2; tail.position.set(0, 0, -2.3);
  jet.add(nose, mid, tail);

  // canopy: a half-sphere of lit glass, with a tiny pilot helmet visible inside
  const canopyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
  canopyMesh.scale.set(0.9, 0.75, 1.9); canopyMesh.position.set(0, 0.42, 2.1);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), mat(0xf2f2f2, { roughness: 0.3 }));
  helmet.position.set(0, 0.42, 2.35);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), mat(0x111418, { metalness: 0.9, roughness: 0.1 }));
  visor.scale.set(1, 0.7, 0.6); visor.position.set(0, 0.44, 2.55);
  jet.add(canopyMesh, helmet, visor);

  // main wings: swept, thin boxes with a slight dihedral, plus tip rails
  const wingGeo = new THREE.BoxGeometry(4.6, 0.16, 1.9);
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(wingGeo, bodyMat);
    w.position.set(s * 2.4, -0.08, 0.1); w.rotation.y = s * -0.42; w.rotation.z = s * 0.06;
    jet.add(w);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 1.5), accentMat);
    rail.position.set(s * 4.55, -0.02, -0.35); rail.rotation.y = s * -0.42;
    jet.add(rail);
  }
  // tailplanes
  for (const s of [-1, 1]) {
    const tp = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 1.0), bodyMat);
    tp.position.set(s * 1.05, 0.05, -2.9); tp.rotation.y = s * -0.5;
    jet.add(tp);
    // twin tails, canted outward — the signature silhouette (body colour, amber tips)
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.7, 1.25), bodyMat);
    fin.position.set(s * 0.85, 0.85, -2.7); fin.rotation.z = s * -0.28; fin.rotation.x = -0.18;
    jet.add(fin);
  }
  // intakes under the wing roots
  for (const s of [-1, 1]) {
    const intake = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 2.2), darkMat);
    intake.position.set(s * 1.05, -0.45, 0.9);
    jet.add(intake);
  }
  // spine + nose probe + wingtip lights
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 3.6), darkMat);
  spine.position.set(0, 0.55, 0.4); jet.add(spine);
  const probe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6), darkMat);
  probe.rotation.x = Math.PI / 2; probe.position.set(0, 0.1, 6.8); jet.add(probe);
  const navL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2a1a }));
  navL.position.set(-4.7, 0, -0.4); jet.add(navL);
  const navR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0x2aff66 }));
  navR.position.set(4.7, 0, -0.4); jet.add(navR);

  // afterburner: twin nozzle cones + a glowing flame cone + point light.
  // Flames are additive and slim so they read as fire, not airframe.
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
  const flame = new THREE.Group();
  for (const s of [-1, 1]) {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.8, 10), darkMat);
    nozzle.rotation.x = Math.PI / 2; nozzle.position.set(s * 0.45, 0, -3.6);
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2.4, 10), flameMat);
    f.rotation.x = -Math.PI / 2; f.position.set(s * 0.45, 0, -5.0);
    flame.add(nozzle, f);
  }
  const glow = new THREE.PointLight(0xff8a1a, 0, 26);
  glow.position.set(0, 0, -5.5);
  flame.add(glow);
  flame.visible = false;
  jet.add(flame);

  jet.scale.setScalar(scale);
  jet.userData.flame = flame; jet.userData.glow = glow;
  return jet;
}

// Player jet: sunset-falcon livery (grey body, amber accents).
export function buildPlayerJet() { return buildJet({ body: 0x9aa7b5, accent: 0xffb62e, scale: 1 }); }
// Bandit: dark red aggressor.
export function buildBanditJet() { return buildJet({ body: 0x5a2a2e, accent: 0xd42a1e, canopy: 0x3a0d12, scale: 0.92 }); }
// NIGHTHAWK: near-black with blood-red accents.
export function buildAceJet() { return buildJet({ body: 0x1c1f26, accent: 0xff2a1e, canopy: 0x12060a, scale: 1.05 }); }
