const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const corePackageRoot = path.resolve(monorepoRoot, 'packages/core');
const rootNodeModules = path.resolve(monorepoRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

// 1. Watch all relevant directories in the monorepo
config.watchFolders = [
  monorepoRoot,
  rootNodeModules,
  corePackageRoot,
];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  rootNodeModules,
];

// 3. Extra node modules alias fallback
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@cassette/core': corePackageRoot,
  'nativewind/jsx-runtime': require.resolve('react/jsx-runtime'),
  'nativewind/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
};

// 4. Explicit resolver hook to intercept any nativewind/jsx-runtime or @cassette/core requests
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@cassette/core') {
    return {
      filePath: path.resolve(corePackageRoot, 'src/index.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName.startsWith('@cassette/core/')) {
    const subpath = moduleName.replace('@cassette/core/', '');
    return {
      filePath: path.resolve(corePackageRoot, subpath.endsWith('.js') ? subpath : `${subpath}.js`),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'nativewind/jsx-runtime') {
    return {
      filePath: require.resolve('react/jsx-runtime'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'nativewind/jsx-dev-runtime') {
    return {
      filePath: require.resolve('react/jsx-dev-runtime'),
      type: 'sourceFile',
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
