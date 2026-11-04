import { AnimationClip } from 'three';
import type { ValueOf } from '@graveshift/shared/core';

export const AnimationName = {
  Idle: 'idle',
  Walk: 'walk',
  Die: 'die',
  Sit: 'sit',
  EmoteYes: 'emote-yes',
  HoldRight: 'holding-right',
  ShootRight: 'holding-right-shoot',
  AttackMelee: 'attack-melee-right',
  HoldLeft: 'holding-left',
  StrikeLeft: 'attack-melee-left',
  Jump: 'jump',
  Interact: 'interact-right',
} as const;
export type AnimationName = ValueOf<typeof AnimationName>;

export const ARM_TRACK_PREFIX = 'arm-right.';
export const LEFT_ARM_TRACK_PREFIX = 'arm-left.';

export const BODY_SUFFIX = ':body';
export const ARM_SUFFIX = ':arm';
export const LEFT_ARM_SUFFIX = ':arm-left';

function isArmTrack(trackName: string): boolean {
  return trackName.startsWith(ARM_TRACK_PREFIX) || trackName.startsWith(LEFT_ARM_TRACK_PREFIX);
}

const SPLIT_CLIPS = new WeakMap<readonly AnimationClip[], ReadonlyMap<string, AnimationClip>>();

function filterClip(
  clip: AnimationClip,
  suffix: string,
  keep: (trackName: string) => boolean,
): AnimationClip {
  const tracks = clip.tracks.filter((track) => keep(track.name));
  return new AnimationClip(`${clip.name}${suffix}`, clip.duration, tracks);
}

export function splitClips(clips: readonly AnimationClip[]): ReadonlyMap<string, AnimationClip> {
  const cached = SPLIT_CLIPS.get(clips);
  if (cached !== undefined) {
    return cached;
  }
  const split = new Map<string, AnimationClip>();
  for (const clip of clips) {
    split.set(clip.name, clip);
    split.set(
      clip.name + BODY_SUFFIX,
      filterClip(clip, BODY_SUFFIX, (track) => !isArmTrack(track)),
    );
    split.set(
      clip.name + ARM_SUFFIX,
      filterClip(clip, ARM_SUFFIX, (track) => track.startsWith(ARM_TRACK_PREFIX)),
    );
    split.set(
      clip.name + LEFT_ARM_SUFFIX,
      filterClip(clip, LEFT_ARM_SUFFIX, (track) => track.startsWith(LEFT_ARM_TRACK_PREFIX)),
    );
  }
  SPLIT_CLIPS.set(clips, split);
  return split;
}
