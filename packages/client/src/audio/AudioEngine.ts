import { SOUND_IDS } from './SoundId.ts';
import type { SoundId } from './SoundId.ts';
import type { SoundMix } from './SoundMix.ts';
import type { SoundPlacement } from './SoundPlacement.ts';
import type { SoundPlayer } from './SoundPlayer.ts';
import type { SoundSpec } from './SoundSpec.ts';

export const CENTERED: SoundPlacement = { gain: 1, pan: 0 };

const UNLOCK_EVENTS: readonly string[] = ['pointerdown', 'pointerup', 'touchend', 'keydown'];

export class AudioEngine implements SoundPlayer {
  private readonly sounds: Readonly<Record<SoundId, SoundSpec>>;
  private readonly decoded = new Map<string, Promise<AudioBuffer | null>>();
  private readonly buffers = new Map<SoundId, readonly AudioBuffer[]>();
  private readonly lastStarted = new Map<SoundId, number>();
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private loadingStarted = false;
  private pageHidden = false;
  private userActivated = false;
  private mix: SoundMix = { muted: true, volume: 1 };

  constructor(sounds: Readonly<Record<SoundId, SoundSpec>>) {
    this.sounds = sounds;
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
    const variants = this.buffers.get(id);
    const spec = this.sounds[id];
    const now = context.currentTime;
    if (variants === undefined || placement.gain <= 0 || this.isThrottled(id, spec, now)) {
      return;
    }
    const buffer = variants[Math.floor(Math.random() * variants.length)];
    if (buffer === undefined) {
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
    this.loadAll(context);
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

  private loadAll(context: AudioContext): void {
    if (this.loadingStarted) {
      return;
    }
    this.loadingStarted = true;
    for (const id of SOUND_IDS) {
      void this.load(context, id);
    }
  }

  private async load(context: AudioContext, id: SoundId): Promise<void> {
    const variants = await Promise.all(
      this.sounds[id].urls.map((url) => this.decode(context, url)),
    );
    this.buffers.set(
      id,
      variants.filter((buffer) => buffer !== null),
    );
  }

  private decode(context: AudioContext, url: string): Promise<AudioBuffer | null> {
    const cached = this.decoded.get(url);
    if (cached !== undefined) {
      return cached;
    }
    const pending = fetch(url)
      .then((response) => response.arrayBuffer())
      .then((bytes) => context.decodeAudioData(bytes))
      .catch(() => null);
    this.decoded.set(url, pending);
    return pending;
  }
}
