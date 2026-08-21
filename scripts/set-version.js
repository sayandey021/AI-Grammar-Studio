const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const packageLockPath = path.join(rootDir, 'package-lock.json');

function isValidVersion(version) {
  return /^\d+\.\d+\.\d+(\.\d+)?(-[a-zA-Z0-9.]+)?$/.test(version.trim());
}

function updateVersion(newVersion) {
  newVersion = newVersion.trim();
  if (!isValidVersion(newVersion)) {
    console.error(`\n[ERROR] Invalid version format: "${newVersion}"`);
    console.error('Please use SemVer format (e.g., 1.0.1, 1.2.0, 2.0.0, or 1.0.1.0)\n');
    process.exit(1);
  }

  // 1. Update package.json
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`\n[ERROR] package.json not found at: ${packageJsonPath}\n`);
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const oldVersion = pkg.version;
  pkg.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(`[UPDATED] package.json: ${oldVersion} -> ${newVersion}`);

  // 2. Update package-lock.json if exists
  if (fs.existsSync(packageLockPath)) {
    try {
      const pkgLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
      pkgLock.version = newVersion;
      if (pkgLock.packages && pkgLock.packages['']) {
        pkgLock.packages[''].version = newVersion;
      }
      fs.writeFileSync(packageLockPath, JSON.stringify(pkgLock, null, 2) + '\n', 'utf8');
      console.log(`[UPDATED] package-lock.json: ${oldVersion} -> ${newVersion}`);
    } catch (e) {
      console.warn(`[WARN] Could not update package-lock.json: ${e.message}`);
    }
  }

  console.log(`\n=======================================================`);
  console.log(` [SUCCESS] Version successfully updated to ${newVersion}!`);
  console.log(` -------------------------------------------------------`);
  console.log(` • package.json:              ${newVersion}`);
  console.log(` • package-lock.json:         ${newVersion}`);
  console.log(` • TitleBar (Dynamic):        v${newVersion}`);
  console.log(` • Studio Dashboard (Dynamic): About v${newVersion}`);
  console.log(` • About Page (Dynamic):      v${newVersion}`);
  console.log(` • Windows Installer (.EXE):  AI Grammar Studio-${newVersion}-x64.exe`);
  console.log(` • Windows Store (.MSIX):     AI Grammar Studio-${newVersion}-x64.msix`);
  console.log(`=======================================================\n`);
}

const inputVersion = process.argv[2];

if (inputVersion) {
  updateVersion(inputVersion);
} else {
  const currentVersion = (() => {
    try {
      return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
    } catch {
      return 'unknown';
    }
  })();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`=======================================================`);
  console.log(`    AI Grammar Studio - Version Management Utility`);
  console.log(`=======================================================`);
  console.log(`Current Application Version: ${currentVersion}\n`);

  rl.question(`Enter new version (e.g. 1.0.1, 1.1.0, 2.0.0): `, (answer) => {
    rl.close();
    if (!answer || !answer.trim()) {
      console.log('\n[CANCELLED] No version entered. Version remained unchanged.\n');
      process.exit(0);
    }
    updateVersion(answer);
  });
}
