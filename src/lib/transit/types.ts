/**
 * Runtime shape of data/transit/transit.json, built from a GTFS feed by scripts/build-transit.mjs.
 * Columnar (parallel arrays) so it is small and quick to parse. Everything here is the feed's published
 * timetable: scheduled, never live.
 */

export const AGENCY_IDS = ['AMTS', 'AJL', 'GTSL'] as const;
export type AgencyId = (typeof AGENCY_IDS)[number];

export interface TransitMeta {
  schema: 1;
  source: {
    name: string;
    publisher: string;
    publisherUrl: string;
    /** First and last day the feed says it is valid (YYYY-MM-DD). */
    validFrom: string;
    validTo: string;
    files: { name: string; sha256: string }[];
    notes: string[];
  };
  counts: { stops: number; routes: number; patterns: number; trips: number; stopTimes: number; vectors: number; stationLinks: number; stopLinks: number };
  report: string[];
}

export interface TransitAgency {
  id: AgencyId;
  name: string;
  url: string;
}

export interface TransitData {
  meta: TransitMeta;
  agencies: TransitAgency[];
  stops: {
    /** GTFS stop ids; the app addresses them as `bus:<id>`. */
    id: string[];
    name: string[];
    lat: number[];
    lon: number[];
    /** Bit i set = served by agencies[i]. */
    agencies: number[];
    /** Index into fares.areas for BRTS fare areas, else -1. */
    area: number[];
  };
  routes: { id: string[]; agency: number[]; short: string[]; long: string[] };
  patterns: {
    route: number[];
    /** GTFS direction_id (0 / 1). */
    dir: number[];
    /** Stop indexes in travel order. */
    stops: number[][];
    /** Per pattern: distinct vectors of whole minutes after the trip's first departure, one value per stop. */
    vectors: number[][][];
    /** Per pattern: trip start times in minutes since the service day began (may exceed 1440), ascending. */
    startT: number[][];
    /** Per pattern: for each start time, the index into `vectors`. */
    startV: number[][];
  };
  fares: {
    /** BRTS fare area names, in area order. */
    areas: string[];
    /** Adult fare amounts (INR) by product index; child[i] is the child fare for adult[i]. */
    adult: number[];
    child: number[];
    /** areas.length² characters: product index as a base-36 digit, or '-' where no fare is defined. Row = from, column = to. */
    matrix: string;
  };
  links: {
    /** [stopIndexA, stopIndexB, metres]; each pair once (a < b). */
    stopStop: [number, number, number][];
    /** Metro station -> nearby bus stop. `named` = the stop's name says "metro". Distances are from ESTIMATED station pins. */
    stationStop: { station: string; stop: number; m: number; named: boolean }[];
  };
}

/** Id prefix for bus stops in places, favourites, recents and URLs. Metro stations keep their plain ids. */
export const BUS_PREFIX = 'bus:';
export const isBusId = (id: string | null | undefined): boolean => !!id && id.startsWith(BUS_PREFIX);
export const busStopId = (gtfsId: string): string => BUS_PREFIX + gtfsId;
export const gtfsStopId = (placeId: string): string => placeId.slice(BUS_PREFIX.length);

/**
 * Road geometry for bus patterns, built from the feed's shapes.txt by scripts/build-transit.mjs
 * (data/transit/shapes.json). The feed does not link shapes to trips, so each pattern is MATCHED to the
 * shape its stops lie on; patterns with no good match have no line and are drawn straight between stops.
 */
export interface ShapesData {
  meta: {
    schema: 1;
    /** Simplification tolerance, metres. */
    tolM: number;
    matched: number;
    total: number;
    byAgency: Record<string, { matched: number; total: number }>;
    report: string[];
  };
  /** Each polyline: [lat0, lon0, dLat1, dLon1, ...] in integer 1e-5 degrees (first point absolute, then deltas). */
  lines: number[][];
  /** Per pattern (same order as transit.json patterns): index into `lines`, or -1 when no road shape matched. */
  pattern: number[];
  /** Per pattern: 1 when the pattern runs opposite to the stored polyline direction. */
  rev: number[];
}
