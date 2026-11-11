import { ENEMY_KINDS, HERO_IDS, WEAPON_IDS } from '../../config/index.ts';
import type { LevelDefinition } from '../../world/LevelDefinition.ts';
import { validateLevelDefinition } from '../../world/validateLevelDefinition.ts';
import type { PayloadCodec } from '../PayloadCodec.ts';
import { ProtocolError } from '../ProtocolError.ts';

const MAX_BOSS_ENTRIES = 1024;

export const levelDefinitionCodec: PayloadCodec<LevelDefinition> = {
  write(writer, level) {
    writer.u8(level.version).string(level.id).u8(level.width).u8(level.height);
    writer.list(level.rows, (w, row) => w.string(row));
    writer.bool(level.orientations !== undefined);
    if (level.orientations !== undefined) {
      writer.list(level.orientations, (w, entry) =>
        w.u8(entry.x).u8(entry.y).u8(entry.quarterTurns),
      );
    }
    const waves = level.waves;
    writer.list(waves.allowedTotals, (w, total) => w.u8(total));
    writer
      .f64(waves.countdownSeconds)
      .f64(waves.intermissionSeconds)
      .f64(waves.baseBudget)
      .f64(waves.budgetPerWave)
      .f64(waves.budgetPerExtraPlayer)
      .f64(waves.healthGrowthPerWave)
      .f64(waves.healthPerExtraPlayer)
      .f64(waves.firstSpawnIntervalSeconds)
      .f64(waves.spawnIntervalDecayPerWave)
      .f64(waves.minSpawnIntervalSeconds)
      .f64(waves.minSpawnDistanceFromPlayers);
    writer.list(waves.enemies, (w, enemy) =>
      w.u8(enemy.kind).f64(enemy.weight).u8(enemy.firstWave),
    );
    writer.list(waves.bossWaves, (w, boss) => w.u8(boss.wave).u8(boss.kind).u16(boss.count));
    writer.u8(level.team.minPlayers).u8(level.team.maxPlayers);
    writer.list(level.team.heroes, (w, hero) => w.u8(hero));
    writer.list(level.weapons.allowed, (w, weapon) => w.u8(weapon));
    writer.list(level.weapons.starting, (w, weapon) => w.u8(weapon));
  },
  read(reader) {
    const version = reader.oneOf([1] as const);
    const id = reader.string();
    const width = reader.u8();
    const height = reader.u8();
    const rows = reader.list((r) => r.string(), 64);
    const orientations = reader.bool()
      ? reader.list((r) => ({ x: r.u8(), y: r.u8(), quarterTurns: r.u8() }), 4096)
      : undefined;
    const waves = {
      allowedTotals: reader.list((r) => r.u8(), 255),
      countdownSeconds: reader.f64(),
      intermissionSeconds: reader.f64(),
      baseBudget: reader.f64(),
      budgetPerWave: reader.f64(),
      budgetPerExtraPlayer: reader.f64(),
      healthGrowthPerWave: reader.f64(),
      healthPerExtraPlayer: reader.f64(),
      firstSpawnIntervalSeconds: reader.f64(),
      spawnIntervalDecayPerWave: reader.f64(),
      minSpawnIntervalSeconds: reader.f64(),
      minSpawnDistanceFromPlayers: reader.f64(),
      enemies: reader.list(
        (r) => ({ kind: r.oneOf(ENEMY_KINDS), weight: r.f64(), firstWave: r.u8() }),
        ENEMY_KINDS.length,
      ),
      bossWaves: reader.list(
        (r) => ({ wave: r.u8(), kind: r.oneOf(ENEMY_KINDS), count: r.u16() }),
        MAX_BOSS_ENTRIES,
      ),
    };
    const team = {
      minPlayers: reader.u8(),
      maxPlayers: reader.u8(),
      heroes: reader.list((r) => r.oneOf(HERO_IDS), HERO_IDS.length),
    };
    const weapons = {
      allowed: reader.list((r) => r.oneOf(WEAPON_IDS), WEAPON_IDS.length),
      starting: reader.list((r) => r.oneOf(WEAPON_IDS), WEAPON_IDS.length),
    };
    const level: LevelDefinition = {
      version,
      id,
      width,
      height,
      rows,
      waves,
      team,
      weapons,
      ...(orientations === undefined ? {} : { orientations }),
    };
    if (validateLevelDefinition(level).length > 0) {
      throw new ProtocolError('Invalid level definition');
    }
    return level;
  },
};
