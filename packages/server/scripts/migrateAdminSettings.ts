import { resolve } from 'node:path';
import { migrateAdminSettings } from '../src/infrastructure/admin/migrateAdminSettings.ts';

const [source, target] = process.argv.slice(2);
if (source === undefined || target === undefined || process.argv.length !== 4) {
  throw new Error('Usage: pnpm --filter @graveshift/server migrate:admin <sqlite> <json>');
}
const root = resolve(import.meta.dirname, '../../..');
migrateAdminSettings(resolve(root, source), resolve(root, target));
