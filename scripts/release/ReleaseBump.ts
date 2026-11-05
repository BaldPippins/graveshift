export const ReleaseBump = {
  Major: 'major',
  Minor: 'minor',
  Patch: 'patch',
  Skip: 'skip',
} as const;

export type ReleaseBump = (typeof ReleaseBump)[keyof typeof ReleaseBump];

export type VersionBump = Exclude<ReleaseBump, typeof ReleaseBump.Skip>;
