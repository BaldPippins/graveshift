import type { ShieldsBadge } from './ShieldsBadge.ts';
import type { TestResults } from './TestResults.ts';

interface CoverageColor {
  readonly minPercent: number;
  readonly color: string;
}

const COVERAGE_COLORS: readonly CoverageColor[] = [
  { minPercent: 90, color: 'brightgreen' },
  { minPercent: 80, color: 'green' },
  { minPercent: 70, color: 'yellowgreen' },
  { minPercent: 60, color: 'yellow' },
  { minPercent: 50, color: 'orange' },
];

const LOW_COVERAGE_COLOR = 'red';

export function coverageBadge(percent: number): ShieldsBadge {
  const step = COVERAGE_COLORS.find(({ minPercent }) => percent >= minPercent);
  return {
    schemaVersion: 1,
    label: 'coverage',
    message: `${percent.toFixed(1)}%`,
    color: step === undefined ? LOW_COVERAGE_COLOR : step.color,
  };
}

function failureOf(results: TestResults): string {
  if (results.numFailedTests > 0) {
    return `${results.numFailedTests} failed`;
  }
  if (results.numFailedTestSuites > 0) {
    return `${results.numFailedTestSuites} files failed`;
  }
  return results.success ? '' : 'run failed';
}

export function testsBadge(results: TestResults): ShieldsBadge {
  const passed = `${results.numPassedTests} passed`;
  const failure = failureOf(results);
  if (failure !== '') {
    return { schemaVersion: 1, label: 'tests', message: `${passed}, ${failure}`, color: 'red' };
  }
  return { schemaVersion: 1, label: 'tests', message: passed, color: 'brightgreen' };
}
