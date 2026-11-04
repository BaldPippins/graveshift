import { describe, expect, it } from 'vitest';
import { releaseChangelog, releaseNotes } from './changelog.ts';
import { withPackageVersion } from './packageVersion.ts';
import type { PullRequest } from './PullRequest.ts';
import { bumpOf } from './pullRequestBump.ts';
import { releaseProblems } from './releaseCheck.ts';
import { ReleaseBump } from './ReleaseBump.ts';
import { nextVersion } from './semver.ts';

const REPOSITORY = 'https://github.com/owner/repo';
const RELEASE = { version: '0.2.0', previousVersion: '0.1.0', date: '2026-11-05' };

function pullRequest(title: string, labels: readonly string[] = []): PullRequest {
  return { title, labels };
}

function changelogWith(unreleased: string): string {
  return [
    '# Журнал изменений',
    '',
    '## [Unreleased]',
    unreleased,
    '## [0.1.0] - 2026-11-04',
    '',
    '### Добавлено',
    '',
    '- Прототип',
    '',
    `[Unreleased]: ${REPOSITORY}/compare/v0.1.0...HEAD`,
    `[0.1.0]: ${REPOSITORY}/releases/tag/v0.1.0`,
    '',
  ].join('\n');
}

const RELEASED = releaseChangelog(changelogWith('\n### Добавлено\n\n- Нетопыри\n'), RELEASE);

describe('release', () => {
  it('bumps semver parts', () => {
    expect(nextVersion('0.1.9', ReleaseBump.Patch)).toBe('0.1.10');
    expect(nextVersion('0.1.9', ReleaseBump.Minor)).toBe('0.2.0');
    expect(nextVersion('0.1.9', ReleaseBump.Major)).toBe('1.0.0');
    expect(() => nextVersion('1.0.0-beta', ReleaseBump.Patch)).toThrow();
  });

  it('takes the bump from labels before the title', () => {
    expect(bumpOf(pullRequest('feat: bats'))).toBe(ReleaseBump.Minor);
    expect(bumpOf(pullRequest('feat(client)!: new hud'))).toBe(ReleaseBump.Minor);
    expect(bumpOf(pullRequest('Add bats', ['enhancement']))).toBe(ReleaseBump.Minor);
    expect(bumpOf(pullRequest('Fix jitter'))).toBe(ReleaseBump.Patch);
    expect(bumpOf(pullRequest('feat: x', ['release:patch']))).toBe(ReleaseBump.Patch);
    expect(bumpOf(pullRequest('Rework', ['release:major']))).toBe(ReleaseBump.Major);
    expect(bumpOf(pullRequest('docs', ['release:skip', 'release:major']))).toBe(ReleaseBump.Skip);
  });

  it('moves unreleased notes into the new version', () => {
    expect(RELEASED).toContain('## [Unreleased]\n\n## [0.2.0] - 2026-11-05\n\n### Добавлено');
    expect(releaseNotes(RELEASED, '0.2.0')).toBe('### Добавлено\n\n- Нетопыри');
    expect(releaseNotes(RELEASED, '0.1.0')).toBe('### Добавлено\n\n- Прототип');
    expect(releaseNotes(RELEASED, '0.3.0')).toBe('');
    expect(RELEASED).toContain(
      `[Unreleased]: ${REPOSITORY}/compare/v0.2.0...HEAD\n` +
        `[0.2.0]: ${REPOSITORY}/compare/v0.1.0...v0.2.0\n` +
        `[0.1.0]: ${REPOSITORY}/releases/tag/v0.1.0\n`,
    );
  });

  it('refuses to release an empty unreleased section', () => {
    expect(() => releaseChangelog(changelogWith(''), RELEASE)).toThrow();
  });

  it('accepts a pull request bumped as its labels and title ask', () => {
    const check = { baseVersion: '0.1.0', changelog: RELEASED };
    expect(
      releaseProblems({
        ...check,
        manifestVersions: ['0.2.0', '0.2.0'],
        pullRequest: pullRequest('feat: bats'),
      }),
    ).toEqual([]);
    expect(
      releaseProblems({
        ...check,
        manifestVersions: ['0.1.0'],
        pullRequest: pullRequest('docs', ['release:skip']),
      }),
    ).toEqual([]);
  });

  it('names the command for a wrong or missing bump', () => {
    const check = { baseVersion: '0.1.0', changelog: RELEASED };
    expect(
      releaseProblems({ ...check, manifestVersions: ['0.1.0'], pullRequest: pullRequest('Fix') }),
    ).toEqual(['Expected version 0.1.1 (patch), got 0.1.0: run pnpm release patch']);
    expect(
      releaseProblems({
        ...check,
        manifestVersions: ['0.1.1'],
        pullRequest: pullRequest('Fix', ['bug']),
      }),
    ).toEqual(['CHANGELOG has no notes for 0.1.1: run pnpm release patch']);
    expect(
      releaseProblems({
        ...check,
        manifestVersions: ['0.2.0', '0.1.0'],
        pullRequest: pullRequest('feat: x'),
      }),
    ).toEqual(['package.json versions differ: 0.2.0, 0.1.0']);
    expect(
      releaseProblems({
        ...check,
        manifestVersions: ['0.2.0'],
        pullRequest: pullRequest('docs', ['release:skip']),
      }),
    ).toEqual(['PR is labelled release:skip, keep version 0.1.0']);
  });

  it('rewrites only the version field of a manifest', () => {
    const manifest = '{\n  "name": "a",\n  "version": "0.1.0",\n  "private": true\n}\n';
    expect(withPackageVersion(manifest, '0.2.0')).toBe(
      '{\n  "name": "a",\n  "version": "0.2.0",\n  "private": true\n}\n',
    );
    expect(() => withPackageVersion('{}', '0.2.0')).toThrow();
  });
});
