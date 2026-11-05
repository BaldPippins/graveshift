import type { PullRequest } from './PullRequest.ts';
import { isFeature } from './pullRequestBump.ts';

const UNRELEASED = 'Unreleased';
const UNRELEASED_LINK = `[${UNRELEASED}]: `;
const SECTION_START = '\n## [';
const LINKS_START = `\n${UNRELEASED_LINK}`;
const FIX_TITLE = /^fix(\([^)]*\))?!?:/i;
const FIX_LABEL = 'bug';
const GROUP_HEADING = '### ';
const GROUP_SPLIT = /\n+(?=### )/;

const EntryGroup = {
  Added: 'Добавлено',
  Changed: 'Изменено',
  Fixed: 'Исправлено',
} as const;

type EntryGroup = (typeof EntryGroup)[keyof typeof EntryGroup];

const GROUP_ORDER: readonly EntryGroup[] = [EntryGroup.Added, EntryGroup.Changed, EntryGroup.Fixed];

export interface ChangelogRelease {
  readonly version: string;
  readonly previousVersion: string;
  readonly date: string;
  readonly repositoryUrl: string;
  readonly pullRequests: readonly PullRequest[];
}

interface EntryBlock {
  readonly heading: string;
  readonly body: string;
}

interface SectionBounds {
  readonly bodyStart: number;
  readonly bodyEnd: number;
}

function sectionBounds(changelog: string, name: string): SectionBounds {
  const headingStart = changelog.indexOf(`\n## [${name}]`);
  if (headingStart === -1) {
    throw new Error(`CHANGELOG has no [${name}] section`);
  }
  const bodyStart = changelog.indexOf('\n', headingStart + 1) + 1;
  const ends = [SECTION_START, LINKS_START]
    .map((marker) => changelog.indexOf(marker, bodyStart - 1))
    .filter((index) => index !== -1);
  return { bodyStart, bodyEnd: ends.length > 0 ? Math.min(...ends) : changelog.length };
}

function groupOf(pullRequest: PullRequest): EntryGroup {
  if (isFeature(pullRequest)) {
    return EntryGroup.Added;
  }
  if (FIX_TITLE.test(pullRequest.title) || pullRequest.labels.includes(FIX_LABEL)) {
    return EntryGroup.Fixed;
  }
  return EntryGroup.Changed;
}

function entryOf(pullRequest: PullRequest): string {
  return `- ${pullRequest.title} ([#${pullRequest.number}](${pullRequest.url}))`;
}

function blockOf(text: string): EntryBlock {
  if (!text.startsWith(GROUP_HEADING)) {
    return { heading: '', body: text.trim() };
  }
  const lineEnd = text.indexOf('\n');
  const headingEnd = lineEnd === -1 ? text.length : lineEnd;
  return {
    heading: text.slice(GROUP_HEADING.length, headingEnd).trim(),
    body: text.slice(headingEnd).trim(),
  };
}

function blocksOf(written: string): readonly EntryBlock[] {
  return written === '' ? [] : written.split(GROUP_SPLIT).map(blockOf);
}

function renderBlock(block: EntryBlock): string {
  return block.heading === '' ? block.body : `${GROUP_HEADING}${block.heading}\n\n${block.body}`;
}

function isDescribed(written: string, pullRequest: PullRequest): boolean {
  return written.includes(`(${pullRequest.url})`);
}

function withEntries(
  blocks: readonly EntryBlock[],
  group: EntryGroup,
  entries: string,
): readonly EntryBlock[] {
  if (!blocks.some((block) => block.heading === group)) {
    return [...blocks, { heading: group, body: entries }];
  }
  return blocks.map((block) =>
    block.heading === group ? { heading: group, body: `${block.body}\n${entries}` } : block,
  );
}

function releaseBody(written: string, pullRequests: readonly PullRequest[]): string {
  const undescribed = pullRequests.filter((pullRequest) => !isDescribed(written, pullRequest));
  const blocks = GROUP_ORDER.reduce((current, group) => {
    const entries = undescribed.filter((pullRequest) => groupOf(pullRequest) === group);
    return entries.length === 0
      ? current
      : withEntries(current, group, entries.map(entryOf).join('\n'));
  }, blocksOf(written));
  return blocks.map(renderBlock).join('\n\n');
}

function releaseLinks(changelog: string, release: ChangelogRelease): string {
  const linkStart = changelog.indexOf(LINKS_START);
  if (linkStart === -1) {
    throw new Error('CHANGELOG has no [Unreleased] link');
  }
  const lineEnd = changelog.indexOf('\n', linkStart + 1);
  const { repositoryUrl, version, previousVersion } = release;
  const links =
    `${UNRELEASED_LINK}${repositoryUrl}/compare/v${version}...HEAD\n` +
    `[${version}]: ${repositoryUrl}/compare/v${previousVersion}...v${version}`;
  const rest = lineEnd === -1 ? '' : changelog.slice(lineEnd);
  return `${changelog.slice(0, linkStart + 1)}${links}${rest}`;
}

export function releaseChangelog(changelog: string, release: ChangelogRelease): string {
  const { bodyStart, bodyEnd } = sectionBounds(changelog, UNRELEASED);
  const written = changelog.slice(bodyStart, bodyEnd).trim();
  const body = releaseBody(written, release.pullRequests);
  const section = `\n## [${release.version}] - ${release.date}\n\n${body}\n`;
  const moved = `${changelog.slice(0, bodyStart)}${section}${changelog.slice(bodyEnd)}`;
  return releaseLinks(moved, release);
}

export function releaseNotes(changelog: string, version: string): string {
  const { bodyStart, bodyEnd } = sectionBounds(changelog, version);
  return changelog.slice(bodyStart, bodyEnd).trim();
}
