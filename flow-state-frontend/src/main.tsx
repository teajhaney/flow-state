import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupInterceptors } from './lib/api';
import { useAuthStore } from './store/auth';

// Setup API interceptors with the store to avoid circular dependency
setupInterceptors(useAuthStore);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
