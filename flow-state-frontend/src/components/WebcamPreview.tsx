import React, { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { Camera, CameraOff } from 'lucide-react';

interface WebcamPreviewProps {
  stream: MediaStream | null;
  className?: string;
}

export const WebcamPreview: React.FC<WebcamPreviewProps> = ({
  stream,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted aspect-video flex items-center justify-center border',
        className
      )}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover mirror"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <CameraOff size={32} />
          <span className="text-xs">Webcam Off</span>
        </div>
      )}
      <div className="absolute top-2 right-2 bg-black/50 p-1 rounded backdrop-blur-sm">
        <Camera size={14} className="text-white" />
      </div>
    </div>
  );
};
