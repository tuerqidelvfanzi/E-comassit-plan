import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Badge } from '../../components/ui';
import { V2Shell } from '../components/V2Shell';
import { StatusChip } from '../components/StatusChip';
import { api } from '../../lib/api';
import { queryKeys, useProducts, usePublishTasks } from '../../hooks/useAppQueries';
import { useSimulatePublishFill, useV2PublishTasks } from '../hooks/useV2Queries';
import type { PublishTask } from '../../lib/api/types';

const PLATFORM_CONFIG: Record<
  string,
  { url: string; flag: string; desc: string; steps: string[]; fillPlatform: string }
> = {
  Shopee: {
    url: 'https://seller.shopee.cn/',
    flag: '🇻🇳',
    desc: '越南 Shopee',
    steps: [
      '目标平台：打开 Shopee 卖家后台新建商品',
      '本平台：发布中心点击「生成填表」',
      '插件 Popup → 拉取 API → 填入卖家页',
      '对照 Mock 面板核对',
      '目标平台内点击发布',
    ],
    fillPlatform: 'shopee',
  },
  'TikTok Shop': {
    url: 'https://seller.tiktokglobalshop.com/',
    flag: '🇹🇭',
    desc: '泰国 TikTok Shop',
    steps: ['卖家中心新建商品', '生成填表', '插件填入 + 预览', '提交审核'],
    fillPlatform: 'tiktok',
  },
  淘宝: {
    url: 'https://sell.taobao.com/',
    flag: '🇨🇳',
    desc: '淘宝草稿（演示）',
    steps: ['千牛发布宝贝', '插件填入'],
    fillPlatform: 'taobao',
  },
};

export function PublishV2Page() {
  const { data: tasks = [] } = usePublishTasks();
  const { data: v2MockTasks = [] } = useV2PublishTasks();
  const { data: readyProducts = [] } = useProducts('ready');
  const qc = useQueryClient();
  const simulate = useSimulatePublishFill();
  const [selectedPlatform, setSelectedPlatform] = useState<PublishTask['platform']>('Shopee');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pluginHint, setPluginHint] = useState('');

  const filteredTasks =
    statusFilter === 'all' ? tasks : tasks.filter((t) => t.status === statusFilter);
  const filteredV2 =
    statusFilter === 'all'
      ? v2MockTasks
      : v2MockTasks.filter((t) => t.status === statusFilter);

  const createMut = useMutation({
    mutationFn: () => {
      const p = readyProducts[0];
      if (!p) throw new Error('NO_READY_PRODUCT');
      return api.createPublishTask({
        platform: p.targetLocale === 'vi-VN' ? 'Shopee' : 'TikTok Shop',
        title: p.processed?.conversion.title ?? p.title,
        productId: p.id,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.publish }),
  });

  const prepareMut = useMutation({
    mutationFn: (id: string) => api.preparePublishTask(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.publish });
      if (data.ok) {
        setPluginHint(
          data.fillInstructions ??
            '已生成填表载荷。请打开卖家后台 → 插件「发布」→ 从 API 拉取 → 填入（左侧 Mock 面板）。',
        );
      } else {
        setPluginHint(`校验未通过：${(data.validation?.issues ?? []).join('；')}`);
      }
    },
    onError: () => setPluginHint('生成填表失败，请确认 API 已启动且商品已处理完成'),
  });

  const cfg = PLATFORM_CONFIG[selectedPlatform] ?? PLATFORM_CONFIG.Shopee;

  return (
    <V2Shell
      title="发布中心"
      desc="本平台生成填表载荷 → 插件在目标平台卖家后台填入（非源站/目标站网页本身）"
      milestone="v2.0"
      actions={
        <Button
          type="button"
          disabled={createMut.isPending || readyProducts.length === 0}
          onClick={() => createMut.mutate()}
        >
          + 新建发布任务
        </Button>
      }
    >
      <Card className="border-[var(--color-primary)]/30 bg-[var(--color-surface)]">
        <h2 className="font-medium">插件演示闭环</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>本页对任务点击 <strong className="text-[var(--color-fg)]">生成填表</strong></li>
          <li>
            <Link to="/app/settings" className="text-[var(--color-primary)]">
              设置
            </Link>
            复制插件令牌 → Popup 连接页配置
          </li>
          <li>打开卖家后台新建页 → 插件「发布」→ 拉取并填入</li>
        </ol>
        {pluginHint ? <p className="mt-3 text-sm text-[var(--color-primary)]">{pluginHint}</p> : null}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="font-medium">目标平台</h2>
          <div className="mt-3 space-y-2">
            {(Object.keys(PLATFORM_CONFIG) as PublishTask['platform'][]).map((platform) => (
              <button
                key={platform}
                type="button"
                className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                  selectedPlatform === platform
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                    : 'border-[var(--color-border)]'
                }`}
                onClick={() => setSelectedPlatform(platform)}
              >
                <span className="mr-2">{PLATFORM_CONFIG[platform].flag}</span>
                {platform}
              </button>
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="font-medium">
            {cfg.flag} {selectedPlatform} 发布步骤
          </h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
            {cfg.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <Button
            type="button"
            className="mt-4"
            variant="outline"
            onClick={() => window.open(cfg.url, '_blank')}
          >
            打开卖家后台
          </Button>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="font-medium">发布状态机（FR-U-01）</h2>
        <p className="mt-1 text-xs text-muted">
          draft → pending → filling → completed | failed
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {['all', 'draft', 'pending', 'filling', 'completed', 'failed'].map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={statusFilter === s ? 'primary' : 'outline'}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? '全部' : s}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-medium">发布任务（API · 供插件填表）</h2>
        {filteredTasks.length === 0 ? (
          <p className="mt-2 text-sm text-muted">暂无任务。请先将商品处理为「可发布」后新建。</p>
        ) : (
          <div className="mt-3 space-y-3">
            {filteredTasks.map((t) => {
              const pcfg = PLATFORM_CONFIG[t.platform];
              return (
                <div
                  key={t.id}
                  className="rounded-lg border border-[var(--color-border)] p-4 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {pcfg?.flag} {t.title}
                      </p>
                      <p className="mt-1 text-muted">
                        {t.platform} · <StatusChip status={t.status} />
                      </p>
                      {t.reason ? <p className="mt-1 text-xs text-red-600">{t.reason}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        disabled={prepareMut.isPending}
                        onClick={() => prepareMut.mutate(t.id)}
                      >
                        生成填表
                      </Button>
                      {t.status === 'pending' ? (
                        <Badge tone="warn">待插件填入</Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {filteredV2.length > 0 ? (
        <Card className="mt-4">
          <h2 className="font-medium">v2 Mock 任务（状态机演示）</h2>
          <table className="mt-2 w-full text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th className="py-2">商品</th>
                <th className="py-2">平台</th>
                <th className="py-2">状态</th>
                <th className="py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredV2.map((t) => (
                <tr key={t.id} className="border-t border-[var(--color-border)]">
                  <td className="py-2">{t.title}</td>
                  <td className="py-2">
                    {t.platform} · {t.locale}
                  </td>
                  <td className="py-2">
                    <StatusChip status={t.status} />
                  </td>
                  <td className="py-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={simulate.isPending || t.status === 'completed'}
                      onClick={() => simulate.mutate(t.id)}
                    >
                      模拟填表
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {simulate.data?.log ? (
            <p className="mt-2 font-mono text-xs text-muted">{simulate.data.log}</p>
          ) : null}
        </Card>
      ) : null}
    </V2Shell>
  );
}
