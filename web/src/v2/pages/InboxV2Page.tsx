/** v2 采集箱：复用 v1 列表能力，统一 v2 壳层 */
import { InboxPage } from '../../pages/InboxPage';
import { MockBadge } from '../components/MockBadge';

export function InboxV2Page() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <MockBadge label="v2.0 采集" />
        <span className="text-sm text-muted">插件 / 链接直采 / 批量榜单入库</span>
      </div>
      <InboxPage />
    </div>
  );
}
