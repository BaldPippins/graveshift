import { describe, expect, it } from 'vitest';
import {
  createEditorHistory,
  redoEditorHistory,
  undoEditorHistory,
  updateEditorHistory,
} from './editorHistory.ts';
import { createEmptyLevel, paintCell, resizeLevel, wouldCrop } from './levelEditing.ts';
import { parseEditorDraft } from './parseEditorDraft.ts';
import { validateLevelDefinition } from '@graveshift/shared/world';

describe('editor history', () => {
  it('reverses and reapplies edits without mutating the previous level', () => {
    const level = createEmptyLevel();
    const painted = paintCell(level, 4, 4, 'g');
    const history = updateEditorHistory(createEditorHistory(level), painted);
    expect((level.rows[4] ?? '').charAt(4)).toBe('.');
    const undone = undoEditorHistory(history);
    expect(undone.current).toEqual(level);
    expect(redoEditorHistory(undone).current).toEqual(painted);
    expect(updateEditorHistory(undone, paintCell(level, 5, 4, 'T')).future).toEqual([]);
  });

  it('preserves the upper-left area and detects occupied cells before cropping', () => {
    const level = paintCell(createEmptyLevel(), 30, 10, 'g');
    expect(wouldCrop(level, 16, 24)).toBe(true);
    const resized = resizeLevel(level, 16, 24);
    expect(resized.rows[1]).toBe((level.rows[1] ?? '').slice(0, 16));
    expect(resized.width).toBe(16);
  });

  it('imports an editable invalid draft and reports the damaged cell', () => {
    const level = createEmptyLevel();
    const draft = paintCell(level, 3, 3, '?');
    const imported = parseEditorDraft(JSON.stringify(draft));
    expect(validateLevelDefinition(imported)).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'rows.3.3', code: 'unknown-tile' })]),
    );
    expect(() => parseEditorDraft('{}')).toThrow();
  });
});
