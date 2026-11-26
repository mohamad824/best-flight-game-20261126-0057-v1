// particles.js — tracers, explosions, smoke trail, sparks. Pure Three.js meshes,
// pooled so the frame rate never stutters.
import { G } from './state.js';

let pool = [];
function makeBurst(scene, pos, color, n, speed, life, size, gravity) {
  const geo = new THREE.SphereGeometry(size, 6, 5);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, mat.clone());
    m.position.copy(pos);
    const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    m.userData = { vx: Math.cos(a) * Math.cos(b) * v, vy: Math.sin(b) * v, vz: Math.sin(a) * Math.cos(b) * v, life: life * (0.6 + Math.random() * 0.7), age: 0, grav: gravity || 0 };
    scene.add(m); pool.push(m);
  }
}
export function explosion(pos, big) {
  if (!G.scene) return;
  makeBurst(G.scene, pos, 0xffa028, big ? 26 : 14, big ? 26 : 16, 1.1, big ? 1.6 : 1.0, -6);
  makeBurst(G.scene, pos, 0x3a3a3a, big ? 16 : 8, big ? 14 : 9, 1.8, big ? 2.4 : 1.6, 2);
  makeBurst(G.scene, pos, 0xfff2b0, 8, 34, 0.5, 0.9, 0);
}
export function sparks(pos) { if (G.scene) makeBurst(G.scene, pos, 0xffe27a, 6, 18, 0.5, 0.5, -4); }

// Tracer: a glowing stretched box from gun to target point, fades in 90 ms.
export function tracer(from, to) {
  if (!G.scene) return;
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = dir.length();
  const geo = new THREE.BoxGeometry(0.25, 0.25, len);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.95 });
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(from).addScaledVector(dir, 0.5);
  m.lookAt(to);
  m.userData = { life: 0.09, age: 0, vx: 0, vy: 0, vz: 0, grav: 0, tracer: true };
  G.scene.add(m); pool.push(m);
}

// Smoke puffs from a damaged jet — called on a timer by main.js.
export function smokePuff(pos) {
  if (!G.scene) return;
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 7, 6),
    new THREE.MeshBasicMaterial({ color: 0x2c2c30, transparent: true, opacity: 0.55 }));
  m.position.copy(pos);
  m.userData = { vx: (Math.random() - 0.5) * 3, vy: 2, vz: (Math.random() - 0.5) * 3, life: 1.6, age: 0, grav: 1, grow: true };
  G.scene.add(m); pool.push(m);
}

export function updateParticles(dt) {
  for (let i = pool.length - 1; i >= 0; i--) {
    const m = pool[i];
    m.userData.age += dt;
    if (m.userData.age >= m.userData.life) {
      G.scene.remove(m); m.geometry.dispose(); m.material.dispose(); pool.splice(i, 1); continue;
    }
    m.position.x += m.userData.vx * dt;
    m.position.y += (m.userData.vy + m.userData.grav * m.userData.age) * dt;
    m.position.z += m.userData.vz * dt;
    const k = 1 - m.userData.age / m.userData.life;
    m.material.opacity = m.userData.tracer ? k : k * 0.6;
    if (m.userData.grow) m.scale.setScalar(1 + m.userData.age * 1.4);
  }
  if (pool.length > 400) { // safety valve
    const extra = pool.splice(0, pool.length - 400);
    extra.forEach((m) => { G.scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
  }
}
