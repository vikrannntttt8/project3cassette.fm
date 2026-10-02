const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// ── Directory anchors ────────────────────────────────────────────────────────
const projectRoot     = __dirname;
const monorepoRoot    = path.resolve(projectRoot, '../..');
const corePackageRoot = path.resolve(monorepoRoot, 'packages/core');
const rootSrcDir      = path.resolve(monorepoRoot, 'src');
const rootNodeModules = path.resolve(monorepoRoot, 'node_modules');
const localNodeModules = path.resolve(projectRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

// ── 1. Watch the entire monorepo workspace ───────────────────────────────────
//    Metro needs to see every directory whose files may be bundled.
config.watchFolders = [
  monorepoRoot,        // root: package.json, turbo.json, eas.json …
  corePackageRoot,     // packages/core — @cassette/core source
  rootSrcDir,          // src/           — shared utilities, fallbackFeed, etc.
  rootNodeModules,     // hoisted node_modules
];

// ── 2. Node-module resolution order ─────────────────────────────────────────
//    Local node_modules first (ensures react-native, expo, etc. resolve to the
//    single copy that was installed for this app), then hoisted root packages.
config.resolver.nodeModulesPaths = [
  localNodeModules,
  rootNodeModules,
];

// ── 3. Extra alias overrides ─────────────────────────────────────────────────
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  // Canonical alias for the shared core package
  '@cassette/core': corePackageRoot,
  // NativeWind v2 ships its own JSX runtime as a peer; shim to React's to avoid
  // the "Cannot read properties of undefined (reading 'createElement')" crash.
  'nativewind/jsx-runtime':     require.resolve('react/jsx-runtime'),
  'nativewind/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
};

// ── 4. Custom resolve hook ───────────────────────────────────────────────────
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // @cassette/core root
  if (moduleName === '@cassette/core') {
    return {
      filePath: path.resolve(corePackageRoot, 'src/index.js'),
      type: 'sourceFile',
    };
  }

  // @cassette/core sub-paths  (e.g. @cassette/core/stores/playerStore)
  if (moduleName.startsWith('@cassette/core/')) {
    const subpath = moduleName.replace('@cassette/core/', '');
    const filePath = path.resolve(
      corePackageRoot,
      subpath.endsWith('.js') ? subpath : `${subpath}.js`
    );
    return { filePath, type: 'sourceFile' };
  }

  // NativeWind v2 JSX shims
  if (moduleName === 'nativewind/jsx-runtime') {
    return { filePath: require.resolve('react/jsx-runtime'), type: 'sourceFile' };
  }
  if (moduleName === 'nativewind/jsx-dev-runtime') {
    return { filePath: require.resolve('react/jsx-dev-runtime'), type: 'sourceFile' };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
