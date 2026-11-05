import type { HeroId } from '../config/heroes.ts';
import type { LevelTeam } from '../world/LevelDefinition.ts';

export function isLevelPartySizeAllowed(team: LevelTeam, count: number): boolean {
  return count >= team.minPlayers && count <= team.maxPlayers;
}

export function isLevelHeroAllowed(team: LevelTeam, hero: HeroId): boolean {
  return team.heroes.includes(hero);
}
