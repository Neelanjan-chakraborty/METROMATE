import { loadBundledDataset } from '../dataset';
import { buildSchematic } from '../schematic';

const ds = loadBundledDataset();
const sch = buildSchematic(ds.corridors);

describe('schematic layout', () => {
  it('places every station exactly once', () => {
    expect(sch.nodes.size).toBe(54);
    for (const s of ds.stations) expect(sch.nodes.has(s.id)).toBe(true);
  });

  it('has one link per adjacent station pair (53)', () => {
    expect(sch.links).toHaveLength(53);
    for (const l of sch.links) {
      expect(sch.nodes.has(l.fromId)).toBe(true);
      expect(sch.nodes.has(l.toId)).toBe(true);
    }
  });

  it('keeps all nodes and labels inside the canvas', () => {
    for (const n of sch.nodes.values()) {
      expect(n.x).toBeGreaterThan(0);
      expect(n.y).toBeGreaterThan(0);
      expect(n.x).toBeLessThan(sch.width);
      expect(n.y).toBeLessThan(sch.height);
    }
  });

  it('draws Mahatma Mandir at the top, APMC at the bottom, Old High Court at the crossing', () => {
    const y = (id: string) => sch.nodes.get(id)!.y;
    expect(y('MAHM')).toBeLessThan(y('GNLU'));
    expect(y('GNLU')).toBeLessThan(y('OHCI'));
    expect(y('OHCI')).toBeLessThan(y('APMC'));
    expect(sch.nodes.get('OHCI')!.x).toBe(sch.spineX);
    expect(sch.nodes.get('SHHP')!.y).toBe(y('OHCI'));
  });

  it('does not overlap any two station dots', () => {
    const ns = [...sch.nodes.values()];
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const d = Math.hypot(ns[i].x - ns[j].x, ns[i].y - ns[j].y);
        expect(d).toBeGreaterThan(20);
      }
    }
  });

  it('degrades to an empty schematic if the corridors are missing', () => {
    const empty = buildSchematic([]);
    expect(empty.nodes.size).toBe(0);
    expect(empty.width).toBe(0);
  });
});
