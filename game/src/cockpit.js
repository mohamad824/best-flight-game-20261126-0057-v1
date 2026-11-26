// cockpit.js — the 3D cockpit. A real cockpit tub with a dashboard, canopy frame,
// control stick the pilot's hand grips, throttle lever, and the PILOT himself
// (helmet, visor, mask, arms on stick + throttle) seated in front of the camera.
// This group is attached to the camera in cockpit view.
import { G } from './state.js';
import { buildPilot } from './people.js';

export function buildCockpit() {
  const rig = new THREE.Group();
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1e24, metalness: 0.5, roughness: 0.6 });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x232830, metalness: 0.4, roughness: 0.55 });

  // cockpit tub floor + side walls
  const floor = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 2.4), darkMat);
  floor.position.set(0, -0.75, 0.2); rig.add(floor);
  for (const s of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 2.4), panelMat);
    wall.position.set(s * 0.85, -0.35, 0.2); rig.add(wall);
  }
  // dashboard: angled panel with glowing dial faces (emissive circles)
  const dash = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.85, 0.25), panelMat);
  dash.position.set(0, -0.05, -1.15); dash.rotation.x = -0.35; rig.add(dash);
  const dialCols = [0x37d67a, 0xffb62e, 0x7ec8ff, 0xff5a2e, 0x9be15d, 0xffcf3d];
  for (let i = 0; i < 6; i++) {
    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.14, 16),
      new THREE.MeshBasicMaterial({ color: dialCols[i] }));
    dial.position.set(-0.55 + (i % 3) * 0.55, 0.12 - Math.floor(i / 3) * 0.34, -1.0);
    dial.rotation.x = -0.35; rig.add(dial);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 6, 16), darkMat);
    rim.position.copy(dial.position); rim.rotation.x = -0.35; rig.add(rim);
  }
  // HUD glass: a small transparent pane with a glowing gunsight ring
  const hudGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.4),
    new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.14, side: THREE.DoubleSide }));
  hudGlass.position.set(0, 0.28, -1.05); rig.add(hudGlass);
  const sight = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.012, 6, 24),
    new THREE.MeshBasicMaterial({ color: 0x7dff9a }));
  sight.position.set(0, 0.28, -1.03); rig.add(sight);

  // canopy frame: two arched ribs + front bow (real geometry the pilot sees through)
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2c3138, metalness: 0.7, roughness: 0.4 });
  for (const z of [-0.5, 0.45]) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 8, 20, Math.PI), frameMat);
    rib.position.set(0, -0.4, z); rib.rotation.y = Math.PI / 2; rib.rotation.z = 0;
    rig.add(rib);
  }
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 8, 20, Math.PI), frameMat);
  bow.position.set(0, -0.4, -1.15); bow.rotation.y = Math.PI / 2; rig.add(bow);

  // control stick + throttle quadrant (the pilot's hands rest on these)
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.55, 8), darkMat);
  stick.position.set(0.12, -0.45, -0.35); stick.rotation.x = 0.25; rig.add(stick);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.1), darkMat);
  grip.position.set(0.12, -0.18, -0.42); rig.add(grip);
  const throttleBase = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.5), darkMat);
  throttleBase.position.set(-0.78, -0.42, -0.2); rig.add(throttleBase);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.08), new THREE.MeshStandardMaterial({ color: 0xffb62e }));
  lever.position.set(-0.78, -0.28, -0.2); lever.rotation.x = -0.5; rig.add(lever);

  // THE PILOT — seated, helmet + visor + mask, right hand on the stick, left on throttle.
  // His local +z is his front (face, hands, knees), so he is turned PI to face the
  // rig's -z (forward, away from the camera behind him).
  const pilot = buildPilot();
  pilot.rotation.y = Math.PI;
  pilot.position.set(0, -0.72, 0.55);
  pilot.scale.setScalar(0.92);
  rig.add(pilot);
  G.pilot = pilot;
  G.cockpit = rig;
  rig.visible = false;
  G.camera.add(rig);
  return rig;
}

// Pilot micro-animation: hands track the stick, head leans into banks.
export function updatePilot() {
  if (!G.pilot) return;
  const p = G.pilot;
  p.rotation.z = -G.bank * 0.0035;
  p.rotation.x = G.pitch * 0.002;
  const arms = p.userData.arms;
  if (arms && arms.R) arms.R.rotation.x = G.pitch * 0.01;
}
