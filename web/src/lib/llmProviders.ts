import { useSyncExternalStore } from 'react';

export type ApiFormat = 'openai' | 'anthropic';

export type ModelCapability =
  | 'chat'
  | 'reasoning'
  | 'vision'
  | 'translation'
  | 'image_gen'
  | 'embedding';

export type LlmModel = {
  id: string;
  /** 调用 API 时使用的 model id */
  modelId: string;
  /** 展示名称（可自定义） */
  displayName: string;
  enabled: boolean;
  capabilities: ModelCapability[];
  group?: string;
};

export type LlmProvider = {
  id: string;
  name: string;
  enabled: boolean;
  apiKey: string;
  apiBaseUrl: string;
  apiFormat: ApiFormat;
  docsUrl?: string;
  models: LlmModel[];
};

/** 后期：不同工作流绑定的模型（预留） */
export type TaskModelBinding = {
  taskId: string;
  label: string;
  description: string;
  modelRefId: string | null;
};

const STORAGE_KEY = 'psa_llm_providers';
const BINDING_KEY = 'psa_llm_task_bindings';
const CHANGE_EVENT = 'psa-llm-change';

export const TASK_BINDINGS: TaskModelBinding[] = [
  { taskId: 'default', label: '默认对话', description: '通用文案与问答', modelRefId: null },
  { taskId: 'title_rewrite', label: '标题优化', description: '类目模板 / 临时 Prompt 改写', modelRefId: null },
  { taskId: 'translation', label: '多语言翻译', description: '越南语、泰语等', modelRefId: null },
  { taskId: 'vision', label: '图片识别', description: '主图与详情图理解', modelRefId: null },
  { taskId: 'image_gen', label: '图生图', description: '商品图生成与变体', modelRefId: null },
];

function defaultProviders(): LlmProvider[] {
  return [
    {
      id: 'minimax',
      name: 'MiniMax',
      enabled: true,
      apiKey: '',
      apiBaseUrl: 'https://api.minimaxi.com/v1',
      apiFormat: 'openai',
      docsUrl: 'https://platform.minimaxi.com',
      models: [
        {
          id: 'mm-m27',
          modelId: 'MiniMax-M2.7',
          displayName: 'MiniMax M2.7',
          enabled: true,
          capabilities: ['chat', 'reasoning'],
          group: 'M2.7',
        },
        {
          id: 'mm-m27-hs',
          modelId: 'MiniMax-M2.7-highspeed',
          displayName: 'MiniMax M2.7 高速',
          enabled: false,
          capabilities: ['chat'],
          group: 'M2.7',
        },
        {
          id: 'mm-m25',
          modelId: 'MiniMax-M2.5',
          displayName: 'MiniMax M2.5',
          enabled: false,
          capabilities: ['chat'],
          group: 'M2.5',
        },
      ],
    },
    {
      id: 'openai',
      name: 'OpenAI',
      enabled: false,
      apiKey: '',
      apiBaseUrl: 'https://api.openai.com/v1',
      apiFormat: 'openai',
      docsUrl: 'https://platform.openai.com',
      models: [
        {
          id: 'gpt-4o',
          modelId: 'gpt-4o',
          displayName: 'GPT-4o',
          enabled: true,
          capabilities: ['chat', 'vision'],
          group: 'GPT',
        },
      ],
    },
    {
      id: 'siliconflow',
      name: 'SiliconFlow',
      enabled: false,
      apiKey: '',
      apiBaseUrl: 'https://api.siliconflow.cn/v1',
      apiFormat: 'openai',
      models: [],
    },
    {
      id: 'custom',
      name: '自定义接口',
      enabled: false,
      apiKey: '',
      apiBaseUrl: 'https://your-api.example.com/v1',
      apiFormat: 'openai',
      models: [],
    },
  ];
}

function normalizeModel(raw: unknown): LlmModel | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Partial<LlmModel>;
  if (!m.id || !m.modelId) return null;
  return {
    id: String(m.id),
    modelId: String(m.modelId),
    displayName: String(m.displayName ?? m.modelId),
    enabled: Boolean(m.enabled),
    capabilities: Array.isArray(m.capabilities) ? m.capabilities : ['chat'],
    group: m.group ? String(m.group) : undefined,
  };
}

function normalizeProvider(raw: unknown): LlmProvider | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<LlmProvider>;
  if (!p.id || !p.name) return null;
  const models = Array.isArray(p.models)
    ? p.models.map(normalizeModel).filter((m): m is LlmModel => m !== null)
    : [];
  return {
    id: String(p.id),
    name: String(p.name),
    enabled: Boolean(p.enabled),
    apiKey: typeof p.apiKey === 'string' ? p.apiKey : '',
    apiBaseUrl: typeof p.apiBaseUrl === 'string' ? p.apiBaseUrl : '',
    apiFormat: p.apiFormat === 'anthropic' ? 'anthropic' : 'openai',
    docsUrl: typeof p.docsUrl === 'string' ? p.docsUrl : undefined,
    models,
  };
}

function mergeWithDefaults(stored: LlmProvider[]): LlmProvider[] {
  const defaults = defaultProviders();
  const byId = new Map(stored.map((p) => [p.id, p]));
  return defaults.map((d) => {
    const hit = byId.get(d.id);
    if (!hit) return d;
    return {
      ...d,
      ...hit,
      models: hit.models.length > 0 ? hit.models : d.models,
    };
  });
}

function normalizeProviders(data: unknown): LlmProvider[] {
  if (!Array.isArray(data)) return defaultProviders();
  const parsed = data.map(normalizeProvider).filter((p): p is LlmProvider => p !== null);
  if (parsed.length === 0) return defaultProviders();
  return mergeWithDefaults(parsed);
}

function loadProviders(): LlmProvider[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProviders();
    return normalizeProviders(JSON.parse(raw));
  } catch {
    return defaultProviders();
  }
}

function saveProviders(data: LlmProvider[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** 启动时修复损坏的 localStorage，避免设置页白屏 */
export function repairLlmStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        const normalized = normalizeProviders(parsed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      }
    }
    const bindingRaw = localStorage.getItem(BINDING_KEY);
    if (bindingRaw) {
      const parsed = JSON.parse(bindingRaw);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem(BINDING_KEY);
      } else {
        localStorage.setItem(BINDING_KEY, JSON.stringify(normalizeBindings(parsed)));
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BINDING_KEY);
  }
}

function normalizeBindings(data: unknown): TaskModelBinding[] {
  const base = TASK_BINDINGS.map((b) => ({ ...b }));
  if (!Array.isArray(data)) return base;
  const byTask = new Map(
    data
      .filter((x) => x && typeof x === 'object' && 'taskId' in x)
      .map((x) => [String((x as TaskModelBinding).taskId), x as TaskModelBinding]),
  );
  return base.map((b) => {
    const hit = byTask.get(b.taskId);
    if (!hit) return b;
    return {
      ...b,
      modelRefId: hit.modelRefId ?? null,
    };
  });
}

function loadBindings(): TaskModelBinding[] {
  try {
    const raw = localStorage.getItem(BINDING_KEY);
    if (!raw) return TASK_BINDINGS.map((b) => ({ ...b }));
    return normalizeBindings(JSON.parse(raw));
  } catch {
    return TASK_BINDINGS.map((b) => ({ ...b }));
  }
}

function saveBindings(data: TaskModelBinding[]) {
  localStorage.setItem(BINDING_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

export function modelRef(providerId: string, modelId: string) {
  return `${providerId}:${modelId}`;
}

export function parseModelRef(ref: string | null) {
  if (!ref) return null;
  const [providerId, id] = ref.split(':');
  return { providerId, id };
}

export function getEnabledModels(providers: LlmProvider[]) {
  const list: { ref: string; label: string; providerName: string }[] = [];
  for (const p of providers) {
    if (!p.enabled) continue;
    for (const m of p.models) {
      if (!m.enabled) continue;
      list.push({
        ref: modelRef(p.id, m.id),
        label: `${m.displayName} (${p.name})`,
        providerName: p.name,
      });
    }
  }
  return list;
}

export type TestResult = { ok: boolean; message: string; latencyMs?: number };

/** 原型：模拟 API 检测 */
export async function testProviderConnection(provider: LlmProvider): Promise<TestResult> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
  if (!provider.apiKey.trim()) {
    return { ok: false, message: '请先填写 API Key' };
  }
  if (!/^https?:\/\//i.test(provider.apiBaseUrl)) {
    return { ok: false, message: 'API 地址格式不正确' };
  }
  if (provider.apiKey.length < 8) {
    return { ok: false, message: 'API Key 长度似乎不正确' };
  }
  return {
    ok: true,
    message: `连接成功（演示）· ${provider.models.filter((m) => m.enabled).length} 个模型已启用`,
    latencyMs: Math.round(600 + Math.random() * 200),
  };
}

/** 原型：从接口拉取模型列表（演示数据） */
export function fetchRemoteModels(provider: LlmProvider): LlmModel[] {
  if (provider.id === 'minimax') {
    return [
      {
        id: `fetch-${Date.now()}-1`,
        modelId: 'MiniMax-M2.1',
        displayName: 'MiniMax M2.1',
        enabled: false,
        capabilities: ['chat'],
        group: 'M2.1',
      },
      {
        id: `fetch-${Date.now()}-2`,
        modelId: 'MiniMax-Text-01',
        displayName: 'MiniMax Text 01',
        enabled: false,
        capabilities: ['chat', 'translation'],
        group: 'Text',
      },
    ];
  }
  return [
    {
      id: `fetch-${Date.now()}`,
      modelId: 'remote-model-1',
      displayName: '远程模型 1',
      enabled: false,
      capabilities: ['chat'],
      group: 'Fetched',
    },
  ];
}

function getServerProviders() {
  return defaultProviders();
}

function getServerBindings() {
  return TASK_BINDINGS.map((b) => ({ ...b }));
}

export function useLlmSettings() {
  const providers = useSyncExternalStore(subscribe, loadProviders, getServerProviders);
  const bindings = useSyncExternalStore(subscribe, loadBindings, getServerBindings);

  return {
    providers,
    bindings,
    setProviders: saveProviders,
    setBindings: saveBindings,
    updateProvider(providerId: string, patch: Partial<LlmProvider>) {
      saveProviders(providers.map((p) => (p.id === providerId ? { ...p, ...patch } : p)));
    },
    addModel(providerId: string, model: Omit<LlmModel, 'id'>) {
      const id = `m-${Date.now()}`;
      saveProviders(
        providers.map((p) =>
          p.id === providerId
            ? { ...p, models: [...p.models, { ...model, id }] }
            : p,
        ),
      );
      return id;
    },
    updateModel(providerId: string, modelId: string, patch: Partial<LlmModel>) {
      saveProviders(
        providers.map((p) =>
          p.id === providerId
            ? {
                ...p,
                models: p.models.map((m) => (m.id === modelId ? { ...m, ...patch } : m)),
              }
            : p,
        ),
      );
    },
    removeModel(providerId: string, modelId: string) {
      saveProviders(
        providers.map((p) =>
          p.id === providerId ? { ...p, models: p.models.filter((m) => m.id !== modelId) } : p,
        ),
      );
    },
    mergeFetchedModels(providerId: string, fetched: LlmModel[]) {
      saveProviders(
        providers.map((p) => {
          if (p.id !== providerId) return p;
          const existingIds = new Set(p.models.map((m) => m.modelId));
          const novel = fetched.filter((f) => !existingIds.has(f.modelId));
          return { ...p, models: [...p.models, ...novel] };
        }),
      );
    },
  };
}
