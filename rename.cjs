const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_PROCESS = ['src', 'convex', 'my-app', 'prds', 'public'];
const DIRECTORIES_TO_IGNORE = ['.next', 'node_modules', '.git', 'dist'];
const FILES_TO_IGNORE = ['rename.js', 'package-lock.json'];

const REPLACEMENTS = [
  { regex: /VibeApps/g, replacement: 'ShipGrid' },
  { regex: /VibeApp/g, replacement: 'ShipGrid' },
  { regex: /vibeapps\.dev/g, replacement: 'goshipgrid.app' },
  { regex: /vibeapps/g, replacement: 'shipgrid' },
  { regex: /vibeapp/g, replacement: 'shipgrid' },
  { regex: /VIBEAPPS/g, replacement: 'SHIPGRID' }
];

let filesModified = 0;

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!DIRECTORIES_TO_IGNORE.includes(entry.name)) {
        processDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      if (!FILES_TO_IGNORE.includes(entry.name)) {
        processFile(fullPath);
      }
    }
  }
}

function processFile(filePath) {
  if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2'].some(ext => filePath.toLowerCase().endsWith(ext))) {
    return;
  }

  try {
    let originalContent = fs.readFileSync(filePath, 'utf8');
    let newContent = originalContent;

    for (const { regex, replacement } of REPLACEMENTS) {
      newContent = newContent.replace(regex, replacement);
    }

    if (originalContent !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated: ${filePath}`);
      filesModified++;
    }
  } catch (err) {
    // skip files that can't be read as utf8 (e.g. binary)
  }
}

for (const dir of DIRECTORIES_TO_PROCESS) {
  const fullDirPath = path.join(__dirname, dir);
  if (fs.existsSync(fullDirPath)) {
    processDirectory(fullDirPath);
  }
}

// Check root files too
['README.md', 'package.json', 'next.config.ts'].forEach(file => {
   const fullPath = path.join(__dirname, file);
   if (fs.existsSync(fullPath)) processFile(fullPath);
});

console.log(`\nRebranding complete. Modified ${filesModified} files.`);
