// Web builds are only a development/preview convenience: expo-sqlite's web
// implementation needs a WASM asset that is not bundled, so on web it is
// replaced by a stub that fails to open. AppProvider then falls back to
// in-memory storage. Native (Expo Go / Android / iOS) uses the real expo-sqlite.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const upstreamResolve = config.resolver.resolveRequest;

// The marketing website (website/, a separate Next.js project) is not part of the app bundle.
const websiteDir = new RegExp(`^${path.join(__dirname, 'website').replace(/[/\\]/g, '[/\\\\]')}[/\\\\].*`);
config.resolver.blockList = [].concat(config.resolver.blockList ?? [], websiteDir);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-sqlite') {
    return { type: 'sourceFile', filePath: path.join(__dirname, 'src/db/expoSqlite.web.stub.js') };
  }
  return (upstreamResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
