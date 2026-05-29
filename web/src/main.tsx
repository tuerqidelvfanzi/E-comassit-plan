import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { getRouterBasename } from './lib/router';
import { initTheme } from './lib/theme';
import { repairLlmStorage } from './lib/llmProviders';
import { installExtensionBridge } from './lib/api/extensionBridge';
import { QueryProvider } from './providers/QueryProvider';
import './index.css';

initTheme();
repairLlmStorage();
installExtensionBridge();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <BrowserRouter basename={getRouterBasename()}>
        <App />
      </BrowserRouter>
    </QueryProvider>
  </StrictMode>,
);
