import { useMemo, useState } from 'react';
import { Eye, EyeOff, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import {
  fetchRemoteModels,
  getEnabledModels,
  testProviderConnection,
  useLlmSettings,
  type LlmProvider,
} from '../lib/llmProviders';
import { Badge, Button, Card, Input, Label, Select, Switch } from './ui';

export function LlmSettings() {
  const {
    providers,
    bindings,
    setBindings,
    updateProvider,
    addModel,
    updateModel,
    removeModel,
    mergeFetchedModels,
  } = useLlmSettings();

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(providers[0]?.id ?? '');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newModelId, setNewModelId] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [fetching, setFetching] = useState(false);

  const selected = providers.find((p) => p.id === selectedId) ?? providers[0];
  const enabledModelOptions = useMemo(() => getEnabledModels(providers), [providers]);

  const filtered = providers.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  if (!selected) {
    return <p className="text-sm text-muted">暂无模型提供商，请刷新页面。</p>;
  }

  async function onTest() {
    setTesting(true);
    setTestMsg(null);
    const res = await testProviderConnection(selected);
    setTestMsg({ tone: res.ok ? 'ok' : 'warn', text: res.message });
    setTesting(false);
  }

  function onFetchModels() {
    setFetching(true);
    const fetched = fetchRemoteModels(selected);
    mergeFetchedModels(selected.id, fetched);
    setTestMsg({ tone: 'ok', text: `已拉取 ${fetched.length} 个模型（演示），请用开关启用` });
    setFetching(false);
  }

  function onAddModel() {
    const mid = newModelId.trim();
    if (!mid) return;
    addModel(selected.id, {
      modelId: mid,
      displayName: newDisplayName.trim() || mid,
      enabled: true,
      capabilities: ['chat'],
      group: '自定义',
    });
    setNewModelId('');
    setNewDisplayName('');
    setAddOpen(false);
    setTestMsg({ tone: 'ok', text: `已添加模型：${newDisplayName.trim() || mid}` });
  }

  const grouped = groupModels(selected.models);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        先配置各厂商 API 与模型列表，用开关启用；后期可为翻译、识图等工作流指定不同模型（下方预留）。
      </p>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* 左侧：提供商列表 */}
        <Card className="w-full shrink-0 p-0 lg:w-56">
          <div className="border-b border-[var(--color-border)] p-3">
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted" />
              <Input
                className="pl-8"
                placeholder="搜索提供商"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <ul className="max-h-[420px] overflow-y-auto p-2">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(p.id);
                    setTestMsg(null);
                  }}
                  className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                    p.id === selected.id
                      ? 'bg-[var(--color-primary-soft)] font-medium text-[var(--color-primary)]'
                      : 'hover:bg-[var(--color-muted)]'
                  }`}
                >
                  <span>{p.name}</span>
                  {p.enabled ? <Badge tone="ok">ON</Badge> : null}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {/* 右侧：提供商详情 */}
        <Card className="min-w-0 flex-1">
          <ProviderHeader provider={selected} onToggle={(v) => updateProvider(selected.id, { enabled: v })} />

          <div className="mt-4 space-y-4">
            <Field label="API 密钥">
              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-[200px] flex-1">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={selected.apiKey}
                    onChange={(e) => updateProvider(selected.id, { apiKey: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 text-muted"
                    onClick={() => setShowKey(!showKey)}
                    aria-label={showKey ? '隐藏' : '显示'}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button variant="outline" onClick={onTest} disabled={testing}>
                  {testing ? '检测中…' : '检测'}
                </Button>
              </div>
              {selected.docsUrl ? (
                <a
                  href={selected.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-[var(--color-primary)]"
                >
                  获取 API Key →
                </a>
              ) : null}
            </Field>

            <Field label="API 地址">
              <div className="flex flex-wrap gap-2">
                <Input
                  className="min-w-[200px] flex-1 font-mono text-xs"
                  value={selected.apiBaseUrl}
                  onChange={(e) => updateProvider(selected.id, { apiBaseUrl: e.target.value })}
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    updateProvider(selected.id, {
                      apiBaseUrl: defaultBaseUrl(selected.id),
                    })
                  }
                >
                  重置
                </Button>
              </div>
            </Field>

            <Field label="API 格式">
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`format-${selected.id}`}
                    checked={selected.apiFormat === 'openai'}
                    onChange={() => updateProvider(selected.id, { apiFormat: 'openai' })}
                  />
                  OpenAI 兼容
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`format-${selected.id}`}
                    checked={selected.apiFormat === 'anthropic'}
                    onChange={() => updateProvider(selected.id, { apiFormat: 'anthropic' })}
                  />
                  Anthropic 兼容
                </label>
              </div>
            </Field>

            {testMsg ? (
              <p
                className={`text-sm ${testMsg.tone === 'ok' ? 'text-[var(--color-success-fg)]' : 'text-[var(--color-warn-fg)]'}`}
              >
                {testMsg.text}
              </p>
            ) : null}

            <div className="border-t border-[var(--color-border)] pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">
                  模型 <span className="text-muted">({selected.models.length})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={onFetchModels} disabled={fetching}>
                    <RefreshCw className={`mr-1 h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
                    获取模型列表
                  </Button>
                  <Button variant="outline" onClick={() => setAddOpen(!addOpen)}>
                    <Plus className="mr-1 h-4 w-4" />
                    添加模型
                  </Button>
                </div>
              </div>

              {addOpen ? (
                <Card className="mt-3 border-dashed bg-[var(--color-muted)]">
                  <p className="text-sm font-medium">添加模型名称</p>
                  <p className="mt-1 text-xs text-muted">
                    填写接口要求的 model id；展示名称可自定义，便于在工作流中选择。
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Model ID（必填）</Label>
                      <Input
                        className="mt-1 font-mono text-xs"
                        placeholder="MiniMax-M2.7"
                        value={newModelId}
                        onChange={(e) => setNewModelId(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>展示名称</Label>
                      <Input
                        className="mt-1"
                        placeholder="可选，默认同 Model ID"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button onClick={onAddModel}>确认添加</Button>
                    <Button variant="ghost" onClick={() => setAddOpen(false)}>
                      取消
                    </Button>
                  </div>
                </Card>
              ) : null}

              <div className="mt-3 space-y-4">
                {Object.entries(grouped).map(([group, models]) => (
                  <div key={group}>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                      {group} · {models.length}
                    </p>
                    <ul className="space-y-2">
                      {models.map((m) => (
                        <li
                          key={m.id}
                          className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-code-bg)] px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <Input
                              className="mb-1 text-sm font-medium"
                              value={m.displayName}
                              onChange={(e) =>
                                updateModel(selected.id, m.id, { displayName: e.target.value })
                              }
                            />
                            <Input
                              className="font-mono text-xs"
                              value={m.modelId}
                              onChange={(e) =>
                                updateModel(selected.id, m.id, { modelId: e.target.value })
                              }
                            />
                          </div>
                          <Switch
                            checked={m.enabled}
                            onChange={(v) => updateModel(selected.id, m.id, { enabled: v })}
                            label={m.enabled ? '启用' : '关闭'}
                          />
                          <button
                            type="button"
                            className="text-muted hover:text-[var(--color-danger)]"
                            onClick={() => removeModel(selected.id, m.id)}
                            aria-label="删除模型"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {selected.models.length === 0 ? (
                  <p className="text-sm text-muted">暂无模型，请获取列表或手动添加。</p>
                ) : null}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 工作流绑定（预留） */}
      <Card>
        <h3 className="font-medium">工作流模型绑定（预留）</h3>
        <p className="mt-1 text-xs text-muted">
          后期可为读写、翻译、识图、图生图等任务指定不同已启用模型。当前仅保存选择，调用逻辑待后端接入。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {bindings.map((b) => (
            <div key={b.taskId} className="rounded-lg border border-[var(--color-border)] p-3">
              <p className="text-sm font-medium">{b.label}</p>
              <p className="text-xs text-muted">{b.description}</p>
              <Select
                className="mt-2 w-full"
                value={b.modelRefId ?? ''}
                onChange={(e) => {
                  const next = bindings.map((x) =>
                    x.taskId === b.taskId
                      ? { ...x, modelRefId: e.target.value || null }
                      : x,
                  );
                  setBindings(next);
                }}
              >
                <option value="">未指定</option>
                {enabledModelOptions.map((o) => (
                  <option key={o.ref} value={o.ref}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ProviderHeader({
  provider,
  onToggle,
}: {
  provider: LlmProvider;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
      <div>
        <h2 className="text-lg font-semibold">{provider.name}</h2>
        <p className="text-xs text-muted">配置完成后用开关启用提供商与具体模型</p>
      </div>
      <Switch checked={provider.enabled} onChange={onToggle} label={provider.enabled ? '已启用' : '已关闭'} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block font-medium">{label}</Label>
      {children}
    </div>
  );
}

function groupModels(models: LlmProvider['models']) {
  const map: Record<string, typeof models> = {};
  for (const m of models) {
    const g = m.group || '其他';
    if (!map[g]) map[g] = [];
    map[g].push(m);
  }
  return map;
}

function defaultBaseUrl(providerId: string) {
  const defaults: Record<string, string> = {
    minimax: 'https://api.minimaxi.com/v1',
    openai: 'https://api.openai.com/v1',
    siliconflow: 'https://api.siliconflow.cn/v1',
    custom: 'https://your-api.example.com/v1',
  };
  return defaults[providerId] ?? 'https://api.example.com/v1';
}
