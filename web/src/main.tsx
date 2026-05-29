import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { getRouterBasename } from './lib/router';
import { initTheme } from './lib/theme';
import { repairLlmStorage } from './lib/llmProviders';
import './index.css';

initTheme();
repairLlmStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={getRouterBasename()}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
