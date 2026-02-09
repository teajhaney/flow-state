import React from 'react';
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
import { Play, Settings as SettingsIcon, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    currentTask,
    setCurrentTask,
    setMonitoringStatus,
    setPage,
    settings,
    updateSettings,
  } = useAppStore();

  const { stream, startStream, stopStream, isActive } = useMediaStream({
    video: settings.webcamEnabled,
    audio: settings.micEnabled,
  });

  const handleStartMonitoring = () => {
    if (!currentTask.trim()) return;

    // TODO: Later replace with IPC call to NestJS backend (main process)
    // ipcRenderer.invoke('start-monitoring', { task: currentTask, settings })

    setMonitoringStatus('active');
    setPage('monitoring');
  };

  const togglePreview = async () => {
    if (isActive) {
      stopStream();
    } else {
      await startStream();
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Flow State</h1>
          <p className="text-muted-foreground">Your AI distraction co-pilot.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setPage('settings')}>
          <SettingsIcon size={24} />
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Session Setup</CardTitle>
            <CardDescription>
              What are you focusing on right now?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Objective</label>
              <Input
                placeholder="e.g. Refactoring the auth layer..."
                value={currentTask}
                onChange={e => setCurrentTask(e.target.value)}
                className="text-lg py-6"
              />
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Detection Sensitivity
                </span>
                <span className="text-xs text-muted-foreground capitalize">
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
                onChange={e => {
                  const val = parseInt(e.target.value);
                  updateSettings({
                    sensitivity:
                      val === 0 ? 'low' : val === 1 ? 'medium' : 'high',
                  });
                }}
              />
            </div>

            <Button
              className="w-full h-14 text-lg gap-2 mt-6"
              disabled={!currentTask.trim()}
              onClick={handleStartMonitoring}
            >
              <Play size={20} fill="currentColor" />
              Enter Flow State
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preview</CardTitle>
            <Button variant="ghost" size="sm" onClick={togglePreview}>
              {isActive ? 'Hide' : 'Show'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <WebcamPreview stream={stream} className="w-full" />
            <MicIndicator stream={stream} />

            <div className="pt-4 space-y-2 border-t text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Status</span>
                <span className="flex items-center gap-1 text-green-500">
                  <Activity size={10} /> Ready
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hardware</span>
                <span>Camera + Mic</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="text-center text-xs text-muted-foreground pt-12">
        <p>Your data stays local. Multimodal analysis powered by Gemini API.</p>
      </footer>
    </div>
  );
};
