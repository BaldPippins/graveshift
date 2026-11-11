import type { LevelDefinition } from '@graveshift/shared/world';

export interface EditorHistory {
  readonly current: LevelDefinition;
  readonly past: readonly LevelDefinition[];
  readonly future: readonly LevelDefinition[];
}

export function createEditorHistory(level: LevelDefinition): EditorHistory {
  return { current: level, past: [], future: [] };
}

export function updateEditorHistory(history: EditorHistory, level: LevelDefinition): EditorHistory {
  if (level === history.current) {
    return history;
  }
  return { current: level, past: [...history.past, history.current], future: [] };
}

export function undoEditorHistory(history: EditorHistory): EditorHistory {
  const previous = history.past.at(-1);
  if (previous === undefined) {
    return history;
  }
  return {
    current: previous,
    past: history.past.slice(0, -1),
    future: [history.current, ...history.future],
  };
}

export function redoEditorHistory(history: EditorHistory): EditorHistory {
  const next = history.future[0];
  if (next === undefined) {
    return history;
  }
  return {
    current: next,
    past: [...history.past, history.current],
    future: history.future.slice(1),
  };
}
