import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { LevelAvailability } from '../application/admin/LevelAvailability.ts';

const ATTEMPT_WINDOW = 60_000;
const MAX_ATTEMPTS = 10;
const MAX_TRACKED_ADDRESSES = 4096;

interface AdminLevelParams {
  readonly id: string;
}

interface Attempts {
  readonly since: number;
  readonly count: number;
}

function sameKey(expected: string, authorization: string | undefined): boolean {
  const supplied =
    authorization !== undefined && authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : '';
  const digest = (value: string): Buffer => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(expected), digest(supplied));
}

export function registerAdminRoutes(
  app: FastifyInstance,
  key: string | null,
  levels: LevelAvailability,
  onChange: () => void,
): void {
  const attempts = new Map<string, Attempts>();
  const authorize = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (key === null) {
      void reply.code(503).send();
      return;
    }
    const now = Date.now();
    for (const [ip, attempt] of attempts) {
      if (now - attempt.since >= ATTEMPT_WINDOW) {
        attempts.delete(ip);
      }
    }
    const prior = attempts.get(request.ip);
    if (prior !== undefined && prior.count >= MAX_ATTEMPTS) {
      void reply.code(429).send();
      return;
    }
    if (!sameKey(key, request.headers.authorization)) {
      if (prior === undefined && attempts.size >= MAX_TRACKED_ADDRESSES) {
        const oldest = attempts.keys().next().value;
        if (oldest !== undefined) {
          attempts.delete(oldest);
        }
      }
      attempts.set(request.ip, {
        since: prior === undefined ? now : prior.since,
        count: prior === undefined ? 1 : prior.count + 1,
      });
      void reply.code(401).send();
      return;
    }
    attempts.delete(request.ip);
  };

  app.get('/api/admin/levels', { preHandler: authorize }, () => levels.list());
  app.put('/api/admin/levels/:id', { preHandler: authorize }, (request, reply) => {
    const { id } = request.params as AdminLevelParams;
    if (!levels.has(id)) {
      return reply.code(404).send();
    }
    const body = request.body;
    if (
      typeof body !== 'object' ||
      body === null ||
      !('enabled' in body) ||
      typeof body.enabled !== 'boolean'
    ) {
      return reply.code(400).send();
    }
    if (!levels.set(id, body.enabled)) {
      return reply.code(409).send();
    }
    onChange();
    return levels.list();
  });
}
