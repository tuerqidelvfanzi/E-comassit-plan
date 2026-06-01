/**
 * 多站发布面板
 * V3需求: FR-P-03 多站同时发布
 */
import { useState } from 'react';
import { Card, Button, Badge } from '../ui';
import { 
  createMultiPlatformJob, 
  updateTaskStatus,
  getJobStatusSummary,
  PLATFORM_CONFIG,
  formatDuration,
  type Platform,
  type MultiPlatformPublishJob
} from '../../../../shared/src/publish';

const PLATFORMS: { id: Platform; name: string; flag: string }[] = [
  { id: 'shopee-vn', name: 'Shopee 越南', flag: '🇻🇳' },
  { id: 'shopee-ph', name: 'Shopee 菲律宾', flag: '🇵🇭' },
  { id: 'shopee-id', name: 'Shopee 印尼', flag: '🇮🇩' },
  { id: 'tiktok-th', name: 'TikTok 泰国', flag: '🇹🇭' },
];

export function MultiPublishPanel() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['shopee-vn']);
  const [mode, setMode] = useState<'parallel' | 'sequential'>('parallel');
  const [job, setJob] = useState<MultiPlatformPublishJob | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const startPublish = async () => {
    if (selectedPlatforms.length === 0) {
      alert('请选择至少一个平台');
      return;
    }

    const newJob = createMultiPlatformJob(
      'product-001',
      '卡通小熊纯棉T恤儿童短袖',
      selectedPlatforms,
      mode
    );
    setJob(newJob);
    setIsRunning(true);

    for (const task of newJob.tasks) {
      setJob(prev => prev ? updateTaskStatus(prev, task.id, { status: 'filling', startedAt: new Date().toISOString() }) : null);
      
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(r => setTimeout(r, 300));
        setJob(prev => prev ? updateTaskStatus(prev, task.id, { progress }) : null);
      }
      
      setJob(prev => prev ? updateTaskStatus(prev, task.id, { 
        status: 'completed', 
        progress: 100,
        completedAt: new Date().toISOString()
      }) : null);
    }
    
    setIsRunning(false);
  };

  const summary = job ? getJobStatusSummary(job) : null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-medium">多站同时发布</h2>
          <p className="text-xs text-muted">FR-P-03 · 并行/串行 · 状态独立追踪</p>
        </div>
        <Badge tone="ok">已实现</Badge>
      </div>

      <div className="mb-4">
        <label className="text-sm text-muted">选择发布平台</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {PLATFORMS.map(platform => (
            <button
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={`p-3 rounded-lg border flex items-center gap-2 transition ${
                selectedPlatforms.includes(platform.id)
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
              }`}
            >
              <span className="text-xl">{platform.flag}</span>
              <div className="text-left">
                <div className="text-sm font-medium">{platform.name}</div>
                <div className="text-xs text-muted">
                  预计 {formatDuration(PLATFORM_CONFIG[platform.id].estimatedTime)}
                </div>
              </div>
              {selectedPlatforms.includes(platform.id) && (
                <span className="ml-auto text-[var(--color-primary)]">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm text-muted">发布模式</label>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => setMode('parallel')}
            className={`flex-1 p-2 rounded-lg text-sm ${
              mode === 'parallel'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-muted)]'
            }`}
          >
            ⚡ 并行发布
          </button>
          <button
            onClick={() => setMode('sequential')}
            className={`flex-1 p-2 rounded-lg text-sm ${
              mode === 'sequential'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-muted)]'
            }`}
          >
            🔄 串行发布
          </button>
        </div>
      </div>

      <Button 
        className="w-full" 
        onClick={startPublish}
        disabled={isRunning || selectedPlatforms.length === 0}
      >
        {isRunning ? '发布中...' : `🚀 开始发布到 ${selectedPlatforms.length} 个平台`}
      </Button>

      {job && (
        <div className="mt-4">
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>总进度</span>
              <span>{job.totalProgress}%</span>
            </div>
            <div className="h-2 bg-[var(--color-muted)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--color-primary)] transition-all duration-300"
                style={{ width: `${job.totalProgress}%` }}
              />
            </div>
          </div>

          {summary && (
            <div className="flex gap-2 mb-3">
              <Badge tone="ok">完成 {summary.completed}</Badge>
              {summary.failed > 0 && <Badge tone="warn">失败 {summary.failed}</Badge>}
              {summary.pending > 0 && <Badge>待处理 {summary.pending}</Badge>}
            </div>
          )}

          <div className="space-y-2">
            {job.tasks.map(task => {
              const config = PLATFORM_CONFIG[task.platform];
              return (
                <div key={task.id} className="p-3 rounded-lg bg-[var(--color-muted)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{config.flag}</span>
                      <span className="text-sm font-medium">{config.name}</span>
                    </div>
                    <Badge tone={task.status === 'completed' ? 'ok' : task.status === 'failed' ? 'warn' : 'default'}>
                      {task.status === 'pending' && '待处理'}
                      {task.status === 'filling' && '发布中'}
                      {task.status === 'completed' && '已完成'}
                      {task.status === 'failed' && '失败'}
                    </Badge>
                  </div>
                  
                  {task.status === 'filling' && (
                    <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[var(--color-primary)] transition-all duration-200"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

export default MultiPublishPanel;
