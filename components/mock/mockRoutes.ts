export const EXAM_ROUTE_PREFIXES = [
  '/mock/listening/exam',
  '/mock/reading/exam',
  '/mock/writing',
  '/mock/speaking',
];

export const isExamRoute = (pathname: string): boolean =>
  EXAM_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
