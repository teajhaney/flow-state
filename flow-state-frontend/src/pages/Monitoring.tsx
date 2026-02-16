import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store';
import api from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { WebcamPreview } from '../components/WebcamPreview';
import { useMediaStream } from '../hooks/useMediaStream';
import {
  Pause,
  Square,
  AlertTriangle,
  ShieldCheck,
  Play,
  WifiOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

// Free ambient sound URLs (loopable, royalty-free)
const AMBIENT_SOUNDS: Record<string, string> = {
  'white-noise': 'https://cdn.freesound.org/previews/612/612089_5674468-lq.mp3',
  rain: 'https://cdn.freesound.org/previews/531/531947_6237441-lq.mp3',
  forest: 'https://cdn.freesound.org/previews/462/462087_5674468-lq.mp3',
  waves: 'https://cdn.freesound.org/previews/467/467523_5674468-lq.mp3',
};

/**
 * Monitoring Page: The active "Flow State" view.
 * Captures webcam frames every 15 seconds, sends them to the backend
 * for Gemini AI analysis, and displays real-time focus metrics.
 */
export const Monitoring: React.FC = () => {
  const {
    currentTask,
    monitoringStatus,
    setMonitoringStatus,
    setPage,
    settings,
    recentEvents,
    addEvent,
    currentSessionId,
    setSessionId,
  } = useAppStore();

  // Redirect to Dashboard if no active session
  useEffect(() => {
    if (monitoringStatus === 'idle' || !currentTask) {
      setPage('dashboard');
    }
  }, [monitoringStatus, currentTask, setPage]);

  const [seconds, setSeconds] = useState(0);
  const [distractionDetected, setDistractionDetected] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Dynamic Focus Tracking ---
  const [analysisResults, setAnalysisResults] = useState<
    { distracted: boolean; confidence: number; reason: string }[]
  >([]);
  const [lastAnalysis, setLastAnalysis] = useState<string>('Waiting for first analysis...');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // --- Ambient Sound ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);

  // Check if the user has an API key configured
  useEffect(() => {
    setHasApiKey(!!settings.geminiApiKey);
  }, [settings.geminiApiKey]);

  const { stream, startStream, stopStream } = useMediaStream({
    video: settings.webcamEnabled,
    audio: settings.micEnabled,
  });

  // Compute focus score only from SUCCESSFUL analysis results
  const focusScore = useCallback(() => {
    if (analysisResults.length === 0) return 100;
    const focusedCount = analysisResults.filter(r => !r.distracted).length;
    return Math.round((focusedCount / analysisResults.length) * 100);
  }, [analysisResults]);

  // --- Ambient Sound Management ---
  const toggleSound = useCallback(() => {
    if (isSoundPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSoundPlaying(false);
    } else {
      const soundKey = settings.maskingSound;
      if (soundKey === 'none') return;

      const url = AMBIENT_SOUNDS[soundKey];
      if (!url) return;

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0.5;
      audio.play().catch(err => console.error('Audio playback failed:', err));
      audioRef.current = audio;
      setIsSoundPlaying(true);
    }
  }, [isSoundPlaying, settings.maskingSound]);

  // Stop audio when leaving the page or changing sound selection
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // When masking sound changes, stop current playback
  useEffect(() => {
    if (audioRef.current && isSoundPlaying) {
      audioRef.current.pause();
      setIsSoundPlaying(false);
    }
  }, [settings.maskingSound]);

  // --- Real Monitoring Logic ---
  useEffect(() => {
    let timerInterval: any;
    let analysisInterval: any;

    const captureAndAnalyze = async () => {
      if (!stream || !canvasRef.current) return;
      if (isRateLimited) return; // Skip if we know we're rate limited

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack || !videoTrack.enabled) return;

      const videoElement = document.querySelector('video');
      if (!videoElement || videoElement.videoWidth === 0) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Lower quality to reduce payload and token usage
      const base64Image = canvas.toDataURL('image/jpeg', 0.4);

      setIsAnalyzing(true);

      try {
        const response = await api.post('/monitoring/frame', {
          image: base64Image,
          timestamp: new Date().toISOString(),
          apiKey: settings.geminiApiKey || undefined,
          model: settings.geminiModel || undefined,
          sessionId: currentSessionId || undefined,
        });

        const { analysis } = response.data;

        if (analysis) {
          // Only count successful analyses (confidence > 0 means the AI actually responded)
          if (analysis.confidence > 0) {
            setAnalysisResults(prev => [...prev, analysis]);
            setLastAnalysis(analysis.reason || 'No details');
            setIsRateLimited(false);

            if (analysis.distracted && analysis.confidence > 60) {
              handleDistraction(analysis.reason || 'Distraction detected');
            } else if (!analysis.distracted) {
              addEvent({
                timestamp: Date.now(),
                type: 'focus',
                message: analysis.reason || 'Focused and engaged',
              });
            }
          } else {
            // confidence === 0 means analysis failed (could be rate limit or no API key)
            const reason = analysis.reason || '';
            if (reason.toLowerCase().includes('api key')) {
              setLastAnalysis('⚠️ No API key — add one in Settings');
            } else {
              setLastAnalysis('⏳ Rate limited — waiting to retry...');
              setIsRateLimited(true);
              // Auto-retry after 60 seconds
              setTimeout(() => setIsRateLimited(false), 60000);
            }
          }
        }
      } catch (error: any) {
        console.error('Failed to analyze frame:', error);
        if (error?.response?.status === 429) {
          setLastAnalysis('⏳ Rate limited — slowing down...');
          setIsRateLimited(true);
          setTimeout(() => setIsRateLimited(false), 60000);
        } else {
          setLastAnalysis('Analysis failed — check connection');
        }
      } finally {
        setIsAnalyzing(false);
      }
    };

    if (monitoringStatus === 'active') {
      timerInterval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);

      // Analyze every 30 seconds to stay within free-tier limits
      analysisInterval = setInterval(captureAndAnalyze, 30000);

      // First analysis after 3 seconds (camera warm-up)
      const initialTimeout = setTimeout(captureAndAnalyze, 3000);

      return () => {
        clearInterval(timerInterval);
        clearInterval(analysisInterval);
        clearTimeout(initialTimeout);
      };
    }
  }, [monitoringStatus, stream, settings.geminiApiKey, isRateLimited]);

  // --- Hardware Lifecycle ---
  useEffect(() => {
    startStream();
    return () => stopStream();
  }, [startStream, stopStream]);

  const handleDistraction = (msg: string) => {
    setDistractionDetected(true);
    addEvent({
      timestamp: Date.now(),
      type: 'distraction',
      message: msg,
    });
    setTimeout(() => setDistractionDetected(false), 5000);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (currentSessionId) {
      try {
        await api.patch(`/monitoring/sessions/${currentSessionId}/end`);
      } catch (err) {
        console.error('Failed to end session:', err);
      }
      setSessionId(null);
    }

    setMonitoringStatus('idle');
    setPage('dashboard');
  };

  const currentFocusScore = focusScore();

  return (
    <div className="relative h-screen bg-background overflow-hidden flex flex-col">
      {/* Distraction Overlay */}
      <AnimatePresence>
        {distractionDetected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 pointer-events-none border-12 border-destructive/50 flex items-center justify-center bg-destructive/10 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-destructive text-destructive-foreground px-8 py-4 rounded-full shadow-2xl flex items-center gap-3"
            >
              <AlertTriangle size={32} />
              <span className="text-2xl font-bold uppercase tracking-widest">
                Distraction Detected
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No API Key Warning */}
      {!hasApiKey && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-3 flex items-center gap-3">
          <WifiOff size={16} className="text-orange-500" />
          <span className="text-sm text-orange-500">
            No Gemini API key set. Go to{' '}
            <button
              className="underline font-bold"
              onClick={() => setPage('settings')}
            >
              Settings
            </button>{' '}
            to add your key for AI analysis.
          </span>
        </div>
      )}

      {/* Rate Limited Warning */}
      {isRateLimited && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-3 flex items-center gap-3">
          <AlertTriangle size={16} className="text-yellow-500" />
          <span className="text-sm text-yellow-500">
            API rate limit reached. Analysis paused for ~60s. Your session timer continues.
          </span>
        </div>
      )}

      {/* Main Monitoring Content */}
      <div className="flex-1 p-8 flex flex-col gap-8">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-sm font-medium uppercase tracking-widest text-primary/70">
              Focusing on
            </h2>
            <h1 className="text-2xl font-bold">{currentTask}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-4xl font-mono font-bold">
                {formatTime(seconds)}
              </div>
              <div className="text-xs text-muted-foreground">Elapsed Time</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 flex-1">
          {/* Feed & Live Status */}
          <div className="md:col-span-3 space-y-6">
            <div className="relative aspect-video rounded-3xl overflow-hidden border-4 border-muted bg-muted shadow-2xl">
              <WebcamPreview stream={stream} className="w-full h-full" />
              <canvas ref={canvasRef} className="hidden" />

              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10">
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full',
                      isRateLimited
                        ? 'bg-yellow-500'
                        : isAnalyzing
                          ? 'bg-yellow-500 animate-pulse'
                          : 'bg-green-500 animate-pulse'
                    )}
                  />
                  <span className="text-sm font-medium text-white italic">
                    {isRateLimited
                      ? '"Rate limited — paused"'
                      : isAnalyzing
                        ? '"Analyzing frame..."'
                        : `"${lastAnalysis}"`}
                  </span>
                </div>

                {/* Ambient Sound Button */}
                {settings.maskingSound !== 'none' && (
                  <button
                    onClick={toggleSound}
                    className={cn(
                      'backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 border transition-colors cursor-pointer',
                      isSoundPlaying
                        ? 'bg-primary/30 border-primary/50 text-white'
                        : 'bg-black/40 border-white/10 text-white/70 hover:text-white hover:bg-black/60'
                    )}
                  >
                    {isSoundPlaying ? (
                      <Volume2 size={16} />
                    ) : (
                      <VolumeX size={16} />
                    )}
                    <span className="text-sm font-medium capitalize">
                      {isSoundPlaying
                        ? `${settings.maskingSound} playing`
                        : `Play ${settings.maskingSound}`}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card
                className={cn(
                  'border',
                  analysisResults.length === 0
                    ? 'bg-muted/50 border-muted'
                    : currentFocusScore >= 70
                      ? 'bg-primary/5 border-primary/20'
                      : currentFocusScore >= 40
                        ? 'bg-orange-500/5 border-orange-500/20'
                        : 'bg-destructive/5 border-destructive/20'
                )}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div
                    className={cn(
                      'p-2 rounded-full',
                      analysisResults.length === 0
                        ? 'bg-muted text-muted-foreground'
                        : currentFocusScore >= 70
                          ? 'bg-primary/10 text-primary'
                          : currentFocusScore >= 40
                            ? 'bg-orange-500/10 text-orange-500'
                            : 'bg-destructive/10 text-destructive'
                    )}
                  >
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Focus Rating</div>
                    <div className="text-2xl font-bold">
                      {analysisResults.length === 0
                        ? '—'
                        : `${currentFocusScore}%`}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {analysisResults.length === 0
                        ? 'Waiting for AI analysis...'
                        : `${analysisResults.length} analysis${analysisResults.length !== 1 ? 'es' : ''} completed`}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-2 bg-orange-500/10 rounded-full text-orange-500">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Interruptions</div>
                    <div className="text-2xl font-bold">
                      {recentEvents.filter(e => e.type === 'distraction').length}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Events Timeline */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-tighter text-muted-foreground">
              Live Timeline
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {recentEvents.length === 0 ? (
                <div className="text-xs text-muted-foreground italic text-center py-8">
                  No events logged yet. Stay focused!
                </div>
              ) : (
                [...recentEvents]
                  .reverse()
                  .map((event, i) => (
                    <div
                      key={i}
                      className={cn(
                        'p-3 rounded-xl text-xs border animate-in slide-in-from-right',
                        event.type === 'distraction'
                          ? 'bg-destructive/5 border-destructive/20'
                          : 'bg-muted border-transparent'
                      )}
                    >
                      <div className="flex justify-between font-bold mb-1">
                        <span>
                          {new Date(event.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                        <span
                          className={
                            event.type === 'distraction'
                              ? 'text-destructive'
                              : 'text-primary'
                          }
                        >
                          {event.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="opacity-80">{event.message}</p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-center items-center gap-4 pb-4">
          <Button
            variant="secondary"
            size="lg"
            className="w-40 rounded-full"
            onClick={() =>
              setMonitoringStatus(
                monitoringStatus === 'active' ? 'paused' : 'active'
              )
            }
          >
            {monitoringStatus === 'active' ? (
              <>
                <Pause className="mr-2" size={18} /> Pause
              </>
            ) : (
              <>
                <Play className="mr-2" size={18} /> Resume
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="w-40 rounded-full"
            onClick={handleStop}
          >
            <Square className="mr-2" size={18} fill="currentColor" /> Stop
          </Button>
        </div>
      </div>
    </div>
  );
};
