import type { SceneCopy } from './types';

/** The five steps in order: ids, backgrounds and the keys of their copy (headline, one sentence, art description, actions). */
export const SCENE_COPY: SceneCopy[] = [
  { id: 'welcome', sky: '#F6D3E8', title: 'onboarding.s1.title', body: 'onboarding.s1.body', art: 'onboarding.s1.art', primary: 'onboarding.s1.primary', secondary: 'onboarding.s1.secondary' },
  { id: 'route', sky: '#E9E7FF', anchor: 'center', title: 'onboarding.s2.title', body: 'onboarding.s2.body', art: 'onboarding.s2.art' },
  { id: 'track', sky: '#DDEBFF', title: 'onboarding.s3.title', body: 'onboarding.s3.body', note: 'onboarding.s3.note', art: 'onboarding.s3.art' },
  { id: 'offline', sky: '#E9E7FF', anchor: 'center', title: 'onboarding.s4.title', body: 'onboarding.s4.body', note: 'onboarding.s4.note', art: 'onboarding.s4.art' },
  { id: 'ready', sky: '#FDE7DA', title: 'onboarding.s5.title', body: 'onboarding.s5.body', art: 'onboarding.s5.art', primary: 'onboarding.s5.primary', secondary: 'onboarding.s5.secondary' },
];
