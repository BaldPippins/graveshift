const TICK_RATE = 30;

export const SIMULATION = {
  tickRate: TICK_RATE,
  tickSeconds: 1 / TICK_RATE,
  tickMilliseconds: 1000 / TICK_RATE,
  interpolationDelayTicks: 3,
  maxInputsPerTick: 4,
  maxQueuedInputs: 12,
  inputStarvationTicks: 4,
  maxRewindTicks: 9,
  flowFieldRefreshTicks: 4,
  maxEnemiesAlive: 70,
} as const;

export const NETWORK = {
  protocolVersion: 13,
  defaultPort: 8686,
  webSocketPath: '/ws',
  pingIntervalMilliseconds: 2000,
  maxMessageBytes: 4096,
  silenceTimeoutMilliseconds: 6000,
  reconnectDelaysMilliseconds: [500, 1000, 2000, 3000, 5000, 5000, 8000, 8000, 10000, 10000],
  seatHoldSeconds: 90,
} as const;

export const ROOM_RULES = {
  maxPlayers: 4,
  firstBotPlayerId: 0xff00,
  codeLength: 4,
  codeAlphabet: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
  minNicknameLength: 2,
  maxNicknameLength: 16,
} as const;
