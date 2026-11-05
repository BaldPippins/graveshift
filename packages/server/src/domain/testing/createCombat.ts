import { CombatTargets } from '../combat/CombatTargets.ts';
import { HitApplier } from '../combat/HitApplier.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';
import { EconomyService } from '../services/EconomyService.ts';
import { EnemyDamageService } from '../services/EnemyDamageService.ts';
import { ExplosionService } from '../services/ExplosionService.ts';
import { MerchantService } from '../services/MerchantService.ts';
import { PickupSpawner } from '../services/PickupSpawner.ts';
import { PlayerLifecycle } from '../services/PlayerLifecycle.ts';
import { TrapService } from '../services/TrapService.ts';
import { WreckageService } from '../services/WreckageService.ts';

export interface CombatRig {
  readonly targets: CombatTargets;
  readonly hits: HitApplier;
  readonly wreckage: WreckageService;
  readonly traps: TrapService;
  readonly economy: EconomyService;
  dispose(): void;
}

export function createCombat(world: MatchWorld, friendlyFire: boolean): CombatRig {
  const events = world.events;
  const economy = new EconomyService(events);
  const lifecycle = new PlayerLifecycle(events);
  const enemyDamage = new EnemyDamageService(world, economy, new PickupSpawner(world));
  const merchants = new MerchantService(world);
  const wreckage = new WreckageService(world);
  const explosions = new ExplosionService(world, enemyDamage, lifecycle, wreckage, friendlyFire);
  const traps = new TrapService(world, economy, explosions, enemyDamage, lifecycle);
  return {
    targets: new CombatTargets(world, merchants, traps, wreckage),
    hits: new HitApplier(enemyDamage, lifecycle, merchants, wreckage, traps, friendlyFire),
    wreckage,
    traps,
    economy,
    dispose: () => {
      merchants.dispose();
      wreckage.dispose();
      traps.dispose();
    },
  };
}
