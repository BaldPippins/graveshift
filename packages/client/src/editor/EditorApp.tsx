import { useEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { validateLevelDefinition } from '@graveshift/shared/world';
import type { LevelDefinition } from '@graveshift/shared/world';
import { Locale } from '../i18n/Locale.ts';
import { detectLocale, LOCALE_MESSAGES } from '../i18n/localeMessages.ts';
import { EDITOR_EN } from '../i18n/locales/editorEn.ts';
import { EDITOR_RU } from '../i18n/locales/editorRu.ts';
import { Button } from '../ui/components/Button.tsx';
import { EditorGrid } from './EditorGrid.tsx';
import { EditorPreview } from './EditorPreview.tsx';
import { EditorSettings } from './EditorSettings.tsx';
import {
  createEditorHistory,
  redoEditorHistory,
  undoEditorHistory,
  updateEditorHistory,
} from './editorHistory.ts';
import { createEmptyLevel, paintCell, resizeLevel, wouldCrop } from './levelEditing.ts';
import { parseEditorDraft } from './parseEditorDraft.ts';

export function EditorApp(): JSX.Element {
  const [locale, setLocale] = useState(detectLocale(navigator.languages));
  const [history, setHistory] = useState(() => createEditorHistory(createEmptyLevel()));
  const [preview, setPreview] = useState(false);
  const [importError, setImportError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const levelRef = useRef<LevelDefinition | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const messages = LOCALE_MESSAGES[locale];
  const text = locale === Locale.Russian ? EDITOR_RU : EDITOR_EN;
  const level = history.current;
  levelRef.current = level;
  const issues = validateLevelDefinition(level);

  useEffect(() => {
    const keydown = (event: KeyboardEvent): void => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        setHistory((previous) =>
          event.shiftKey ? redoEditorHistory(previous) : undoEditorHistory(previous),
        );
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        setHistory(redoEditorHistory);
      }
    };
    window.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('keydown', keydown);
    };
  }, []);

  useEffect(() => {
    setSaveStatus('idle');
  }, [level]);

  const save = async (): Promise<void> => {
    if (issues.length !== 0 || saving) {
      return;
    }
    setSaving(true);
    setSaveStatus('idle');
    const send = (overwrite: boolean): Promise<Response> =>
      fetch(`/__editor/save${overwrite ? '?overwrite=1' : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(level),
      });
    try {
      let response = await send(false);
      if (response.status === 409) {
        if (!window.confirm(text.confirmOverwrite)) {
          return;
        }
        response = await send(true);
      }
      if (!response.ok) {
        throw new Error('save failed');
      }
      if (levelRef.current === level) {
        setSaveStatus('saved');
      }
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const change = (next: LevelDefinition): void => {
    setHistory((previous) => updateEditorHistory(previous, next));
  };
  const resize = (width: number, height: number): boolean => {
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 8 ||
      width > 64 ||
      height < 8 ||
      height > 64
    ) {
      return false;
    }
    if (wouldCrop(level, width, height) && !window.confirm(text.confirmCrop)) {
      return false;
    }
    change(resizeLevel(level, width, height));
    return true;
  };
  const exportLevel = (): void => {
    if (issues.length !== 0) {
      return;
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(level, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `${level.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main class="editor-shell">
      <header class="editor-toolbar">
        <div class="editor-brand">
          <h1>{text.title}</h1>
          <span>
            {level.id} · {level.width} × {level.height}
          </span>
        </div>
        <div class="editor-actions">
          <Button
            onClick={() => {
              change(createEmptyLevel());
            }}
          >
            {text.newLevel}
          </Button>
          <Button
            onClick={() => {
              if (file.current !== null) {
                file.current.click();
              }
            }}
          >
            {text.importLevel}
          </Button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const selected =
                event.currentTarget.files === null ? undefined : event.currentTarget.files[0];
              event.currentTarget.value = '';
              if (selected === undefined) {
                return;
              }
              void selected
                .text()
                .then((json) => {
                  change(parseEditorDraft(json));
                  setImportError(false);
                })
                .catch(() => {
                  setImportError(true);
                });
            }}
          />
          <Button
            variant="primary"
            title={text.saveHint}
            disabled={issues.length > 0 || saving}
            onClick={() => {
              void save();
            }}
          >
            {saving ? text.saving : text.saveLevel}
          </Button>
          <Button disabled={issues.length > 0} onClick={exportLevel}>
            {text.exportLevel}
          </Button>
          <Button
            disabled={history.past.length === 0}
            onClick={() => {
              setHistory(undoEditorHistory);
            }}
          >
            {text.undo}
          </Button>
          <Button
            disabled={history.future.length === 0}
            onClick={() => {
              setHistory(redoEditorHistory);
            }}
          >
            {text.redo}
          </Button>
        </div>
        <div class="editor-view-actions">
          <Button
            onClick={() => {
              setPreview(!preview);
            }}
          >
            {preview ? text.view2d : text.view3d}
          </Button>
          <label>
            {messages.common.language}
            <select
              value={locale}
              onChange={(event) => {
                setLocale(
                  event.currentTarget.value === Locale.Russian ? Locale.Russian : Locale.English,
                );
              }}
            >
              <option value={Locale.Russian}>{text.russian}</option>
              <option value={Locale.English}>{text.english}</option>
            </select>
          </label>
        </div>
      </header>
      <p class="editor-hint">{text.saveHint}</p>
      {saveStatus === 'saved' ? <p role="status">{text.saved}</p> : null}
      {saveStatus === 'error' ? (
        <p class="editor-error" role="alert">
          {text.saveError}
        </p>
      ) : null}
      {importError ? (
        <p class="editor-error" role="alert">
          {text.importError}
        </p>
      ) : null}
      <div class="editor-body">
        <div class="editor-main">
          <div hidden={preview}>
            <EditorGrid
              level={level}
              issues={issues}
              text={text}
              onPaint={(x, y, symbol) => {
                setHistory((previous) =>
                  updateEditorHistory(previous, paintCell(previous.current, x, y, symbol)),
                );
              }}
            />
          </div>
          {preview ? <EditorPreview level={level} messages={messages} text={text} /> : null}
          <section class="editor-errors" aria-live="polite">
            {issues.length === 0 ? (
              <p class="editor-valid">{text.valid}</p>
            ) : (
              <details open>
                <summary>
                  {text.errors} · {issues.length}
                </summary>
                <ul>
                  {issues.map((issue, index) => (
                    <li key={`${issue.path}-${index}`}>
                      {issue.path}: {text.issueNames[issue.code] ?? issue.code}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        </div>
        <EditorSettings
          level={level}
          issues={issues}
          messages={messages}
          text={text}
          onChange={change}
          onResize={resize}
        />
      </div>
    </main>
  );
}
