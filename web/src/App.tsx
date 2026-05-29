import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InboxPage } from './pages/InboxPage';
import { WorkbenchPage } from './pages/WorkbenchPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { RulesPage } from './pages/RulesPage';
import { InsightsPage } from './pages/InsightsPage';
import { PublishPage } from './pages/PublishPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuth } from './lib/auth';

export default function App() {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isLoggedIn ? '/app' : '/login'} replace />} />
      <Route path="/login" element={isLoggedIn ? <Navigate to="/app" replace /> : <LoginPage />} />
      <Route
        path="/app"
        element={isLoggedIn ? <AppLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<DashboardPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="workbench/:id" element={<WorkbenchPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="publish" element={<PublishPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={isLoggedIn ? '/app' : '/login'} replace />} />
    </Routes>
  );
}
