import type { HeroId } from '@graveshift/shared/config';
import type { ClientSession } from '../session/ClientSession.ts';

export interface RoomMember {
  readonly session: ClientSession;
  hero: HeroId;
  ready: boolean;
}
