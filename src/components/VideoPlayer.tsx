import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface VideoPlayerProps {
  url: string;
  onProgressUpdate: (percentage: number) => void;
  onComplete: () => void;
  currentProgress?: number;
}

export const VideoPlayer = ({ url, onProgressUpdate, onComplete, currentProgress = 0 }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(currentProgress);
  const [duration, setDuration] = useState(0);
  const lastReportedProgress = useRef(0);
  const hasCompleted = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;

      if (duration > 0) {
        const currentProgress = (currentTime / duration) * 100;
        setProgress(currentProgress);

        // Report progress every 5%
        if (Math.floor(currentProgress / 5) > Math.floor(lastReportedProgress.current / 5)) {
          onProgressUpdate(currentProgress);
          lastReportedProgress.current = currentProgress;
        }

        // Mark as complete at 95%
        if (currentProgress >= 95 && !hasCompleted.current) {
          hasCompleted.current = true;
          onComplete();
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (currentProgress > 0) {
        video.currentTime = (currentProgress / 100) * video.duration;
      }
    };

    // Prevent context menu to avoid download
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('contextmenu', handleContextMenu);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onProgressUpdate, onComplete, currentProgress]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={url}
          className="w-full aspect-video"
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>
      
      <div className="space-y-2">
        <Progress value={progress} className="h-1.5 md:h-2" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 md:h-10 md:w-10"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-3 w-3 md:h-4 md:w-4" /> : <Play className="h-3 w-3 md:h-4 md:w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 md:h-10 md:w-10"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-3 w-3 md:h-4 md:w-4" /> : <Volume2 className="h-3 w-3 md:h-4 md:w-4" />}
            </Button>

            <span className="text-xs md:text-sm text-muted-foreground">
              {formatTime((progress / 100) * duration)} / {formatTime(duration)}
            </span>
          </div>

          <span className="text-xs md:text-sm font-medium">
            {progress >= 95 ? "✓ Concluído" : `${Math.floor(progress)}%`}
          </span>
        </div>
      </div>
    </div>
  );
};
