import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authApi";
import { Shield, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden font-sans selection:bg-[#E8602E] selection:text-white">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#E8602E]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid background with radial mask */}
      <div 
        className="absolute inset-0 hero-grid opacity-30 pointer-events-none" 
        style={{
          WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
          maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
        }}
      />

      <div className="relative w-full max-w-md z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-5 group">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-[#E8602E]/50 group-hover:shadow-[0_0_15px_rgba(232,96,46,0.3)] transition-all">
              <Shield className="h-6 w-6 text-[#E8602E]" />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Emergency Command Platform
          </h1>
          <p className="text-xs text-white/40 mt-1.5 uppercase tracking-widest font-bold">
            Authorized Personnel Only
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0B0B0B] rounded-2xl border border-white/5 shadow-2xl p-8">
          <h2 className="text-lg font-bold text-white mb-1">
            Department Login
          </h2>
          <p className="text-xs text-white/50 mb-6">
            Enter your credentials to access your department dashboard
          </p>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 p-3.5 mb-5 bg-red-950/40 border border-red-900/30 rounded-lg text-red-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2"
              >
                Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                className="w-full px-4 py-2.5 bg-[#121212] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8602E]/60 focus:ring-0 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 bg-[#121212] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8602E]/60 focus:ring-0 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
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
              className="w-full py-2.5 bg-[#E8602E] hover:bg-[#D74E1D] hover:shadow-[0_0_25px_rgba(232,96,46,0.4)] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-white/5 border border-white/5 rounded-lg">
            <p className="text-[10px] text-white/40 leading-relaxed">
              <span className="font-bold text-white/60">
                Security Notice:
              </span>{" "}
              This is a restricted government system. Unauthorized access
              attempts are logged and may result in legal prosecution.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">
            Government Emergency Command &bull; &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
