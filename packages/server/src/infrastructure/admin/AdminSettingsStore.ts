import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export class AdminSettingsStore {
  private readonly database: DatabaseSync;

  constructor(path: string) {
    if (path !== ':memory:') {
      mkdirSync(dirname(path), { recursive: true });
    }
    this.database = new DatabaseSync(path, { timeout: 0 });
    this.database.exec('PRAGMA journal_mode = WAL');
    this.database.exec(
      'CREATE TABLE IF NOT EXISTS feature_switches (' +
        'namespace TEXT NOT NULL, key TEXT NOT NULL, enabled INTEGER NOT NULL, ' +
        'PRIMARY KEY (namespace, key), CHECK (enabled IN (0, 1)))',
    );
  }

  disabledLevels(): string[] {
    return this.database
      .prepare("SELECT key FROM feature_switches WHERE namespace = 'levels' AND enabled = 0")
      .all()
      .map((row) => row['key'])
      .filter((value): value is string => typeof value === 'string');
  }

  setLevelEnabled(id: string, enabled: boolean, knownIds: readonly string[]): boolean {
    if (!knownIds.includes(id)) {
      return false;
    }
    this.database.exec('BEGIN IMMEDIATE');
    try {
      const disabled = new Set(this.disabledLevels());
      if (!enabled) {
        disabled.add(id);
        if (!knownIds.some((known) => !disabled.has(known))) {
          this.database.exec('ROLLBACK');
          return false;
        }
      }
      this.database
        .prepare(
          "INSERT INTO feature_switches (namespace, key, enabled) VALUES ('levels', ?, ?) " +
            'ON CONFLICT (namespace, key) DO UPDATE SET enabled = excluded.enabled',
        )
        .run(id, enabled ? 1 : 0);
      this.database.exec('COMMIT');
      return true;
    } catch (error: unknown) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  close(): void {
    this.database.close();
  }
}
