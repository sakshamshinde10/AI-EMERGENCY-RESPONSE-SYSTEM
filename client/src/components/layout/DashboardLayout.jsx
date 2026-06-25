import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Shield,
  Flame,
  Activity,
  LayoutDashboard,
  BarChart3,
  LogOut,
  Menu,
  X,
  Radio,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  HeartHandshake,
  CheckCircle,
  Zap,
} from "lucide-react";

const DashboardLayout = ({ children, title, headerActions }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isPathActive = (itemPath) => {
    const [path, search] = itemPath.split("?");
    if (location.pathname !== path) return false;
    if (!search) return !location.search;
    const currentTab = new URLSearchParams(location.search).get("tab") || "pending";
    const itemTab = new URLSearchParams("?" + search).get("tab");
    return currentTab === itemTab;
  };

  const getNavItems = () => {
    if (!user) return [];
    const items = [];

    if (user.role === "admin") {
      items.push(
        { label: "Command Overview", path: "/admin", icon: LayoutDashboard, color: "#6366F1", accent: "indigo" },
        { label: "Analytics", path: "/analytics", icon: BarChart3, color: "#8B5CF6", accent: "violet" }
      );
    }

    const showPolice = user.role === "admin" || user.role === "police";
    const showFire = user.role === "admin" || user.role === "fire";
    const showHospital = user.role === "admin" || user.role === "hospital";
    const isPolicePage = location.pathname.startsWith("/police");
    const isFirePage = location.pathname.startsWith("/fire");
    const isHospitalPage = location.pathname.startsWith("/hospital");

    if (showPolice) {
      if (user.role === "admin") {
        items.push({ label: "Police Department", path: "/police?tab=pending", icon: Shield, color: "#6366F1", accent: "indigo", isHeaderLink: true });
      }
      if (isPolicePage) {
        const policeSub = [
          { label: "Pending Queue", path: "/police?tab=pending", icon: Clock, color: "#F59E0B", accent: "amber", isSub: true },
          { label: "Active Patrols", path: "/police?tab=active", icon: Shield, color: "#6366F1", accent: "indigo", isSub: true },
          { label: "Closed Logs", path: "/police?tab=resolved", icon: CheckCircle2, color: "#10B981", accent: "emerald", isSub: true },
        ];
        if (user.role === "police") return policeSub;
        else items.push(...policeSub);
      }
    }

    if (showFire) {
      if (user.role === "admin") {
        items.push({ label: "Fire Department", path: "/fire?tab=pending", icon: Flame, color: "#EF4444", accent: "red", isHeaderLink: true });
      }
      if (isFirePage) {
        const fireSub = [
          { label: "Active Alarms", path: "/fire?tab=pending", icon: Clock, color: "#F59E0B", accent: "amber", isSub: true },
          { label: "Engines Dispatched", path: "/fire?tab=active", icon: Truck, color: "#F97316", accent: "orange", isSub: true },
          { label: "Resolved Incidents", path: "/fire?tab=resolved", icon: CheckCircle, color: "#10B981", accent: "emerald", isSub: true },
        ];
        if (user.role === "fire") return fireSub;
        else items.push(...fireSub);
      }
    }

    if (showHospital) {
      if (user.role === "admin") {
        items.push({ label: "Hospital Department", path: "/hospital?tab=pending", icon: Activity, color: "#10B981", accent: "emerald", isHeaderLink: true });
      }
      if (isHospitalPage) {
        const hospitalSub = [
          { label: "Triage Queue", path: "/hospital?tab=pending", icon: Clock, color: "#F59E0B", accent: "amber", isSub: true },
          { label: "Ambulance En Route", path: "/hospital?tab=active", icon: Activity, color: "#3B82F6", accent: "blue", isSub: true },
          { label: "Admitted / Closed", path: "/hospital?tab=resolved", icon: HeartHandshake, color: "#10B981", accent: "emerald", isSub: true },
        ];
        if (user.role === "hospital") return hospitalSub;
        else items.push(...hospitalSub);
      }
    }

    return items;
  };

  const navItems = getNavItems();

  const getRoleBadge = () => {
    if (!user) return null;
    const roleConfig = {
      police: { label: "Police", gradient: "from-indigo-500 to-blue-600" },
      fire: { label: "Fire Brigade", gradient: "from-red-500 to-rose-600" },
      hospital: { label: "Hospital", gradient: "from-emerald-500 to-teal-600" },
      admin: { label: "Super Admin", gradient: "from-amber-400 to-orange-500" },
    };
    const config = roleConfig[user.role] || { label: user.role, gradient: "from-gray-500 to-gray-600" };
    return (
      <span className={`bg-gradient-to-r ${config.gradient} text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm`}>
        {config.label}
      </span>
    );
  };

  const getSectionLabel = () => {
    if (!user) return "Navigation";
    if (user.role === "admin") return "Navigation";
    if (user.role === "police") return "Police Operations";
    if (user.role === "fire") return "Fire Operations";
    if (user.role === "hospital") return "Medical Operations";
    return "Navigation";
  };

  // Avatar initials + gradient bg based on role
  const getAvatarGradient = () => {
    if (!user) return "from-gray-600 to-gray-700";
    const map = {
      admin: "from-amber-400 to-orange-500",
      police: "from-indigo-500 to-blue-600",
      fire: "from-red-500 to-rose-600",
      hospital: "from-emerald-500 to-teal-600",
    };
    return map[user.role] || "from-gray-500 to-gray-600";
  };

  return (
    <div className="min-h-screen text-white flex" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0d0d18 50%, #0a0f0a 100%)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══ SIDEBAR ═══ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg, #0b0b14 0%, #080810 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Brand */}
        <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo mark */}
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 opacity-20 blur-sm" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Zap className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight tracking-tight">Emergency Command</h1>
                <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">Platform</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-sm font-black text-white shadow-lg flex-shrink-0`}>
                {user.displayName?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                <div className="mt-0.5">{getRoleBadge()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-3 text-[9px] font-bold text-white/25 uppercase tracking-widest">
            {getSectionLabel()}
          </p>

          {navItems.map((item, index) => {
            const isActive = isPathActive(item.path);
            const Icon = item.icon;

            if (item.isHeaderLink && index > 0) {
              return (
                <div key={`${item.path}-${index}`}>
                  <div className="my-3 mx-2" style={{ height: "1px", background: "rgba(255,255,255,0.04)" }} />
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative"
                    style={
                      isActive
                        ? {
                            background: `linear-gradient(135deg, ${item.color}18 0%, ${item.color}08 100%)`,
                            border: `1px solid ${item.color}25`,
                          }
                        : {}
                    }
                  >
                    {isActive && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    <Icon
                      className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
                      style={{ color: isActive ? item.color : "rgba(255,255,255,0.35)" }}
                    />
                    <span className={`truncate ${isActive ? "text-white font-bold" : "text-white/50 group-hover:text-white/80"}`}>
                      {item.label}
                    </span>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto" style={{ color: item.color }} />}
                  </Link>
                </div>
              );
            }

            if (item.isSub) {
              return (
                <Link
                  key={`${item.path}-${index}`}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2.5 pl-7 pr-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group"
                  style={
                    isActive
                      ? {
                          background: `linear-gradient(135deg, ${item.color}15 0%, ${item.color}05 100%)`,
                          border: `1px solid ${item.color}20`,
                        }
                      : {}
                  }
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200"
                    style={{ backgroundColor: isActive ? item.color : "rgba(255,255,255,0.15)" }}
                  />
                  <Icon
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: isActive ? item.color : "rgba(255,255,255,0.3)" }}
                  />
                  <span className={isActive ? "text-white font-semibold" : "text-white/40 group-hover:text-white/70"}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={`${item.path}-${index}`}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative"
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, ${item.color}18 0%, ${item.color}08 100%)`,
                        border: `1px solid ${item.color}25`,
                      }
                    : {}
                }
              >
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <Icon
                  className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ color: isActive ? item.color : "rgba(255,255,255,0.35)" }}
                />
                <span className={`truncate ${isActive ? "text-white font-bold" : "text-white/50 group-hover:text-white/80"}`}>
                  {item.label}
                </span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto" style={{ color: item.color }} />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
          >
            <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Bar */}
        <header
          className="sticky top-0 z-30 h-14 flex items-center px-4 lg:px-6 gap-4"
          style={{
            background: "rgba(10,10,18,0.85)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            backdropFilter: "blur(16px)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white truncate">{title || "Dashboard"}</h2>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider hidden sm:inline">System Active</span>
            </div>
            {headerActions}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
