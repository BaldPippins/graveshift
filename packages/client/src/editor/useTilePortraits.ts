import { useEffect, useState } from 'preact/hooks';
import type { TileKind } from '@graveshift/shared/world';
import { AssetLibrary } from '../assets/AssetLibrary.ts';
import { captureTilePortraits } from '../render/portraits/captureTilePortraits.ts';

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      reject(new Error('Failed to load tile portrait'));
    };
    image.src = source;
  });
}

export function useTilePortraits(): ReadonlyMap<TileKind, HTMLImageElement> {
  const [portraits, setPortraits] = useState<ReadonlyMap<TileKind, HTMLImageElement>>(new Map());
  useEffect(() => {
    let cancelled = false;
    const assets = new AssetLibrary();
    void assets
      .loadAll(() => undefined)
      .then(() => {
        if (cancelled) {
          return [];
        }
        const urls = captureTilePortraits(assets);
        return Promise.all(
          [...urls].map(async ([kind, url]) => [kind, await loadImage(url)] as const),
        );
      })
      .then((images) => {
        if (!cancelled) {
          setPortraits(new Map(images));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  return portraits;
}
