import { useState, useRef, useEffect } from "react";
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
  Search,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  Building,
} from "lucide-react";
import {
  BellIcon,
  ArrowDown01Icon,
} from "../watermelon/WatermelonIcons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const DashboardLayout = ({
  children,
  title,
  headerActions,
  audioEnabled,
  onToggleAudio,
  searchQuery,
  onSearchChange,
  notifications = [],
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const roleConfig = {
    police:   { label: "Police Dept",  color: "#3B82F6", bg: "rgba(59,130,246,0.12)", icon: Shield },
    fire:     { label: "Fire Brigade", color: "#EF4444", bg: "rgba(239,68,68,0.12)", icon: Flame },
    hospital: { label: "Hospital EMS", color: "#10B981", bg: "rgba(16,185,129,0.12)", icon: Activity },
    admin:    { label: "Super Admin",  color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", icon: Zap },
  };
  const role = roleConfig[user?.role] || { label: user?.role || "Operator", color: "#6B7280", bg: "rgba(107,114,128,0.12)", icon: Shield };
  const UserRoleIcon = role.icon;

  const getNavItems = () => {
    if (!user) return [];
    const items = [];

    if (user.role === "admin") {
      items.push(
        { label: "Central Command", path: "/admin", icon: LayoutDashboard, accent: "#8B5CF6" },
        { label: "Analytics & Trends", path: "/analytics", icon: BarChart3, accent: "#8B5CF6" }
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
        items.push({ label: "Police Dept", path: "/police?tab=pending", icon: Shield, accent: "#3B82F6", isHeader: true });
      }
      if (isPolicePage) {
        const sub = [
          { label: "Pending Queue", path: "/police?tab=pending", icon: Clock, accent: "#F59E0B", isSub: true },
          { label: "Active Patrols", path: "/police?tab=active", icon: Shield, accent: "#3B82F6", isSub: true },
          { label: "Closed Logs", path: "/police?tab=resolved", icon: CheckCircle2, accent: "#22C55E", isSub: true },
        ];
        if (user.role === "police") return sub;
        else items.push(...sub);
      }
    }

    if (showFire) {
      if (user.role === "admin") {
        items.push({ label: "Fire Dept", path: "/fire?tab=pending", icon: Flame, accent: "#EF4444", isHeader: true });
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
        items.push({ label: "Hospital EMS", path: "/hospital?tab=pending", icon: Activity, accent: "#10B981", isHeader: true });
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

  return (
    <div className="min-h-screen flex bg-background text-foreground selection:bg-primary/20">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── WATERMELON SIDEBAR ─────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border/40 transition-all duration-300 ease-in-out lg:static lg:z-auto max-w-[85vw]",
          sidebarCollapsed ? "w-[72px]" : "w-[240px]",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/30 shrink-0">
          <Link
            to={user?.role === "admin" ? "/admin" : `/${user?.role}`}
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <div
              className="flex size-9 items-center justify-center rounded-xl shrink-0"
              style={{
                backgroundColor: `${role.color}15`,
                border: `1px solid ${role.color}35`,
                color: role.color,
              }}
            >
              <Zap className="size-4.5" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black tracking-tight text-foreground leading-none">
                  EMERGENCY
                </span>
                <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mt-0.5">
                  COMMAND HQ
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* User Identity Pill */}
        {user && (
          <div className="p-3 border-b border-border/30 shrink-0">
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-xl p-2 transition-all",
                sidebarCollapsed ? "justify-center" : "bg-secondary/60 border border-border/40"
              )}
            >
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: role.color }}
              >
                {user.displayName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              {!sidebarCollapsed && (
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-xs font-bold text-foreground truncate leading-none">
                    {user.displayName || user.username}
                  </p>
                  <p
                    className="text-[10px] font-semibold mt-1 flex items-center gap-1.5"
                    style={{ color: role.color }}
                  >
                    <span
                      className="size-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: role.color }}
                    />
                    <span className="truncate">{role.label}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-2.5 overflow-y-auto">
          {!sidebarCollapsed && (
            <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Command Modules
            </p>
          )}

          {navItems.map((item, idx) => {
            const isActive = isPathActive(item.path);
            const Icon = item.icon;

            if (item.isHeader && idx > 0) {
              return (
                <div key={`${item.path}-${idx}`} className="pt-2">
                  <div className="h-[1px] bg-border/40 my-2 mx-1" />
                  <Link
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group",
                      isActive
                        ? "bg-secondary text-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                      sidebarCollapsed && "justify-center px-2"
                    )}
                  >
                    <Icon
                      className="size-4 shrink-0 transition-transform group-hover:scale-110"
                      style={{ color: isActive ? item.accent : undefined }}
                    />
                    {!sidebarCollapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <ChevronRight
                            className="size-3.5 ml-auto"
                            style={{ color: item.accent }}
                          />
                        )}
                      </>
                    )}
                  </Link>
                </div>
              );
            }

            if (item.isSub) {
              return (
                <Link
                  key={`${item.path}-${idx}`}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 py-1.5 text-xs font-medium rounded-lg transition-all",
                    sidebarCollapsed ? "justify-center px-2" : "pl-7 pr-3",
                    isActive
                      ? "text-foreground font-bold bg-secondary/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full shrink-0 transition-all",
                      isActive ? "scale-125" : "opacity-40"
                    )}
                    style={{ backgroundColor: isActive ? item.accent : "currentColor" }}
                  />
                  <Icon className="size-3.5 shrink-0" style={{ color: isActive ? item.accent : undefined }} />
                  {!sidebarCollapsed && (
                    <span className={cn("truncate", isActive ? "text-foreground font-semibold" : "")}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            }

            return (
              <Link
                key={`${item.path}-${idx}`}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                  isActive
                    ? "bg-secondary text-foreground font-bold border border-border/50 shadow-xs"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )}
              >
                <Icon
                  className="size-4 shrink-0 transition-transform group-hover:scale-110"
                  style={{ color: isActive ? item.accent : undefined }}
                />
                {!sidebarCollapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <ChevronRight
                        className="size-3.5 ml-auto"
                        style={{ color: item.accent }}
                      />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border/30 shrink-0 space-y-2">
          {/* Audio siren toggle */}
          {onToggleAudio && (
            <button
              onClick={onToggleAudio}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                audioEnabled
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              {audioEnabled ? (
                <Volume2 className="size-3.5 shrink-0" />
              ) : (
                <VolumeX className="size-3.5 shrink-0" />
              )}
              {!sidebarCollapsed && (
                <span className="truncate">
                  {audioEnabled ? "Siren Alert ON" : "Siren Muted"}
                </span>
              )}
            </button>
          )}

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground transition-all hover:bg-rose-500/10 hover:text-rose-400",
              sidebarCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="size-3.5 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── WATERMELON MAIN CONTAINER ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6 gap-3 bg-card/85 border-b border-border/40 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="size-5" />
            </Button>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex size-8 items-center justify-center rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ArrowDown01Icon className={cn("size-4 transition-transform", sidebarCollapsed ? "-rotate-90" : "rotate-90")} />
            </button>

            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground tracking-tight truncate">
                {title || "Emergency Operations Command"}
              </h2>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
            {/* Live Socket Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Radio className="size-3 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase hidden sm:inline">
                LIVE
              </span>
            </div>

            {/* Department Switcher Dropdown (Admin) */}
            {user?.role === "admin" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-xs font-semibold border-border/60 bg-secondary/40 hidden md:flex"
                  >
                    <Building className="size-3.5 text-muted-foreground" />
                    <span>Switch Unit</span>
                    <ChevronDown className="size-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-1.5 shadow-xl">
                  <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                    Select Department
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate("/admin")}
                    className="cursor-pointer gap-2 text-xs font-semibold"
                  >
                    <Zap className="size-3.5 text-purple-400" />
                    <span>Central Command</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/police?tab=pending")}
                    className="cursor-pointer gap-2 text-xs font-semibold"
                  >
                    <Shield className="size-3.5 text-blue-400" />
                    <span>Police Department</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/fire?tab=pending")}
                    className="cursor-pointer gap-2 text-xs font-semibold"
                  >
                    <Flame className="size-3.5 text-red-400" />
                    <span>Fire Brigade</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/hospital?tab=pending")}
                    className="cursor-pointer gap-2 text-xs font-semibold"
                  >
                    <Activity className="size-3.5 text-emerald-400" />
                    <span>Hospital EMS</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="relative size-8 rounded-lg border border-border/40"
                >
                  <BellIcon className="size-4 text-foreground" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 size-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 size-2 rounded-full bg-rose-500" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-2 shadow-2xl">
                <DropdownMenuLabel className="flex items-center justify-between text-xs font-bold px-2 py-1">
                  <span>Incident Notifications</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {notifications.length} Active
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-64 overflow-y-auto space-y-1 py-1">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-4">
                      No new alerts
                    </p>
                  ) : (
                    notifications.slice(0, 5).map((n, i) => (
                      <DropdownMenuItem
                        key={i}
                        className="flex flex-col items-start gap-1 p-2 rounded-md cursor-default text-xs"
                      >
                        <div className="flex items-center justify-between w-full font-semibold">
                          <span className="truncate">{n.title || n.name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {n.time || "Now"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {n.description || n.location}
                        </p>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {headerActions}
          </div>
        </header>

        {/* Page Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
