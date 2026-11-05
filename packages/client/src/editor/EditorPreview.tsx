import { useEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { parseTileMap, validateLevelGeometry } from '@graveshift/shared/world';
import type { LevelDefinition } from '@graveshift/shared/world';
import { AssetLibrary } from '../assets/AssetLibrary.ts';
import type { Messages } from '../i18n/Messages.ts';
import { GameRenderer } from '../render/GameRenderer.ts';
import { WorldRenderer } from '../render/WorldRenderer.ts';
import type { EditorTexts } from './EditorTexts.ts';

export interface EditorPreviewProps {
  readonly level: LevelDefinition;
  readonly messages: Messages;
  readonly text: EditorTexts;
}

export function EditorPreview(props: EditorPreviewProps): JSX.Element {
  const host = useRef<HTMLDivElement>(null);
  const assetsRef = useRef<AssetLibrary | null>(null);
  const loadRef = useRef<Promise<void> | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const valid = validateLevelGeometry(props.level).length === 0;
  useEffect(() => {
    const element = host.current;
    if (element === null || !valid) {
      return;
    }
    let cancelled = false;
    let frame = 0;
    let world: WorldRenderer | null = null;
    const assets = assetsRef.current ?? new AssetLibrary();
    assetsRef.current = assets;
    loadRef.current ??= assets.loadAll(() => undefined);
    setLoading(true);
    setFailed(false);
    void loadRef.current
      .then(() => {
        if (cancelled) {
          return;
        }
        const map = parseTileMap(props.level);
        const renderer = new GameRenderer(element);
        try {
          world = new WorldRenderer(renderer, assets, map, {
            merchant: () => props.messages.merchantSign,
            trap: () => props.messages.trapSign,
          });
        } catch (error: unknown) {
          renderer.dispose();
          throw error;
        }
        renderer.scene.fog = null;
        const extent = Math.max(map.height, map.width / renderer.aspect);
        renderer.camera.position.set(map.width / 2, extent * 1.6, map.height / 2 + extent * 0.5);
        renderer.camera.lookAt(map.width / 2, 0, map.height / 2);
        setLoading(false);
        const tick = (): void => {
          if (world === null) {
            return;
          }
          renderer.render();
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      })
      .catch(() => {
        if (!cancelled) {
          loadRef.current = null;
          setFailed(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (world !== null) {
        world.dispose();
      }
    };
  }, [
    props.level.rows,
    props.level.width,
    props.level.height,
    props.level.id,
    props.messages,
    valid,
  ]);
  return (
    <section class="editor-preview">
      {!valid ? <p>{props.text.previewInvalid}</p> : null}
      {valid && loading ? <p>{props.text.loading}</p> : null}
      {valid && failed ? <p role="alert">{props.text.previewError}</p> : null}
      <div ref={host} class="editor-preview__surface" />
    </section>
  );
}
