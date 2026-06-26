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
  Clock,
  CheckCircle2,
  Truck,
  HeartHandshake,
  CheckCircle,
  Radio,
  ChevronRight,
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
        { label: "Command Overview", path: "/admin", icon: LayoutDashboard, accent: "#6366F1" },
        { label: "Analytics", path: "/analytics", icon: BarChart3, accent: "#8B5CF6" }
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
        items.push({ label: "Police Dept.", path: "/police?tab=pending", icon: Shield, accent: "#2563EB", isHeader: true });
      }
      if (isPolicePage) {
        const sub = [
          { label: "Pending Queue", path: "/police?tab=pending", icon: Clock, accent: "#F59E0B", isSub: true },
          { label: "Active Patrols", path: "/police?tab=active", icon: Shield, accent: "#2563EB", isSub: true },
          { label: "Closed Logs", path: "/police?tab=resolved", icon: CheckCircle2, accent: "#22C55E", isSub: true },
        ];
        if (user.role === "police") return sub;
        else items.push(...sub);
      }
    }

    if (showFire) {
      if (user.role === "admin") {
        items.push({ label: "Fire Dept.", path: "/fire?tab=pending", icon: Flame, accent: "#DC2626", isHeader: true });
      }
      if (isFirePage) {
        const sub = [
          { label: "Active Alarms", path: "/fire?tab=pending", icon: Clock, accent: "#F59E0B", isSub: true },
          { label: "Engines Dispatched", path: "/fire?tab=active", icon: Truck, accent: "#F97316", isSub: true },
          { label: "Resolved Incidents", path: "/fire?tab=resolved", icon: CheckCircle, accent: "#22C55E", isSub: true },
        ];
        if (user.role === "fire") return sub;
        else items.push(...sub);
      }
    }

    if (showHospital) {
      if (user.role === "admin") {
        items.push({ label: "Hospital Dept.", path: "/hospital?tab=pending", icon: Activity, accent: "#16A34A", isHeader: true });
      }
      if (isHospitalPage) {
        const sub = [
          { label: "Triage Queue", path: "/hospital?tab=pending", icon: Clock, accent: "#F59E0B", isSub: true },
          { label: "Ambulance En Route", path: "/hospital?tab=active", icon: Activity, accent: "#3B82F6", isSub: true },
          { label: "Admitted / Closed", path: "/hospital?tab=resolved", icon: HeartHandshake, accent: "#22C55E", isSub: true },
        ];
        if (user.role === "hospital") return sub;
        else items.push(...sub);
      }
    }

    return items;
  };

  const navItems = getNavItems();

  const roleConfig = {
    police:   { label: "Police Dept",  color: "#2563EB", bg: "rgba(37,99,235,0.12)" },
    fire:     { label: "Fire Brigade", color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
    hospital: { label: "Hospital EMS", color: "#16A34A", bg: "rgba(22,163,74,0.12)" },
    admin:    { label: "Super Admin",  color: "#7C3AED", bg: "rgba(124,58,237,0.12)" },
  };
  const role = roleConfig[user?.role] || { label: user?.role, color: "#64748B", bg: "rgba(100,116,139,0.12)" };

  return (
    <div className="min-h-screen flex" style={{ background: "#060913" }}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[220px] flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          background: "#080c18",
          borderRight: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-4 h-14"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#E8602E]/10 border border-[#E8602E]/25">
              <Zap className="h-3.5 w-3.5 text-[#E8602E]" />
            </div>
            <div>
              <p className="text-[13px] font-extrabold text-white leading-none tracking-tight">EMERGENCY</p>
              <p className="text-[9px] font-bold mt-0.5 text-white/40" style={{ letterSpacing: "0.08em" }}>
                COMMAND CENTER
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* User Profile */}
        {user && (
          <div className="px-3 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg"
              style={{ background: role.bg }}>
              <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                style={{ background: role.color }}>
                {user.displayName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white truncate leading-none">
                  {user.displayName}
                </p>
                <p className="text-[10px] mt-0.5 font-semibold" style={{ color: role.color }}>
                  {role.label}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <p className="section-label px-2 mb-2">Navigation</p>
          {navItems.map((item, idx) => {
            const isActive = isPathActive(item.path);
            const Icon = item.icon;

            if (item.isHeader && idx > 0) {
              return (
                <div key={`${item.path}-${idx}`}>
                  <div className="mx-2 my-2" style={{ height: "1px", background: "rgba(255,255,255,0.04)" }} />
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className="sidebar-nav-item"
                    style={isActive ? { background: `${item.accent}15`, color: item.accent } : {}}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r"
                        style={{ background: item.accent }} />
                    )}
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: isActive ? item.accent : "#475569" }} />
                    <span>{item.label}</span>
                  </Link>
                </div>
              );
            }

            if (item.isSub) {
              return (
                <Link
                  key={`${item.path}-${idx}`}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className="sidebar-nav-item pl-7 text-[12px]"
                  style={isActive ? { background: `${item.accent}12`, color: "#CBD5E1" } : {}}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: isActive ? item.accent : "#334155" }} />
                  <Icon className="h-3 w-3 flex-shrink-0" style={{ color: isActive ? item.accent : "#475569" }} />
                  <span className={isActive ? "text-white font-medium" : ""}>{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={`${item.path}-${idx}`}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className="sidebar-nav-item"
                style={isActive ? { background: `${item.accent}15`, color: item.accent } : {}}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r"
                    style={{ background: item.accent }} />
                )}
                <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: isActive ? item.accent : "#475569" }} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="h-3 w-3 ml-auto" style={{ color: item.accent }} />}
              </Link>
            );
          })}
        </nav>

        {/* System Status + Logout */}
        <div className="px-2 pb-3 space-y-1" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-2 px-3 py-2 mt-2">
            <span className="live-dot" />
            <span className="text-[10px] font-medium" style={{ color: "#475569" }}>System Active</span>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-nav-item w-full text-left"
            style={{ color: "#475569" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#EF4444"; }}
            onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "#475569"; }}
          >
            <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Bar */}
        <header
          className="sticky top-0 z-30 h-14 flex items-center px-4 lg:px-6 gap-4"
          style={{
            background: "rgba(6,9,19,0.85)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            backdropFilter: "blur(12px)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: "#64748B" }}
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold text-white truncate">{title || "Dashboard"}</h2>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <Radio className="h-3 w-3" style={{ color: "#22C55E" }} />
              <span className="text-[10px] font-semibold hidden sm:inline" style={{ color: "#22C55E", letterSpacing: "0.06em" }}>
                LIVE
              </span>
            </div>
            {headerActions}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
