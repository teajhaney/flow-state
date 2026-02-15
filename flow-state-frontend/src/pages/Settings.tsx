import React from 'react';
import { useAppStore } from '../store';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/Card';
import { Switch } from '../components/ui/Switch';
import { Slider } from '../components/ui/Slider';
import { ChevronLeft, Moon, Sun, Shield, Volume2 } from 'lucide-react';
import type { MaskingSound } from '../types';

export const Settings: React.FC = () => {
  const { setPage, settings, updateSettings } = useAppStore();

  const maskingSounds: { value: MaskingSound; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'white-noise', label: 'White Noise' },
    { value: 'rain', label: 'Rain' },
    { value: 'forest', label: 'Forest' },
    { value: 'waves', label: 'Ocean Waves' },
  ];

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPage('dashboard')}
        >
          <ChevronLeft size={24} />
        </Button>
        <h1 className="text-3xl font-bold">Settings</h1>
      </header>

      <div className="space-y-6">
        {/* Hardware & Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} className="text-primary" /> Monitoring & Sensors
            </CardTitle>
            <CardDescription>
              Configure how Flow State monitors your environment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Webcam Monitoring</div>
                <div className="text-xs text-muted-foreground">
                  Used to detect visual distractions (phone, looking away).
                </div>
              </div>
              <Switch
                checked={settings.webcamEnabled}
                onCheckedChange={val => updateSettings({ webcamEnabled: val })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Microphone Monitoring</div>
                <div className="text-xs text-muted-foreground">
                  Used to detect noise-based distractions.
                </div>
              </div>
              <Switch
                checked={settings.micEnabled}
                onCheckedChange={val => updateSettings({ micEnabled: val })}
              />
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">AI Sensitivity</span>
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
                onChange={e => {
                  const val = parseInt(e.target.value);
                  updateSettings({
                    sensitivity:
                      val === 0 ? 'low' : val === 1 ? 'medium' : 'high',
                  });
                }}
              />
              <p className="text-[10px] text-muted-foreground italic">
                Higher sensitivity means more frequent distraction alerts.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Audio Masking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 size={20} className="text-primary" /> Audio Masking
            </CardTitle>
            <CardDescription>
              Play soothing sounds to drown out distractions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {maskingSounds.map(sound => (
                <Button
                  key={sound.value}
                  variant={
                    settings.maskingSound === sound.value
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => updateSettings({ maskingSound: sound.value })}
                  className="justify-start truncate"
                >
                  {sound.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* API Integration */}
        <Card>
          <CardHeader>
            <CardTitle>Gemini API</CardTitle>
            <CardDescription>
              Required for multimodal reasoning and distraction analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <Input
                type="password"
                placeholder="Paste your Gemini API key here..."
                value={settings.geminiApiKey}
                onChange={e => updateSettings({ geminiApiKey: e.target.value })}
              />
              <p className="text-[10px] text-muted-foreground">
                Your key is stored locally in your app data.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Theme</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateSettings({
                    theme: settings.theme === 'dark' ? 'light' : 'dark',
                  })
                }
                className="gap-2"
              >
                {settings.theme === 'dark' ? (
                  <>
                    <Moon size={16} /> Dark
                  </>
                ) : (
                  <>
                    <Sun size={16} /> Light
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="pt-8 text-center text-xs text-muted-foreground space-y-4">
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={() => useAuthStore.getState().logout()}
          >
            Sign Out
          </Button>
          <div>
            <p>Flow State v1.0.0-beta</p>
            <p>© 2026 SeobiLabs</p>
          </div>
        </div>
      </div>
    </div>
  );
};
