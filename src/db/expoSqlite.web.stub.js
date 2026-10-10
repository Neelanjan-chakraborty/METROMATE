// Stand-in for expo-sqlite on web builds (see metro.config.js).
export async function openDatabaseAsync() {
  throw new Error('expo-sqlite is not available in web builds');
}
