import { SoundBank } from './SoundBank.ts';
import type { SoundDecoder } from './SoundDecoder.ts';
import type { SoundId } from './SoundId.ts';
import type { SoundMix } from './SoundMix.ts';
import type { SoundPlacement } from './SoundPlacement.ts';
import type { SoundPlayer } from './SoundPlayer.ts';
import type { SoundSpec } from './SoundSpec.ts';

export const CENTERED: SoundPlacement = { gain: 1, pan: 0 };

const UNLOCK_EVENTS: readonly string[] = ['pointerdown', 'pointerup', 'touchend', 'keydown'];

function decoderFor(context: AudioContext): SoundDecoder<AudioBuffer> {
  return {
    decode: async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Sound ${url} answered ${response.status}`);
      }
      return context.decodeAudioData(await response.arrayBuffer());
    },
  };
}

export class AudioEngine implements SoundPlayer {
  private readonly sounds: Readonly<Record<SoundId, SoundSpec>>;
  private readonly bank: SoundBank<AudioBuffer>;
  private readonly lastStarted = new Map<SoundId, number>();
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private pageHidden = false;
  private userActivated = false;
  private mix: SoundMix = { muted: true, volume: 1 };

  constructor(sounds: Readonly<Record<SoundId, SoundSpec>>) {
    this.sounds = sounds;
    this.bank = new SoundBank(sounds, () => performance.now());
  }

  attach(target: Window): void {
    const unlock = (): void => {
      this.userActivated = true;
      this.unlock();
    };
    for (const type of UNLOCK_EVENTS) {
      target.addEventListener(type, unlock, { capture: true, passive: true });
    }
    target.document.addEventListener('visibilitychange', () => {
      this.pageHidden = target.document.hidden;
      this.syncRunning();
    });
  }

  setMix(mix: SoundMix): void {
    this.mix = mix;
    if (this.master !== null) {
      this.master.gain.value = mix.volume;
    }
    this.unlock();
    this.syncRunning();
  }

  play(id: SoundId, placement: SoundPlacement = CENTERED): void {
    const context = this.context;
    const master = this.master;
    if (this.mix.muted || context === null || master === null || context.state !== 'running') {
      return;
    }
    const variants = this.bank.variantsOf(id);
    const spec = this.sounds[id];
    const now = context.currentTime;
    if (placement.gain <= 0 || this.isThrottled(id, spec, now)) {
      return;
    }
    const buffer = variants[Math.floor(Math.random() * variants.length)];
    if (buffer === undefined) {
      this.bank.loadMissing(decoderFor(context));
      return;
    }
    this.lastStarted.set(id, now);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = spec.playbackRate * (1 + (Math.random() * 2 - 1) * spec.rateJitter);
    const gain = context.createGain();
    gain.gain.value = spec.volume * placement.gain;
    const panner = context.createStereoPanner();
    panner.pan.value = placement.pan;
    source.connect(gain).connect(panner).connect(master);
    source.start();
  }

  private isThrottled(id: SoundId, spec: SoundSpec, now: number): boolean {
    const last = this.lastStarted.get(id);
    return last !== undefined && now - last < spec.minIntervalSeconds;
  }

  private unlock(): void {
    if (this.mix.muted || this.pageHidden || !this.userActivated) {
      return;
    }
    const context = this.ensureContext();
    if (context === null) {
      return;
    }
    if (context.state === 'suspended') {
      void context.resume();
    }
    this.bank.loadMissing(decoderFor(context));
  }

  private syncRunning(): void {
    const context = this.context;
    if (context === null) {
      return;
    }
    if (this.mix.muted || this.pageHidden) {
      void context.suspend();
    } else {
      void context.resume();
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.context !== null) {
      return this.context;
    }
    if (typeof AudioContext === 'undefined') {
      return null;
    }
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = this.mix.volume;
    master.connect(context.destination);
    this.context = context;
    this.master = master;
    return context;
  }
}
