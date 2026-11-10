import { useEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { CollisionLayer, TILE_KINDS, TILE_TRAITS, TileKind } from '@graveshift/shared/world';
import type { LevelDefinition, LevelGeometryIssue } from '@graveshift/shared/world';
import { PALETTE } from '../content/palette.ts';
import { cssColor } from '../content/cssColor.ts';
import type { EditorTexts } from './EditorTexts.ts';
import { Button } from '../ui/components/Button.tsx';
import { useTilePortraits } from './useTilePortraits.ts';

const CELL = 32;

export interface EditorGridProps {
  readonly level: LevelDefinition;
  readonly issues: readonly LevelGeometryIssue[];
  readonly text: EditorTexts;
  readonly onPaint: (x: number, y: number, symbol: string, quarterTurns: number | null) => void;
}

export function EditorGrid(props: EditorGridProps): JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const panning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const [kind, setKind] = useState<TileKind>(TileKind.Grass);
  const [eraser, setEraser] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState('auto');
  const portraits = useTilePortraits();

  useEffect(() => {
    const context = canvas.current === null ? null : canvas.current.getContext('2d');
    if (context === null) {
      return;
    }
    const kinds = new Map(TILE_KINDS.map((item) => [TILE_TRAITS[item].symbol, item]));
    const orientations = new Map(
      (props.level.orientations ?? []).map((entry) => [
        `${entry.x},${entry.y}`,
        entry.quarterTurns,
      ]),
    );
    const errorCells = new Set(
      props.issues.filter((issue) => issue.path.startsWith('rows.')).map((issue) => issue.path),
    );
    context.font = '16px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    for (let y = 0; y < props.level.height; y += 1) {
      const row = props.level.rows[y] ?? '';
      for (let x = 0; x < props.level.width; x += 1) {
        const symbol = row.charAt(x);
        const tile = kinds.get(symbol) ?? TileKind.Grass;
        const blocked = TILE_TRAITS[tile].blocks[CollisionLayer.Movement];
        const background = blocked ? PALETTE.stoneDebris : PALETTE.nightSky;
        context.fillStyle = cssColor(background);
        context.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
        const portrait = portraits.get(tile);
        if (portrait !== undefined) {
          const turns = orientations.get(`${x},${y}`) ?? 0;
          context.save();
          context.translate(x * CELL + CELL / 2, y * CELL + CELL / 2);
          context.rotate((turns * Math.PI) / 2);
          context.drawImage(portrait, -CELL / 2, -CELL / 2, CELL - 1, CELL - 1);
          context.restore();
        }
        const foreground = errorCells.has(`rows.${y}.${x}`) ? PALETTE.flameRed : PALETTE.reloadIcon;
        context.fillStyle = cssColor(foreground);
        context.font = portrait === undefined ? '16px sans-serif' : '10px sans-serif';
        context.textAlign = portrait === undefined ? 'center' : 'right';
        if (portrait !== undefined) {
          context.fillText(symbol, (x + 1) * CELL - 2, (y + 1) * CELL - 6);
          continue;
        }
        context.fillText(symbol, x * CELL + CELL / 2, y * CELL + CELL / 2);
      }
    }
  }, [props.level, props.issues, portraits]);

  const paint = (event: PointerEvent): void => {
    const element = canvas.current;
    if (element === null) {
      return;
    }
    const bounds = element.getBoundingClientRect();
    const x = Math.floor((event.clientX - bounds.left) / (CELL * zoom));
    const y = Math.floor((event.clientY - bounds.top) / (CELL * zoom));
    props.onPaint(
      x,
      y,
      eraser ? TILE_TRAITS[TileKind.Grass].symbol : TILE_TRAITS[kind].symbol,
      eraser || rotation === 'auto' ? null : Number(rotation),
    );
  };

  return (
    <section class="editor-grid">
      <div class="editor-grid__heading">
        <div>
          <h2>{props.text.tools}</h2>
          <p>
            {props.text.selectedTool}: {eraser ? props.text.erase : props.text.tileNames[kind]}
          </p>
        </div>
        <label>
          {props.text.rotation}
          <select
            value={rotation}
            onChange={(event) => {
              setRotation(event.currentTarget.value);
            }}
          >
            <option value="auto">{props.text.rotationAutomatic}</option>
            {[0, 1, 2, 3].map((turns) => (
              <option value={String(turns)} key={turns}>
                {turns * 90}°
              </option>
            ))}
          </select>
        </label>
        <label class="editor-zoom">
          {props.text.zoom}
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={zoom}
            onInput={(event) => {
              setZoom(Number(event.currentTarget.value));
            }}
          />
          <output>{Math.round(zoom * 100)}%</output>
        </label>
      </div>
      <div class="editor-palette" role="group" aria-label={props.text.tools}>
        <Button
          variant={eraser ? 'primary' : 'secondary'}
          ariaPressed={eraser}
          onClick={() => {
            setEraser(true);
          }}
        >
          {props.text.erase}
        </Button>
        {TILE_KINDS.map((tile) => {
          const portrait = portraits.get(tile);
          return (
            <Button
              key={tile}
              variant={!eraser && tile === kind ? 'primary' : 'secondary'}
              ariaPressed={!eraser && tile === kind}
              title={props.text.tileNames[tile]}
              onClick={() => {
                setKind(tile);
                setEraser(false);
              }}
            >
              {portrait === undefined ? null : (
                <img class="editor-palette__portrait" src={portrait.src} alt="" />
              )}
              {TILE_TRAITS[tile].symbol} {props.text.tileNames[tile]}
            </Button>
          );
        })}
      </div>
      <p class="editor-hint">{props.text.canvasHint}</p>
      <div
        class="editor-viewport"
        ref={viewport}
        onContextMenu={(event) => {
          event.preventDefault();
        }}
      >
        <canvas
          ref={canvas}
          aria-label={props.text.paint}
          width={props.level.width * CELL}
          height={props.level.height * CELL}
          style={{
            width: props.level.width * CELL * zoom,
            height: props.level.height * CELL * zoom,
          }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            panning.current = event.button !== 0;
            dragging.current = true;
            lastPointer.current = { x: event.clientX, y: event.clientY };
            if (!panning.current) {
              paint(event);
            }
          }}
          onPointerMove={(event) => {
            if (!dragging.current) {
              return;
            }
            if (panning.current && viewport.current !== null) {
              viewport.current.scrollLeft -= event.clientX - lastPointer.current.x;
              viewport.current.scrollTop -= event.clientY - lastPointer.current.y;
              lastPointer.current = { x: event.clientX, y: event.clientY };
            } else {
              paint(event);
            }
          }}
          onPointerUp={() => {
            dragging.current = false;
            panning.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
            panning.current = false;
          }}
        />
      </div>
    </section>
  );
}
