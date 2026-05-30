import { BatchCollectPage } from '../../pages/BatchCollectPage';
import { MockBadge } from '../components/MockBadge';

export function BatchCollectV2Page() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <MockBadge label="v2.2 批量" />
        <span className="text-sm text-muted">榜单 TOP N · Playwright Mock Worker</span>
      </div>
      <BatchCollectPage />
    </div>
  );
}
