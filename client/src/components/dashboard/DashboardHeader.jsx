import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDarkMode } from "../../hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";
import { 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Plus, 
  Radio,
  Clock,
  TrendingUp,
  LayoutDashboard,
  Shield,
  Flame,
  PlusSquare,
  Activity
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
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-blue-500" },
    { label: "Police Panel", href: "/police", icon: Shield, color: "text-blue-600" },
    { label: "Fire Panel", href: "/fire", icon: Flame, color: "text-red-500" },
    { label: "Hospital Panel", href: "/hospital", icon: Activity, color: "text-emerald-500" },
    { label: "Analytics", href: "/analytics", icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="flex h-16 items-center px-4 md:px-8 justify-between">
        
        {/* Brand/Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-md shadow-red-500/20 group-hover:scale-105 transition-all">
              <ShieldAlert className="h-5 w-5 text-white" />
              <div className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-bold tracking-tight block leading-tight text-foreground">
                DISPATCH CENTRAL
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase block">
                AI Emergency Operations
              </span>
            </div>
          </Link>
          
          {/* Live Status indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/40">
            <Radio className={`h-4 w-4 ${socketConnected ? "text-emerald-500 animate-pulse" : "text-red-500 animate-pulse"}`} />
            <span className="text-xs font-medium">
              {socketConnected ? "SOCKET ACTIVE" : "SOCKET OFFLINE"}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                to={link.href}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isActive 
                    ? "bg-accent text-accent-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? link.color : "text-muted-foreground"}`} />
                {link.label.replace(" Panel", "")}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Time, Mute, Theme, Report Button */}
        <div className="flex items-center gap-3">
          
          {/* System Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border bg-muted/20">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </div>

          {/* Sound toggle button */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAudio}
            title={audioEnabled ? "Mute audio alerts" : "Unmute audio alerts"}
            className="h-9 w-9 rounded-lg border-muted/50 hover:bg-muted"
          >
            {audioEnabled ? (
              <Volume2 className="h-4 w-4 text-emerald-500 animate-pulse" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          {/* Dark mode button */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleDark}
            className="h-9 w-9 rounded-lg border-muted/50 hover:bg-muted"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-500 transition-all hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-blue-600" />
            )}
          </Button>

          {/* Direct Incident Submission Button */}
          {onReportClick && (
            <Button
              onClick={onReportClick}
              className="bg-red-600 hover:bg-red-500 text-white gap-2 font-semibold shadow-md shadow-red-500/25 h-9"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Incident</span>
            </Button>
          )}
        </div>

      </div>
    </header>
  );
};

export default DashboardHeader;
