import { describe, expect, it } from 'vitest';
import { coverageBadge, testsBadge } from './badges.ts';

describe('badges', () => {
  it('colors coverage by thresholds', () => {
    expect(coverageBadge(93.456)).toEqual({
      schemaVersion: 1,
      label: 'coverage',
      message: '93.5%',
      color: 'brightgreen',
    });
    expect(coverageBadge(80).color).toBe('green');
    expect(coverageBadge(55).color).toBe('orange');
    expect(coverageBadge(12).color).toBe('red');
  });

  it('turns the tests badge red on failures', () => {
    const run = { success: true, numPassedTests: 312, numFailedTests: 0, numFailedTestSuites: 0 };
    expect(testsBadge(run)).toEqual({
      schemaVersion: 1,
      label: 'tests',
      message: '312 passed',
      color: 'brightgreen',
    });
    expect(
      testsBadge({ ...run, success: false, numFailedTests: 2, numFailedTestSuites: 1 }),
    ).toMatchObject({ message: '312 passed, 2 failed', color: 'red' });
  });

  it('turns the tests badge red when a test file fails to load', () => {
    const importError = {
      success: false,
      numPassedTests: 300,
      numFailedTests: 0,
      numFailedTestSuites: 1,
    };
    expect(testsBadge(importError)).toMatchObject({
      message: '300 passed, 1 files failed',
      color: 'red',
    });
    expect(testsBadge({ ...importError, numFailedTestSuites: 0 })).toMatchObject({
      message: '300 passed, run failed',
      color: 'red',
    });
  });
});
