const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

// ── 1. Workspace Anchors ───────────────────────────────────────────────────────
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const corePackageRoot = path.resolve(monorepoRoot, 'packages/core');
const rootNodeModules = path.resolve(monorepoRoot, 'node_modules');
const localNodeModules = path.resolve(projectRoot, 'node_modules');
const desktopRoot = path.resolve(monorepoRoot, 'apps/desktop');

// ── 2. Initialize Expo Metro Configuration ─────────────────────────────────────
const config = getDefaultConfig(projectRoot);

// ── 3. Watch Folders (Disjoint Workspace Paths) ───────────────────────────────
// Fix TreeFS "Failed to make parent directory entry for node_modules/..." crash.
// TreeFS crashes when watchFolders contains both a parent folder and its children.
// We strictly retain only the necessary, disjoint workspace directories and
// explicitly exclude non-mobile workspaces (like apps/desktop).
config.watchFolders = [monorepoRoot];

// ── 4. Node Modules Resolution Order ──────────────────────────────────────────
// Ensure Metro searches local apps/mobile/node_modules first, then hoisted root node_modules.
config.resolver.nodeModulesPaths = [
  localNodeModules,
  rootNodeModules,
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// ── 5. Blocklist Conflicting Sub-node_modules and Build Artifacts ─────────────
// Ensure Metro does not crawl desktop node_modules, .git, .vercel, or build output folders.
function createCrossPlatformRegex(dirPath) {
  const normalized = path.resolve(dirPath).replace(/\\/g, '/');
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const crossPlatform = escaped.replace(/\//g, '[\\\\/]');
  return new RegExp(`^${crossPlatform}([\\\\/].*)?$`);
}

const customBlockList = [
  // Block desktop workspace and its nested node_modules
  createCrossPlatformRegex(desktopRoot),
  createCrossPlatformRegex(path.resolve(monorepoRoot, 'apps/desktop/node_modules')),
  // Block nested package node_modules if any
  createCrossPlatformRegex(path.resolve(corePackageRoot, 'node_modules')),
  // Block version control, deployment, and build artifacts
  createCrossPlatformRegex(path.resolve(monorepoRoot, '.git')),
  createCrossPlatformRegex(path.resolve(monorepoRoot, '.vercel')),
  createCrossPlatformRegex(path.resolve(monorepoRoot, 'dist')),
  createCrossPlatformRegex(path.resolve(projectRoot, 'dist')),
  /.*\android[\\/](app[\\/])?build[\\/].*/,
  /.*\android[\\/]\.gradle[\\/].*/,
  /.*\ios[\\/]Pods[\\/].*/,
  /.*\\\.expo[\\/].*/,
];

// Preserve Expo's default blockList patterns while merging our custom monorepo filters
const existingBlockList = config.resolver.blockList;
if (Array.isArray(existingBlockList)) {
  config.resolver.blockList = [...existingBlockList, ...customBlockList];
} else if (existingBlockList instanceof RegExp) {
  config.resolver.blockList = [existingBlockList, ...customBlockList];
} else {
  config.resolver.blockList = customBlockList;
}

// ── 6. Extra Node Modules & NativeWind Shims ──────────────────────────────────
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  // Canonical alias for the shared core package
  '@cassette/core': corePackageRoot,
  'expo-router': path.resolve(monorepoRoot, 'node_modules/expo-router'),
  // NativeWind v2 JSX runtime shims to avoid createElement crashes
  'nativewind/jsx-runtime': require.resolve('react/jsx-runtime'),
  'nativewind/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
};

// ── 7. Custom Module Resolution Hook ──────────────────────────────────────────
const emptyShim = path.resolve(projectRoot, 'shims/empty.js');
const nodeBuiltins = ['crypto', 'stream', 'http', 'https', 'net', 'tls', 'fs', 'path', 'os', 'zlib', 'vm'];

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (nodeBuiltins.includes(moduleName) || moduleName.startsWith('node:')) {
    return { filePath: emptyShim, type: 'sourceFile' };
  }

  // @cassette/core root
  if (moduleName === '@cassette/core') {
    return {
      filePath: path.resolve(corePackageRoot, 'src/index.js'),
      type: 'sourceFile',
    };
  }

  // @cassette/core sub-paths (e.g. @cassette/core/stores/playerStore)
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

  // Expo Router entry and subpaths resolution for hoisted monorepo
  if (moduleName === './node_modules/expo-router/entry' || moduleName.endsWith('expo-router/entry')) {
    return {
      filePath: require.resolve('expo-router/entry', { paths: [projectRoot, monorepoRoot] }),
      type: 'sourceFile',
    };
  }
  if (moduleName.startsWith('expo-router/')) {
    const sub = moduleName.slice('expo-router/'.length);
    const candidate = path.resolve(monorepoRoot, 'node_modules/expo-router', sub.endsWith('.js') ? sub : `${sub}.js`);
    if (fs.existsSync(candidate)) {
      return { filePath: candidate, type: 'sourceFile' };
    }
  }

  const resolve = defaultResolveRequest || context.resolveRequest;
  try {
    return resolve(context, moduleName, platform);
  } catch (err) {
    if (!moduleName.startsWith('.') && !moduleName.startsWith('/')) {
      try {
        const resolved = require.resolve(moduleName, { paths: [projectRoot, monorepoRoot, rootNodeModules] });
        if (path.isAbsolute(resolved)) {
          return { filePath: resolved, type: 'sourceFile' };
        }
        return { type: 'empty' };
      } catch {}
    }
    throw err;
  }
};

module.exports = config;
