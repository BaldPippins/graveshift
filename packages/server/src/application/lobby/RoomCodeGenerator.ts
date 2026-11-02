import { ROOM_RULES } from '@graveshift/shared/config';
import type { SeededRandom } from '@graveshift/shared/core';

export class RoomCodeGenerator {
  private readonly random: SeededRandom;

  constructor(random: SeededRandom) {
    this.random = random;
  }

  next(isTaken: (code: string) => boolean): string {
    for (;;) {
      const alphabet = ROOM_RULES.codeAlphabet;
      const code = Array.from({ length: ROOM_RULES.codeLength }, () =>
        alphabet.charAt(this.random.integer(0, alphabet.length)),
      ).join('');
      if (!isTaken(code)) {
        return code;
      }
    }
  }
}
