import { Input } from '../ui';
import type { PackageDimensions } from '../../lib/api/types';

type Props = {
  weightGrams: number;
  packageDims: PackageDimensions;
  onWeight: (n: number) => void;
  onDims: (d: PackageDimensions) => void;
};

export function LogisticsPanel({ weightGrams, packageDims, onWeight, onDims }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 text-sm">
      <label>
        <span className="text-muted">重量 (g)</span>
        <Input
          type="number"
          className="mt-1"
          value={weightGrams}
          onChange={(e) => onWeight(Number(e.target.value) || 0)}
        />
        <p className="mt-1 text-xs text-muted">BRD / 谷歌报告：默认 220g</p>
      </label>
      <div>
        <span className="text-muted">包裹尺寸 (cm) 长×宽×高</span>
        <div className="mt-1 flex gap-2">
          <Input
            type="number"
            placeholder="长"
            value={packageDims.length}
            onChange={(e) => onDims({ ...packageDims, length: Number(e.target.value) || 0 })}
          />
          <Input
            type="number"
            placeholder="宽"
            value={packageDims.width}
            onChange={(e) => onDims({ ...packageDims, width: Number(e.target.value) || 0 })}
          />
          <Input
            type="number"
            placeholder="高"
            value={packageDims.height}
            onChange={(e) => onDims({ ...packageDims, height: Number(e.target.value) || 0 })}
          />
        </div>
        <p className="mt-1 text-xs text-muted">菲律宾演示：10×5×10</p>
      </div>
    </div>
  );
}
