import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDarkMode } from "../../hooks/useScrollAnimation";
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Plus,
  Radio,
  Clock,
  TrendingUp,
  LayoutDashboard,
  Shield,
  Flame,
  Activity,
  Zap,
} from "lucide-react";

const DashboardHeader = ({ socketConnected, onReportClick, audioEnabled, toggleAudio }) => {
  const [isDark, toggleDark] = useDarkMode();
  const [time, setTime] = useState(new Date());
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navLinks = [
    { label: "Dashboard",    href: "/dashboard", icon: LayoutDashboard, color: "#8B5CF6" },
    { label: "Police",       href: "/police",    icon: Shield,          color: "#3B82F6" },
    { label: "Fire",         href: "/fire",      icon: Flame,           color: "#EF4444" },
    { label: "Hospital",     href: "/hospital",  icon: Activity,        color: "#22C55E" },
    { label: "Analytics",    href: "/analytics", icon: TrendingUp,      color: "#8B5CF6" },
  ];

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: "rgba(9,9,11,0.92)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="flex h-14 items-center px-4 md:px-6 justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <Zap className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />
            </div>
            <div className="hidden sm:block">
              <p className="text-[12px] font-black text-white leading-none tracking-tight">DISPATCH CENTRAL</p>
              <p className="text-[9px] font-semibold mt-0.5 uppercase tracking-widest" style={{ color: "#6B7280" }}>
                AI Emergency Operations
              </p>
            </div>
          </Link>

          {/* Socket status */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              background: socketConnected ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
              border: `1px solid ${socketConnected ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"}`,
            }}
          >
            <Radio
              className="h-3 w-3"
              style={{ color: socketConnected ? "#22C55E" : "#EF4444" }}
            />
            <span className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: socketConnected ? "#22C55E" : "#EF4444" }}>
              {socketConnected ? "Socket Active" : "Offline"}
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href || location.pathname.startsWith(link.href + "?");
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                to={link.href}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all"
                style={{
                  background: isActive ? `${link.color}10` : "transparent",
                  color: isActive ? link.color : "#6B7280",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.color = "#D1D5DB";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#6B7280";
                  }
                }}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">

          {/* System Clock */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-semibold"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#6B7280",
            }}
          >
            <Clock className="h-3 w-3" />
            {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
          </div>

          {/* Sound toggle */}
          <button
            onClick={toggleAudio}
            title={audioEnabled ? "Mute audio alerts" : "Unmute audio alerts"}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          >
            {audioEnabled
              ? <Volume2 className="h-3.5 w-3.5" style={{ color: "#22C55E" }} />
              : <VolumeX className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />}
          </button>

          {/* Report Button */}
          {onReportClick && (
            <button
              onClick={onReportClick}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-white text-[11px] font-bold tracking-wide transition-all"
              style={{ background: "#EF4444" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Incident</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
