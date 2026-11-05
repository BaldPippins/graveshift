import type { Logger } from '../ports/Logger.ts';
import type { TickScheduler } from '../ports/TickScheduler.ts';
import type { LevelDefinition } from '@graveshift/shared/world';
import { Room } from './Room.ts';
import type { RoomCodeGenerator } from './RoomCodeGenerator.ts';

export interface RoomRegistryDependencies {
  readonly scheduler: TickScheduler;
  readonly logger: Logger;
  readonly codes: RoomCodeGenerator;
  readonly nextSeed: () => number;
  readonly levels: ReadonlyMap<string, LevelDefinition>;
}

export class RoomRegistry {
  private readonly rooms = new Map<string, Room>();
  private readonly dependencies: RoomRegistryDependencies;

  constructor(dependencies: RoomRegistryDependencies) {
    this.dependencies = dependencies;
  }

  get size(): number {
    return this.rooms.size;
  }

  get levels(): readonly LevelDefinition[] {
    return [...this.dependencies.levels.values()];
  }

  create(): Room {
    const code = this.dependencies.codes.next((candidate) => this.rooms.has(candidate));
    const room = new Room(code, {
      scheduler: this.dependencies.scheduler,
      logger: this.dependencies.logger,
      nextSeed: this.dependencies.nextSeed,
      levels: this.dependencies.levels,
      onEmpty: (emptied) => {
        this.rooms.delete(emptied.code);
        this.dependencies.logger.info('Room closed', { room: emptied.code });
      },
    });
    this.rooms.set(code, room);
    this.dependencies.logger.info('Room opened', { room: code });
    return room;
  }

  find(code: string): Room | undefined {
    return this.rooms.get(code.trim().toUpperCase());
  }
}
