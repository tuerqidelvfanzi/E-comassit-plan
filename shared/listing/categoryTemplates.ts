/**
 * 类目模板定义（BRD v1.1 §6）
 */

export type CategoryTemplateId =
  | 'tpl-clothing-tshirt'
  | 'tpl-clothing-general'
  | 'tpl-kitchenware'
  | 'tpl-lighting'
  | 'tpl-beauty'
  | 'tpl-electronics'
  | 'tpl-home'
  | 'tpl-other';

export type DummyHookConfig = {
  enabled: boolean;
  colorName: string;
  price: number;
  stock: number;
  weight: number;
};

export type SkuConfig = {
  prefix: string;
  sequenceStart: number;
  colors: string[];
  sizes: string[];
  sides: Array<'P' | 'R' | 'PR'>;
  dummyHook: DummyHookConfig;
};

export type CategoryTemplate = {
  id: CategoryTemplateId;
  name: string;
  category: string;
  skuConfig?: SkuConfig;
  priceMultiplier?: number;
  titleMaxChars?: number;
  defaultStock?: number;
};

export const CATEGORY_TEMPLATES: Record<CategoryTemplateId, CategoryTemplate> = {
  'tpl-clothing-tshirt': {
    id: 'tpl-clothing-tshirt',
    name: '服装-T恤',
    category: 'clothing-tshirt',
    skuConfig: {
      prefix: 'BF',
      sequenceStart: 1,
      colors: ['WH', 'BK', 'PK'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
      sides: ['P', 'R', 'PR'],
      dummyHook: {
        enabled: true,
        colorName: 'empty',
        price: 400,
        stock: 5,
        weight: 220,
      },
    },
  },
  'tpl-clothing-general': {
    id: 'tpl-clothing-general',
    name: '服装-通用',
    category: 'clothing-general',
  },
  'tpl-kitchenware': {
    id: 'tpl-kitchenware',
    name: '厨具',
    category: 'kitchenware',
  },
  'tpl-lighting': {
    id: 'tpl-lighting',
    name: '灯具',
    category: 'lighting',
  },
  'tpl-beauty': {
    id: 'tpl-beauty',
    name: '美妆',
    category: 'beauty',
  },
  'tpl-electronics': {
    id: 'tpl-electronics',
    name: '3C电子',
    category: 'electronics',
  },
  'tpl-home': {
    id: 'tpl-home',
    name: '家居',
    category: 'home',
  },
  'tpl-other': {
    id: 'tpl-other',
    name: '通用模板',
    category: 'other',
  },
};

/** 越南 Shopee 模板叠加规则 */
export const SHOPEE_VN_TEMPLATE_OVERRIDES = {
  priceMultiplier: 3.5,
  titleMaxChars: 20,
  defaultStock: 50,
} as const;

export function getCategoryTemplate(id: CategoryTemplateId): CategoryTemplate {
  return CATEGORY_TEMPLATES[id];
}
