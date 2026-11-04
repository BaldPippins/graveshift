import { ReleaseBump } from './ReleaseBump.ts';
import type { VersionBump } from './ReleaseBump.ts';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

export function nextVersion(version: string, bump: VersionBump): string {
  const match = SEMVER.exec(version);
  if (match === null) {
    throw new Error(`Not a plain semver version: ${version}`);
  }
  const [major, minor, patch] = match.slice(1).map(Number) as [number, number, number];
  switch (bump) {
    case ReleaseBump.Major:
      return `${major + 1}.0.0`;
    case ReleaseBump.Minor:
      return `${major}.${minor + 1}.0`;
    case ReleaseBump.Patch:
      return `${major}.${minor}.${patch + 1}`;
  }
}
