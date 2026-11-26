// input.js — keyboard + mouse. One shared input object; main.js polls it each frame.
export const input = {
  keys: {},
  mouseX: 0, mouseY: 0, mouseActive: false,
  _down: null, _up: null,
};

export function initInput(onKey) {
  input._down = (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!input.keys[e.code]) onKey(e.code, true);
    input.keys[e.code] = true;
  };
  input._up = (e) => { input.keys[e.code] = false; onKey(e.code, false); };
  window.addEventListener('keydown', input._down);
  window.addEventListener('keyup', input._up);
  window.addEventListener('mousemove', (e) => {
    input.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    input.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    input.mouseActive = true;
  });
  window.addEventListener('mousedown', (e) => { if (e.button === 0) input.keys.Mouse0 = true; });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) input.keys.Mouse0 = false; });
  window.addEventListener('blur', () => { input.keys = {}; });
}

export const pressed = (code) => !!input.keys[code];
// Steering intent: -1..1 for roll (turn) and pitch, from keys + mouse.
export function steer() {
  let roll = 0, pitch = 0;
  if (pressed('ArrowLeft') || pressed('KeyA')) roll -= 1;
  if (pressed('ArrowRight') || pressed('KeyD')) roll += 1;
  if (pressed('ArrowUp')) pitch += 1;
  if (pressed('ArrowDown')) pitch -= 1;
  if (input.mouseActive) { roll += input.mouseX * 0.9; pitch -= input.mouseY * 0.7; }
  return { roll: Math.max(-1, Math.min(1, roll)), pitch: Math.max(-1, Math.min(1, pitch)) };
}
