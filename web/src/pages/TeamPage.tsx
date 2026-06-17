/**
 * 团队管理页面 - V3需求
 */
import { useState } from 'react';
import { PageHeader, Card, Button, Badge } from '../components/ui';

const TEAM_MEMBERS = [
  { id: '1', name: '张三', email: 'zhangsan@example.com', role: 'admin', status: 'active' },
  { id: '2', name: '李四', email: 'lisi@example.com', role: 'editor', status: 'active' },
  { id: '3', name: '王五', email: 'wangwu@example.com', role: 'viewer', status: 'invited' },
];

const ROLES = [
  { value: 'admin', label: '管理员', desc: '全部权限' },
  { value: 'editor', label: '编辑', desc: '采集/编辑/发布' },
  { value: 'viewer', label: '查看', desc: '仅查看' },
];

export function TeamPage() {
  const [members, setMembers] = useState(TEAM_MEMBERS);
  const [showInvite, setShowInvite] = useState(false);

  return (
    <>
      <PageHeader
        title="团队管理"
        desc="管理团队成员和权限"
        action={
          <Button onClick={() => setShowInvite(true)}>+ 邀请成员</Button>
        }
      />

      <Card className="mb-6">
        <h3 className="font-medium mb-4">团队成员 ({members.length})</h3>
        <div className="space-y-3">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                  {m.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.name}</span>
                    <Badge tone={m.status === 'active' ? 'ok' : 'warn'}>
                      {m.status === 'active' ? '已激活' : '待激活'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select className="px-3 py-1 rounded border border-border bg-surface text-sm">
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value} selected={m.role === r.value}>
                      {r.label} ({r.desc})
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="outline">移除</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showInvite && (
        <Card>
          <h3 className="font-medium mb-4">邀请新成员</h3>
          <div className="flex gap-3 mb-4">
            <input
              type="email"
              placeholder="输入邮箱地址"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface"
            />
            <Button onClick={() => setShowInvite(false)}>发送邀请</Button>
            <Button variant="outline" onClick={() => setShowInvite(false)}>取消</Button>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="font-medium mb-4">权限说明</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {ROLES.map(r => (
            <div key={r.value} className="p-3 bg-muted/50 rounded-lg">
              <h4 className="font-medium">{r.label}</h4>
              <p className="text-sm text-muted">{r.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

export default TeamPage;
