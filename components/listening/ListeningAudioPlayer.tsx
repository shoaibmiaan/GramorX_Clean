import * as React from 'react';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

type ListeningAudioPlayerProps = {
  src: string | null;
};

export const ListeningAudioPlayer: React.FC<ListeningAudioPlayerProps> = ({
  src,
}) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [volume, setVolume] = React.useState(0.9);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = React.useState<string | null>(null);

  // Clean up blob URL on unmount
  React.useEffect(() => {
    return () => {
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, [audioBlobUrl]);

  // Fetch audio as blob to avoid CORS issues
  React.useEffect(() => {
    if (!src) {
      setErrorMsg('No audio is attached to this mock (audio_url is missing).');
      return;
    }

    const fetchAudio = async () => {
      try {
        console.log('Fetching audio from:', src);
        setErrorMsg(null);
        setIsReady(false);

        // Try to fetch the audio as a blob
        const response = await fetch(src, {
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': 'audio/*',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();

        // Check if blob has audio content
        if (!blob.type.startsWith('audio/')) {
          throw new Error('File is not an audio file');
        }

        const blobUrl = URL.createObjectURL(blob);
        setAudioBlobUrl(blobUrl);

        // Create audio element
        const audio = new Audio();
        audio.src = blobUrl;
        audio.preload = 'metadata';

        // Wait for metadata to load
        await new Promise<void>((resolve, reject) => {
          const onLoadedMetadata = () => {
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('error', onError);
            resolve();
          };

          const onError = (e: Event) => {
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('error', onError);
            reject(audio.error || new Error('Failed to load audio'));
          };

          audio.addEventListener('loadedmetadata', onLoadedMetadata);
          audio.addEventListener('error', onError);
          audio.load();

          // Timeout after 10 seconds
          setTimeout(() => {
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('error', onError);
            reject(new Error('Audio loading timeout'));
          }, 10000);
        });

        // Set audio reference
        audioRef.current = audio;

        // Get duration
        const d = Number.isFinite(audio.duration) ? audio.duration : 0;
        setDuration(d);

        // Set up event listeners
        const handleTimeUpdate = () => {
          setCurrentTime(audio.currentTime || 0);
        };

        const handleEnded = () => {
          setIsPlaying(false);
          setCurrentTime(d);
        };

        const handleError = (e: Event) => {
          console.error('Audio playback error:', audio.error);
          setErrorMsg(`Audio error: ${audio.error?.message || 'Unknown error'}`);
          setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        setIsReady(true);
        console.log('Audio loaded successfully, duration:', d);

      } catch (err) {
        console.error('Failed to load audio:', err);
        setErrorMsg(`Failed to load audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsReady(false);
      }
    };

    fetchAudio();
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;

    if (!audio || !isReady) {
      setErrorMsg('Audio not ready. Please wait or try again.');
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        // Reset to beginning if at the end
        if (audio.ended || audio.currentTime >= audio.duration - 0.5) {
          audio.currentTime = 0;
        }

        // Play audio
        await audio.play();
        setIsPlaying(true);
        setErrorMsg(null);
      }
    } catch (err) {
      console.error('Playback error:', err);

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setErrorMsg('Playback blocked. Click play again to allow audio.');
        } else {
          setErrorMsg(`Playback failed: ${err.message}`);
        }
      } else {
        setErrorMsg('Playback failed. Please try again.');
      }

      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || duration <= 0) return;
    const value = Number(e.target.value);
    const newTime = (value / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const value = Number(e.target.value);
    setVolume(value);
    if (audio) {
      audio.volume = value;
    }
  };

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) secs = 0;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const mm = m < 10 ? `0${m}` : `${m}`;
    const ss = s < 10 ? `0${s}` : `${s}`;
    return `${mm}:${ss}`;
  };

  const disableControls = !src || !!errorMsg || !isReady;

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const retryAudio = () => {
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    setAudioBlobUrl(null);
    setIsReady(false);
    setErrorMsg(null);
    // Trigger re-fetch by updating a state
    // The useEffect will re-run because audioBlobUrl changed
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card/95 px-3 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="Headphones" className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Listening audio
            </p>
            <p className="text-[11px] text-muted-foreground/80">
              Plays once · Use the controls below carefully.
            </p>
          </div>
        </div>

        <Button
          tone="primary"
          size="icon-sm"
          type="button"
          onClick={togglePlay}
          disabled={disableControls}
        >
          <Icon
            name={isPlaying ? 'pause' : 'play'}
            className="h-4 w-4"
          />
        </Button>
      </div>

      {!src && (
        <p className="text-[11px] text-destructive">
          No audio is attached to this mock (audio_url is missing).
        </p>
      )}

      {src && (
        <>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || 0)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={progressPercent}
              disabled={!isReady || !!errorMsg}
              onChange={handleSeek}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Icon name="Volume2" className="h-3.5 w-3.5" />
              <span>Volume</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolume}
              className="h-2 w-24 cursor-pointer appearance-none rounded-full bg-muted"
            />
          </div>
        </>
      )}

      {errorMsg && (
        <div className="mt-2 space-y-2">
          <p className="text-[11px] text-destructive">
            {errorMsg}
          </p>
          <div className="flex gap-2">
            <Button
              size="xs"
              variant="outline"
              className="text-[11px]"
              onClick={retryAudio}
            >
              <Icon name="RefreshCw" className="mr-1 h-3 w-3" />
              Retry Loading Audio
            </Button>
            {src && (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-primary hover:underline"
              >
                Open audio in new tab
              </a>
            )}
          </div>
        </div>
      )}

      {!isReady && !errorMsg && src && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Icon name="Loader2" className="h-3.5 w-3.5 animate-spin" />
          <span>Loading audio...</span>
        </div>
      )}

      {process.env.NODE_ENV === 'development' && src && (
        <div className="mt-2 border-t border-border/50 pt-2">
          <p className="text-[10px] text-muted-foreground">
            <strong>URL:</strong> {src.substring(0, 50)}...
          </p>
          <p className="text-[10px] text-muted-foreground">
            <strong>Status:</strong> {isReady ? 'Ready' : 'Loading'} | {errorMsg ? 'Error' : 'OK'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ListeningAudioPlayer;