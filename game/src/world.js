// world.js — golden-hour ocean, coastline islands, sun, clouds. One coherent style:
// warm amber light, cool deep-blue sea and sky, one warm accent everywhere.
import { G } from './state.js';
import { mulberry32 } from './util.js';

export function buildWorld() {
  const scene = G.scene;
  // warm haze fog + sky colour
  scene.background = new THREE.Color(0x2e4a6b);
  scene.fog = new THREE.Fog(0xe8a55c, 600, 5200);

  // lights: low golden sun + cool sky fill
  const sun = new THREE.DirectionalLight(0xffb35c, 1.9);
  sun.position.set(-900, 320, -1400);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0x9db8d6, 0x1c2f45, 0.85));
  const bounce = new THREE.DirectionalLight(0x4a6a9a, 0.35);
  bounce.position.set(600, 200, 900); scene.add(bounce);

  // sun disc: glowing sprite low on the horizon
  const sunCanvas = document.createElement('canvas'); sunCanvas.width = sunCanvas.height = 128;
  const c = sunCanvas.getContext('2d');
  const grad = c.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,240,200,1)'); grad.addColorStop(0.35, 'rgba(255,190,90,0.9)'); grad.addColorStop(1, 'rgba(255,140,40,0)');
  c.fillStyle = grad; c.fillRect(0, 0, 128, 128);
  const sunTex = new THREE.CanvasTexture(sunCanvas);
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, transparent: true, depthWrite: false }));
  sunSprite.scale.set(900, 900, 1); sunSprite.position.set(-2600, 420, -4200);
  scene.add(sunSprite);

  // sea: huge plane, deep blue, slight shine; follows the player (re-centred in main.js)
  const seaGeo = new THREE.PlaneGeometry(12000, 12000, 1, 1);
  const seaMat = new THREE.MeshPhongMaterial({ color: 0x14486e, shininess: 55, specular: 0x7a4a22 });
  const sea = new THREE.Mesh(seaGeo, seaMat);
  sea.rotation.x = -Math.PI / 2; sea.position.y = 0; sea.name = 'sea';
  scene.add(sea);

  // sun glitter: a band of small additive sparkles on the water toward the sun
  const glitterGeo = new THREE.PlaneGeometry(2400, 420);
  const glitterMat = new THREE.MeshBasicMaterial({ color: 0xffb35c, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false });
  const glitter = new THREE.Mesh(glitterGeo, glitterMat);
  glitter.rotation.x = -Math.PI / 2; glitter.position.set(-900, 0.6, -2200); glitter.name = 'glitter';
  scene.add(glitter);

  // islands: cones with green tops + sand skirts, placed along the course
  const rnd = mulberry32(20261126);
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xc49a68, roughness: 0.9 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x5a3d2b, roughness: 0.95 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x2f5a28, roughness: 0.9 });
  G.islands = [];
  const spots = [
    { x: -350, z: 250, r: 170, h: 90 }, { x: 380, z: 180, r: 150, h: 75 },
    { x: -260, z: 700, r: 190, h: 95 }, { x: 320, z: 1050, r: 150, h: 70 },
    { x: -140, z: 1500, r: 230, h: 120 }, { x: 420, z: 1900, r: 180, h: 85 },
    { x: -380, z: 2350, r: 200, h: 110 }, { x: 180, z: 2750, r: 260, h: 140 },
    { x: -520, z: 3200, r: 170, h: 80 }, { x: 520, z: 3500, r: 210, h: 100 },
  ];
  for (const s of spots) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(s.r * 0.92, s.r, s.h * 0.45, 9), sandMat);
    base.position.y = s.h * 0.2; g.add(base);
    const rock = new THREE.Mesh(new THREE.ConeGeometry(s.r * 0.78, s.h, 9), rockMat);
    rock.position.y = s.h * 0.6; g.add(rock);
    const top = new THREE.Mesh(new THREE.ConeGeometry(s.r * 0.42, s.h * 0.42, 9), greenMat);
    top.position.y = s.h * 0.95; g.add(top);
    // a few trees: tiny cone + cylinder
    for (let i = 0; i < 5; i++) {
      const a = rnd() * Math.PI * 2, rr = rnd() * s.r * 0.4;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 9, 5), rockMat);
      trunk.position.set(Math.cos(a) * rr, s.h * 0.72, Math.sin(a) * rr); g.add(trunk);
      const crown = new THREE.Mesh(new THREE.ConeGeometry(6, 14, 6), greenMat);
      crown.position.set(Math.cos(a) * rr, s.h * 0.72 + 10, Math.sin(a) * rr); g.add(crown);
    }
    g.position.set(s.x, 0, s.z);
    scene.add(g);
    G.islands.push({ x: s.x, z: s.z, r: s.r * 0.85, h: s.h });
  }

  // clouds: flattened white sphere clusters drifting slowly
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffe8cc, roughness: 1, transparent: true, opacity: 0.85 });
  G.clouds = [];
  for (let i = 0; i < 16; i++) {
    const cl = new THREE.Group();
    const n = 3 + Math.floor(rnd() * 3);
    for (let j = 0; j < n; j++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(18 + rnd() * 26, 8, 6), cloudMat);
      s.position.set(j * 26 - n * 13 + rnd() * 10, rnd() * 8, rnd() * 20 - 10);
      s.scale.y = 0.42; cl.add(s);
    }
    cl.position.set((rnd() - 0.5) * 3200, 260 + rnd() * 220, 300 + rnd() * 3400);
    scene.add(cl); G.clouds.push(cl);
  }
}

// Terrain height at (x,z): island cone height, else 0 (sea level).
export function terrainHeight(x, z) {
  let h = 0;
  for (const isl of G.islands || []) {
    const dx = x - isl.x, dz = z - isl.z, d = Math.hypot(dx, dz);
    if (d < isl.r) h = Math.max(h, isl.h * (1 - d / isl.r));
  }
  return h;
}
// Carrier deck rectangle test (deck y = 18, deck spans x -14..14, z -120..120).
export function overDeck(x, z) { return Math.abs(x) < 14 && z > -120 && z < 120; }
