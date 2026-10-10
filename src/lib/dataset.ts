import type { Dataset } from '../types';

import info from '../../data/dataset.json';
import sources from '../../data/sources.json';
import corridors from '../../data/corridors.json';
import stations from '../../data/stations.json';
import connections from '../../data/connections.json';
import gates from '../../data/gates.json';
import landmarks from '../../data/landmarks.json';
import fares from '../../data/fares.json';
import fareRules from '../../data/fare-rules.json';
import timetable from '../../data/timetable-metadata.json';
import facilities from '../../data/facilities.json';

/**
 * The dataset bundled into the app binary. It seeds the local SQLite database
 * on first launch and is the fallback if the database cannot be opened.
 */
export function loadBundledDataset(): Dataset {
  return {
    info,
    sources,
    corridors,
    stations,
    connections,
    gates,
    landmarks,
    fares,
    fareRules,
    timetable,
    facilities,
  } as unknown as Dataset;
}
