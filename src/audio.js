/* ============================================
   AUDIO SYSTEM — Web Audio API
   ============================================ */

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.glitchGain = null;
    this.muted = true;
    this.initialized = false;
    this.ambientOscs = [];
    this.glitchTimeout = null;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.15;
    this.ambientGain.connect(this.masterGain);

    this.glitchGain = this.ctx.createGain();
    this.glitchGain.gain.value = 0;
    this.glitchGain.connect(this.masterGain);

    this._startAmbient();
    this.initialized = true;
    if (this.muted) this.masterGain.gain.value = 0;
  }

  _startAmbient() {
    const freqs = [55, 82.5, 110, 220];
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.value = 0.03;
      osc.connect(g);
      g.connect(this.ambientGain);
      osc.start();
      this.ambientOscs.push({ osc, gain: g });
    });

    // Subtle LFO modulation
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(this.ambientOscs[0].osc.frequency);
    lfo.start();
  }

  triggerGlitch(intensity = 0.5, duration = 300) {
    if (!this.initialized || this.muted) return;
    const now = this.ctx.currentTime;

    this.glitchGain.gain.setValueAtTime(intensity * 0.2, now);
    this.glitchGain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * (duration / 1000);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * intensity;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Distortion
    const dist = this.ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = (Math.PI + intensity * 100) * x / (Math.PI + intensity * 100 * Math.abs(x));
    }
    dist.curve = curve;

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800 + Math.random() * 2000;
    filter.Q.value = 5;

    noise.connect(dist);
    dist.connect(filter);
    filter.connect(this.glitchGain);
    noise.start();
    noise.stop(now + duration / 1000);
  }

  toggleMute() {
    if (!this.initialized) {
      this.init();
    }
    this.muted = !this.muted;
    if (this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.muted ? 0 : 0.3,
        this.ctx.currentTime + 0.3
      );
    }
    return this.muted;
  }

  setHallucinationLevel(level) {
    if (!this.initialized) return;
    // Modulate ambient based on hallucination intensity (0-1)
    this.ambientOscs.forEach((o, i) => {
      const detune = level * 50 * (i % 2 === 0 ? 1 : -1);
      o.osc.detune.linearRampToValueAtTime(detune, this.ctx.currentTime + 0.1);
      o.gain.gain.linearRampToValueAtTime(0.03 + level * 0.05, this.ctx.currentTime + 0.1);
    });
  }
}
