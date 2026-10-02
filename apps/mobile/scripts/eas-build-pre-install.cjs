const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[EAS Build Hook] Running eas-build-pre-install hook...');

// Detect monorepo root (find directory containing package.json with workspaces)
let currentDir = process.cwd();
let monorepoRoot = null;

let checkDir = currentDir;
while (checkDir !== path.dirname(checkDir)) {
  const pkgPath = path.join(checkDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.workspaces) {
        monorepoRoot = checkDir;
        break;
      }
    } catch (e) {}
  }
  checkDir = path.dirname(checkDir);
}

if (!monorepoRoot) {
  monorepoRoot = currentDir;
  console.log(`[EAS Build Hook] Monorepo root fallback to cwd: ${monorepoRoot}`);
} else {
  console.log(`[EAS Build Hook] Detected monorepo root at: ${monorepoRoot}`);
}

// 1. Configure npm globally and at root for the build process to ignore peer dependency conflicts and platform mismatch
try {
  console.log('[EAS Build Hook] Setting npm config legacy-peer-deps and force at root...');
  execSync('npm config set legacy-peer-deps true', { cwd: monorepoRoot, stdio: 'inherit' });
  execSync('npm config set force true', { cwd: monorepoRoot, stdio: 'inherit' });
} catch (err) {
  console.warn('[EAS Build Hook] Notice: npm config set warning:', err.message);
}

// 2. Ensure .npmrc exists at root and current working directory
const npmrcContent = 'legacy-peer-deps=true\ninstall-links=true\n';
try {
  fs.writeFileSync(path.join(monorepoRoot, '.npmrc'), npmrcContent);
  if (monorepoRoot !== currentDir) {
    fs.writeFileSync(path.join(currentDir, '.npmrc'), npmrcContent);
  }
  console.log('[EAS Build Hook] Verified .npmrc with legacy-peer-deps=true');
} catch (err) {
  console.warn('[EAS Build Hook] Notice: .npmrc write warning:', err.message);
}

// 3. Ensure hoisted monorepo installation at workspace root
try {
  console.log(`[EAS Build Hook] Ensuring workspace dependencies are installed from root (${monorepoRoot})...`);
  execSync('npm install --legacy-peer-deps', {
    cwd: monorepoRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NPM_CONFIG_LEGACY_PEER_DEPS: 'true',
      NPM_CONFIG_FORCE: 'true'
    }
  });
  console.log('[EAS Build Hook] Workspace dependencies successfully resolved and installed.');
} catch (err) {
  console.error('[EAS Build Hook] Failed during monorepo root dependency installation:', err.message);
  process.exit(1);
}
