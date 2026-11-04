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
    expect(testsBadge({ numPassedTests: 312, numFailedTests: 0 })).toEqual({
      schemaVersion: 1,
      label: 'tests',
      message: '312 passed',
      color: 'brightgreen',
    });
    expect(testsBadge({ numPassedTests: 310, numFailedTests: 2 })).toMatchObject({
      message: '310 passed, 2 failed',
      color: 'red',
    });
  });
});
