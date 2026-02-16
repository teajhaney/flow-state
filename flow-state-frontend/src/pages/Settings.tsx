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
import { Switch } from '../components/ui/Switch';
import { Slider } from '../components/ui/Slider';
import { Moon, Sun, Shield, Volume2, Cpu } from 'lucide-react';
import type { MaskingSound } from '../types';

export const Settings: React.FC = () => {
  const { settings, updateSettings } = useAppStore();

  const maskingSounds: { value: MaskingSound; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'white-noise', label: 'White Noise' },
    { value: 'rain', label: 'Rain' },
    { value: 'forest', label: 'Forest' },
    { value: 'waves', label: 'Ocean Waves' },
  ];

  return (
    <div className="container max-w-5xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="space-y-8">
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
                    Used to detect visual distractions.
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = parseInt(e.target.value);
                    updateSettings({
                      sensitivity:
                        val === 0 ? 'low' : val === 1 ? 'medium' : 'high',
                    });
                  }}
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Higher sensitivity means from precise distraction alerts.
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
            <CardContent>
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
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
           {/* API Integration */}
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 <Cpu size={20} className="text-primary" /> Gemini AI Model
              </CardTitle>
              <CardDescription>
                Required for multimodal reasoning.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

               <div className="space-y-2">
                <label className="text-sm font-medium">Model Selection</label>
                <select
                  className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={settings.geminiModel}
                  onChange={e => updateSettings({ geminiModel: e.target.value })}
                >
                  <optgroup label="Flash (Fast & Efficient)">
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  </optgroup>
                  <optgroup label="Pro (High Reasoning)">
                    <option value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro Experimental</option>
                     <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  </optgroup>
                </select>
                <p className="text-[10px] text-muted-foreground">
                   Flash models are recommended for real-time monitoring.
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
                <span className="text-sm font-medium">Theme Mode</span>
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
        </div>

      </div>
    </div>
  );
};
