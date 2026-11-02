import type { Object3D } from 'three';
import type { Identified } from '../../game/view/Identified.ts';
import type { EntityView } from './EntityView.ts';

export class EntityViewRegistry<TFrame extends Identified, TView extends EntityView<TFrame>> {
  private readonly parent: Object3D;
  private readonly create: (frame: TFrame) => TView;
  private readonly active = new Map<number, TView>();
  private readonly retired = new Set<TView>();
  private readonly seen = new Set<number>();

  constructor(parent: Object3D, create: (frame: TFrame) => TView) {
    this.parent = parent;
    this.create = create;
  }

  find(id: number): TView | undefined {
    return this.active.get(id);
  }

  sync(frames: readonly TFrame[], deltaSeconds: number): void {
    this.seen.clear();
    for (const frame of frames) {
      this.seen.add(frame.id);
      let view = this.active.get(frame.id);
      if (view === undefined) {
        view = this.create(frame);
        this.active.set(frame.id, view);
        this.parent.add(view.object);
      }
      view.sync(frame, deltaSeconds);
    }
    for (const [id, view] of this.active) {
      if (!this.seen.has(id)) {
        this.active.delete(id);
        view.retire();
        this.retired.add(view);
      }
    }
    for (const view of this.retired) {
      if (!view.updateRetired(deltaSeconds)) {
        this.retired.delete(view);
        view.dispose();
      }
    }
  }

  clear(): void {
    for (const view of [...this.active.values(), ...this.retired]) {
      view.dispose();
    }
    this.active.clear();
    this.retired.clear();
  }
}
