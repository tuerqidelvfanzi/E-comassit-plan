/**
 * 链接直采页面 - V3需求 FR-C-02
 */
import { useState } from 'react';
import { PageHeader, Card, Button, Input, Badge } from '../../components/ui';

const QUICK_URLS = [
  { label: '1688商品', placeholder: 'https://detail.1688.com/offer/xxx.html' },
  { label: '淘宝商品', placeholder: 'https://item.taobao.com/item.htm?id=xxx' },
  { label: '天猫商品', placeholder: 'https://detail.tmall.com/item.htm?id=xxx' },
  { label: '拼多多商品', placeholder: 'https://mobile.yangkeduo.com/goods.html?goods_id=xxx' },
];

export function LinkCollectPage() {
  const [url, setUrl] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectResult, setCollectResult] = useState<any>(null);

  const detectPlatform = (url: string) => {
    if (url.includes('1688.com')) return '1688';
    if (url.includes('tmall.com')) return '天猫';
    if (url.includes('taobao.com')) return '淘宝';
    if (url.includes('yangkeduo.com') || url.includes('pinduoduo')) return '拼多多';
    return null;
  };

  const handleCollect = async () => {
    if (!url.trim()) return;
    const platform = detectPlatform(url);
    if (!platform) {
      alert('无法识别平台，请输入有效的1688/淘宝/天猫/拼多多链接');
      return;
    }
    setIsCollecting(true);
    setCollectResult(null);
    // 模拟采集过程
    await new Promise(r => setTimeout(r, 2500));
    setCollectResult({
      success: true,
      platform,
      title: '2024夏季新款可爱卡通小熊图案印花纯棉短袖T恤儿童百搭休闲上衣',
      price: 29.9,
      images: [
        'https://placehold.co/200x200/pink/white?text=主图',
        'https://placehold.co/200x200/blue/white?text=图2',
        'https://placehold.co/200x200/green/white?text=图3',
      ],
      skuCount: 12,
      category: 'T恤',
    });
    setIsCollecting(false);
  };

  const platform = detectPlatform(url);

  return (
    <>
      <PageHeader
        title="链接直采"
        desc="粘贴商品链接，后台自动抓取商品信息"
        action={
          <Badge tone={platform ? 'ok' : 'default'}>
            {platform ? `检测到: ${platform}` : '等待输入链接'}
          </Badge>
        }
      />

      {/* 快速链接 */}
      <Card className="mb-6">
        <h3 className="text-sm font-medium mb-3">快速链接</h3>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {QUICK_URLS.map(q => (
            <div key={q.label} className="p-2 bg-muted/50 rounded-lg text-sm">
              <p className="text-muted">{q.label}</p>
              <p className="text-xs mt-1 truncate">{q.placeholder}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 链接输入 */}
      <Card className="mb-6">
        <h3 className="text-sm font-medium mb-3">输入商品链接</h3>
        <div className="flex gap-3">
          <Input
            placeholder="粘贴1688/淘宝/天猫/拼多多商品链接"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleCollect} disabled={isCollecting || !url.trim()}>
            {isCollecting ? '采集中...' : '🚀 开始采集'}
          </Button>
        </div>
        <div className="mt-3 text-xs text-muted">
          <p>支持平台: 1688 · 淘宝 · 天猫 · 拼多多</p>
          <p>提示: 复杂的商品详情页可能需要更长的采集时间</p>
        </div>
      </Card>

      {/* 采集进度 */}
      {isCollecting && (
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="animate-spin text-2xl">⏳</div>
            <div className="flex-1">
              <p className="font-medium">正在采集商品...</p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4 text-center text-xs text-muted">
            <div>✓ 访问目标页面</div>
            <div>✓ 解析商品数据</div>
            <div>○ 保存到采集箱</div>
          </div>
        </Card>
      )}

      {/* 采集结果 */}
      {collectResult && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">✅</span>
            <h3 className="font-medium">采集成功</h3>
            <Badge tone="ok">{collectResult.platform}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted mb-1">商品标题</p>
              <p className="font-medium">{collectResult.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted mb-1">价格</p>
              <p className="font-medium">¥{collectResult.price}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted mb-2">商品图片 ({collectResult.images.length}张)</p>
            <div className="flex gap-2">
              {collectResult.images.map((img: string, i: number) => (
                <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button>📦 加入采集箱</Button>
            <Button variant="outline">⚙️ 前往处理</Button>
            <Button variant="outline">🗑️ 放弃</Button>
          </div>
        </Card>
      )}
    </>
  );
}

export default LinkCollectPage;
