import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import './i18n';
import App from './App';
import './index.css';
import { initJitterRadar } from './utils/jitterRadar';

// 启动全局抖动侦测雷达
initJitterRadar();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
