import { describe, expect, it } from 'vitest';
import { TrapKind } from '@graveshift/shared/config';
import { MerchantAccess } from '@graveshift/shared/rules';
import type { TrapSpot } from '@graveshift/shared/rules';
import { offeredTrap } from './offeredTrap.ts';

const TRAP: TrapSpot = {
  kind: TrapKind.BearTrap,
  cell: { cx: 5, cy: 5 },
  index: 85,
  center: { x: 5.5, y: 5.5 },
};

describe('offeredTrap', () => {
  it('offers the trap when it is closer than the merchant', () => {
    const merchant = { x: 7, y: 5.5 };
    const offer = offeredTrap({ x: 6, y: 5.5 }, [TRAP], merchant, MerchantAccess.Serving);
    expect(offer).toBe(TRAP);
  });

  it('leaves B to the merchant or his grave when he is closer', () => {
    const merchant = { x: 6.2, y: 5.5 };
    const position = { x: 6.6, y: 5.5 };
    expect(offeredTrap(position, [TRAP], merchant, MerchantAccess.Serving)).toBeNull();
    expect(offeredTrap(position, [TRAP], merchant, MerchantAccess.Grave)).toBeNull();
  });

  it('ignores a merchant who is out of reach', () => {
    const offer = offeredTrap({ x: 6, y: 5.5 }, [TRAP], { x: 6.1, y: 5.5 }, MerchantAccess.Gone);
    expect(offer).toBe(TRAP);
  });
});
