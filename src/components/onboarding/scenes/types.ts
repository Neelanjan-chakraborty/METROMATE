import type { SharedValue } from 'react-native-reanimated';
import type { MessageKey } from '../../../i18n';

/** What every scene receives from the pager. */
export interface SceneProps {
  /** The phone asks for reduced motion: show the finished scene, still. */
  reduced: boolean;
  /** Screen pixels per artboard unit and the page width. */
  scale: number;
  pageW: number;
  /** Pager position (float) and this scene's index: scenes start, pause and parallax from these on the UI thread. */
  progress: SharedValue<number>;
  index: number;
}

/** The part of a scene that is plain data: its copy keys and background. */
export interface SceneCopy {
  id: string;
  /** Colour at the top of the scene's sky: the area above the artboard is filled with it. */
  sky: string;
  /** Where the artboard sits in the art area: 'bottom' keeps the ground flush with the text sheet; 'center' floats it. */
  anchor?: 'bottom' | 'center';
  title: MessageKey;
  body: MessageKey;
  note?: MessageKey;
  art: MessageKey;
  primary?: MessageKey;
  secondary?: MessageKey;
}

export interface SceneDef extends SceneCopy {
  Scene: React.ComponentType<SceneProps>;
}
