import { OfflineScene } from './OfflineScene';
import { ReadyScene } from './ReadyScene';
import { RouteScene } from './RouteScene';
import { TrackingScene } from './TrackingScene';
import { WelcomeScene } from './WelcomeScene';
import { SCENE_COPY } from './copy';
import type { SceneDef } from './types';

const COMPONENTS = [WelcomeScene, RouteScene, TrackingScene, OfflineScene, ReadyScene];

/** The five scenes in order: their copy and their animated artwork. */
export const SCENES: SceneDef[] = SCENE_COPY.map((c, i) => ({ ...c, Scene: COMPONENTS[i] }));
