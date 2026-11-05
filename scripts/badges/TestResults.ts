export interface TestResults {
  readonly success: boolean;
  readonly numPassedTests: number;
  readonly numFailedTests: number;
  readonly numFailedTestSuites: number;
}
