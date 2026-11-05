export interface LevelGeometry {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly rows: readonly string[];
}

export interface LevelGeometryIssue {
  readonly path: string;
  readonly code: string;
}
