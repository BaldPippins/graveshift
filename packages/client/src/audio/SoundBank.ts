import type { SoundDecoder } from './SoundDecoder.ts';
import { SOUND_IDS } from './SoundId.ts';
import type { SoundId } from './SoundId.ts';
import type { SoundSpec } from './SoundSpec.ts';

const RETRY_MILLISECONDS = 5000;

export class SoundBank<TBuffer> {
  private readonly sounds: Readonly<Record<SoundId, SoundSpec>>;
  private readonly now: () => number;
  private readonly loaded = new Map<string, TBuffer>();
  private readonly loading = new Set<string>();
  private lastAttempt = Number.NEGATIVE_INFINITY;

  constructor(sounds: Readonly<Record<SoundId, SoundSpec>>, now: () => number) {
    this.sounds = sounds;
    this.now = now;
  }

  variantsOf(id: SoundId): TBuffer[] {
    const variants: TBuffer[] = [];
    for (const url of this.sounds[id].urls) {
      const buffer = this.loaded.get(url);
      if (buffer !== undefined) {
        variants.push(buffer);
      }
    }
    return variants;
  }

  loadMissing(decoder: SoundDecoder<TBuffer>): void {
    const now = this.now();
    if (now - this.lastAttempt < RETRY_MILLISECONDS) {
      return;
    }
    this.lastAttempt = now;
    for (const id of SOUND_IDS) {
      for (const url of this.sounds[id].urls) {
        if (!this.loaded.has(url) && !this.loading.has(url)) {
          void this.load(decoder, url);
        }
      }
    }
  }

  private async load(decoder: SoundDecoder<TBuffer>, url: string): Promise<void> {
    this.loading.add(url);
    try {
      this.loaded.set(url, await decoder.decode(url));
    } catch {
      return;
    } finally {
      this.loading.delete(url);
    }
  }
}
