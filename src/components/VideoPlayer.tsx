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

    // Prevent seeking forward
    let lastValidTime = currentProgress * video.duration / 100;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;

      if (duration > 0) {
        const currentProgress = (currentTime / duration) * 100;
        setProgress(currentProgress);

        // Only allow seeking backwards or to already watched positions
        if (currentTime > lastValidTime + 1) {
          video.currentTime = lastValidTime;
          return;
        }
        
        lastValidTime = Math.max(lastValidTime, currentTime);

        // Report progress every 5%
        if (Math.floor(currentProgress / 5) > Math.floor(lastReportedProgress.current / 5)) {
          onProgressUpdate(currentProgress);
          lastReportedProgress.current = currentProgress;
        }

        // Mark as complete at 70%
        if (currentProgress >= 70 && !hasCompleted.current) {
          hasCompleted.current = true;
          onComplete();
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (currentProgress > 0) {
        video.currentTime = (currentProgress / 100) * video.duration;
        lastValidTime = video.currentTime;
      }
    };

    const handleSeeking = () => {
      if (video.currentTime > lastValidTime) {
        video.currentTime = lastValidTime;
      }
    };

    // Prevent context menu to avoid download
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('contextmenu', handleContextMenu);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeking', handleSeeking);
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
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={url}
          className="w-full"
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>
      
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>

            <span className="text-sm text-muted-foreground">
              {formatTime((progress / 100) * duration)} / {formatTime(duration)}
            </span>
          </div>

          <span className="text-sm font-medium">
            {progress >= 70 ? "✓ Concluído" : `${Math.floor(progress)}%`}
          </span>
        </div>

        {progress < 70 && (
          <p className="text-xs text-muted-foreground text-center">
            Assista até pelo menos 70% do vídeo para concluí-lo
          </p>
        )}
      </div>
    </div>
  );
};
