import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';

const DEFAULT_URL = 'http://localhost:5173/';
const DEFAULT_BOTS = '3';
const DEFAULT_WAVES = '10';
const NICKNAME = 'Зритель';
const LOAD_TIMEOUT_MS = 60_000;

interface WatchOptions {
  readonly url: string;
  readonly bots: string;
  readonly waves: string;
}

function readOptions(): WatchOptions {
  const { values } = parseArgs({
    options: {
      url: { type: 'string', default: DEFAULT_URL },
      bots: { type: 'string', default: DEFAULT_BOTS },
      waves: { type: 'string', default: DEFAULT_WAVES },
    },
  });
  return { url: values.url, bots: values.bots, waves: values.waves };
}

async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch({ headless: false });
  } catch {
    return chromium.launch({ headless: false, channel: 'chrome' });
  }
}

async function pickOption(page: Page, group: number, value: string): Promise<void> {
  await page
    .locator('.bot-picker__options')
    .nth(group)
    .getByRole('radio', { name: value, exact: true })
    .click();
}

async function startBotShift(page: Page, options: WatchOptions): Promise<void> {
  await page.goto(options.url);
  await page.waitForSelector('.main-menu__panel', { timeout: LOAD_TIMEOUT_MS });
  await page.locator('.main-menu__panel input').first().fill(NICKNAME);
  await page.locator('.main-menu__panel .btn--primary').first().click();
  await page.waitForSelector('.bot-picker__options');
  await pickOption(page, 0, options.bots);
  await pickOption(page, 1, options.waves);
  await page.locator('.panel__footer .btn--primary').click();
}

const options = readOptions();
const browser = await launchBrowser();
const context = await browser.newContext({ viewport: null });
const page = await context.newPage();
await startBotShift(page, options);
process.stdout.write(`Bots are on the shift at ${options.url}. Close the window to stop.\n`);
await page.waitForEvent('close', { timeout: 0 });
await browser.close();
