import { describe, expect, it } from 'vitest';
import { HEROES, HeroId, JUMP_RULES, SIMULATION } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { InputButton } from '@graveshift/shared/model';
import { ClientMessageType } from '@graveshift/shared/protocol';
import { MapId, parseTileMap } from '@graveshift/shared/world';
import { PlayerEntity } from '../entities/PlayerEntity.ts';
import { MatchEventBus } from '../match/MatchEventBus.ts';
import { MatchWorld } from '../match/MatchWorld.ts';
import { PlayerControlSystem } from './PlayerControlSystem.ts';

const FIELD = ['#######', '#P...S#', '#######'];

function jumpingPlayer(): [PlayerControlSystem, PlayerEntity] {
  const world = new MatchWorld(
    parseTileMap({ id: MapId.Graveyard, rows: FIELD }),
    new SeededRandom(1),
    new MatchEventBus(),
  );
  const player = new PlayerEntity(1, 'Tester', HEROES[HeroId.Pippin], false, { x: 2.5, y: 1.5 });
  world.players.set(player.id, player);
  const control = new PlayerControlSystem(world);
  player.enqueueInput({
    type: ClientMessageType.PlayerInput,
    sequence: 1,
    viewTick: 0,
    moveX: 0,
    moveY: 0,
    aim: 0,
    buttons: InputButton.Jump,
  });
  control.update();
  return [control, player];
}

describe('PlayerControlSystem', () => {
  it('keeps the jump in step with inputs through short network jitter', () => {
    const [control, player] = jumpingPlayer();
    const airborne = player.height;
    for (let tick = 0; tick < SIMULATION.inputStarvationTicks; tick += 1) {
      control.update();
    }
    expect(airborne).toBeGreaterThan(0);
    expect(player.height).toBe(airborne);
  });

  it('lands a player whose inputs stopped arriving mid-jump', () => {
    const [control, player] = jumpingPlayer();
    const airTicks = Math.ceil(
      (2 * JUMP_RULES.launchSpeed) / JUMP_RULES.gravity / SIMULATION.tickSeconds,
    );
    for (let tick = 0; tick < SIMULATION.inputStarvationTicks + airTicks + 2; tick += 1) {
      control.update();
    }
    expect(player.height).toBe(0);
    expect(player.verticalSpeed).toBe(0);
  });
});
