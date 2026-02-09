import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Page, MonitoringStatus, AppSettings, MonitoringEvent } from '../types';

const defaultSettings: AppSettings = {
  webcamEnabled: true,
  micEnabled: true,
  maskingSound: 'none',
  sensitivity: 'medium',
  geminiApiKey: '',
  theme: 'dark',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentPage: 'dashboard',
      monitoringStatus: 'idle',
      currentTask: '',
      settings: defaultSettings,
      recentEvents: [],

      setPage: (page: Page) => set({ currentPage: page }),
      
      setMonitoringStatus: (status: MonitoringStatus) => set({ monitoringStatus: status }),
      
      setCurrentTask: (task: string) => set({ currentTask: task }),
      
      updateSettings: (newSettings: Partial<AppSettings>) => 
        set((state) => ({ 
          settings: { ...state.settings, ...newSettings } 
        })),
        
      addEvent: (event: MonitoringEvent) => 
        set((state) => ({ 
          recentEvents: [event, ...state.recentEvents].slice(0, 50) 
        })),
        
      resetEvents: () => set({ recentEvents: [] }),
    }),
    {
      name: 'flow-state-storage',
      partialize: (state) => ({ settings: state.settings }), // Only persist settings
    }
  )
);
