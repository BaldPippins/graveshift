const UNRELEASED = 'Unreleased';
const UNRELEASED_LINK = `[${UNRELEASED}]: `;
const SECTION_START = '\n## [';
const LINKS_START = `\n${UNRELEASED_LINK}`;
const COMPARE_PATH = '/compare/';

export interface ChangelogRelease {
  readonly version: string;
  readonly previousVersion: string;
  readonly date: string;
}

interface SectionBounds {
  readonly bodyStart: number;
  readonly bodyEnd: number;
}

interface UnreleasedLink {
  readonly start: number;
  readonly end: number;
  readonly repositoryUrl: string;
}

function sectionBounds(changelog: string, name: string): SectionBounds | null {
  const headingStart = changelog.indexOf(`\n## [${name}]`);
  if (headingStart === -1) {
    return null;
  }
  const bodyStart = changelog.indexOf('\n', headingStart + 1) + 1;
  const ends = [SECTION_START, LINKS_START]
    .map((marker) => changelog.indexOf(marker, bodyStart - 1))
    .filter((index) => index !== -1);
  return { bodyStart, bodyEnd: ends.length > 0 ? Math.min(...ends) : changelog.length };
}

function requiredSection(changelog: string, name: string): SectionBounds {
  const bounds = sectionBounds(changelog, name);
  if (bounds === null) {
    throw new Error(`CHANGELOG has no [${name}] section`);
  }
  return bounds;
}

function unreleasedLink(changelog: string): UnreleasedLink {
  const start = changelog.indexOf(LINKS_START) + 1;
  const compareStart = changelog.indexOf(COMPARE_PATH, start);
  if (start === 0 || compareStart === -1) {
    throw new Error(`CHANGELOG has no ${UNRELEASED_LINK}<repository>${COMPARE_PATH}… link`);
  }
  const lineEnd = changelog.indexOf('\n', start);
  return {
    start,
    end: lineEnd === -1 ? changelog.length : lineEnd,
    repositoryUrl: changelog.slice(start + UNRELEASED_LINK.length, compareStart),
  };
}

function releaseLinks(changelog: string, release: ChangelogRelease): string {
  const link = unreleasedLink(changelog);
  const { version, previousVersion } = release;
  const links =
    `${UNRELEASED_LINK}${link.repositoryUrl}${COMPARE_PATH}v${version}...HEAD\n` +
    `[${version}]: ${link.repositoryUrl}${COMPARE_PATH}v${previousVersion}...v${version}`;
  return `${changelog.slice(0, link.start)}${links}${changelog.slice(link.end)}`;
}

export function releaseChangelog(changelog: string, release: ChangelogRelease): string {
  const { bodyStart, bodyEnd } = requiredSection(changelog, UNRELEASED);
  const body = changelog.slice(bodyStart, bodyEnd).trim();
  if (body === '') {
    throw new Error(`Describe the changes in [${UNRELEASED}] first`);
  }
  const section = `\n## [${release.version}] - ${release.date}\n\n${body}\n`;
  const moved = `${changelog.slice(0, bodyStart)}${section}${changelog.slice(bodyEnd)}`;
  return releaseLinks(moved, release);
}

export function releaseNotes(changelog: string, version: string): string {
  const bounds = sectionBounds(changelog, version);
  return bounds === null ? '' : changelog.slice(bounds.bodyStart, bounds.bodyEnd).trim();
}
