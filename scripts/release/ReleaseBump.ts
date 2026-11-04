export const ReleaseBump = {
  Major: 'major',
  Minor: 'minor',
  Patch: 'patch',
  Skip: 'skip',
} as const;

export type ReleaseBump = (typeof ReleaseBump)[keyof typeof ReleaseBump];

export type VersionBump = Exclude<ReleaseBump, typeof ReleaseBump.Skip>;

const VERSION_BUMPS: readonly string[] = [ReleaseBump.Major, ReleaseBump.Minor, ReleaseBump.Patch];

export function isVersionBump(value: string): value is VersionBump {
  return VERSION_BUMPS.includes(value);
}
