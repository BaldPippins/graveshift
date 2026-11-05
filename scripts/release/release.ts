import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { releaseChangelog, releaseNotes } from './changelog.ts';
import { withPackageVersion } from './packageVersion.ts';
import type { PullRequest } from './PullRequest.ts';
import { bumpOf, strongestBump } from './pullRequestBump.ts';
import { ReleaseBump } from './ReleaseBump.ts';
import { nextVersion } from './semver.ts';

const CHANGELOG = 'CHANGELOG.md';
const ROOT_MANIFEST = 'package.json';
const PACKAGES_DIR = 'packages';

interface RootManifest {
  readonly version: string;
}

interface ReleaseOptions {
  readonly command: string;
  readonly pullRequests: string;
  readonly notes: string;
  readonly version: string;
  readonly repositoryUrl: string;
}

function readOptions(): ReleaseOptions {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      'pull-requests': { type: 'string', default: '' },
      notes: { type: 'string', default: '' },
      version: { type: 'string', default: '' },
      'repository-url': { type: 'string', default: '' },
    },
  });
  return {
    command: positionals[0] ?? '',
    pullRequests: values['pull-requests'],
    notes: values.notes,
    version: values.version,
    repositoryUrl: values['repository-url'],
  };
}

function manifestPaths(): readonly string[] {
  const packages = readdirSync(PACKAGES_DIR).map((name) => join(PACKAGES_DIR, name, ROOT_MANIFEST));
  return [ROOT_MANIFEST, ...packages];
}

function currentVersion(): string {
  return (JSON.parse(readFileSync(ROOT_MANIFEST, 'utf8')) as RootManifest).version;
}

function prepare(options: ReleaseOptions): void {
  const pullRequests = JSON.parse(readFileSync(options.pullRequests, 'utf8')) as PullRequest[];
  const bump = strongestBump(pullRequests.map(bumpOf));
  if (bump === ReleaseBump.Skip) {
    return;
  }
  const previousVersion = currentVersion();
  const version = nextVersion(previousVersion, bump);
  for (const path of manifestPaths()) {
    writeFileSync(path, withPackageVersion(readFileSync(path, 'utf8'), version));
  }
  const changelog = releaseChangelog(readFileSync(CHANGELOG, 'utf8'), {
    version,
    previousVersion,
    date: new Date().toISOString().slice(0, 10),
    repositoryUrl: options.repositoryUrl,
    pullRequests,
  });
  writeFileSync(CHANGELOG, changelog);
  process.stdout.write(`version=${version}\n`);
}

function notes(options: ReleaseOptions): void {
  writeFileSync(options.notes, releaseNotes(readFileSync(CHANGELOG, 'utf8'), options.version));
}

const options = readOptions();
switch (options.command) {
  case 'prepare':
    prepare(options);
    break;
  case 'notes':
    notes(options);
    break;
  default:
    throw new Error(`Unknown command "${options.command}", expected prepare or notes`);
}
