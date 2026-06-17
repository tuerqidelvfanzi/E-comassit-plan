/**
 * 平台规则矩阵（验收依据）
 *
 * 来源：V2 `v2/components/PlatformRulesMatrix.tsx`
 * 变更：从 v2/components 迁出到 components/rules/，被 RulesPage 引用
 *
 * 覆盖 PRD V3 §6 平台规则矩阵
 */
import { Card } from '../ui';

const ROWS = [
  {
    item: '标题',
    vn: '≤20 字符',
    th: '≤220，可 emoji',
    ph: '≤120，偏英语',
  },
  {
    item: '主图',
    vn: '9 张，1:1 800×800',
    th: '≥5 张',
    ph: '9 张',
  },
  {
    item: '价格',
    vn: '×3.5 → VND',
    th: '×2.5 → THB',
    ph: '固定低价档 PHP',
  },
  {
    item: 'SKU',
    vn: '五段主码',
    th: '五段主码',
    ph: '五段或平台原生',
  },
  {
    item: '品牌',
    vn: '无品牌/授权',
    th: '无品牌为主',
    ph: '同左',
  },
] as const;

export function PlatformRulesMatrix() {
  return (
    <Card>
      <h2 className="font-medium">平台规则矩阵（验收依据 · REQUIREMENTS_V3 §6）</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-muted">
              <th className="py-2 pr-3">项</th>
              <th className="py-2 pr-3">越南 Shopee</th>
              <th className="py-2 pr-3">泰国 TikTok</th>
              <th className="py-2">菲律宾 Shopee</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.item} className="border-b border-[var(--color-border)]">
                <td className="py-2 pr-3 font-medium">{r.item}</td>
                <td className="py-2 pr-3">{r.vn}</td>
                <td className="py-2 pr-3">{r.th}</td>
                <td className="py-2">{r.ph}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
