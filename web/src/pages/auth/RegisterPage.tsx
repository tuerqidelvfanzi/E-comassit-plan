import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function RegisterPage() {
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"input" | "verify">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("两次密码不一致");
      return;
    }
    if (password.length < 6) {
      setError("密码至少6位");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/auth/register/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.code !== 0) {
        setError(data.message || "注册失败");
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

  const handleSendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError("请输入正确的手机号");
      return;
    }
    setLoading(true);
    setError("");
    try {
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

  const handlePhoneRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
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
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">注册账号</h1>
        <p className="text-center text-gray-500 mb-6">电商AI助手 - 开启跨境运营之旅</p>
        <div className="flex mb-6">
          <button
            className={"flex-1 py-2 text-center font-medium rounded-lg transition-colors " + (mode === "email" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            onClick={() => { setMode("email"); setStep("input"); setError(""); }}
          >
            邮箱注册
          </button>
          <button
            className={"flex-1 py-2 text-center font-medium rounded-lg transition-colors " + (mode === "phone" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            onClick={() => { setMode("phone"); setStep("input"); setError(""); }}
          >
            手机注册
          </button>
        </div>
        {mode === "email" ? (
          <form onSubmit={handleEmailRegister}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="your@email.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="至少6位" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="再次输入密码" required />
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full mt-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? "注册中..." : "注册"}
            </button>
          </form>
        ) : (
          <form onSubmit={step === "verify" ? handlePhoneRegister : undefined}>
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
                {loading ? "验证中..." : "验证并注册"}
              </button>
            )}
          </form>
        )}
        <p className="mt-4 text-center text-sm text-gray-500">
          已有账号？<a href="/login" className="text-blue-600 hover:underline">立即登录</a>
        </p>
      </div>
    </div>
  );
}
