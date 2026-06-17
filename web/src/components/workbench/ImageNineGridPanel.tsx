import { useState } from 'react';
import { Button, Badge } from '../ui';
import { api } from '../../lib/api';
import type { Product } from '../../lib/api/types';

function imageUrls(p: Product): string[] {
  if (Array.isArray(p.images) && p.images.length > 0) {
    return p.images.map((img) => (typeof img === 'string' ? img : img.url));
  }
  return p.thumb ? [p.thumb] : [];
}

type Props = {
  product: Product;
  onMessage?: (msg: string) => void;
};

export function ImageNineGridPanel({ product, onMessage }: Props) {
  const [busy, setBusy] = useState('');
  const urls = imageUrls(product);
  const slots = Array.from({ length: 9 }, (_, i) => urls[i] ?? null);

  async function runJob(op: 'translate_overlay' | 'dedupe_watermark' | 'upscale', label: string) {
    setBusy(label);
    try {
      await api.createImageJob(product.id, [op]);
      onMessage?.(`${label} 任务已提交（演示队列）`);
    } catch {
      onMessage?.(`${label} 失败`);
    } finally {
      setBusy('');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">越南站 9 张 · 1:1 · 800×800（演示槽位）</p>
        <Badge tone="warn">{urls.length}/9 已采集</Badge>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {slots.map((url, idx) => (
          <div
            key={idx}
            className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]"
          >
            {url ? (
              <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-muted">待补</span>
            )}
            <span className="absolute left-1 top-1 rounded bg-[var(--color-primary)] px-1 text-[10px] text-white">
              {idx + 1}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!!busy}
          onClick={() => runJob('dedupe_watermark', '消除笔')}
        >
          消除笔/去水印
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!!busy}
          onClick={() => runJob('translate_overlay', '翻译覆盖')}
        >
          翻译覆盖（→越）
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!!busy}
          onClick={() => runJob('upscale', '1:1 放大')}
        >
          1:1 放大
        </Button>
      </div>
    </div>
  );
}
