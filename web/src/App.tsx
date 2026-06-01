import { useState } from 'react';
import { AppLayout } from './components/AppLayout';
import { SettingsPage } from './pages/SettingsPage';
import { InboxPage } from './pages/inbox/InboxPage';
import { WorkbenchPage } from './pages/workbench/WorkbenchPage';
import { ThemeSettings } from './components/ThemeSettings';

type Page = 'inbox' | 'workbench' | 'settings' | 'themes';

export function App() {
  const [currentPage, setCurrentPage] = useState<Page>('workbench');

  const renderPage = () => {
    switch (currentPage) {
      case 'inbox':
        return <InboxPage />;
      case 'workbench':
        return <WorkbenchPage />;
      case 'settings':
        return <SettingsPage />;
      case 'themes':
        return <ThemeSettings />;
      default:
        return <WorkbenchPage />;
    }
  };

  return (
    <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </AppLayout>
  );
}

export default App;
