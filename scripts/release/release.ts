import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { releaseChangelog, releaseNotes } from './changelog.ts';
import { withPackageVersion } from './packageVersion.ts';
import type { PullRequest } from './PullRequest.ts';
import { releaseProblems } from './releaseCheck.ts';
import { isVersionBump } from './ReleaseBump.ts';
import { nextVersion } from './semver.ts';

const CHANGELOG = 'CHANGELOG.md';
const MANIFEST = 'package.json';
const PACKAGES_DIR = 'packages';

interface Manifest {
  readonly version: string;
}

interface ReleaseOptions {
  readonly command: string;
  readonly bump: string;
  readonly version: string;
  readonly baseVersion: string;
  readonly pullRequest: string;
  readonly notes: string;
}

function readOptions(): ReleaseOptions {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      version: { type: 'string', default: '' },
      'base-version': { type: 'string', default: '' },
      'pull-request': { type: 'string', default: '' },
      notes: { type: 'string', default: '' },
    },
  });
  return {
    command: positionals[0] ?? '',
    bump: positionals[1] ?? '',
    version: values.version,
    baseVersion: values['base-version'],
    pullRequest: values['pull-request'],
    notes: values.notes,
  };
}

function manifestPaths(): readonly string[] {
  const packages = readdirSync(PACKAGES_DIR).map((name) => join(PACKAGES_DIR, name, MANIFEST));
  return [MANIFEST, ...packages];
}

function versionOf(path: string): string {
  return (JSON.parse(readFileSync(path, 'utf8')) as Manifest).version;
}

function bump(options: ReleaseOptions): void {
  if (!isVersionBump(options.bump)) {
    throw new Error('Usage: pnpm release <major|minor|patch>');
  }
  const previousVersion = versionOf(MANIFEST);
  const version = nextVersion(previousVersion, options.bump);
  const date = new Date().toISOString().slice(0, 10);
  const changelog = readFileSync(CHANGELOG, 'utf8');
  writeFileSync(CHANGELOG, releaseChangelog(changelog, { version, previousVersion, date }));
  for (const path of manifestPaths()) {
    writeFileSync(path, withPackageVersion(readFileSync(path, 'utf8'), version));
  }
  process.stdout.write(`${previousVersion} → ${version}\n`);
}

function verify(options: ReleaseOptions): void {
  const problems = releaseProblems({
    baseVersion: options.baseVersion,
    manifestVersions: manifestPaths().map(versionOf),
    changelog: readFileSync(CHANGELOG, 'utf8'),
    pullRequest: JSON.parse(readFileSync(options.pullRequest, 'utf8')) as PullRequest,
  });
  for (const problem of problems) {
    process.stderr.write(`${problem}\n`);
  }
  process.exitCode = problems.length > 0 ? 1 : 0;
}

function notes(options: ReleaseOptions): void {
  const text = releaseNotes(readFileSync(CHANGELOG, 'utf8'), options.version);
  if (text === '') {
    throw new Error(`CHANGELOG has no notes for ${options.version}`);
  }
  writeFileSync(options.notes, `${text}\n`);
}

const options = readOptions();
switch (options.command) {
  case 'bump':
    bump(options);
    break;
  case 'verify':
    verify(options);
    break;
  case 'notes':
    notes(options);
    break;
  default:
    throw new Error(`Unknown command "${options.command}", expected bump, verify or notes`);
}
