import type { Landmark, Station } from '../types';

export interface SearchHit {
  station: Station;
  matchedOn: 'name' | 'alias' | 'landmark' | 'all';
  matchedText: string;
  landmark?: Landmark;
  score: number;
}

/** Lower-case, strip accents and punctuation, collapse whitespace. */
export function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const compact = (s: string) => s.replace(/ /g, '');

function scoreText(text: string, q: string, qc: string): number {
  const t = normalize(text);
  if (!t) return 0;
  const tc = compact(t);
  if (t === q || tc === qc) return 100;
  if (t.startsWith(q) || tc.startsWith(qc)) return 80;
  if (t.split(' ').some((w) => w.startsWith(q))) return 65;
  if (t.includes(q) || tc.includes(qc)) return 45;
  return 0;
}

/**
 * Searches station names, aliases and landmark names (a landmark hit resolves
 * to its associated station). An empty query lists every station A–Z.
 */
export function searchStations(stations: Station[], landmarks: Landmark[], query: string, limit = 30): SearchHit[] {
  const q = normalize(query);
  if (!q) {
    return [...stations]
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit)
      .map((station) => ({ station, matchedOn: 'all' as const, matchedText: station.name, score: 0 }));
  }
  const qc = compact(q);
  const stationById = new Map(stations.map((s) => [s.id, s]));
  const best = new Map<string, SearchHit>();
  const offer = (hit: SearchHit) => {
    const cur = best.get(hit.station.id);
    if (!cur || hit.score > cur.score) best.set(hit.station.id, hit);
  };

  for (const station of stations) {
    const nameScore = scoreText(station.name, q, qc);
    if (nameScore) offer({ station, matchedOn: 'name', matchedText: station.name, score: nameScore + 10 });
    for (const alias of station.aliases) {
      const s = scoreText(alias, q, qc);
      if (s) offer({ station, matchedOn: 'alias', matchedText: alias, score: s });
    }
  }
  for (const landmark of landmarks) {
    const station = stationById.get(landmark.nearestStationId);
    if (!station) continue;
    const s = scoreText(landmark.name, q, qc);
    if (s) offer({ station, matchedOn: 'landmark', matchedText: landmark.name, landmark, score: s - 10 });
  }

  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.station.name.localeCompare(b.station.name))
    .slice(0, limit);
}
