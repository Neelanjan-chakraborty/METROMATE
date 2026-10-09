import type { Corridor } from '../types';

/**
 * Original schematic layout for the network map. Positions are computed from
 * the corridor sequences (not copied from any GMRC artwork):
 *  - the North–South corridor is a vertical spine, Mahatma Mandir at the top,
 *  - the East–West corridor is a horizontal line crossing the spine at Old High Court,
 *  - the GIFT City branch leaves the spine to the right at GNLU.
 */

export interface SchematicNode {
  id: string;
  x: number;
  y: number;
  /** Where the label sits relative to the node. */
  label: { x: number; y: number; anchor: 'start' | 'end'; rotate: number };
}

export interface SchematicLink {
  corridorId: string;
  fromId: string;
  toId: string;
}

export interface Schematic {
  width: number;
  height: number;
  /** x of the North–South spine, used to centre the initial view. */
  spineX: number;
  nodes: Map<string, SchematicNode>;
  links: SchematicLink[];
}

const TOP = 56;
const LEFT = 110;
const NS_STEP = 28;
const EW_STEP = 44;
const GIFT_STEP = 70;

export function buildSchematic(corridors: Corridor[]): Schematic {
  const byId = new Map(corridors.map((c) => [c.id, c]));
  const ns = byId.get('ns');
  const ew = byId.get('ew');
  const gift = byId.get('gift');
  const nodes = new Map<string, SchematicNode>();
  const links: SchematicLink[] = [];
  if (!ns || !ew) return { width: 0, height: 0, spineX: 0, nodes, links };

  const nsLast = ns.sequence.length - 1;
  const interchangeId = ns.sequence.find((id) => ew.sequence.includes(id));
  if (!interchangeId) return { width: 0, height: 0, spineX: 0, nodes, links };

  const ewInterchangeIdx = ew.sequence.indexOf(interchangeId);
  const spineX = LEFT + ewInterchangeIdx * EW_STEP;
  const nsY = (idx: number) => TOP + (nsLast - idx) * NS_STEP;
  const ewY = nsY(ns.sequence.indexOf(interchangeId));
  const interchangeNsIdx = ns.sequence.indexOf(interchangeId);

  ns.sequence.forEach((id, idx) => {
    const y = nsY(idx);
    const north = idx >= interchangeNsIdx; // at or above the East–West crossing: label on the left
    nodes.set(id, {
      id,
      x: spineX,
      y,
      label: north
        ? { x: spineX - 14, y: y + (idx === interchangeNsIdx ? -10 : 4), anchor: 'end', rotate: 0 }
        : { x: spineX + 14, y: y + 4, anchor: 'start', rotate: 0 },
    });
  });

  ew.sequence.forEach((id, idx) => {
    if (nodes.has(id)) return;
    const x = LEFT + idx * EW_STEP;
    const left = idx < ewInterchangeIdx;
    nodes.set(id, {
      id,
      x,
      y: ewY,
      label: left
        ? { x, y: ewY + 14, anchor: 'end', rotate: -45 }
        : { x, y: ewY - 14, anchor: 'start', rotate: -45 },
    });
  });

  if (gift) {
    const origin = nodes.get(gift.sequence[0]);
    if (origin) {
      gift.sequence.forEach((id, idx) => {
        if (idx === 0) return;
        const x = origin.x + idx * GIFT_STEP;
        nodes.set(id, { id, x, y: origin.y, label: { x, y: origin.y + 22, anchor: 'start', rotate: 0 } });
      });
    }
  }

  for (const c of corridors) {
    for (let i = 0; i < c.sequence.length - 1; i++) {
      links.push({ corridorId: c.id, fromId: c.sequence[i], toId: c.sequence[i + 1] });
    }
  }

  let maxX = 0;
  let maxY = 0;
  for (const n of nodes.values()) {
    maxX = Math.max(maxX, n.x + 110);
    maxY = Math.max(maxY, n.y + 90);
  }
  return { width: Math.ceil(maxX), height: Math.ceil(maxY), spineX, nodes, links };
}
