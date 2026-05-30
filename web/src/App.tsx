import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';
import {
  DashboardV2Page,
  CompetitorsPage,
  InboxV2Page,
  LinkCollectPage,
  BatchCollectV2Page,
  WorkbenchV2Page,
  TemplatesV2Page,
  RulesV2Page,
  InsightsV2Page,
  PublishV2Page,
  IntegrationsPage,
  TeamPage,
} from './v2/pages';
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
        <Route index element={<DashboardV2Page />} />
        <Route path="competitors" element={<CompetitorsPage />} />
        <Route path="inbox" element={<InboxV2Page />} />
        <Route path="link-collect" element={<LinkCollectPage />} />
        <Route path="batch-collect" element={<BatchCollectV2Page />} />
        <Route path="workbench/:id" element={<WorkbenchV2Page />} />
        <Route path="templates" element={<TemplatesV2Page />} />
        <Route path="rules" element={<RulesV2Page />} />
        <Route path="insights" element={<InsightsV2Page />} />
        <Route path="publish" element={<PublishV2Page />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={isLoggedIn ? '/app' : '/login'} replace />} />
    </Routes>
  );
}
