import { describe, expect, it } from 'vitest';
import {
  createEditorHistory,
  redoEditorHistory,
  undoEditorHistory,
  updateEditorHistory,
} from './editorHistory.ts';
import { createEmptyLevel, paintCell, resizeLevel, wouldCrop } from './levelEditing.ts';
import { canPreviewLevel } from './canPreviewLevel.ts';
import { parseEditorDraft } from './parseEditorDraft.ts';
import { validateLevelDefinition } from '@graveshift/shared/world';

describe('editor history', () => {
  it('records quarter turns and clears them when cells are erased or cropped', () => {
    const level = paintCell(createEmptyLevel(), 4, 4, 'g', 1);
    expect(level.orientations).toEqual([{ x: 4, y: 4, quarterTurns: 1 }]);
    const rotated = paintCell(level, 4, 4, 'g', 2);
    expect(rotated.orientations).toEqual([{ x: 4, y: 4, quarterTurns: 2 }]);
    expect(parseEditorDraft(JSON.stringify(rotated)).orientations).toEqual(rotated.orientations);
    expect(paintCell(rotated, 4, 4, '.').orientations).toBeUndefined();
    expect(paintCell(rotated, 4, 4, 'g').orientations).toBeUndefined();
    const outside = paintCell(rotated, 30, 10, 'g', 3);
    expect(resizeLevel(outside, 16, 24).orientations).toEqual([{ x: 4, y: 4, quarterTurns: 2 }]);
  });
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

  it('allows previewing disconnected resized maps but rejects unrenderable geometry', () => {
    const level = createEmptyLevel();
    const expanded = resizeLevel(level, 36, 24);
    expect(validateLevelDefinition(expanded)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'disconnected' })]),
    );
    expect(canPreviewLevel(expanded)).toBe(true);
    expect(canPreviewLevel(paintCell(level, 3, 3, '?'))).toBe(false);
    expect(canPreviewLevel(paintCell(level, 1, 1, '.'))).toBe(false);
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

  it('imports legacy maps with a fixed wave count', () => {
    const level = createEmptyLevel();
    const waves = Object.fromEntries(
      Object.entries(level.waves).filter(([key]) => key !== 'allowedTotals'),
    );
    const legacy = { ...level, waves: { ...waves, totalWaves: 10 } };
    expect(parseEditorDraft(JSON.stringify(legacy)).waves.allowedTotals).toEqual([10]);
  });
});
