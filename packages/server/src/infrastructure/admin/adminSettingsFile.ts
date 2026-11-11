import { randomUUID } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';
import type { AdminLevelSetting } from './AdminLevelSetting.ts';

export function writeAdminSettings(path: string, settings: readonly AdminLevelSetting[]): void {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  const descriptor = openSync(temp, 'wx', 0o600);
  try {
    try {
      writeFileSync(descriptor, `${JSON.stringify(settings, null, 2)}\n`);
      fsyncSync(descriptor);
    } finally {
      closeSync(descriptor);
    }
    renameSync(temp, path);
  } finally {
    if (existsSync(temp)) {
      unlinkSync(temp);
    }
  }
}
