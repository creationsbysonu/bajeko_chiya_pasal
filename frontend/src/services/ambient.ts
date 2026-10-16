/**
 * Procedural ambient engine.
 *
 * Rather than shipping audio files, every ambience layer is *synthesised* with
 * the Web Audio API: filtered noise beds, LFO-swept filters, and scheduled
 * grains (rain drops, vinyl pops, bell partials, bird chirps). This keeps the
 * bundle tiny and works fully offline.
 *
 * The ambience is played through a completely separate AudioContext, so it
 * layers over the YouTube music stream with no coupling — the two simply mix
 * at the OS level.
 */

export interface AmbientLayerDef {
  id: string;
  icon: string;
  name: string;
  nameNe: string;
  blurb: string;
  blurbNe: string;
  /** Internal loudness scalar applied before the user's per-layer volume. */
  base: number;
}

export const AMBIENT_LAYERS: AmbientLayerDef[] = [
  { id: 'rain',    icon: '🌧️', name: 'Monsoon Rain',   nameNe: 'वर्षा',            blurb: 'Steady shower on the tin roof', blurbNe: 'टिनको छानामा झरी',          base: 0.5 },
  { id: 'wind',    icon: '🍃', name: 'Mountain Wind',  nameNe: 'पहाडी हावा',       blurb: 'High-altitude breeze',          blurbNe: 'हिमाली हावाको सरसर',        base: 0.9 },
  { id: 'stream',  icon: '🌊', name: 'River Stream',   nameNe: 'खोलाको पानी',      blurb: 'Water over smooth stones',      blurbNe: 'ढुङ्गामा बग्ने पानी',       base: 0.7 },
  { id: 'birds',   icon: '🐦', name: 'Village Birds',  nameNe: 'गाउँका चरा',       blurb: 'Morning birdsong',              blurbNe: 'बिहानीको चिरबिर',           base: 1.0 },
  { id: 'bells',   icon: '🔔', name: 'Temple Bells',   nameNe: 'मन्दिरका घण्टी',   blurb: 'Distant prayer bells',          blurbNe: 'टाढाका घण्टीको ध्वनि',      base: 0.9 },
  { id: 'crackle', icon: '📼', name: 'Vinyl Crackle',  nameNe: 'भिनाइल क्र्याकल',  blurb: 'Dust, pops & warm rot',         blurbNe: 'पुरानो रेकर्डको आवाज',      base: 0.8 },
  { id: 'hiss',    icon: '📻', name: 'Tape Hiss',      nameNe: 'टेप हिस',          blurb: 'Analog warmth',                 blurbNe: 'क्यासेटको हल्का हिस',       base: 0.55 },
  { id: 'fire',    icon: '🔥', name: 'Chulho Fire',    nameNe: 'चुल्होको आगो',     blurb: 'Crackling embers',              blurbNe: 'दाउराको कडाइ',              base: 0.9 },
];

const LAYER_BY_ID = new Map(AMBIENT_LAYERS.map((l) => [l.id, l]));

interface LayerHandle {
  gain: GainNode;
  base: number;
  volume: number;
  enabled: boolean;
  nodes: AudioScheduledSourceNode[];
  timers: number[];
}

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private layers = new Map<string, LayerHandle>();
  private masterVolume = 0.7;

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    return Boolean(w.AudioContext || w.webkitAudioContext);
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (!this.isSupported()) return null;
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = (w.AudioContext || w.webkitAudioContext) as typeof AudioContext;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.masterVolume;
    this.master.connect(this.ctx.destination);
    this.noise = this.buildNoise(this.ctx);
    return this.ctx;
  }

  /** Must be called from a user gesture the first time, per autoplay policy. */
  resume(): void {
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }
  }

  setMaster(v: number): void {
    this.masterVolume = v;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }
  }

  setVolume(id: string, v: number): void {
    const h = this.layers.get(id);
    if (!h) return;
    h.volume = v;
    this.applyGain(h);
  }

  setEnabled(id: string, on: boolean): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    let h = this.layers.get(id);
    if (!h) {
      if (!on) return;
      h = this.buildLayer(id, ctx, this.master);
      this.layers.set(id, h);
    }
    h.enabled = on;
    this.applyGain(h);
  }

  stopAll(): void {
    this.layers.forEach((h) => {
      h.enabled = false;
      this.applyGain(h);
    });
  }

  private applyGain(h: LayerHandle): void {
    if (!this.ctx) return;
    const target = h.enabled ? h.base * h.volume : 0;
    h.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
  }

  private buildNoise(ctx: AudioContext, seconds = 2): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private buildLayer(id: string, ctx: AudioContext, out: GainNode): LayerHandle {
    const def = LAYER_BY_ID.get(id);
    const handle: LayerHandle = {
      gain: ctx.createGain(),
      base: def?.base ?? 0.6,
      volume: 0.7,
      enabled: false,
      nodes: [],
      timers: [],
    };
    handle.gain.gain.value = 0;
    handle.gain.connect(out);

    const noise = this.noise as AudioBuffer;

    const spawnNoise = (): AudioBufferSourceNode => {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      src.start();
      handle.nodes.push(src);
      return src;
    };

    const lfo = (freq: number, min: number, max: number, param: AudioParam): void => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      const amp = ctx.createGain();
      amp.gain.value = (max - min) / 2;
      param.value = (max + min) / 2;
      osc.connect(amp).connect(param);
      osc.start();
      handle.nodes.push(osc);
    };

    const schedule = (ms: number, fn: () => void): void => {
      const timer = window.setInterval(() => {
        if (handle.enabled) fn();
      }, ms);
      handle.timers.push(timer);
    };

    const pop = (fMin: number, fMax: number, gMax: number): void => {
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = fMin + Math.random() * (fMax - fMin);
      filter.Q.value = 1;
      const g = ctx.createGain();
      const dur = 0.008 + Math.random() * 0.03;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gMax * (0.4 + Math.random() * 0.6), t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter).connect(g).connect(handle.gain);
      src.start(t, Math.random() * noise.duration);
      src.stop(t + dur + 0.02);
    };

    const chirp = (delay: number): void => {
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const f0 = 1800 + Math.random() * 1600;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f0 * 1.5, t + 0.05);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.85, t + 0.12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(g).connect(handle.gain);
      osc.start(t);
      osc.stop(t + 0.2);
    };

    const strikeBell = (): void => {
      const t = ctx.currentTime;
      const notes = [196, 220, 247, 294, 330];
      const f0 = notes[Math.floor(Math.random() * notes.length)];
      const partials = [1, 2.0, 2.76, 5.4];
      const amps = [0.22, 0.1, 0.06, 0.03];
      const durs = [4.5, 3.2, 2.2, 1.4];
      partials.forEach((p, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f0 * p;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(amps[i], t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + durs[i]);
        osc.connect(g).connect(handle.gain);
        osc.start(t);
        osc.stop(t + durs[i] + 0.1);
      });
    };

    switch (id) {
      case 'rain': {
        const body = spawnNoise();
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 600;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 6500;
        lp.Q.value = 0.6;
        body.connect(hp).connect(lp).connect(handle.gain);
        lfo(0.08, 3000, 8000, lp.frequency);

        const sparkle = spawnNoise();
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2600;
        bp.Q.value = 0.4;
        const sg = ctx.createGain();
        sg.gain.value = 0.35;
        sparkle.connect(bp).connect(sg).connect(handle.gain);
        break;
      }
      case 'wind': {
        const body = spawnNoise();
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 400;
        lp.Q.value = 1.2;
        const g = ctx.createGain();
        g.gain.value = 1.2;
        body.connect(lp).connect(g).connect(handle.gain);
        lfo(0.05, 170, 660, lp.frequency);
        lfo(0.09, 0.6, 1.4, g.gain);
        break;
      }
      case 'stream': {
        const body = spawnNoise();
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1100;
        bp.Q.value = 0.7;
        const g = ctx.createGain();
        g.gain.value = 1.1;
        body.connect(bp).connect(g).connect(handle.gain);
        lfo(0.12, 700, 1700, bp.frequency);

        const bed = spawnNoise();
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 500;
        const bg = ctx.createGain();
        bg.gain.value = 0.5;
        bed.connect(lp).connect(bg).connect(handle.gain);
        break;
      }
      case 'birds': {
        const bg = spawnNoise();
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 4000;
        bp.Q.value = 0.3;
        const g = ctx.createGain();
        g.gain.value = 0.07;
        bg.connect(bp).connect(g).connect(handle.gain);
        schedule(1500, () => {
          const bursts = 1 + Math.floor(Math.random() * 3);
          for (let i = 0; i < bursts; i += 1) chirp(i * 0.16);
        });
        break;
      }
      case 'bells': {
        const drone = spawnNoise();
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 180;
        const g = ctx.createGain();
        g.gain.value = 0.14;
        drone.connect(lp).connect(g).connect(handle.gain);
        schedule(7000, strikeBell);
        break;
      }
      case 'crackle': {
        const hiss = spawnNoise();
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2500;
        hp.Q.value = 0.5;
        const g = ctx.createGain();
        g.gain.value = 0.08;
        hiss.connect(hp).connect(g).connect(handle.gain);
        schedule(80, () => {
          if (Math.random() < 0.55) pop(900, 4200, 0.14);
        });
        break;
      }
      case 'hiss': {
        const body = spawnNoise();
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 3500;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 11000;
        const g = ctx.createGain();
        g.gain.value = 0.35;
        body.connect(hp).connect(lp).connect(g).connect(handle.gain);
        break;
      }
      case 'fire': {
        const rumble = spawnNoise();
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 320;
        lp.Q.value = 0.8;
        const g = ctx.createGain();
        g.gain.value = 1.1;
        rumble.connect(lp).connect(g).connect(handle.gain);
        lfo(0.07, 0.7, 1.4, g.gain);
        schedule(120, () => {
          if (Math.random() < 0.6) pop(200, 1600, 0.2);
        });
        break;
      }
      default:
        break;
    }

    return handle;
  }
}

export const ambientEngine = new AmbientEngine();
