import fg from 'fast-glob';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ScannedFile } from '../types.js';

export const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/.next/**',
  '**/.turbo/**',
  '**/coverage/**',
  '**/storybook-static/**',
  '**/*.min.*',
];

export const STYLE_EXTENSIONS = ['css', 'scss', 'sass', 'less'];
export const SCRIPT_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'vue', 'svelte'];

export interface ScanOptions {
  extensions?: string[];
  ignore?: string[];
}

export async function scanFiles(targetDir: string, options: ScanOptions = {}): Promise<ScannedFile[]> {
  const extensions = options.extensions ?? [...STYLE_EXTENSIONS, ...SCRIPT_EXTENSIONS];
  const ignore = [...DEFAULT_IGNORE, ...(options.ignore ?? [])];
  const pattern = `**/*.{${extensions.join(',')}}`;

  const entries = await fg(pattern, {
    cwd: targetDir,
    ignore,
    dot: false,
    onlyFiles: true,
    absolute: false,
  });

  const files: ScannedFile[] = [];
  for (const relativePath of entries) {
    const absolutePath = path.join(targetDir, relativePath);
    try {
      const content = await readFile(absolutePath, 'utf8');
      files.push({ path: relativePath, content });
    } catch {
      continue;
    }
  }
  return files;
}

export async function findFiles(targetDir: string, patterns: string[], ignore: string[] = []): Promise<string[]> {
  return fg(patterns, {
    cwd: targetDir,
    ignore: [...DEFAULT_IGNORE, ...ignore],
    dot: false,
    onlyFiles: true,
  });
}
