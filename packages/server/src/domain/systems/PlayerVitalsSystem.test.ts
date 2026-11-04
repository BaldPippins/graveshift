import { describe, expect, it } from 'vitest';
import { HEROES, HeroId, PLAYER_RULES, SIMULATION } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { LifeState } from '@graveshift/shared/model';
import { MapId, parseTileMap } from '@graveshift/shared/world';
import { PlayerEntity } from '../entities/PlayerEntity.ts';
import { MatchEventBus } from '../match/MatchEventBus.ts';
import { MatchWorld } from '../match/MatchWorld.ts';
import { PlayerLifecycle } from '../services/PlayerLifecycle.ts';
import { PlayerVitalsSystem } from './PlayerVitalsSystem.ts';

const ARENA = ['########', '#S.....#', '#...P..#', '#.....S#', '########'];
const DOWNED_ID = 1;

function ticksToRevive(helpers: number): number {
  const events = new MatchEventBus();
  const world = new MatchWorld(
    parseTileMap({ id: MapId.Graveyard, rows: ARENA }),
    new SeededRandom(1),
    events,
  );
  const lifecycle = new PlayerLifecycle(events);
  const vitals = new PlayerVitalsSystem(world, lifecycle);
  const downed = new PlayerEntity(DOWNED_ID, 'Downed', HEROES[HeroId.Pippin], false, {
    x: 3.5,
    y: 2.5,
  });
  world.players.set(downed.id, downed);
  for (let index = 0; index < helpers; index += 1) {
    const helper = new PlayerEntity(DOWNED_ID + 1 + index, 'Helper', HEROES[HeroId.Pippin], false, {
      x: 3.5 + 0.3 * (index + 1),
      y: 2.5,
    });
    world.players.set(helper.id, helper);
  }
  lifecycle.damage(downed, downed.maxHealth * 10, null);
  let ticks = 0;
  while (downed.life === LifeState.Downed && ticks < SIMULATION.tickRate * 30) {
    vitals.update();
    ticks += 1;
  }
  return ticks;
}

describe('PlayerVitalsSystem', () => {
  it('revives faster with every extra ally kneeling beside the downed player', () => {
    const alone = ticksToRevive(1);
    const pair = ticksToRevive(2);
    const trio = ticksToRevive(3);
    expect(alone).toBeCloseTo(PLAYER_RULES.reviveSeconds * SIMULATION.tickRate, -1);
    expect(pair).toBeCloseTo(alone / (1 + PLAYER_RULES.reviveHelperBonus), -1);
    expect(trio).toBeCloseTo(alone / (1 + 2 * PLAYER_RULES.reviveHelperBonus), -1);
  });
});
