import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { resolveApiMode, api } from "../../lib/api";

/**
 * LoginPage
 * - HTTP 模式：走真实后端 /api/v1/auth/*（生产用）
 * - Local 模式（GitHub Pages 演示）：走 localApi，邮箱登录用 admin01 / abcd234
 *   手机登录做一层薄包装，直接以 demo 身份登录
 */
export function LoginPage() {
  const isLocal = resolveApiMode() === "local";
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState(isLocal ? "admin01" : "");
  const [password, setPassword] = useState(isLocal ? "abcd234" : "");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"input" | "verify">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isLocal) {
        // 本地模式：直接调 localApi（内存里接受 admin01 / abcd234）
        const session = await api.login(email, password);
        login(session.accessToken, {
          id: session.user.id,
          username: session.user.username,
        });
        navigate("/app");
        return;
      }
      const res = await fetch("/api/v1/auth/login/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.code !== 0) {
        setError(data.message || "登录失败");
        return;
      }
      login(data.data.accessToken, data.data.user);
      navigate("/app");
    } catch {
      if (isLocal) {
        setError("演示账号：admin01 / abcd234");
      } else {
        setError("网络错误");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError("请输入正确的手机号");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (isLocal) {
        // 本地模式：无 SMS 网关，直接跳到 verify 步
        setCode("000000");
        setStep("verify");
        return;
      }
      const res = await fetch("/api/v1/auth/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.code !== 0) {
        setError(data.message || "发送失败");
        return;
      }
      setStep("verify");
      if (data.data.code) {
        setCode(data.data.code);
        alert("开发模式验证码: " + data.data.code);
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isLocal) {
        // 本地模式：任意 6 位验证码都通过，以 admin01 身份登录
        const session = await api.login("admin01", "abcd234");
        login(session.accessToken, {
          id: session.user.id,
          username: session.user.username,
        });
        navigate("/app");
        return;
      }
      const res = await fetch("/api/v1/auth/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (data.code !== 0) {
        setError(data.message || "验证失败");
        return;
      }
      login(data.data.accessToken, data.data.user);
      navigate("/app");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">电商AI助手</h1>
        {isLocal && (
          <p className="mb-4 text-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg py-2">
            演示模式：已预填账号 <span className="font-mono">admin01</span> / <span className="font-mono">abcd234</span>
          </p>
        )}
        <div className="flex mb-6">
          <button
            className={"flex-1 py-2 text-center font-medium rounded-lg transition-colors " + (mode === "email" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            onClick={() => { setMode("email"); setStep("input"); setError(""); }}
          >
            邮箱登录
          </button>
          <button
            className={"flex-1 py-2 text-center font-medium rounded-lg transition-colors " + (mode === "phone" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            onClick={() => { setMode("phone"); setStep("input"); setError(""); }}
          >
            手机登录
          </button>
        </div>
        {mode === "email" ? (
          <form onSubmit={handleEmailLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="your@email.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="******" required />
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full mt-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? "登录中..." : "登录"}
            </button>
          </form>
        ) : (
          <form onSubmit={step === "verify" ? handlePhoneLogin : undefined}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="13800138000" disabled={step === "verify"} required />
              </div>
              {step === "verify" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
                  <div className="flex gap-2">
                    <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="6位验证码" maxLength={6} required />
                    <button type="button" onClick={() => setStep("input")} className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800">返回</button>
                  </div>
                </div>
              )}
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            {step === "input" ? (
              <button type="button" onClick={handleSendCode} disabled={loading} className="w-full mt-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? "发送中..." : "获取验证码"}
              </button>
            ) : (
              <button type="submit" disabled={loading} className="w-full mt-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? "验证中..." : "验证并登录"}
              </button>
            )}
          </form>
        )}
        <p className="mt-4 text-center text-sm text-gray-500">
          还没有账号？<a href="/register" className="text-blue-600 hover:underline">立即注册</a>
        </p>
      </div>
    </div>
  );
}
