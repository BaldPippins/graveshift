import { Group } from 'three';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import { PICKUP_CONTENT } from '../../content/pickupContent.ts';
import type { PickupFrame } from '../../game/view/WorldFrame.ts';
import { placeOnGround } from '../space.ts';
import type { EntityView } from './EntityView.ts';

const BOB_HEIGHT = 0.12;
const BOB_SPEED = 3;
const SPIN_SPEED = 2.2;
const HOVER = 0.15;

export class PickupView implements EntityView<PickupFrame> {
  readonly object = new Group();
  private readonly model;
  private elapsed = Math.random() * Math.PI * 2;

  constructor(frame: PickupFrame, assets: AssetLibrary) {
    this.model = assets.instantiate(PICKUP_CONTENT[frame.kind].model);
    this.object.add(this.model);
  }

  sync(frame: PickupFrame, deltaSeconds: number): void {
    this.elapsed += deltaSeconds;
    placeOnGround(
      this.object,
      frame.x,
      frame.y,
      HOVER + Math.sin(this.elapsed * BOB_SPEED) * BOB_HEIGHT,
    );
    this.model.rotation.y = this.elapsed * SPIN_SPEED;
  }

  retire(): void {
    this.object.visible = false;
  }

  updateRetired(): boolean {
    return false;
  }

  dispose(): void {
    this.object.removeFromParent();
  }
}
