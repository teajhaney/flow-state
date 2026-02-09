import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { WebcamPreview } from '../components/WebcamPreview';
import { useMediaStream } from '../hooks/useMediaStream';
import {
  Pause,
  Square,
  AlertTriangle,
  ShieldCheck,
  Music,
  Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

/**
 * Monitoring Page: The active "Flow State" view.
 * Displays a live webcam feed, focus timer, and distraction alerts.
 * In a real scenario, this would send frames to the backend for analysis.
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
  } = useAppStore();

  const [seconds, setSeconds] = useState(0);
  const [distractionDetected, setDistractionDetected] = useState(false);
  const { stream, startStream, stopStream } = useMediaStream({
    video: settings.webcamEnabled,
    audio: settings.micEnabled,
  });

  // --- Timer & Simulation Logic ---
  useEffect(() => {
    let interval: any;
    if (monitoringStatus === 'active') {
      interval = setInterval(() => {
        // Increment the session timer
        setSeconds(s => s + 1);

        // MOCK DISTRACTION: 
        // For demonstration purposes, we trigger a distraction every 30 seconds.
        // In production, this would be triggered by an IPC message from the backend.
        if (seconds > 0 && (seconds + 1) % 30 === 0) {
          handleDistraction('Phone detected in hand!');
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [monitoringStatus, seconds]);

  // --- Hardware Lifecycle ---
  // Request webcam/mic access when entering this page, 
  // and ensure they are disabled when leaving.
  useEffect(() => {
    startStream();
    return () => stopStream();
  }, [startStream, stopStream]);

  /**
   * Triggers the visual alert overlay and logs the event to the store.
   */
  const handleDistraction = (msg: string) => {
    setDistractionDetected(true);
    addEvent({
      timestamp: Date.now(),
      type: 'distraction',
      message: msg,
    });

    // Auto-clear the visual alert after 5 seconds
    setTimeout(() => setDistractionDetected(false), 5000);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    // TODO: Later replace with IPC call to NestJS backend
    // ipcRenderer.invoke('stop-monitoring')

    setMonitoringStatus('idle');
    setPage('dashboard');
  };

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

              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-white italic">
                    "Analyzing multimodal feed..."
                  </span>
                </div>

                {settings.maskingSound !== 'none' && (
                  <div className="bg-primary/20 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 border border-primary/30 text-primary-foreground">
                    <Music size={16} />
                    <span className="text-sm font-medium capitalize">
                      {settings.maskingSound} playing
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Focus Rating</div>
                    <div className="text-2xl font-bold">92%</div>
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
                      {
                        recentEvents.filter(e => e.type === 'distraction')
                          .length
                      }
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
                recentEvents.map((event, i) => (
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
