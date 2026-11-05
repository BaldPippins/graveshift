import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GlbBuilder } from './GlbBuilder.ts';
import type { Box } from './GlbBuilder.ts';

const OUTPUT_DIRECTORY = resolve(import.meta.dirname, '../../public/assets/graveshift');

const IRON = 0x4a4c52;
const STEEL = 0xb9bcc4;
const PLATE = 0x8a6a3a;
const RUST = 0x7a3b22;

const TEETH = 5;
const JAW_LENGTH = 0.62;
const JAW_REACH = 0.3;
const TOOTH = 0.07;

interface TrapMaterials {
  readonly iron: number;
  readonly steel: number;
  readonly plate: number;
  readonly rust: number;
}

function toothOffsets(): number[] {
  return Array.from(
    { length: TEETH },
    (_, index) => -JAW_LENGTH / 2 + ((index + 0.5) * JAW_LENGTH) / TEETH,
  );
}

function frameBoxes(materials: TrapMaterials): Box[] {
  return [
    { center: [0, 0.015, 0], size: [0.26, 0.03, 0.26], material: materials.plate },
    {
      center: [0, 0.02, JAW_LENGTH / 2],
      size: [JAW_REACH * 2 + 0.1, 0.04, 0.05],
      material: materials.iron,
    },
    {
      center: [0, 0.02, -JAW_LENGTH / 2],
      size: [JAW_REACH * 2 + 0.1, 0.04, 0.05],
      material: materials.iron,
    },
    { center: [0.47, 0.02, 0], size: [0.22, 0.03, 0.06], material: materials.rust },
    { center: [-0.47, 0.02, 0], size: [0.22, 0.03, 0.06], material: materials.rust },
  ];
}

function openJaws(materials: TrapMaterials): Box[] {
  return [-1, 1].flatMap((side) => [
    {
      center: [side * JAW_REACH, 0.025, 0],
      size: [0.06, 0.05, JAW_LENGTH],
      material: materials.iron,
    },
    ...toothOffsets().map((z) => ({
      center: [side * (JAW_REACH - 0.05), 0.06, z],
      size: [TOOTH, TOOTH, 0.04],
      material: materials.steel,
    })),
  ]);
}

function closedJaws(materials: TrapMaterials): Box[] {
  return [-1, 1].flatMap((side) => [
    { center: [side * 0.05, 0.16, 0], size: [0.05, 0.3, JAW_LENGTH], material: materials.iron },
    ...toothOffsets().map((z, index) => ({
      center: [side * 0.01, 0.3, z + (side > 0 ? 0.03 : -0.03) * (index % 2 === 0 ? 1 : -1)],
      size: [0.06, TOOTH, 0.04],
      material: materials.steel,
    })),
  ]);
}

function writeTrap(file: string, jaws: (materials: TrapMaterials) => Box[]): void {
  const builder = new GlbBuilder();
  const materials: TrapMaterials = {
    iron: builder.addMaterial('iron', IRON, false),
    steel: builder.addMaterial('steel', STEEL, false),
    plate: builder.addMaterial('plate', PLATE, false),
    rust: builder.addMaterial('rust', RUST, false),
  };
  const root = builder.addNode(file, [0, 0, 0], [...frameBoxes(materials), ...jaws(materials)]);
  writeFileSync(resolve(OUTPUT_DIRECTORY, `${file}.glb`), builder.build(root));
}

mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
writeTrap('bear-trap-open', openJaws);
writeTrap('bear-trap-closed', closedJaws);
