import { parseArgs } from 'node:util';
import { NETWORK } from '@graveshift/shared/config';
import { SmokeBot } from './SmokeBot.ts';

const { values } = parseArgs({
  options: {
    bots: { type: 'string', default: '2' },
    url: {
      type: 'string',
      default: `ws://localhost:${NETWORK.defaultPort}${NETWORK.webSocketPath}`,
    },
    timeout: { type: 'string', default: '240' },
    join: { type: 'string' },
  },
});

const botCount = Math.max(1, Number(values.bots));
const bots = Array.from(
  { length: botCount },
  (_, index) => new SmokeBot(`Bot${index + 1}`, values.url),
);
const [host, ...guests] = bots;
if (host === undefined) {
  throw new Error('At least one bot is required');
}

const code = await host.connect(values.join ?? null);
await Promise.all(guests.map((bot) => bot.connect(code)));
process.stdout.write(`room ${code} with ${botCount} bots\n`);

const timeout = new Promise<never>((_, reject) => {
  setTimeout(
    () => {
      reject(new Error(`Match did not finish within ${values.timeout}s`));
    },
    Number(values.timeout) * 1000,
  ).unref();
});

try {
  const reports = await Promise.race([Promise.all(bots.map((bot) => bot.ready())), timeout]);
  process.stdout.write(`${JSON.stringify(reports, null, 2)}\n`);
} catch (error: unknown) {
  process.stdout.write(
    `${String(error)}\n${JSON.stringify(
      bots.map((bot) => bot.progress),
      null,
      2,
    )}\n`,
  );
  process.exitCode = 1;
} finally {
  bots.forEach((bot) => {
    bot.close();
  });
}
