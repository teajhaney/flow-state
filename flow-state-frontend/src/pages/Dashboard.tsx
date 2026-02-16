import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/Card';
import { WebcamPreview } from '../components/WebcamPreview';
import { MicIndicator } from '../components/MicIndicator';
import { Slider } from '../components/ui/Slider';
import { useMediaStream } from '../hooks/useMediaStream';
import { Play, Zap, Trophy, Eye, Clock } from 'lucide-react';
import api from '../lib/api'; // Use default import for api instance
import type { Session } from '../types';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const {
    currentTask,
    setCurrentTask,
    setMonitoringStatus,
    setPage,
    setSessionId,
    settings,
    updateSettings,
  } = useAppStore();

  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState({ totalSessions: 0, avgFlowScore: 0 });

  // Media preview for setup
  const { stream, isActive, startStream, stopStream } = useMediaStream({
    video: settings.webcamEnabled,
    audio: settings.micEnabled,
  });

  // Load session history on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsRes, statsRes] = await Promise.all([
          api.get('/monitoring/sessions'),
          api.get('/monitoring/stats'),
        ]);
        setRecentSessions(sessionsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  // Handle stream cleanup
  useEffect(() => {
    startStream();
    return () => {
      stopStream();
    };
  }, [startStream, stopStream]);

  const handleStartMonitoring = async () => {
    if (!currentTask.trim()) {
      toast.error('Please enter a task objective');
      return;
    }

    try {
      // Create session in backend
      const res = await api.post('/monitoring/sessions', { task: currentTask });
      const sessionId = res.data.id;

      // Update local state and navigate
      setSessionId(sessionId);
      setMonitoringStatus('active');
      setPage('monitoring');
      toast.success('Entering Flow State...');
    } catch (err) {
      console.error('Failed to start session:', err);
      toast.error('Could not start session. Check connection.');
    }
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Quick Start & stats */}
        <div className="flex-1 space-y-6 w-full">
          {/* Quick Start Card */}
          <Card className="border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-xl">Start Focus Session</CardTitle>
              <CardDescription>
                Define your objective and let AI keep you on track.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">I want to...</label>
                <Input
                  autoFocus
                  placeholder="e.g. Finish the API documentation..."
                  value={currentTask}
                  onChange={e => setCurrentTask(e.target.value)}
                  className="text-lg py-6"
                  onKeyDown={e => e.key === 'Enter' && handleStartMonitoring()}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Sensitivity</span>
                    <span className="text-xs text-muted-foreground capitalize font-bold">
                      {settings.sensitivity}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={2}
                    step={1}
                    value={
                      settings.sensitivity === 'low'
                        ? 0
                        : settings.sensitivity === 'medium'
                          ? 1
                          : 2
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const v = parseInt(e.target.value);
                      updateSettings({
                        sensitivity:
                          v === 0 ? 'low' : v === 1 ? 'medium' : 'high',
                      });
                    }}
                  />
                </div>

                <div className="flex items-center justify-end">
                  <Button
                    className="w-full sm:w-auto h-12 text-md gap-2 shadow-md shadow-primary/20 px-8"
                    onClick={handleStartMonitoring}
                    disabled={!currentTask.trim()}
                  >
                    <Play size={18} fill="currentColor" /> Enter Flow
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Total Sessions
                  </p>
                  <h3 className="text-3xl font-bold">{stats.totalSessions}</h3>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full">
                  <Zap size={24} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Avg Focus Score
                  </p>
                  <h3 className="text-3xl font-bold">{stats.avgFlowScore}%</h3>
                </div>
                <div className="p-3 bg-green-500/10 text-green-500 rounded-full">
                  <Trophy size={24} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hardware Check (Compact) */}
          <Card className="overflow-hidden border-muted/40">
            <CardHeader className="py-3 px-4 border-b bg-muted/20">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye size={16} className="text-muted-foreground" /> Hardware
                Check
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative aspect-video bg-black/90 flex items-center justify-center">
              <div className="absolute inset-0">
                <WebcamPreview
                  stream={stream}
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-white flex items-center gap-2 border border-white/10 shadow-lg">
                <MicIndicator stream={stream} />
                <span className="font-medium">
                  {isActive ? 'Camera Active' : 'Initializing...'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: History */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock size={18} /> History
            </h3>
          </div>

          <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
            {recentSessions.length === 0 ? (
              <div className="text-center py-12 px-6 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border/60">
                <p className="font-medium">No sessions yet</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  Start working to build search history!
                </p>
              </div>
            ) : (
              recentSessions.map(session => (
                <Card
                  key={session.id}
                  className="group hover:bg-muted/40 transition-all cursor-default border-muted/60"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <h4 className="font-medium text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {session.task}
                      </h4>
                      <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          (session.focusScore || 0) >= 80
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : (session.focusScore || 0) >= 50
                              ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}
                      >
                        {session.focusScore ?? '-'}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      <span>
                        {new Date(session.startedAt).toLocaleDateString(
                          undefined,
                          {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </span>
                      <span>
                        {session.endedAt
                          ? `${Math.max(1, Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000))}m`
                          : 'Active'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
