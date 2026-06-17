import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card } from './ui';
import { api } from '../lib/api';
import { queryKeys, useExtensionToken } from '../hooks/useAppQueries';

export function ExtensionTokenCard() {
  const { data, isLoading } = useExtensionToken();
  const qc = useQueryClient();
  const rotateMut = useMutation({
    mutationFn: () => api.rotateExtensionToken(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.extToken }),
  });

  const token = data?.token ?? '';

  const copy = async () => {
    if (token) await navigator.clipboard.writeText(token);
  };

  return (
    <Card className="mt-4">
      <h2 className="font-medium">插件连接令牌</h2>
      <p className="mt-1 text-sm text-muted">
        插件请求 <code className="text-xs">POST /api/v1/collect-jobs</code> 时携带 Header{' '}
        <code className="text-xs">X-Extension-Token</code>
      </p>
      <code className="code-block mt-3 block break-all rounded bg-code p-2 text-xs">
        {isLoading ? '…' : token || '（无）'}
      </code>
      <div className="mt-3 flex gap-2">
        <Button variant="outline" onClick={copy} disabled={!token}>
          复制
        </Button>
        <Button variant="outline" disabled={rotateMut.isPending} onClick={() => rotateMut.mutate()}>
          重新生成
        </Button>
      </div>
    </Card>
  );
}
