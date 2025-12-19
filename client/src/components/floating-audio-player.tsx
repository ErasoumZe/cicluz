import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

import {
  ChevronDown,
  ChevronUp,
  Music2,
  Pause,
  Play,
  Volume2,
} from "lucide-react";

const LOCAL_AUDIO_SRC = "/music.mp3";

type AudioSource = "local" | "spotify";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function FloatingAudioPlayer() {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [source, setSource] = useState<AudioSource>("local");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([60]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [progress, setProgress] = useState([0]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, volume[0] / 100));
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () => {
      const nextTime = audio.currentTime || 0;
      setCurrentTime(nextTime);
      if (audio.duration) {
        setProgress([Math.min(100, (nextTime / audio.duration) * 100)]);
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, []);

  useEffect(() => {
    if (source !== "spotify") return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
  }, [source]);

  const togglePlayback = async () => {
    if (source !== "local") {
      toast({
        title: "Spotify em breve",
        description: "Integracao com Spotify sera adicionada em breve.",
      });
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        toast({
          title: "Nao foi possivel iniciar o audio",
          description: "Verifique o arquivo em public e tente novamente.",
          variant: "destructive",
        });
      }
      return;
    }

    audio.pause();
  };

  const handleSourceChange = (nextSource: AudioSource) => {
    if (nextSource === "spotify") {
      toast({
        title: "Spotify em breve",
        description: "Integracao com Spotify sera adicionada em breve.",
      });
    }
    setSource(nextSource);
  };

  const handleSeek = (nextValue: number[]) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const nextTime = (nextValue[0] / 100) * audio.duration;
    audio.currentTime = nextTime;
    setProgress(nextValue);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`relative overflow-hidden rounded-[28px] border border-border/60 bg-background/70 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${
          isExpanded ? "w-[320px]" : "w-[180px]"
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-cicluz-gradient opacity-90" />

        <div className="flex items-center gap-3 px-4 pt-4">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cicluz-gradient text-white shadow-[0_8px_18px_rgba(0,0,0,0.35)]">
            <Music2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Musica ambiente</p>
            <p className="text-xs text-muted-foreground">
              {source === "local" ? "Fonte local" : "Spotify (em breve)"}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isExpanded ? (
          <div className="px-4 pb-4 pt-3 space-y-3">
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                className="h-11 w-11 rounded-full bg-cicluz-gradient text-white shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
                onClick={togglePlayback}
                disabled={source !== "local"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <div className="flex-1">
                <Slider value={progress} onValueChange={handleSeek} max={100} step={1} />
                <div className="mt-1 flex items-center justify-between text-[0.7rem] text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider value={volume} onValueChange={setVolume} max={100} step={1} />
            </div>

            <div className="flex items-center gap-1 rounded-full bg-muted/40 p-1">
              <Button
                size="sm"
                className="h-7 flex-1 rounded-full"
                variant={source === "local" ? "default" : "ghost"}
                onClick={() => handleSourceChange("local")}
              >
                Local
              </Button>
              <Button
                size="sm"
                className="h-7 flex-1 rounded-full"
                variant={source === "spotify" ? "default" : "ghost"}
                onClick={() => handleSourceChange("spotify")}
              >
                Spotify
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 pb-4 pt-3">
            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-cicluz-gradient text-white shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
              onClick={togglePlayback}
              disabled={source !== "local"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{formatTime(currentTime)}</p>
              <Slider value={progress} onValueChange={handleSeek} max={100} step={1} />
            </div>
          </div>
        )}
      </div>

      <audio ref={audioRef} src={LOCAL_AUDIO_SRC} preload="metadata" />
    </div>
  );
}
