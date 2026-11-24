import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Dashboard from './Dashboard';
import { LoadingProvider } from './LoadingOverlay';
import './styles.css';
import './loading-featured.css';

const path = window.location.pathname.replace(/\/$/, '');
const screen = path === '/admin' ? <Dashboard area="admin" /> : path === '/staff' ? <Dashboard area="staff" /> : <App />;

createRoot(document.getElementById('root')).render(
  <React.StrictMode><LoadingProvider>{screen}</LoadingProvider></React.StrictMode>,
);
