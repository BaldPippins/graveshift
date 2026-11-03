import { describe, expect, it } from 'vitest';
import { SilentLogger } from '../../application/testing/SilentLogger.ts';
import { GracefulDrain } from './GracefulDrain.ts';

describe('GracefulDrain', () => {
  it('waits until the last room closes', async () => {
    let rooms = 2;
    const drain = new GracefulDrain({
      logger: new SilentLogger(),
      activeRooms: () => {
        rooms = Math.max(0, rooms - 1);
        return rooms;
      },
      timeoutMilliseconds: 10_000,
      pollMilliseconds: 1,
      now: () => 0,
    });
    await drain.drain();
    expect(drain.isDraining).toBe(true);
    expect(rooms).toBe(0);
  });

  it('gives up once the timeout passes', async () => {
    let clock = 0;
    const drain = new GracefulDrain({
      logger: new SilentLogger(),
      activeRooms: () => 1,
      timeoutMilliseconds: 50,
      pollMilliseconds: 1,
      now: () => {
        clock += 20;
        return clock;
      },
    });
    await drain.drain();
    expect(clock).toBeGreaterThanOrEqual(50);
  });
});
