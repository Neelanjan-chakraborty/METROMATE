/** Shared constants for the illustrated live-tracking canvas. */

/** World pixels per metre. A 1.2 km hop is about 240 px. */
export const SCALE = 0.2;
/** Empty border around the route in world pixels. */
export const WORLD_PAD = 600;

export const COLORS = {
  ground: '#E9EBF7',
  deck: '#FFFFFF',
  deckEdge: '#C9CCE6',
  deckShadow: '#6E73A6',
  progress: '#4F35E8',
  progressGlow: '#8D7CFF',
  tunnelDark: '#14163F',
  tunnelLit: '#8E84FF',
  navy: '#111A32',
  slate: '#78839D',
};

export type LandmarkKind = 'stadium' | 'temple' | 'hall' | 'secretariat' | 'campus' | 'towers' | 'court' | 'railway' | 'market' | 'tvtower' | 'factory';

/**
 * Landmarks are chosen from the station's name only (e.g. "Motera Stadium" gets a stadium). They sit
 * beside the station as an illustration; their shape and exact position are not survey data.
 */
export const LANDMARKS: Record<string, LandmarkKind> = {
  MTRS: 'stadium',
  SPSD: 'stadium',
  AKDM: 'temple',
  MAHM: 'hall',
  SVAL: 'secretariat',
  JUSL: 'secretariat',
  GJUV: 'campus',
  GNLU: 'campus',
  PDEU: 'campus',
  VIKC: 'campus',
  GIFC: 'towers',
  OHCI: 'court',
  SBRS: 'railway',
  KPMS: 'railway',
  APMC: 'market',
  ARPK: 'factory',
  DDKN: 'tvtower',
};
