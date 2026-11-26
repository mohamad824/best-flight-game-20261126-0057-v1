// audio.js — original synth sounds via WebAudio. No audio files, no borrowed music.
// Engine hum, wind, gun, explosion, beeps, trap chime — all generated oscillators/noise.
let ctx = null, master = null, engineOsc = null, engineOsc2 = null, engineGain = null, windSrc = null, windGain = null, muted = false;

export function initAudio() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    // engine: two detuned saws through a lowpass
    engineOsc = ctx.createOscillator(); engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 55;
    engineOsc2 = ctx.createOscillator(); engineOsc2.type = 'sawtooth'; engineOsc2.frequency.value = 82;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    engineGain = ctx.createGain(); engineGain.gain.value = 0.0;
    engineOsc.connect(lp); engineOsc2.connect(lp); lp.connect(engineGain); engineGain.connect(master);
    engineOsc.start(); engineOsc2.start();
    // wind: looped noise buffer
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    windSrc = ctx.createBufferSource(); windSrc.buffer = buf; windSrc.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.6;
    windGain = ctx.createGain(); windGain.gain.value = 0.0;
    windSrc.connect(bp); bp.connect(windGain); windGain.connect(master); windSrc.start();
  } catch (e) { ctx = null; }
}
export function resumeAudio() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
export function toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.5; return muted; }

// Called every frame: engine pitch follows throttle/speed, wind follows airspeed.
export function updateEngine(throttle, speedKts, afterburner) {
  if (!ctx || !engineOsc) return;
  const t = ctx.currentTime;
  const base = 42 + throttle * 95 + (afterburner ? 45 : 0);
  engineOsc.frequency.setTargetAtTime(base, t, 0.08);
  engineOsc2.frequency.setTargetAtTime(base * 1.5 + 3, t, 0.08);
  engineGain.gain.setTargetAtTime(0.05 + throttle * 0.09 + (afterburner ? 0.05 : 0), t, 0.1);
  windGain.gain.setTargetAtTime(Math.min(0.16, speedKts / 4200), t, 0.15);
}

function blip(freq, dur, type, vol, slideTo) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + dur);
}
function noiseBurst(dur, vol, freq) {
  if (!ctx) return;
  const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ctx.createBufferSource(); s.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 900;
  const g = ctx.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(master); s.start();
}
export const sfx = {
  gun() { blip(880, 0.07, 'square', 0.10, 220); noiseBurst(0.05, 0.08, 3000); },
  hit() { blip(1400, 0.08, 'square', 0.12, 500); },
  explosion() { noiseBurst(0.7, 0.5, 500); blip(90, 0.5, 'sine', 0.35, 35); },
  ring() { blip(660, 0.12, 'sine', 0.2); setTimeout(() => blip(990, 0.18, 'sine', 0.2), 90); },
  trap() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.25, 'triangle', 0.22), i * 110)); },
  bolter() { blip(220, 0.4, 'sawtooth', 0.2, 110); },
  warn() { blip(1200, 0.12, 'square', 0.12); },
  phase() { blip(180, 0.5, 'sawtooth', 0.25, 720); },
  click() { blip(700, 0.06, 'triangle', 0.15); },
};
