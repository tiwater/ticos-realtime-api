#!/usr/bin/env node

/**
 * Script to publish TypeDoc-generated MDX files to a Nextra project
 *
 * By default, looks for a ticos-docs project in the parent directory,
 * but can specify a different location with the --target flag
 *
 * For a Nextra site with localization support, this creates copies
 * of documentation for English and Chinese locales.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Default locales to create copies for
const DEFAULT_LOCALES = 'en,zh';

// Default destination is ../ticos-docs/content
let targetBaseDir = path.resolve(projectRoot, '..', 'ticos-docs', 'content');
let targetLocales: string[] = DEFAULT_LOCALES.split(',');

// Parse command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--target' && i + 1 < args.length) {
    targetBaseDir = path.resolve(args[++i]);
  } else if (args[i] === '--locales' && i + 1 < args.length) {
    targetLocales = args[++i].split(',');
  }
}

// Source directory with generated docs
const sourceDir = path.resolve(projectRoot, 'docs');

// Set fixed directory name and title
const dirName = 'realtime-typescript-sdk';
const dirTitle = 'Realtime SDK';

/**
 * Recursively copy files from source to destination
 */
async function copyFiles(source: string, dest: string): Promise<void> {
  // Create destination directory if it doesn't exist
  await fs.mkdir(dest, { recursive: true });

  // Get all files and subdirectories in the source directory
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      await copyFiles(sourcePath, destPath);
    } else {
      // Copy files
      await fs.copyFile(sourcePath, destPath);
      console.log(`Copied: ${sourcePath} → ${destPath}`);
    }
  }
}

/**
 * Generate a _meta.ts file for Nextra navigation
 */
async function generateMetaJson(dir: string): Promise<void> {
  // Get all directories and files in the specified directory
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const modules: Record<string, { title: string }> = {};

  // For each directory, add an entry to the _meta.ts file
  for (const entry of entries) {
    if (entry.isDirectory()) {
      modules[entry.name] = {
        title: formatTitle(entry.name),
      };
    }
  }

  // Add index.mdx with title "Overview"
  if (await fileExists(path.join(dir, 'index.mdx'))) {
    modules['index'] = { title: 'Overview' };
  }

  // Write the _meta.ts file
  const metaPath = path.join(dir, '_meta.ts');
  const content = `// This file is auto-generated, do not edit
export default ${JSON.stringify(modules, null, 2)};
`;
  await fs.writeFile(metaPath, content);
  console.log(`Generated: ${metaPath}`);

  // Recursively generate _meta.ts for subdirectories
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await generateMetaJson(path.join(dir, entry.name));
    }
  }
}

/**
 * Format a title for display in navigation
 */
function formatTitle(name: string): string {
  // Special cases
  if (name === 'index') return 'Overview';
  if (name === 'src') return 'Source';
  if (name === 'types') return 'Types';
  if (name === 'core') return 'Core';
  if (name === 'interfaces') return 'Interfaces';
  if (name === 'classes') return 'Classes';
  if (name === 'type-aliases') return 'Type Aliases';

  // General case: capitalize first letter and convert camelCase to Title Case
  return name
    .replace(/([A-Z])/g, ' $1') // Insert spaces before capital letters
    .split('-')
    .join(' ') // Replace hyphens with spaces
    .split('_')
    .join(' ') // Replace underscores with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .trim() // Remove leading and trailing spaces
    .split(' ') // Split into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
    .join(' '); // Join words with spaces
}

/**
 * Check if a file exists
 */
async function fileExists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

// Main execution
async function main() {
  try {
    console.log(`Publishing docs from ${sourceDir}`);
    console.log(`Creating copies for locales: ${targetLocales.join(', ')}`);

    // For each locale, create a copy of the documentation
    for (const locale of targetLocales) {
      // Target is /content/{locale}/realtime-typescript-sdk/
      const localeDir = path.join(targetBaseDir, locale);
      const targetDir = path.join(localeDir, dirName);

      // No longer need to update locale _meta.ts - we'll only manage files within the SDK folder

      // Clear the target directory if it exists
      if (await fileExists(targetDir)) {
        await fs.rm(targetDir, { recursive: true, force: true });
        console.log(`Cleared target directory: ${targetDir}`);
      }

      // Copy all files from source to destination
      await copyFiles(sourceDir, targetDir);

      // Generate _meta.ts files for Nextra navigation
      await generateMetaJson(targetDir);

      console.log(`✅ Documentation copy created for locale: ${locale}`);
    }

    console.log('✨ Documentation successfully published!');
  } catch (error) {
    console.error('Failed to publish documentation:', error);
    process.exit(1);
  }
}

main();
