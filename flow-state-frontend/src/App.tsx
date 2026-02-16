import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAppStore } from './store';
import { useAuthStore } from './store/auth';
import { Dashboard } from './pages/Dashboard';
import { Monitoring } from './pages/Monitoring';
import { Settings } from './pages/Settings';
import Splash from './pages/Splash';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { cn } from './lib/utils';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/splash" replace />;
  }

  return <>{children}</>;
}

import { DashboardLayout } from './components/DashboardLayout';

function MainApp() {
  const { currentPage } = useAppStore();

  let content;
  switch (currentPage) {
    case 'dashboard':
      content = <Dashboard />;
      break;
    case 'monitoring':
      content = <Monitoring />;
      break;
    case 'settings':
      content = <Settings />;
      break;
    default:
      content = <Dashboard />;
  }

  return <DashboardLayout>{content}</DashboardLayout>;
}

function App() {
  const { settings } = useAppStore();
  const checkAuth = useAuthStore(state => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // TODO: WebSocket / IPC listener for real-time events from backend

  return (
    <Router>
      <div
        className={cn(
          'min-h-screen transition-colors duration-300',
          settings.theme === 'dark'
            ? 'bg-zinc-950 text-white'
            : 'bg-slate-50 text-slate-900'
        )}
      >
        <Toaster
          richColors
          position="top-center"
          theme={settings.theme === 'dark' ? 'dark' : 'light'}
        />
        <Routes>
          <Route path="/splash" element={<Splash />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
