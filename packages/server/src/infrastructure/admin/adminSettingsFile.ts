import { randomUUID } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';
import type { AdminLevelSetting } from './AdminLevelSetting.ts';

export function withAdminSettingsLock<T>(path: string, action: () => T): T {
  mkdirSync(dirname(path), { recursive: true });
  const lockPath = `${path}.lock`;
  const descriptor = openSync(lockPath, 'wx', 0o600);
  const lock = fstatSync(descriptor);
  try {
    writeFileSync(descriptor, `${process.pid}\n`);
    return action();
  } finally {
    closeSync(descriptor);
    const current = lstatSync(lockPath, { throwIfNoEntry: false });
    if (current !== undefined && current.dev === lock.dev && current.ino === lock.ino) {
      unlinkSync(lockPath);
    }
  }
}

export function writeAdminSettings(path: string, settings: readonly AdminLevelSetting[]): void {
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
