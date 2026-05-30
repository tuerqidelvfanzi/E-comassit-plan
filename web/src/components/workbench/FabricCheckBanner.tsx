import type { Product } from '../../lib/api/types';

/** F-P-A05 面料一致性 · 演示规则 */
export function FabricCheckBanner({ product, title, description }: { product: Product; title: string; description: string }) {
  const attrs = product.attributes ?? {};
  const fabric =
    String(attrs.fabric ?? attrs.material ?? attrs['面料'] ?? '').toLowerCase();
  const text = `${title} ${description}`.toLowerCase();
  const mentionsCotton = /棉|cotton/.test(text);
  const mentionsPoly = /涤|poly|聚酯/.test(text);
  const attrCotton = fabric.includes('棉') || fabric.includes('cotton');
  const attrPoly = fabric.includes('涤') || fabric.includes('poly');

  if (!fabric && !mentionsCotton && !mentionsPoly) return null;

  const mismatch =
    (attrCotton && mentionsPoly && !mentionsCotton) ||
    (attrPoly && mentionsCotton && !mentionsPoly);

  if (!mismatch) {
    return (
      <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
        面料一致性扫描：属性与文案未发现冲突（演示规则）
      </p>
    );
  }

  return (
    <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      面料一致性警告：属性「{fabric || '—'}」与标题/描述用词不一致，请人工核对（F-P-A05 Mock）
    </p>
  );
}
