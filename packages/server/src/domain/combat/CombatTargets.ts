import type { DestructibleCell } from '../entities/DestructibleCell.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';
import type { MerchantService } from '../services/MerchantService.ts';
import type { TrapService } from '../services/TrapService.ts';
import type { WreckageService } from '../services/WreckageService.ts';
import type { HitTargets, MeleeTargets } from './HitTargets.ts';

export class CombatTargets {
  private readonly world: MatchWorld;
  private readonly merchants: MerchantService;
  private readonly traps: TrapService;
  private readonly wreckage: WreckageService;

  constructor(
    world: MatchWorld,
    merchants: MerchantService,
    traps: TrapService,
    wreckage: WreckageService,
  ) {
    this.world = world;
    this.merchants = merchants;
    this.traps = traps;
    this.wreckage = wreckage;
  }

  ranged(): HitTargets {
    return {
      enemies: this.world.enemies.values(),
      players: this.world.players.values(),
      merchant: this.merchants.aliveMerchant,
      traps: this.traps.shootableTraps,
    };
  }

  melee(includePlayers: boolean): MeleeTargets {
    return {
      enemies: this.world.enemies.values(),
      players: includePlayers ? this.world.players.values() : [],
      merchant: this.merchants.aliveMerchant,
      traps: this.traps.shootableTraps,
      obstacles: this.wreckage.intact,
    };
  }

  obstacleAt(index: number): DestructibleCell | null {
    return this.wreckage.intactAt(index);
  }
}
