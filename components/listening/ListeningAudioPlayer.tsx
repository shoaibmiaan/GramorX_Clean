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

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoaded = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(audio.duration || 0);
    };

    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Audio playback blocked or failed', err);
    }
  };

  const handleSeek: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Number(event.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolume: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const newVolume = Number(event.target.value);
    setVolume(newVolume);
  };

  const formatTime = (value: number) => {
    if (!Number.isFinite(value)) return '00:00';
    const mins = Math.floor(value / 60)
      .toString()
      .padStart(2, '0');
    const secs = Math.floor(value % 60)
      .toString()
      .padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const disableControls = !src;
  const safeDuration = Number.isFinite(duration) ? duration : 0;
  const progressMax = safeDuration > 0 ? safeDuration : 0;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background/90 px-3 py-2 shadow-sm">
      <audio
        ref={audioRef}
        src={src ?? undefined}
        preload="metadata"
        className="hidden"
      />

      {!src ? (
        <div className="text-xs text-muted-foreground">
          Audio not configured for this test. Please upload a listening audio
          file to Supabase and set <span className="font-mono">audio_url</span>.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
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

            <div className="flex flex-1 flex-col gap-1">
              <input
                type="range"
                min={0}
                max={progressMax || 0}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(safeDuration)}</span>
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <Icon
                name="volume-2"
                className="h-4 w-4 text-muted-foreground"
              />
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
          </div>
        </>
      )}
    </div>
  );
};
