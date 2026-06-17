/**
 * 多站发布模块
 * V3需求: FR-P-03 多站同时发布
 */

/** 发布平台 */
export type Platform = 'shopee-vn' | 'shopee-ph' | 'shopee-id' | 'tiktok-th';

/** 发布状态 */
export type PublishStatus = 'draft' | 'pending' | 'filling' | 'completed' | 'failed' | 'paused';

/** 单平台发布任务 */
export interface PublishTask {
  id: string;
  productId: string;
  platform: Platform;
  status: PublishStatus;
  progress: number;       // 0-100
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  startedAt?: string;
  completedAt?: string;
  estimatedDuration?: number;  // 预估耗时（秒）
}

/** 多站发布任务组 */
export interface MultiPlatformPublishJob {
  id: string;
  productId: string;
  title: string;
  tasks: PublishTask[];
  mode: 'parallel' | 'sequential';
  createdAt: string;
  completedAt?: string;
  totalProgress: number;
}

/** 平台配置 */
export const PLATFORM_CONFIG: Record<Platform, {
  name: string;
  country: string;
  flag: string;
  estimatedTime: number;  // 秒
  formFields: number;
}> = {
  'shopee-vn': {
    name: 'Shopee 越南',
    country: '越南',
    flag: '🇻🇳',
    estimatedTime: 120,
    formFields: 15
  },
  'shopee-ph': {
    name: 'Shopee 菲律宾',
    country: '菲律宾',
    flag: '🇵🇭',
    estimatedTime: 150,
    formFields: 15
  },
  'shopee-id': {
    name: 'Shopee 印尼',
    country: '印尼',
    flag: '🇮🇩',
    estimatedTime: 180,
    formFields: 18
  },
  'tiktok-th': {
    name: 'TikTok 泰国',
    country: '泰国',
    flag: '🇹🇭',
    estimatedTime: 200,
    formFields: 20
  }
};

/** 发布模式 */
export type PublishMode = 'parallel' | 'sequential';

/**
 * 创建多平台发布任务
 */
export function createMultiPlatformJob(
  productId: string,
  title: string,
  platforms: Platform[],
  mode: PublishMode = 'parallel'
): MultiPlatformPublishJob {
  const tasks: PublishTask[] = platforms.map(platform => ({
    id: `task-${Date.now()}-${platform}`,
    productId,
    platform,
    status: 'pending',
    progress: 0,
    retryCount: 0,
    maxRetries: 3,
    estimatedDuration: PLATFORM_CONFIG[platform].estimatedTime
  }));
  
  return {
    id: `job-${Date.now()}`,
    productId,
    title,
    tasks,
    mode,
    createdAt: new Date().toISOString(),
    totalProgress: 0
  };
}

/**
 * 更新任务状态
 */
export function updateTaskStatus(
  job: MultiPlatformPublishJob,
  taskId: string,
  updates: Partial<PublishTask>
): MultiPlatformPublishJob {
  const updatedTasks = job.tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, ...updates };
    }
    return task;
  });
  
  return {
    ...job,
    tasks: updatedTasks,
    totalProgress: calculateTotalProgress(updatedTasks)
  };
}

/**
 * 计算总进度
 */
export function calculateTotalProgress(tasks: PublishTask[]): number {
  if (tasks.length === 0) return 0;
  const total = tasks.reduce((sum, task) => sum + task.progress, 0);
  return Math.round(total / tasks.length);
}

/**
 * 获取任务状态摘要
 */
export function getJobStatusSummary(job: MultiPlatformPublishJob): {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  inProgress: number;
} {
  const summary = {
    total: job.tasks.length,
    completed: 0,
    failed: 0,
    pending: 0,
    inProgress: 0
  };
  
  for (const task of job.tasks) {
    switch (task.status) {
      case 'completed':
        summary.completed++;
        break;
      case 'failed':
        summary.failed++;
        break;
      case 'pending':
        summary.pending++;
        break;
      case 'filling':
      case 'paused':
        summary.inProgress++;
        break;
    }
  }
  
  return summary;
}

/**
 * 获取失败任务
 */
export function getFailedTasks(job: MultiPlatformPublishJob): PublishTask[] {
  return job.tasks.filter(task => task.status === 'failed');
}

/**
 * 重试失败任务
 */
export function retryFailedTasks(job: MultiPlatformPublishJob): MultiPlatformPublishJob {
  const updatedTasks = job.tasks.map(task => {
    if (task.status === 'failed' && task.retryCount < task.maxRetries) {
      return {
        ...task,
        status: 'pending' as PublishStatus,
        progress: 0,
        retryCount: task.retryCount + 1,
        errorMessage: undefined
      };
    }
    return task;
  });
  
  return {
    ...job,
    tasks: updatedTasks
  };
}

/**
 * 暂停任务
 */
export function pauseTask(job: MultiPlatformPublishJob, taskId: string): MultiPlatformPublishJob {
  return updateTaskStatus(job, taskId, { status: 'paused' });
}

/**
 * 恢复任务
 */
export function resumeTask(job: MultiPlatformPublishJob, taskId: string): MultiPlatformPublishJob {
  return updateTaskStatus(job, taskId, { status: 'pending' });
}

/**
 * 格式化耗时
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}小时${remainingMinutes}分`;
}

/**
 * 获取平台图标
 */
export function getPlatformIcon(platform: Platform): string {
  return PLATFORM_CONFIG[platform].flag;
}

/**
 * 验证发布任务
 */
export function validatePublishJob(job: MultiPlatformPublishJob): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (job.tasks.length === 0) {
    errors.push('没有选择任何发布平台');
  }
  
  for (const task of job.tasks) {
    if (task.maxRetries <= 0) {
      errors.push(`平台 ${task.platform} 重试次数设置无效`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
