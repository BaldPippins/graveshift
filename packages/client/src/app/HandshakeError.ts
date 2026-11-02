import type { ErrorCode } from '@graveshift/shared/protocol';

export class HandshakeError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode) {
    super(`Handshake rejected with code ${code}`);
    this.name = 'HandshakeError';
    this.code = code;
  }
}
