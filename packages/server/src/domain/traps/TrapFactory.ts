import { TrapKind } from '@graveshift/shared/config';
import { assertNever } from '@graveshift/shared/core';
import type { TrapSpot } from '@graveshift/shared/rules';
import { TrapEntity } from '../entities/TrapEntity.ts';
import { BearTrapBehavior } from './BearTrapBehavior.ts';
import { PowderKegBehavior } from './PowderKegBehavior.ts';
import type { TrapBehavior } from './TrapBehavior.ts';
import type { TrapHost } from './TrapHost.ts';

export class TrapFactory {
  private readonly host: TrapHost;

  constructor(host: TrapHost) {
    this.host = host;
  }

  create(spot: TrapSpot, ownerId: number | null, power: number): TrapEntity {
    return new TrapEntity(spot, ownerId, power, this.behaviorFor(spot.kind));
  }

  private behaviorFor(kind: TrapKind): TrapBehavior {
    switch (kind) {
      case TrapKind.PowderKeg:
        return new PowderKegBehavior(this.host);
      case TrapKind.BearTrap:
        return new BearTrapBehavior(this.host);
      default:
        return assertNever(kind);
    }
  }
}
