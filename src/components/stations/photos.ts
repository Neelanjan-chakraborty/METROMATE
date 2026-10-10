import type { ImageSourcePropType } from 'react-native';
import { STATION_PHOTOS } from './thumbs.generated';

export interface StationPhoto {
  source: ImageSourcePropType;
  /** Photographer, as recorded on Wikimedia Commons. */
  credit: string;
  license: string;
  pageUrl: string;
}

/** The bundled, pre-compressed thumbnail for a station, or null (the drawn illustration is used instead). */
export function stationPhoto(id: string): StationPhoto | null {
  return STATION_PHOTOS[id] ?? null;
}
