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

  // Helper to determine if a route item is active
  const isPathActive = (itemPath) => {
    const [path, search] = itemPath.split("?");
    if (location.pathname !== path) return false;
    if (!search) return !location.search;

    const currentTab = new URLSearchParams(location.search).get("tab") || "pending";
    const itemTab = new URLSearchParams("?" + search).get("tab");
    return currentTab === itemTab;
  };

  // Navigation items based on role
  const getNavItems = () => {
    if (!user) return [];

    const items = [];

    // Super Admin gets Command Overview and Analytics at top
    if (user.role === "admin") {
      items.push(
        {
          label: "Command Overview",
          path: "/admin",
          icon: LayoutDashboard,
          color: "#F8FAFC",
        },
        {
          label: "Analytics",
          path: "/analytics",
          icon: BarChart3,
          color: "#F8FAFC",
        }
      );
    }

    const showPolice = user.role === "admin" || user.role === "police";
    const showFire = user.role === "admin" || user.role === "fire";
    const showHospital = user.role === "admin" || user.role === "hospital";

    const isPolicePage = location.pathname.startsWith("/police");
    const isFirePage = location.pathname.startsWith("/fire");
    const isHospitalPage = location.pathname.startsWith("/hospital");

    // Police Section
    if (showPolice) {
      if (user.role === "admin") {
        items.push({
          label: "Police Department",
          path: "/police?tab=pending",
          icon: Shield,
          color: "#2563EB",
          isHeaderLink: true,
        });
      }

      if (isPolicePage) {
        const policeSub = [
          {
            label: "Pending Queue",
            path: "/police?tab=pending",
            icon: Clock,
            color: "#D97706",
            isSub: true,
          },
          {
            label: "Active Patrols",
            path: "/police?tab=active",
            icon: Shield,
            color: "#2563EB",
            isSub: true,
          },
          {
            label: "Closed Logs",
            path: "/police?tab=resolved",
            icon: CheckCircle2,
            color: "#16A34A",
            isSub: true,
          },
        ];
        
        if (user.role === "police") {
          return policeSub;
        } else {
          items.push(...policeSub);
        }
      }
    }

    // Fire Section
    if (showFire) {
      if (user.role === "admin") {
        items.push({
          label: "Fire Department",
          path: "/fire?tab=pending",
          icon: Flame,
          color: "#DC2626",
          isHeaderLink: true,
        });
      }

      if (isFirePage) {
        const fireSub = [
          {
            label: "Active Alarms",
            path: "/fire?tab=pending",
            icon: Clock,
            color: "#D97706",
            isSub: true,
          },
          {
            label: "Engines Dispatched",
            path: "/fire?tab=active",
            icon: Truck,
            color: "#EA580C",
            isSub: true,
          },
          {
            label: "Resolved Incidents",
            path: "/fire?tab=resolved",
            icon: CheckCircle,
            color: "#16A34A",
            isSub: true,
          },
        ];

        if (user.role === "fire") {
          return fireSub;
        } else {
          items.push(...fireSub);
        }
      }
    }

    // Hospital Section
    if (showHospital) {
      if (user.role === "admin") {
        items.push({
          label: "Hospital Department",
          path: "/hospital?tab=pending",
          icon: Activity,
          color: "#16A34A",
          isHeaderLink: true,
        });
      }

      if (isHospitalPage) {
        const hospitalSub = [
          {
            label: "Triage Queue",
            path: "/hospital?tab=pending",
            icon: Clock,
            color: "#D97706",
            isSub: true,
          },
          {
            label: "Ambulance En Route",
            path: "/hospital?tab=active",
            icon: Activity,
            color: "#2563EB",
            isSub: true,
          },
          {
            label: "Admitted / Closed",
            path: "/hospital?tab=resolved",
            icon: HeartHandshake,
            color: "#16A34A",
            isSub: true,
          },
        ];

        if (user.role === "hospital") {
          return hospitalSub;
        } else {
          items.push(...hospitalSub);
        }
      }
    }

    return items;
  };

  const navItems = getNavItems();

  const getRoleBadge = () => {
    if (!user) return null;
    const roleConfig = {
      police: { label: "Police", bg: "bg-[#2563EB]" },
      fire: { label: "Fire Brigade", bg: "bg-[#DC2626]" },
      hospital: { label: "Hospital", bg: "bg-[#16A34A]" },
      admin: { label: "Super Admin", bg: "bg-[#F59E0B]" },
    };
    const config = roleConfig[user.role] || {
      label: user.role,
      bg: "bg-gray-500",
    };
    return (
      <span
        className={`${config.bg} text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider`}
      >
        {config.label}
      </span>
    );
  };

  // Section header label for department-role users
  const getSectionLabel = () => {
    if (!user) return "Navigation";
    if (user.role === "admin") return "Navigation";
    if (user.role === "police") return "Police Operations";
    if (user.role === "fire") return "Fire Operations";
    if (user.role === "hospital") return "Medical Operations";
    return "Navigation";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-white flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold leading-tight">
                  Emergency Command
                </h1>
                <p className="text-[10px] text-white/50 font-medium">
                  Platform
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/60 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold">
                {user.displayName?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user.displayName}
                </p>
                {getRoleBadge()}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-bold text-white/40 uppercase tracking-wider">
            {getSectionLabel()}
          </p>
          {navItems.map((item, index) => {
            const isActive = isPathActive(item.path);
            const Icon = item.icon;

            // Separator before department header links
            if (item.isHeaderLink && index > 0) {
              return (
                <div key={`${item.path}-${index}`}>
                  <div className="my-2 mx-3 border-t border-white/5" />
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white/10 text-white font-bold"
                        : "text-white/60 hover:bg-white/5 hover:text-white/90"
                    }`}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: isActive ? item.color : undefined }}
                    />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="h-3.5 w-3.5 ml-auto text-white/40" />
                    )}
                  </Link>
                </div>
              );
            }

            return (
              <Link
                key={`${item.path}-${index}`}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  item.isSub 
                    ? "pl-8 pr-3 text-xs" 
                    : "px-3"
                } ${
                  isActive
                    ? item.isSub
                      ? "bg-white/8 text-white font-bold"
                      : "bg-white/10 text-white font-bold"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                }`}
              >
                {item.isSub && (
                  <span className={`w-1 h-1 rounded-full shrink-0 ${isActive ? "bg-current" : "bg-white/20"}`} />
                )}
                <Icon
                  className={`shrink-0 ${item.isSub ? "h-3.5 w-3.5" : "h-4 w-4"}`}
                  style={{ color: isActive ? item.color : undefined }}
                />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <ChevronRight className="h-3.5 w-3.5 ml-auto text-white/30" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#E2E8F0] flex items-center px-4 lg:px-6 gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page title */}
          <h2 className="text-base font-bold text-[#0F172A] truncate">
            {title || "Dashboard"}
          </h2>

          <div className="ml-auto flex items-center gap-3">
            {/* Connection indicator */}
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] mr-1">
              <Radio className="h-3.5 w-3.5 text-[#16A34A]" />
              <span className="hidden sm:inline font-medium">System Active</span>
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
