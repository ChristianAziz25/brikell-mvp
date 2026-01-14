#!/usr/bin/env node
/**
 * Post-prisma-generate script to fix .js imports for Turbopack compatibility
 * Prisma 7.x generates ESM-style imports with .js extensions, but Turbopack
 * doesn't resolve them to .ts files automatically.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.join(__dirname, '../src/generated');

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace .js imports with .ts imports for local files
  const newContent = content.replace(
    /from\s+['"](\.[^'"]+)\.js['"]/g,
    (match, importPath) => {
      modified = true;
      return `from '${importPath}.ts'`;
    }
  );

  if (modified) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed imports in: ${path.relative(process.cwd(), filePath)}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fixImports(filePath);
    }
  }
}

console.log('Fixing Prisma generated imports for Turbopack...');
walkDir(generatedDir);
console.log('Done!');
