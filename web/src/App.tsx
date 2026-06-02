import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { WorkbenchPage } from './pages/workbench/WorkbenchPage';
import { CompetitorsPage } from './pages/competitors/CompetitorsPage';
import { TitleOptimizationPage } from './pages/workbench/TitleOptimizationPage';
import { InboxPage } from './pages/inbox/InboxPage';
import { LinkCollectPage } from './pages/link-collect/LinkCollectPage';
import { BatchCollectPage } from './pages/BatchCollectPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { RulesPage } from './pages/RulesPage';
import { InsightsPage } from './pages/InsightsPage';
import { PublishPage } from './pages/PublishPage';
import { SettingsPage } from './pages/SettingsPage';
import { ThemeSettings } from './components/ThemeSettings';
import { ThemeSettingsV2 } from './lib/ThemeSettingsV2';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { TeamPage } from './pages/TeamPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { useAuth } from './hooks/useAuth';

/**
 * V3.0 完整路由配置
 * 覆盖所有V3需求中的菜单项
 */
export function App() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/app" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/app" replace /> : <RegisterPage />} />

      <Route element={<AppLayout />}>
        {/* 首页/工作台 */}
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/app" element={<DashboardPage />} />

        {/* 选品中心 */}
        <Route path="/app/competitors" element={<CompetitorsPage />} />

        {/* 工作台 */}
        <Route path="/app/title-optimization" element={<TitleOptimizationPage />} />
        <Route path="/app/inbox" element={<InboxPage />} />
        <Route path="/app/link-collect" element={<LinkCollectPage />} />
        <Route path="/app/batch-collect" element={<BatchCollectPage />} />

        {/* 配置中心 */}
        <Route path="/app/templates" element={<TemplatesPage />} />
        <Route path="/app/rules" element={<RulesPage />} />

        {/* 发布中心 */}
        <Route path="/app/insights" element={<InsightsPage />} />
        <Route path="/app/publish" element={<PublishPage />} />

        {/* 系统设置 */}
        <Route path="/app/settings" element={<SettingsPage />} />
        <Route path="/app/settings/themes" element={<ThemeSettingsV2 />} />
        <Route path="/app/integrations" element={<IntegrationsPage />} />
        <Route path="/app/team" element={<TeamPage />} />

        {/* 兜底 */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
