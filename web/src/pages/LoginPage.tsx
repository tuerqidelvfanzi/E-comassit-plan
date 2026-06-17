import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { PRODUCT_NAME } from '../lib/brand';
import { Button, Card, Input } from '../components/ui';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.target as HTMLFormElement);
    const ok = await login(String(fd.get('username')), String(fd.get('password')));
    setLoading(false);
    if (ok) navigate('/app');
    else setError('用户名或密码错误（演示：admin01 / abcd234）');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-gradient p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-semibold">{PRODUCT_NAME}</h1>
        <p className="mt-1 text-sm text-muted">登录您的账户以继续</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block text-label">用户名或邮箱</span>
            <Input name="username" defaultValue="admin01" required autoComplete="username" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-label">密码</span>
            <Input name="password" type="password" defaultValue="abcd234" required autoComplete="current-password" />
          </label>
          <label className="flex items-center gap-2 text-sm text-label">
            <input type="checkbox" defaultChecked className="rounded" />
            记住我
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          还没有账户？ <span className="text-[var(--color-primary)]">立即注册</span>（原型未实现）
        </p>
      </Card>
    </div>
  );
}
