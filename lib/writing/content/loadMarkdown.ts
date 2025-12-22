// lib/writing/content/loadMarkdown.ts
// Lightweight markdown loader for server-side use.
import fs from 'fs';
import path from 'path';

export const loadMarkdown = (relativePath: string): string => {
  const baseDir = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(baseDir)) return '';
  return fs.readFileSync(baseDir, 'utf8');
};
