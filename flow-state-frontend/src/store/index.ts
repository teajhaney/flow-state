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

/**
 * Global application store using Zustand.
 * Handles navigation, monitoring status, and user settings.
 * Settings are persisted to localStorage so they survive app restarts.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // --- Initial State ---
      currentPage: 'dashboard',
      monitoringStatus: 'idle',
      currentTask: '',
      settings: defaultSettings,
      recentEvents: [],

      // --- Actions ---
      
      /**
       * Updates the current active page in the UI.
       */
      setPage: (page: Page) => set({ currentPage: page }),
      
      /**
       * Updates the monitoring state (idle, active, or paused).
       */
      setMonitoringStatus: (status: MonitoringStatus) => set({ monitoringStatus: status }),
      
      /**
       * Sets the name/description of the current focus task.
       */
      setCurrentTask: (task: string) => set({ currentTask: task }),
      
      /**
       * Merges new settings into the existing settings object.
       */
      updateSettings: (newSettings: Partial<AppSettings>) => 
        set((state) => ({ 
          settings: { ...state.settings, ...newSettings } 
        })),
        
      /**
       * Adds a new monitoring event (e.g. distraction detected) to the history.
       * Keeps only the 50 most recent events to prevent memory bloat.
       */
      addEvent: (event: MonitoringEvent) => 
        set((state) => ({ 
          recentEvents: [event, ...state.recentEvents].slice(0, 50) 
        })),
        
      /**
       * Clears the event timeline.
       */
      resetEvents: () => set({ recentEvents: [] }),
    }),
    {
      name: 'flow-state-storage',
      // Only settings are persisted; transient state like monitoring status is reset on boot.
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
