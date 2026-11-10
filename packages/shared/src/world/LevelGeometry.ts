export interface CellOrientation {
  readonly x: number;
  readonly y: number;
  readonly quarterTurns: number;
}

export interface LevelGeometry {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly rows: readonly string[];
  readonly orientations?: readonly CellOrientation[];
}

export interface LevelGeometryIssue {
  readonly path: string;
  readonly code: string;
}
