import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TemplatesPage } from '../../pages/TemplatesPage';
import { V2Shell } from '../components/V2Shell';

/** 复用 v1 模板 CRUD（SKU 配置、六段编码） */
export function TemplatesManageV2Page() {
  const [params] = useSearchParams();
  const isNew = params.get('new') === '1';

  useEffect(() => {
    if (!isNew) return;
    const t = window.setTimeout(() => {
      document.getElementById('tpl-create-trigger')?.click();
    }, 300);
    return () => clearTimeout(t);
  }, [isNew]);

  return (
    <V2Shell
      title="模板管理"
      desc="新建/编辑类目模板 · SKU 矩阵 · 白色钩子 · 五段主码"
      milestone="v2.0"
    >
      <TemplatesPage embedded />
    </V2Shell>
  );
}
