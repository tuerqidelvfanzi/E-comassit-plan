import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { getRouterBasename } from './lib/router';
import { initTheme } from './lib/theme';
import { initThemeV2 } from './lib/theme-v2';
import { repairLlmStorage } from './lib/llmProviders';
import { installExtensionBridge } from './lib/api/extensionBridge';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './hooks/useAuth';
import './index.css';

// 初始化主题系统 v2（会覆盖旧主题）
initThemeV2();
repairLlmStorage();
installExtensionBridge();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter basename={getRouterBasename()}>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  </StrictMode>,
);
