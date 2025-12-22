// lib/writing/content/writingContent.ts
import path from 'path';
import { loadMarkdown } from './loadMarkdown';

type TaskKey = 'task1' | 'task2';
type BandKey = '6' | '7' | '8';

const base = (...parts: string[]) => path.join('content', ...parts);
const cache = new Map<string, string>();

const readCached = (rel: string): string => {
  if (cache.has(rel)) return cache.get(rel)!;
  const data = loadMarkdown(rel);
  cache.set(rel, data);
  return data;
};

export const getWritingExamples = (task: TaskKey, band: BandKey): string => {
  const rel = base('writing', 'examples', task, `band${band}.md`);
  return readCached(rel);
};

export const getExaminerNotes = (task: TaskKey): string => {
  const rel = base('writing', 'examiner-notes', `${task}.md`);
  return readCached(rel);
};
