import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface MicIndicatorProps {
  stream: MediaStream | null;
  className?: string;
}

export const MicIndicator: React.FC<MicIndicatorProps> = ({
  stream,
  className,
}) => {
  const [level, setLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setLevel(0);
      return;
    }

    const audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    source.connect(analyser);
    analyser.fftSize = 256;

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      setLevel(Math.min(100, Math.round((average / 128) * 100)));

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();

    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stream]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {stream && stream.getAudioTracks().length > 0 ? (
        <Mic size={16} className="text-primary" />
      ) : (
        <MicOff size={16} className="text-muted-foreground" />
      )}
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-75"
          style={{ width: `${level}%` }}
        />
      </div>
      <span className="text-[10px] w-6 text-right tabular-nums text-muted-foreground">
        {level}%
      </span>
    </div>
  );
};
