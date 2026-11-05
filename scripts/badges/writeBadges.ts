import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { coverageBadge, testsBadge } from './badges.ts';
import type { ShieldsBadge } from './ShieldsBadge.ts';
import type { TestResults } from './TestResults.ts';

interface CoverageMetric {
  readonly pct: number;
}

interface CoverageTotals {
  readonly lines: CoverageMetric;
}

interface CoverageSummary {
  readonly total: CoverageTotals;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeBadge(dir: string, name: string, badge: ShieldsBadge): void {
  writeFileSync(join(dir, `${name}.json`), `${JSON.stringify(badge)}\n`);
}

const { values } = parseArgs({
  options: {
    coverage: { type: 'string', default: 'coverage/coverage-summary.json' },
    tests: { type: 'string', default: 'coverage/test-results.json' },
    out: { type: 'string', default: 'badges' },
  },
});

const summary = readJson(values.coverage) as CoverageSummary;
const results = readJson(values.tests) as TestResults;
mkdirSync(values.out, { recursive: true });
writeBadge(values.out, 'coverage', coverageBadge(summary.total.lines.pct));
writeBadge(values.out, 'tests', testsBadge(results));
