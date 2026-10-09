export type VerificationStatus = 'verified' | 'unverified' | 'estimated' | 'unknown';

export interface SourceMetadata {
  sourceId: string;
  sourceUrl: string | null;
  verifiedAt: string | null;
  verificationStatus: VerificationStatus;
  notes: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  type: string;
  obtainedBy: string;
  checkedAt: string;
  limitations: string;
}

export interface Corridor {
  id: string;
  name: string;
  shortName: string;
  color: string;
  lengthKm: number;
  description: string;
  /** Ordered station ids along the corridor. */
  sequence: string[];
  forwardTerminalId: string;
  backwardTerminalId: string;
  sourceMetadata: SourceMetadata;
}

export interface Platform {
  id: string;
  stationId: string;
  label: string;
  towardsStationId: string | null;
  sourceUrl: string | null;
  verificationStatus: VerificationStatus;
}

export interface NearbyConnection {
  kind: 'brts' | 'bus' | 'rail' | 'other';
  gateNumber: number | null;
  note: string;
  sourceId: string;
  verificationStatus: VerificationStatus;
}

export interface Station {
  id: string;
  name: string;
  aliases: string[];
  corridorIds: string[];
  sequenceByCorridor: Record<string, number>;
  isInterchange: boolean;
  /** Passenger-facing note for interchange stations; null otherwise. */
  interchangeNote: string | null;
  /** Ticketing phase per the GMRC fare rules page. */
  phase: 1 | 2;
  latitude: number | null;
  longitude: number | null;
  coordinateStatus: VerificationStatus;
  /** Where the coordinates came from (a source id), or null when unknown. */
  coordinateSourceId: string | null;
  stationType: 'elevated' | 'underground' | 'unknown';
  /** Lifts with ramp listed by GMRC at entrances, by lift number and nearest gate number. */
  lifts: { lift: number; nearGate: number }[];
  /** Set when the station needs a caveat (e.g. not in GMRC's operational gate table). */
  serviceNote: string | null;
  /** Bus/BRTS/railway connectivity notes. Unverified (from an unofficial map). */
  nearbyConnections: NearbyConnection[];
  facilities: string[];
  platforms: Platform[];
  sourceMetadata: SourceMetadata;
}

export interface Connection {
  id: string;
  fromStationId: string;
  toStationId: string;
  corridorId: string;
  /** Human label, e.g. "Towards Mahatma Mandir". */
  direction: string;
  directionTerminalId: string;
  estimatedTravelMinutes: number | null;
  verificationStatus: VerificationStatus;
  sourceUrl: string | null;
  verifiedAt: string | null;
  notes: string;
}

export interface Gate {
  id: string;
  stationId: string;
  gateNumber: string;
  /** What GMRC publishes, verbatim. */
  publishedDescription: string;
  /** Independently verified street/landmark direction; null unless verified. */
  verifiedDirection: string | null;
  accessibilityNotes: string | null;
  /** Connectivity notes for this gate (unverified; from an unofficial map). */
  nearbyConnectionNotes?: string[];
  sourceUrl: string | null;
  verifiedAt?: string | null;
  verificationStatus: VerificationStatus;
  notes?: string;
}

export interface Landmark {
  id: string;
  name: string;
  category: string;
  nearestStationId: string;
  latitude: number | null;
  longitude: number | null;
  walkingDistanceMeters: number | null;
  walkingTimeMinutes: number | null;
  recommendedGateId: string | null;
  sourceUrl: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  notes: string;
}

export interface FarePair {
  fromStationId: string;
  toStationId: string;
  amountInr: number;
  fareType: string;
  validFrom: string | null;
  sourceUrl: string;
  verifiedAt: string;
  verificationStatus: VerificationStatus;
}

export interface FareTable {
  version: string;
  currency: 'INR';
  status: 'available' | 'unavailable';
  validFrom: string | null;
  reviewDate: string | null;
  fareType: string | null;
  pairs: FarePair[];
  rules: unknown[];
  notes: string;
  sourceMetadata: SourceMetadata;
}

export interface FareRules {
  version: string;
  sourceMetadata: SourceMetadata;
  media: string[];
  products: string[];
  rules: string[];
  phaseRestriction: { status: string; text: string; notes: string };
}

export interface FrequencyBand {
  label: string;
  kind: 'every' | 'average' | 'bus-only';
  minutes: number | null;
  note?: string;
}

export interface TimetableLine {
  id: string;
  label: string;
  corridorId: string;
  terminalStationIds: string[];
  stationIds: string[];
  frequency: FrequencyBand[];
  firstTrain: { stationId: string; time: string }[];
  lastTrain: { stationId: string; time: string }[];
  endToEndMinutes: number;
  distanceKm: number;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  verifiedAt: string;
  notes: string;
}

export interface TimetableMetadata {
  version: string;
  validFrom: string;
  sourcePageLastUpdated: string;
  isLive: false;
  sourceMetadata: SourceMetadata;
  notes: string[];
  lines: TimetableLine[];
}

export interface Facilities {
  scope: 'network-wide';
  sourceMetadata: SourceMetadata;
  general: string[];
  accessibility: string[];
}

export interface DatasetInfo {
  name: string;
  version: string;
  generatedAt: string;
  sourcePageLastUpdated: string;
  network: string;
  stationCount: number;
  notes: string;
}

/** Everything the app reads from the bundled / SQLite dataset. */
export interface Dataset {
  info: DatasetInfo;
  sources: Source[];
  corridors: Corridor[];
  stations: Station[];
  connections: Connection[];
  gates: Gate[];
  landmarks: Landmark[];
  fares: FareTable;
  fareRules: FareRules;
  timetable: TimetableMetadata;
  facilities: Facilities;
}

// ------------------------------------------------------------------ routing

export interface RouteSegment {
  corridorId: string;
  /** Ordered station ids including both ends of the segment. */
  stationIds: string[];
  fromStationId: string;
  toStationId: string;
  /** Stops after boarding (stations passed + alighting station). */
  stops: number;
  direction: string;
  directionTerminalId: string;
}

export interface Interchange {
  stationId: string;
  fromCorridorId: string;
  toCorridorId: string;
}

export interface RouteResult {
  ok: true;
  originId: string;
  destinationId: string;
  stationIds: string[];
  segments: RouteSegment[];
  interchanges: Interchange[];
  /** Stops after boarding until arrival. */
  stopCount: number;
  /** Stations strictly between origin and destination. */
  intermediateCount: number;
  crossesPhaseBoundary: boolean;
  preference: 'fewest-stops';
  warnings: string[];
}

export type RouteErrorCode = 'SAME_STATION' | 'UNKNOWN_STATION' | 'NO_ROUTE' | 'MISSING_INPUT';

export interface RouteError {
  ok: false;
  code: RouteErrorCode;
  message: string;
}

export type RouteOutcome = RouteResult | RouteError;

// ------------------------------------------------------------- fare / time

export type FareOutcome =
  | { status: 'available'; amountInr: number; fareType: string; validFrom: string | null; sourceUrl: string }
  | { status: 'unavailable'; message: string };

export type JourneyTimeOutcome =
  | { status: 'estimated'; minutes: number; note: string }
  | { status: 'unavailable'; message: string };

export interface ServiceInfo {
  line: TimetableLine;
  /** Station ids of the route that lie on this line. */
  routeStationIds: string[];
}

// --------------------------------------------------------------- persistence

export interface SavedJourney {
  id: number;
  fromId: string;
  toId: string;
  createdAt: number;
}

/** A station position recorded on this phone from GPS fixes (kept separately from the dataset). */
export interface StationCoord {
  stationId: string;
  lat: number;
  lon: number;
  /** Sum of inverse-variance weights; higher means more precise. */
  weight: number;
  samples: number;
  updatedAt: number;
  /** Estimated accuracy of the averaged position, in metres. */
  accuracyM: number;
}
