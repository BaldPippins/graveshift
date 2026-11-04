import { describe, expect, it } from 'vitest';
import { SOUND_CONTENT } from '../content/soundContent.ts';
import { SoundBank } from './SoundBank.ts';
import type { SoundDecoder } from './SoundDecoder.ts';
import { SoundId } from './SoundId.ts';

const RETRY_DELAY = 6000;

class FlakyNetwork implements SoundDecoder<string> {
  online = false;
  requests = 0;

  decode(url: string): Promise<string> {
    this.requests += 1;
    return this.online ? Promise.resolve(url) : Promise.reject(new Error('offline'));
  }
}

interface Clock {
  now: number;
}

async function settle(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe('SoundBank', () => {
  it('fetches sounds again once the network is back', async () => {
    const clock: Clock = { now: 0 };
    const bank = new SoundBank(SOUND_CONTENT, () => clock.now);
    const network = new FlakyNetwork();
    bank.loadMissing(network);
    await settle();
    expect(bank.variantsOf(SoundId.ShotPistol)).toEqual([]);

    network.online = true;
    clock.now += RETRY_DELAY;
    bank.loadMissing(network);
    await settle();
    expect(bank.variantsOf(SoundId.ShotPistol)).toEqual(SOUND_CONTENT[SoundId.ShotPistol].urls);
  });

  it('does not hammer the network and skips sounds it already has', async () => {
    const clock: Clock = { now: 0 };
    const bank = new SoundBank(SOUND_CONTENT, () => clock.now);
    const network = new FlakyNetwork();
    network.online = true;
    bank.loadMissing(network);
    await settle();
    const firstPass = network.requests;
    bank.loadMissing(network);
    clock.now += RETRY_DELAY;
    bank.loadMissing(network);
    await settle();
    expect(network.requests).toBe(firstPass);
  });
});
