import { releaseNotes } from './changelog.ts';
import type { PullRequest } from './PullRequest.ts';
import { bumpOf } from './pullRequestBump.ts';
import { ReleaseBump } from './ReleaseBump.ts';
import { nextVersion } from './semver.ts';

export interface ReleaseCheckInput {
  readonly baseVersion: string;
  readonly manifestVersions: readonly string[];
  readonly changelog: string;
  readonly pullRequest: PullRequest;
}

function expectedVersionProblems(input: ReleaseCheckInput, version: string): readonly string[] {
  const bump = bumpOf(input.pullRequest);
  if (bump === ReleaseBump.Skip) {
    return version === input.baseVersion
      ? []
      : [`PR is labelled release:skip, keep version ${input.baseVersion}`];
  }
  const expected = nextVersion(input.baseVersion, bump);
  if (version !== expected) {
    return [`Expected version ${expected} (${bump}), got ${version}: run pnpm release ${bump}`];
  }
  if (releaseNotes(input.changelog, expected) === '') {
    return [`CHANGELOG has no notes for ${expected}: run pnpm release ${bump}`];
  }
  return [];
}

export function releaseProblems(input: ReleaseCheckInput): readonly string[] {
  const versions = new Set(input.manifestVersions);
  const [version] = versions;
  if (version === undefined || versions.size > 1) {
    return [`package.json versions differ: ${[...versions].join(', ')}`];
  }
  return expectedVersionProblems(input, version);
}
