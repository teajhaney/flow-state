import { useState, useCallback, useEffect, useRef } from 'react';

interface UseMediaStreamOptions {
  video?: boolean;
  audio?: boolean;
}

export function useMediaStream(
  options: UseMediaStreamOptions = { video: true, audio: true }
) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isActive, setIsActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startStream = useCallback(async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: options.video,
        audio: options.audio,
      });
      setStream(newStream);
      streamRef.current = newStream;
      setIsActive(true);
      setError(null);
      return newStream;
    } catch (err) {
      const mediaError =
        err instanceof Error ? err : new Error('Unknown media error');
      setError(mediaError);
      setIsActive(false);
      return null;
    }
  }, [options.video, options.audio]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setStream(null);
      streamRef.current = null;
      setIsActive(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return { stream, error, isActive, startStream, stopStream };
}
