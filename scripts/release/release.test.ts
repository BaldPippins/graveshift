import { describe, expect, it } from 'vitest';
import { releaseChangelog, releaseNotes } from './changelog.ts';
import type { ChangelogRelease } from './changelog.ts';
import { withPackageVersion } from './packageVersion.ts';
import type { PullRequest } from './PullRequest.ts';
import { bumpOf, strongestBump } from './pullRequestBump.ts';
import { ReleaseBump } from './ReleaseBump.ts';
import { nextVersion } from './semver.ts';

const REPOSITORY = 'https://github.com/owner/repo';

function pullRequest(number: number, title: string, labels: readonly string[] = []): PullRequest {
  return { number, title, url: `${REPOSITORY}/pull/${number}`, labels };
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

function releaseOf(pullRequests: readonly PullRequest[]): ChangelogRelease {
  return {
    version: '0.2.0',
    previousVersion: '0.1.0',
    date: '2026-11-05',
    repositoryUrl: REPOSITORY,
    pullRequests,
  };
}

describe('release', () => {
  it('bumps semver parts', () => {
    expect(nextVersion('0.1.9', ReleaseBump.Patch)).toBe('0.1.10');
    expect(nextVersion('0.1.9', ReleaseBump.Minor)).toBe('0.2.0');
    expect(nextVersion('0.1.9', ReleaseBump.Major)).toBe('1.0.0');
    expect(() => nextVersion('1.0.0-beta', ReleaseBump.Patch)).toThrow();
  });

  it('takes the bump from labels before the title', () => {
    expect(bumpOf(pullRequest(1, 'feat: bats'))).toBe(ReleaseBump.Minor);
    expect(bumpOf(pullRequest(2, 'feat(client)!: new hud'))).toBe(ReleaseBump.Minor);
    expect(bumpOf(pullRequest(3, 'Add bats', ['enhancement']))).toBe(ReleaseBump.Minor);
    expect(bumpOf(pullRequest(4, 'Fix jitter'))).toBe(ReleaseBump.Patch);
    expect(bumpOf(pullRequest(5, 'feat: x', ['release:patch']))).toBe(ReleaseBump.Patch);
    expect(bumpOf(pullRequest(6, 'Rework', ['release:major']))).toBe(ReleaseBump.Major);
    expect(bumpOf(pullRequest(7, 'docs', ['release:skip', 'release:major']))).toBe(
      ReleaseBump.Skip,
    );
  });

  it('releases the strongest bump and skips when nothing counts', () => {
    expect(strongestBump([ReleaseBump.Patch, ReleaseBump.Minor, ReleaseBump.Skip])).toBe(
      ReleaseBump.Minor,
    );
    expect(strongestBump([ReleaseBump.Skip])).toBe(ReleaseBump.Skip);
    expect(strongestBump([])).toBe(ReleaseBump.Skip);
  });

  it('moves written unreleased notes into the new version', () => {
    const released = releaseChangelog(
      changelogWith(`\n### Добавлено\n\n- Нетопыри ([#5](${REPOSITORY}/pull/5))\n`),
      releaseOf([pullRequest(5, 'feat: bats')]),
    );
    expect(released).toContain('## [Unreleased]\n\n## [0.2.0] - 2026-11-05\n\n### Добавлено');
    expect(releaseNotes(released, '0.2.0')).toBe(
      `### Добавлено\n\n- Нетопыри ([#5](${REPOSITORY}/pull/5))`,
    );
    expect(releaseNotes(released, '0.1.0')).toBe('### Добавлено\n\n- Прототип');
    expect(released).toContain(
      `[Unreleased]: ${REPOSITORY}/compare/v0.2.0...HEAD\n` +
        `[0.2.0]: ${REPOSITORY}/compare/v0.1.0...v0.2.0\n` +
        `[0.1.0]: ${REPOSITORY}/releases/tag/v0.1.0\n`,
    );
  });

  it('adds titles of pull requests missing from written notes', () => {
    const released = releaseChangelog(
      changelogWith(
        `\n### Добавлено\n\n- Нетопыри\n  в небе ([#5](${REPOSITORY}/pull/5))\n\n` +
          '### Удалено\n\n- Старая лавка\n',
      ),
      releaseOf([
        pullRequest(5, 'feat: bats'),
        pullRequest(50, 'feat: traps'),
        pullRequest(51, 'fix: reload'),
      ]),
    );
    expect(releaseNotes(released, '0.2.0')).toBe(
      `### Добавлено\n\n- Нетопыри\n  в небе ([#5](${REPOSITORY}/pull/5))\n` +
        `- feat: traps ([#50](${REPOSITORY}/pull/50))\n\n` +
        '### Удалено\n\n- Старая лавка\n\n' +
        `### Исправлено\n\n- fix: reload ([#51](${REPOSITORY}/pull/51))`,
    );
  });

  it('writes pull request titles when unreleased is empty', () => {
    const released = releaseChangelog(
      changelogWith(''),
      releaseOf([
        pullRequest(7, 'Tune shop'),
        pullRequest(8, 'fix: reload'),
        pullRequest(9, 'feat: bats'),
      ]),
    );
    expect(releaseNotes(released, '0.2.0')).toBe(
      `### Добавлено\n\n- feat: bats ([#9](${REPOSITORY}/pull/9))\n\n` +
        `### Изменено\n\n- Tune shop ([#7](${REPOSITORY}/pull/7))\n\n` +
        `### Исправлено\n\n- fix: reload ([#8](${REPOSITORY}/pull/8))`,
    );
  });

  it('rewrites only the version field of a manifest', () => {
    const manifest = '{\n  "name": "a",\n  "version": "0.1.0",\n  "private": true\n}\n';
    expect(withPackageVersion(manifest, '0.2.0')).toBe(
      '{\n  "name": "a",\n  "version": "0.2.0",\n  "private": true\n}\n',
    );
    expect(() => withPackageVersion('{}', '0.2.0')).toThrow();
  });
});
