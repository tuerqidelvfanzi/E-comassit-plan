/** REQUIREMENTS_V2 §7 信息架构 + 增补模块（演示导航） */
export type RequirementModule = {
  id: string;
  title: string;
  route: string;
  layer: '选品' | '采集' | '处理' | '配置' | '发布' | '系统';
  requirement: string;
  milestone: string;
};

export const REQUIREMENT_MODULES: RequirementModule[] = [
  {
    id: 'dashboard',
    title: '工作台首页',
    route: '/app',
    layer: '系统',
    requirement: '今日采集/待处理/失败与能力总览',
    milestone: 'P0',
  },
  {
    id: 'competitors',
    title: '竞品分析',
    route: '/app/competitors',
    layer: '选品',
    requirement: '源平台关键词洞察、找同类（FR-I-01）',
    milestone: 'P1',
  },
  {
    id: 'insights',
    title: '选品洞察',
    route: '/app/insights',
    layer: '选品',
    requirement: 'GMV/CTR 看板与报告索引（FR-I-02）',
    milestone: 'P1',
  },
  {
    id: 'title-opt',
    title: '天猫标题优化',
    route: '/app/title-optimization',
    layer: '选品',
    requirement: '7 步：搜索词→生成→对比→更换（FR-TO）',
    milestone: 'P0',
  },
  {
    id: 'inbox',
    title: '采集箱',
    route: '/app/inbox',
    layer: '采集',
    requirement: '筛选、批量、导出（FR-C-04）',
    milestone: 'P0',
  },
  {
    id: 'link-collect',
    title: '链接直采',
    route: '/app/link-collect',
    layer: '采集',
    requirement: '粘贴 URL，Worker 解析（FR-C-02）',
    milestone: 'P1',
  },
  {
    id: 'batch-collect',
    title: '批量采集',
    route: '/app/batch-collect',
    layer: '采集',
    requirement: '榜单 TOP N（FR-C-03）',
    milestone: 'P2',
  },
  {
    id: 'workbench',
    title: '处理工作台',
    route: '/app/workbench/p1',
    layer: '处理',
    requirement: '管线、五段 SKU、9 图、13 步（FR-P）',
    milestone: 'P0',
  },
  {
    id: 'templates',
    title: '类目模板',
    route: '/app/templates',
    layer: '配置',
    requirement: 'A/B/C 目录（FR-T-01）',
    milestone: 'P0',
  },
  {
    id: 'templates-manage',
    title: '模板管理',
    route: '/app/templates/manage',
    layer: '配置',
    requirement: 'SKU 配置、系统 Prompt（FR-T）',
    milestone: 'P0',
  },
  {
    id: 'rules',
    title: '规则库',
    route: '/app/rules',
    layer: '配置',
    requirement: '倍率、违禁、字数（FR-R-01）',
    milestone: 'P1',
  },
  {
    id: 'publish',
    title: '发布中心',
    route: '/app/publish',
    layer: '发布',
    requirement: '状态机、生成填表（FR-U-01）',
    milestone: 'P0',
  },
  {
    id: 'integrations',
    title: '平台集成',
    route: '/app/integrations',
    layer: '发布',
    requirement: 'DOM / Open API 适配（FR-U-04）',
    milestone: 'P3',
  },
  {
    id: 'team',
    title: '团队',
    route: '/app/team',
    layer: '系统',
    requirement: '成员角色（协作预留）',
    milestone: 'v2.3',
  },
  {
    id: 'settings',
    title: '设置',
    route: '/app/settings',
    layer: '系统',
    requirement: '插件、Token、LLM（FR-S-01）',
    milestone: 'P0',
  },
];
