import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { AdminLevelSetting } from './AdminLevelSetting.ts';
import { withAdminSettingsLock, writeAdminSettings } from './adminSettingsFile.ts';

export function migrateAdminSettings(source: string, target: string): void {
  if (!existsSync(source)) {
    throw new Error('Source SQLite database does not exist');
  }
  withAdminSettingsLock(target, () => {
    if (existsSync(target)) {
      throw new Error('Target settings file already exists');
    }
    const database = new DatabaseSync(source, { readOnly: true });
    try {
      const rows = database
        .prepare("SELECT key, enabled FROM feature_switches WHERE namespace = 'levels'")
        .all();
      const settings: AdminLevelSetting[] = rows.map((row) => {
        const id = row['key'];
        const enabled = row['enabled'];
        if (typeof id !== 'string' || id.length === 0 || (enabled !== 0 && enabled !== 1)) {
          throw new Error('Invalid SQLite level settings');
        }
        return { id, enabled: enabled === 1 };
      });
      writeAdminSettings(target, settings);
    } finally {
      database.close();
    }
  });
}
