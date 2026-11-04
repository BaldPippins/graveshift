import type { PullRequest } from './PullRequest.ts';
import { ReleaseBump } from './ReleaseBump.ts';

const LABEL_BUMPS: readonly (readonly [string, ReleaseBump])[] = [
  ['release:skip', ReleaseBump.Skip],
  ['release:major', ReleaseBump.Major],
  ['release:minor', ReleaseBump.Minor],
  ['release:patch', ReleaseBump.Patch],
];

const FEATURE_TITLE = /^feat(\([^)]*\))?!?:/i;
const FEATURE_LABEL = 'enhancement';

function isFeature(pullRequest: PullRequest): boolean {
  return FEATURE_TITLE.test(pullRequest.title) || pullRequest.labels.includes(FEATURE_LABEL);
}

export function bumpOf(pullRequest: PullRequest): ReleaseBump {
  const labelled = LABEL_BUMPS.find(([label]) => pullRequest.labels.includes(label));
  if (labelled !== undefined) {
    return labelled[1];
  }
  return isFeature(pullRequest) ? ReleaseBump.Minor : ReleaseBump.Patch;
}
