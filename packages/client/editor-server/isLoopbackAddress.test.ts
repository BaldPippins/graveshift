import { describe, expect, it } from 'vitest';
import { isLoopbackAddress } from './isLoopbackAddress.ts';

describe('editor save socket address', () => {
  it.each(['127.0.0.1', '127.42.1.9', '::1', '::ffff:127.0.0.1'])(
    'accepts loopback address %s',
    (address) => {
      expect(isLoopbackAddress(address)).toBe(true);
    },
  );

  it.each(['192.168.1.5', '::ffff:192.168.1.5', '::', undefined])(
    'rejects non-loopback or missing address %s',
    (address) => {
      expect(isLoopbackAddress(address)).toBe(false);
    },
  );
});
