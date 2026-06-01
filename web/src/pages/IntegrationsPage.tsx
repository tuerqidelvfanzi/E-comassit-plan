/**
 * 平台集成页面 - V3需求 FR-P
 */
import { useState } from 'react';
import { PageHeader, Card, Button, Badge } from '../components/ui';

const PLATFORMS = [
  {
    id: 'shopee-vn',
    name: 'Shopee 越南',
    flag: '🇻🇳',
    status: 'connected',
    account: 'seller_vn_***',
    lastSync: '2024-01-15 10:30',
  },
  {
    id: 'tiktok-th',
    name: 'TikTok Shop 泰国',
    flag: '🇹🇭',
    status: 'connected',
    account: 'th_seller_***',
    lastSync: '2024-01-15 09:45',
  },
  {
    id: 'shopee-ph',
    name: 'Shopee 菲律宾',
    flag: '🇵🇭',
    status: 'pending',
    account: null,
    lastSync: null,
  },
  {
    id: 'shopee-id',
    name: 'Shopee 印尼',
    flag: '🇮🇩',
    status: 'pending',
    account: null,
    lastSync: null,
  },
];

export function IntegrationsPage() {
  const [platforms, setPlatforms] = useState(PLATFORMS);

  const toggleConnection = (id: string) => {
    setPlatforms(platforms.map(p => 
      p.id === id 
        ? { ...p, status: p.status === 'connected' ? 'pending' : 'connected' }
        : p
    ));
  };

  return (
    <>
      <PageHeader
        title="平台集成"
        desc="管理Shopee/TikTok等目标平台的账号连接"
      />

      <Card className="mb-6">
        <h3 className="font-medium mb-4">已集成的平台</h3>
        <div className="space-y-4">
          {platforms.map(p => (
            <div key={p.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{p.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{p.name}</h4>
                    <Badge tone={p.status === 'connected' ? 'ok' : 'default'}>
                      {p.status === 'connected' ? '已连接' : '未连接'}
                    </Badge>
                  </div>
                  {p.account ? (
                    <p className="text-sm text-muted mt-1">
                      账号: {p.account} · 最后同步: {p.lastSync}
                    </p>
                  ) : (
                    <p className="text-sm text-muted mt-1">点击右侧按钮进行授权连接</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {p.status === 'connected' ? (
                  <>
                    <Button size="sm" variant="outline">同步</Button>
                    <Button size="sm" variant="outline" onClick={() => toggleConnection(p.id)}>断开</Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => toggleConnection(p.id)}>连接</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-medium mb-4">集成说明</h3>
        <div className="space-y-3 text-sm text-muted">
          <p>• Shopee/TikTok账号需要先在对应平台注册卖家账号</p>
          <p>• 连接后可直接将处理完成的商品发布到对应平台</p>
          <p>• 支持同时管理多个平台的多个账号</p>
          <p>• 所有凭证信息使用加密存储，保障账号安全</p>
        </div>
      </Card>
    </>
  );
}

export default IntegrationsPage;
