export async function parallelQuery<T extends readonly unknown[]>(
  tasks: { [K in keyof T]: () => Promise<T[K]> },
): Promise<{ data: T | null; error: string | null }> {
  try {
    const results = await Promise.all(tasks.map((task) => task()));
    return { data: results as T, error: null };
  } catch (err) {
    console.error('SSR parallel query failed', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
