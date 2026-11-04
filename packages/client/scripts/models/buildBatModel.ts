import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { GlbBuilder } from './GlbBuilder.ts';
import type { Box, Keyframes } from './GlbBuilder.ts';

const OUTPUT = resolve(import.meta.dirname, '../../public/assets/graveshift/bat.glb');

const FUR = 0x4b3a5a;
const BELLY = 0x6d5a7e;
const MEMBRANE = 0x2b2036;
const EAR = 0x3a2c47;
const EYE = 0xff3b3b;
const FANG = 0xf3efe6;

const IDLE_SECONDS = 0.8;
const FLAP_SECONDS = 0.36;
const ATTACK_SECONDS = 0.5;
const DIE_SECONDS = 1;

interface WingPose {
  readonly time: number;
  readonly lift: number;
  readonly tip: number;
}

interface BatNodes {
  readonly root: number;
  readonly body: number;
  readonly leftWing: number;
  readonly leftTip: number;
  readonly rightWing: number;
  readonly rightTip: number;
}

interface BatMaterials {
  readonly fur: number;
  readonly belly: number;
  readonly membrane: number;
  readonly ear: number;
  readonly eye: number;
  readonly fang: number;
}

function aroundZ(angle: number): number[] {
  return [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)];
}

function aroundX(angle: number): number[] {
  return [Math.sin(angle / 2), 0, 0, Math.cos(angle / 2)];
}

function mirrored(box: Box): Box {
  const [x = 0, y = 0, z = 0] = box.center;
  return { ...box, center: [-x, y, z] };
}

function wingBoxes(materials: BatMaterials): readonly Box[] {
  return [
    { center: [0.22, 0, 0], size: [0.44, 0.025, 0.34], material: materials.membrane },
    { center: [0.22, 0.02, 0.15], size: [0.44, 0.04, 0.04], material: materials.fur },
  ];
}

function tipBoxes(materials: BatMaterials): readonly Box[] {
  return [
    { center: [0.17, 0, -0.04], size: [0.34, 0.02, 0.26], material: materials.membrane },
    { center: [0.17, 0.015, 0.1], size: [0.34, 0.03, 0.03], material: materials.fur },
  ];
}

function headBoxes(materials: BatMaterials): readonly Box[] {
  const ear: Box = { center: [0.08, 0.15, 0], size: [0.07, 0.13, 0.04], material: materials.ear };
  const eye: Box = {
    center: [0.06, 0.03, 0.155],
    size: [0.05, 0.05, 0.02],
    material: materials.eye,
  };
  const fang: Box = {
    center: [0.035, -0.09, 0.15],
    size: [0.025, 0.045, 0.02],
    material: materials.fang,
  };
  return [
    { center: [0, 0, 0.05], size: [0.26, 0.22, 0.2], material: materials.fur },
    ear,
    mirrored(ear),
    eye,
    mirrored(eye),
    fang,
    mirrored(fang),
  ];
}

function bodyBoxes(materials: BatMaterials): readonly Box[] {
  const foot: Box = {
    center: [0.06, -0.18, -0.06],
    size: [0.04, 0.06, 0.04],
    material: materials.ear,
  };
  return [
    { center: [0, 0, 0], size: [0.3, 0.3, 0.34], material: materials.fur },
    { center: [0, -0.02, 0.12], size: [0.22, 0.22, 0.12], material: materials.belly },
    foot,
    mirrored(foot),
  ];
}

function buildNodes(builder: GlbBuilder, materials: BatMaterials): BatNodes {
  const root = builder.addNode('bat', [0, 0, 0], []);
  const body = builder.addNode('body', [0, 0, 0], bodyBoxes(materials));
  const head = builder.addNode('head', [0, 0.12, 0.16], headBoxes(materials));
  const leftWing = builder.addNode('wing-left', [0.15, 0.06, 0], wingBoxes(materials));
  const leftTip = builder.addNode('wing-left-tip', [0.44, 0, 0], tipBoxes(materials));
  const rightWing = builder.addNode(
    'wing-right',
    [-0.15, 0.06, 0],
    wingBoxes(materials).map(mirrored),
  );
  const rightTip = builder.addNode(
    'wing-right-tip',
    [-0.44, 0, 0],
    tipBoxes(materials).map(mirrored),
  );
  builder.attach(root, [body]);
  builder.attach(body, [head, leftWing, rightWing]);
  builder.attach(leftWing, [leftTip]);
  builder.attach(rightWing, [rightTip]);
  return { root, body, leftWing, leftTip, rightWing, rightTip };
}

function flapTracks(nodes: BatNodes, poses: readonly WingPose[]): Keyframes[] {
  const times = poses.map((pose) => pose.time);
  return [
    { node: nodes.leftWing, path: 'rotation', times, values: poses.map((p) => aroundZ(p.lift)) },
    { node: nodes.leftTip, path: 'rotation', times, values: poses.map((p) => aroundZ(p.tip)) },
    { node: nodes.rightWing, path: 'rotation', times, values: poses.map((p) => aroundZ(-p.lift)) },
    { node: nodes.rightTip, path: 'rotation', times, values: poses.map((p) => aroundZ(-p.tip)) },
  ];
}

function flapCycle(seconds: number, up: number, down: number): WingPose[] {
  return [
    { time: 0, lift: up, tip: up * 0.6 },
    { time: seconds / 2, lift: down, tip: down * 0.7 },
    { time: seconds, lift: up, tip: up * 0.6 },
  ];
}

function bob(nodes: BatNodes, seconds: number, height: number): Keyframes {
  return {
    node: nodes.body,
    path: 'translation',
    times: [0, seconds / 2, seconds],
    values: [
      [0, -height, 0],
      [0, height, 0],
      [0, -height, 0],
    ],
  };
}

function addAnimations(builder: GlbBuilder, nodes: BatNodes): void {
  builder.addAnimation('idle', [
    ...flapTracks(nodes, flapCycle(IDLE_SECONDS, 0.55, -0.35)),
    bob(nodes, IDLE_SECONDS, 0.03),
  ]);
  builder.addAnimation('walk', [
    ...flapTracks(nodes, flapCycle(FLAP_SECONDS, 0.75, -0.5)),
    bob(nodes, FLAP_SECONDS, 0.02),
  ]);
  builder.addAnimation('attack-melee-right', [
    ...flapTracks(nodes, [
      { time: 0, lift: 0.3, tip: 0.2 },
      { time: ATTACK_SECONDS * 0.4, lift: 1, tip: 0.6 },
      { time: ATTACK_SECONDS, lift: 0.3, tip: 0.2 },
    ]),
    {
      node: nodes.body,
      path: 'rotation',
      times: [0, ATTACK_SECONDS * 0.4, ATTACK_SECONDS],
      values: [aroundX(0), aroundX(0.6), aroundX(0)],
    },
  ]);
  builder.addAnimation('die', [
    ...flapTracks(nodes, [
      { time: 0, lift: 0.4, tip: 0.2 },
      { time: DIE_SECONDS, lift: -1.2, tip: -1 },
    ]),
    {
      node: nodes.body,
      path: 'rotation',
      times: [0, DIE_SECONDS / 2, DIE_SECONDS],
      values: [aroundZ(0), aroundZ(1.6), aroundZ(3)],
    },
  ]);
}

const builder = new GlbBuilder();
const materials: BatMaterials = {
  fur: builder.addMaterial('fur', FUR, false),
  belly: builder.addMaterial('belly', BELLY, false),
  membrane: builder.addMaterial('membrane', MEMBRANE, false),
  ear: builder.addMaterial('ear', EAR, false),
  eye: builder.addMaterial('eye', EYE, true),
  fang: builder.addMaterial('fang', FANG, false),
};
const nodes = buildNodes(builder, materials);
addAnimations(builder, nodes);
mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, builder.build(nodes.root));
