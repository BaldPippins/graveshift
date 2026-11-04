export interface PullRequest {
  readonly number: number;
  readonly title: string;
  readonly url: string;
  readonly labels: readonly string[];
}
