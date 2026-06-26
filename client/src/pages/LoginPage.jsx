import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authApi";
import { Shield, Eye, EyeOff, AlertCircle, Loader2, Zap } from "lucide-react";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser(username.trim(), password);

      if (response.success) {
        login(response.data.token, response.data.user);
        const dashboardPath = getDashboardPath(response.data.user.role);
        navigate(dashboardPath, { replace: true });
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to connect to server";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCredentialClick = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  const testCredentials = [
    { label: "Admin", username: "super_admin", password: "admin123", color: "hover:border-[#7C3AED] hover:bg-[#7C3AED]/10 text-purple-400" },
    { label: "Police", username: "police_admin", password: "police123", color: "hover:border-[#2563EB] hover:bg-[#2563EB]/10 text-blue-400" },
    { label: "Fire", username: "fire_admin", password: "fire123", color: "hover:border-[#DC2626] hover:bg-[#DC2626]/10 text-red-400" },
    { label: "Hospital", username: "hospital_admin", password: "hospital123", color: "hover:border-[#16A34A] hover:bg-[#16A34A]/10 text-emerald-400" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white" style={{ background: "#0B1120" }}>
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid background with radial mask */}
      <div 
        className="absolute inset-0 hero-grid opacity-25 pointer-events-none" 
        style={{
          WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
          maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
        }}
      />

      <div className="relative w-full max-w-[420px] z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: "rgba(37,99,235,0.1)",
                border: "1px solid rgba(37,99,235,0.2)",
              }}>
              <Zap className="h-6 w-6 text-blue-500" />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            EMERGENCY COMMAND
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
            Emergency Command Platform &bull; Authorized Access
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#111827] rounded-2xl border border-white/5 shadow-2xl p-8"
          style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
          <h2 className="text-base font-bold text-white mb-1">
            Departmental Sign In
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Provide credentials below to access your operations console
          </p>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 bg-red-950/40 border border-red-900/30 rounded-lg text-red-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2"
              >
                Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. police_admin"
                autoComplete="username"
                className="w-full px-3.5 py-2.5 bg-[#1F2937]/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 bg-[#1F2937]/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Access Console"
              )}
            </button>
          </form>



          {/* Security Notice */}
          <div className="mt-5 p-3 bg-white/5 border border-white/5 rounded-lg">
            <p className="text-[9px] text-slate-400 leading-relaxed">
              <span className="font-bold text-white/60">
                Security Warning:
              </span>{" "}
              This is an encrypted government resource. All operations are recorded. Unauthorized attempts to gain entry are flagged.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">
            Government Operations Center &bull; &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
