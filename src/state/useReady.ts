import { useApp } from './AppProvider';

/** For screens rendered behind the loading gate: dataset and network are guaranteed present. */
export function useReady() {
  const app = useApp();
  if (!app.dataset || !app.network) throw new Error('Dataset is not ready');
  return { ...app, dataset: app.dataset, network: app.network };
}
