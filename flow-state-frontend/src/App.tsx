import { useEffect } from 'react';
import { useAppStore } from './store';
import { Dashboard } from './pages/Dashboard';
import { Monitoring } from './pages/Monitoring';
import { Settings } from './pages/Settings';
import { cn } from './lib/utils';

function App() {
  const { currentPage, settings } = useAppStore();

  // Apply theme class to body
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // TODO: WebSocket / IPC listener for real-time events from backend
  // useEffect(() => {
  //   if (window.ipcRenderer) {
  //     const removeListener = window.ipcRenderer.on('distraction-detected', (event, data) => {
  //       useAppStore.getState().addEvent({
  //         timestamp: Date.now(),
  //         type: 'distraction',
  //         message: data.message
  //       });
  //     });
  //     return () => removeListener();
  //   }
  // }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'monitoring':
        return <Monitoring />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-300',
        settings.theme === 'dark'
          ? 'bg-background text-foreground'
          : 'bg-slate-50 text-slate-900'
      )}
    >
      {renderPage()}
    </div>
  );
}

export default App;
