import { Card, Badge } from '../../components/ui';
import { V2Shell } from '../components/V2Shell';
import { useV2Team } from '../hooks/useV2Queries';

const roleLabel: Record<string, string> = {
  owner: '所有者',
  operator: '运营',
  viewer: '只读',
};

export function TeamPage() {
  const { data: members = [] } = useV2Team();

  return (
    <V2Shell
      title="团队"
      desc="多用户协作与权限（Mock，v2.3 演示）"
      milestone="v2.3"
    >
      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-muted">
              <th className="py-2">成员</th>
              <th className="py-2">角色</th>
              <th className="py-2">邮箱</th>
              <th className="py-2">最近活跃</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-[var(--color-border)]">
                <td className="py-3 font-medium">{m.name}</td>
                <td className="py-3">
                  <Badge tone={m.role === 'owner' ? 'ok' : 'default'}>
                    {roleLabel[m.role] ?? m.role}
                  </Badge>
                </td>
                <td className="py-3 text-muted">{m.email}</td>
                <td className="py-3 text-muted">{new Date(m.lastActiveAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </V2Shell>
  );
}
