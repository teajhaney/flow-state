export type Page = 'dashboard' | 'monitoring' | 'settings';

export type MonitoringStatus = 'idle' | 'active' | 'paused';

export type DistractionLevel = 'low' | 'medium' | 'high';

export type MaskingSound = 'none' | 'white-noise' | 'rain' | 'forest' | 'waves';

export interface AppSettings {
  webcamEnabled: boolean;
  micEnabled: boolean;
  maskingSound: MaskingSound;
  sensitivity: DistractionLevel;
  geminiApiKey: string;
  theme: 'dark' | 'light';
}

export interface MonitoringEvent {
  timestamp: number;
  type: 'distraction' | 'focus';
  message: string;
  data?: any;
}

export interface AppState {
  currentPage: Page;
  monitoringStatus: MonitoringStatus;
  currentTask: string;
  settings: AppSettings;
  recentEvents: MonitoringEvent[];

  // Actions
  setPage: (page: Page) => void;
  setMonitoringStatus: (status: MonitoringStatus) => void;
  setCurrentTask: (task: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addEvent: (event: MonitoringEvent) => void;
  resetEvents: () => void;
}
