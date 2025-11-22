// lib/listening/audio.ts

/**
 * Resolve the final audio URL for a listening test.
 *
 * - If the key is already an absolute URL → return it.
 * - Else, treat it as a storage key and prepend a configurable base.
 *
 * You can wire this to Supabase storage signed URLs later if needed.
 */
export function resolveListeningAudioUrl(storageKey: string | null): string | null {
  if (!storageKey) return null;

  const trimmed = storageKey.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const base =
    process.env.NEXT_PUBLIC_LISTENING_AUDIO_BASE_URL ??
    '';

  if (!base) {
    // Fallback: let Next.js route / public asset handle it
    return `/${trimmed.replace(/^\/+/, '')}`;
  }

  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedKey = trimmed.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedKey}`;
}

/**
 * Best-effort browser-only audio preload helper.
 * Safe to call from client components/hooks.
 */
export async function preloadListeningAudio(url: string | null): Promise<HTMLAudioElement | null> {
  if (!url) return null;
  if (typeof window === 'undefined') return null;

  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = url;
    audio.preload = 'auto';

    const onCanPlayThrough = () => {
      cleanup();
      resolve(audio);
    };

    const onError = () => {
      cleanup();
      reject(new Error('Failed to preload audio'));
    };

    const cleanup = () => {
      audio.removeEventListener('canplaythrough', onCanPlayThrough);
      audio.removeEventListener('error', onError);
    };

    audio.addEventListener('canplaythrough', onCanPlayThrough);
    audio.addEventListener('error', onError);
    audio.load();
  });
}
