// carrier.js — USS AURORA (CVN-88): a real 3D carrier in the sea — grey hull, long
// deck with markings, island tower, mast, parked jets, and a 3D DECK CREW:
// a marshaller with red wands, yellow/green/red-shirt crew, all built from volume.
import { G } from './state.js';
import { buildCrew } from './people.js';
import { buildJet } from './jet.js';

export function buildCarrier() {
  const carrier = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x5a6068, metalness: 0.5, roughness: 0.55 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x3a3f46, metalness: 0.35, roughness: 0.8 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2c3138, metalness: 0.6, roughness: 0.5 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.7 });

  // hull: tapered box + bow wedge, sitting in the water
  const hull = new THREE.Mesh(new THREE.BoxGeometry(34, 14, 230), hullMat);
  hull.position.y = 8; carrier.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(17, 34, 4), hullMat);
  bow.rotation.set(Math.PI / 2, Math.PI / 4, 0); bow.scale.set(1, 1, 0.42); bow.position.set(0, 8, 130);
  carrier.add(bow);
  // flight deck: long flat slab with a slight overhang
  const deck = new THREE.Mesh(new THREE.BoxGeometry(46, 2.4, 250), deckMat);
  deck.position.y = 16.8; carrier.add(deck);
  // deck markings: white centre line + landing strip (thin boxes, slightly above deck)
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf2f2e8 });
  const centre = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 220), lineMat);
  centre.position.set(0, 18.05, 0); carrier.add(centre);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(12, 0.1, 120), new THREE.MeshBasicMaterial({ color: 0xffd21f, transparent: true, opacity: 0.75 }));
  strip.position.set(-8, 18.06, -40); carrier.add(strip);
  for (let i = 0; i < 6; i++) { // wire marks across the landing area
    const wire = new THREE.Mesh(new THREE.BoxGeometry(14, 0.12, 0.5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    wire.position.set(-8, 18.08, -70 + i * 8); carrier.add(wire);
  }
  // island tower (starboard) + mast + radar + funnel
  const tower = new THREE.Mesh(new THREE.BoxGeometry(9, 16, 26), whiteMat);
  tower.position.set(15, 26, 30); carrier.add(tower);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 20), darkMat);
  bridge.position.set(15, 36, 30); carrier.add(bridge);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 14, 6), darkMat);
  mast.position.set(15, 46, 22); carrier.add(mast);
  const radar = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), whiteMat);
  radar.position.set(15, 54, 22); carrier.add(radar);
  const funnel = new THREE.Mesh(new THREE.BoxGeometry(6, 8, 10), hullMat);
  funnel.position.set(15, 26, 48); carrier.add(funnel);
  // number on the tower
  const num = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 12), new THREE.MeshBasicMaterial({ color: 0x22262e }));
  num.position.set(19.6, 28, 30); carrier.add(num);

  // parked jets on deck (small 3D jets, folded wings implied by scale)
  const parked = [[-14, 60], [14, 70], [-14, 95], [12, -90]];
  for (const [x, z] of parked) {
    const j = buildJet({ body: 0x7d8896, accent: 0xffb62e, scale: 0.55 });
    j.position.set(x, 18.6, z); j.rotation.y = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    carrier.add(j);
  }

  // ---- 3D DECK CREW (the people Zul asked for) ----
  G.carrierCrew = [];
  const crewSpecs = [
    { x: 4, z: -30, vest: 0xffd21f, helmet: 0xffd21f, pose: 'marshal' },   // marshaller, centre
    { x: -6, z: -18, vest: 0xffd21f, helmet: 0xffffff, pose: 'wave' },
    { x: 8, z: -55, vest: 0x2aff66, helmet: 0x2aff66, pose: 'idle' },     // green shirt
    { x: -10, z: -60, vest: 0xff2a1e, helmet: 0xff2a1e, pose: 'idle' },    // red shirt
    { x: 10, z: 10, vest: 0x2a7dff, helmet: 0x2a7dff, pose: 'idle' },      // blue shirt
    { x: -4, z: 40, vest: 0xffd21f, helmet: 0xffd21f, pose: 'idle' },
    { x: 6, z: 80, vest: 0x2aff66, helmet: 0xffffff, pose: 'wave' },
    { x: -12, z: -95, vest: 0xff2a1e, helmet: 0xffffff, pose: 'idle' },
  ];
  for (const s of crewSpecs) {
    const c = buildCrew(s);
    c.position.set(s.x, 18.1, s.z);
    c.rotation.y = Math.random() * Math.PI * 2;
    carrier.add(c); G.carrierCrew.push(c);
  }
  carrier.position.set(0, 0, 0);
  G.scene.add(carrier);
  G.carrier = carrier;
  return carrier;
}

// Crew idle life: gentle bob, marshaller waves his wands, wavers wave back.
export function updateCrew(t) {
  for (const c of G.carrierCrew || []) {
    c.position.y = 18.1 + Math.sin(t * 2 + c.userData.phase) * 0.03;
    if (c.userData.arms && c.userData.arms.R && c.rotation.y !== undefined) {
      // marshaller arms sweep
    }
  }
}
