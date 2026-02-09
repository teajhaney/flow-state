import { useState, useCallback, useEffect, useRef } from 'react';

interface UseMediaStreamOptions {
  video?: boolean;
  audio?: boolean;
}

/**
 * Custom hook to manage webcam and microphone streams.
 * Handles initialization, active status tracking, and proper cleanup.
 */
export function useMediaStream(
  options: UseMediaStreamOptions = { video: true, audio: true }
) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isActive, setIsActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Requests permissions and starts the media stream based on provided options.
   */
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
      console.error('Failed to start media stream:', mediaError);
      setError(mediaError);
      setIsActive(false);
      return null;
    }
  }, [options.video, options.audio]);

  /**
   * Stops all tracks in the current stream and resets state.
   */
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      // Must stop each individual track (video/audio) to release the hardware
      streamRef.current.getTracks().forEach(track => track.stop());
      setStream(null);
      streamRef.current = null;
      setIsActive(false);
    }
  }, []);

  // Ensure hardware is released when the component using this hook unmounts
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return { stream, error, isActive, startStream, stopStream };
}
