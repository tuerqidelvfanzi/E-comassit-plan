import { scanBannedTerms } from '../../lib/bannedTerms';
import { countTitleChars, VIETNAM_TITLE_MAX } from '../../lib/listingTitle';

type Props = {
  locale: string;
  title: string;
  shortDesc: string;
  longDesc: string;
  onTitle: (v: string) => void;
  onShortDesc: (v: string) => void;
  onLongDesc: (v: string) => void;
};

function BannedAlert({ text }: { text: string }) {
  const hits = scanBannedTerms(text);
  if (!hits.length) return null;
  return (
    <p className="mt-1 text-xs text-red-600">
      违禁词：{hits.join('、')}
    </p>
  );
}

export function CopyEditPanel({
  locale,
  title,
  shortDesc,
  longDesc,
  onTitle,
  onShortDesc,
  onLongDesc,
}: Props) {
  const vn = locale === 'vi-VN';

  return (
    <div className="space-y-4 text-sm">
      <div>
        <div className="flex items-center justify-between">
          <span className="font-medium">标题</span>
          {vn ? (
            <span
              className={`text-xs ${countTitleChars(title) > VIETNAM_TITLE_MAX ? 'text-red-600' : 'text-muted'}`}
            >
              {countTitleChars(title)}/{VIETNAM_TITLE_MAX}
            </span>
          ) : null}
        </div>
        <textarea
          className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
          rows={2}
          value={title}
          onChange={(e) => onTitle(e.target.value)}
        />
        <BannedAlert text={title} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <span className="font-medium">短描述</span>
          {vn ? (
            <span className="text-xs text-muted">{countTitleChars(shortDesc)}/{VIETNAM_TITLE_MAX}</span>
          ) : null}
        </div>
        <textarea
          className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
          rows={2}
          value={shortDesc}
          onChange={(e) => onShortDesc(e.target.value)}
        />
        <BannedAlert text={shortDesc} />
      </div>
      <div>
        <span className="font-medium">详细描述（13 步 · 编详描）</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
          rows={5}
          value={longDesc}
          onChange={(e) => onLongDesc(e.target.value)}
          placeholder="删除品牌/产地/发货地/3C 等国内标识…"
        />
        <BannedAlert text={longDesc} />
      </div>
    </div>
  );
}
