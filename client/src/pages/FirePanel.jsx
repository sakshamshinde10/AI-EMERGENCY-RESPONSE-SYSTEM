import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getFireEmergencies, updateEmergencyStatus } from "../services/emergencyApi";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import ReportEmergencyDialog from "../components/dashboard/ReportEmergencyDialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import { 
  Flame, 
  Search, 
  Clock, 
  Phone, 
  CheckCircle, 
  Loader2,
  Inbox,
  Truck,
  Volume2,
  VolumeX,
  MapPin,
  AlertTriangle,
  RefreshCw,
  LayoutGrid,
  List,
} from "lucide-react";

// Web Audio API beep sound generator
const playAlertSound = (priority) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    oscillator.start();
    
    oscillator.frequency.linearRampToValueAtTime(750, audioCtx.currentTime + 0.2);
    oscillator.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.4);
    gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime + 0.45);
    
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (error) {
    console.log("AudioContext playback failed", error);
  }
};

const FirePanel = () => {
  const [fireCases, setFireCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [expandedMapCardId, setExpandedMapCardId] = useState(null);
  const socketRef = useRef(null);

  const location = useLocation();
  const currentTab = new URLSearchParams(location.search).get("tab") || "pending";

  const fetchFireCases = async () => {
    try {
      const data = await getFireEmergencies();
      if (data.success && data.data) {
        setFireCases(data.data);
      } else if (Array.isArray(data)) {
        setFireCases(data);
      } else if (data.data) {
        setFireCases(data.data);
      }
    } catch (error) {
      console.log("Error fetching fire cases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFireCases();

    socketRef.current = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    const socket = socketRef.current;

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    const handleNewEmergency = (emergency) => {
      if (emergency.department === "Fire" || emergency.department === "Fire Brigade") {
        setFireCases((prevCases) => [emergency, ...prevCases]);
        
        if (audioEnabled) {
          playAlertSound(emergency.priority);
        }

        toast.error(`FIRE ALARM: STATION DISPATCH REQUESTED`, {
          description: `Caller: ${emergency.name} | Priority: ${emergency.priority}`,
          duration: 7000,
        });
      }
    };

    const handleStatusUpdated = (updatedEmergency) => {
      setFireCases((prevCases) =>
        prevCases.map((c) => (c._id === updatedEmergency._id ? updatedEmergency : c))
      );
    };

    socket.on("new-emergency", handleNewEmergency);
    socket.on("status-updated", handleStatusUpdated);

    return () => {
      socket.disconnect();
    };
  }, [audioEnabled]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await updateEmergencyStatus(id, status);
      if (response.success && response.data) {
        setFireCases((prevCases) =>
          prevCases.map((c) => (c._id === id ? response.data : c))
        );
        toast.success(`Fire Record Updated`, {
          description: `Status changed to: ${status}`,
        });
      } else {
        fetchFireCases();
        toast.success(`Fire Record Updated`, {
          description: `Status changed to: ${status}`,
        });
      }
    } catch (error) {
      console.log("Error updating status:", error);
      toast.error("Operation failed");
    }
  };

  const filteredCases = fireCases.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.location?.toLowerCase().includes(query) ||
      item.address?.toLowerCase().includes(query) ||
      item.area?.toLowerCase().includes(query) ||
      item.city?.toLowerCase().includes(query) ||
      item.landmark?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.message?.toLowerCase().includes(query)
    );
  });

  const pending = filteredCases.filter((c) => c.status === "Pending");
  const inProgress = filteredCases.filter((c) => c.status === "InProgress");
  const resolved = filteredCases.filter((c) => c.status === "Resolved");

  // All counts (unfiltered) for stats
  const allPending = fireCases.filter((c) => c.status === "Pending");
  const allInProgress = fireCases.filter((c) => c.status === "InProgress");
  const allResolved = fireCases.filter((c) => c.status === "Resolved");
  const criticalCount = fireCases.filter((c) => c.priority === "Critical" && c.status !== "Resolved").length;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-950/40 text-red-400 border-red-800/40 font-bold";
      case "High":
        return "bg-orange-950/40 text-orange-400 border-orange-800/40 font-bold";
      case "Medium":
        return "bg-yellow-950/40 text-yellow-400 border-yellow-850/40 font-bold";
      default:
        return "bg-blue-950/40 text-blue-400 border-blue-800/40 font-bold";
    }
  };

  const getAccentByPriority = (priority) => {
    switch (priority) {
      case "Critical": return "border-l-red-600";
      case "High": return "border-l-orange-500";
      case "Medium": return "border-l-amber-500";
      default: return "border-l-blue-500";
    }
  };

  const currentList = currentTab === "pending" ? pending : currentTab === "active" ? inProgress : resolved;

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setAudioEnabled(!audioEnabled)}
        title={audioEnabled ? "Mute audio alerts" : "Unmute audio alerts"}
        className="h-9 w-9 rounded-lg border-white/10 bg-[#0B0B0B] hover:bg-white/5 shrink-0"
      >
        {audioEnabled ? (
          <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse" />
        ) : (
          <VolumeX className="h-4 w-4 text-white/40" />
        )}
      </Button>

      <Button
        onClick={() => setReportDialogOpen(true)}
        className="bg-[#DC2626] hover:bg-[#B91C1C] hover:shadow-lg hover:shadow-red-500/25 text-white font-semibold text-xs h-9 px-4 gap-1.5 rounded-lg border-none"
      >
        <span>+ File Report</span>
      </Button>
    </div>
  );

  // --- CARD RENDERER ---
  const renderCaseCard = (item) => (
    <div
      key={item._id}
      className={`bg-[#0B0B0B] rounded-xl border border-white/5 hover:border-white/15 shadow-2xl transition-all duration-200 overflow-hidden border-l-[3px] ${getAccentByPriority(item.priority)} group`}
    >
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 truncate flex-1">
            <h3 className="text-sm font-bold text-white leading-tight truncate">
              {item.name}
            </h3>
            {item.language && item.language !== "English" && (
              <Badge className="bg-purple-950/40 text-purple-400 border-purple-800/40 text-[9px] px-1 py-0 shrink-0 hover:bg-purple-900/30" variant="outline">
                {item.language === "Hindi" ? "🇮🇳 Hindi" : item.language === "Marathi" ? "🇮🇳 Marathi" : item.language}
              </Badge>
            )}
          </div>
          <Badge className={`${getPriorityColor(item.priority)} text-[10px] px-1.5 py-0 shrink-0`} variant="outline">
            {item.priority}
          </Badge>
        </div>

        <p className="text-xs text-white/60 leading-relaxed line-clamp-2 mb-3">
          {item.description || item.message}
        </p>

        <div className="flex flex-col gap-1.5">
          {(item.address || item.location) && (
            <div className="flex items-start gap-1.5 text-[11px] text-white/95 font-semibold bg-white/5 border border-white/5 rounded-lg p-2" title={item.address || item.location}>
              <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="leading-tight">{item.address || item.location}</span>
                {item.area && <span className="text-[9px] text-white/40 font-bold">Area: {item.area}</span>}
              </div>
            </div>
          )}
          {item.landmark && (
            <div className="flex items-center gap-1.5 text-[10px] text-purple-400 bg-purple-950/30 border border-purple-800/20 rounded px-1.5 py-0.5 w-fit font-bold">
              <span className="text-[8px] uppercase tracking-wider text-purple-500">Landmark:</span>
              <span className="truncate">{item.landmark}</span>
            </div>
          )}
          {item.phone && (
            <div className="flex items-center gap-1.5 text-[11px] text-white/40">
              <Phone className="h-3 w-3 text-white/20 shrink-0" />
              <span>{item.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-white/50">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="font-mono">{formatTime(item.createdAt)}</span>
            <span className="text-white/20">·</span>
            <span>{formatDate(item.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
        <div className="flex gap-2">
          {/* Map Toggle Button */}
          {(item.latitude || item.address || item.location) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedMapCardId(expandedMapCardId === item._id ? null : item._id)}
              className={`flex-1 font-bold text-[10px] h-8 rounded-lg flex items-center justify-center gap-1 border-white/10 bg-[#0B0B0B] hover:bg-[#121212] text-white hover:text-white ${expandedMapCardId === item._id ? 'bg-white/10 text-white' : ''}`}
            >
              📍 {expandedMapCardId === item._id ? 'Hide Map' : 'View Map'}
            </Button>
          )}

          {currentTab === "pending" && (
            <Button
              onClick={() => handleUpdateStatus(item._id, "InProgress")}
              className="flex-grow bg-[#DC2626] hover:bg-[#B91C1C] hover:shadow-lg hover:shadow-red-500/20 text-white font-bold text-xs h-8 rounded-lg flex items-center justify-center gap-1.5 border-none shadow-sm cursor-pointer transition-all duration-200"
            >
              <Truck className="h-3.5 w-3.5" /> Dispatch Engines
            </Button>
          )}
          {currentTab === "active" && (
            <Button
              onClick={() => handleUpdateStatus(item._id, "Resolved")}
              className="flex-grow bg-[#16A34A] hover:bg-[#15803D] hover:shadow-lg hover:shadow-green-500/20 text-white font-bold text-xs h-8 rounded-lg flex items-center justify-center gap-1.5 border-none shadow-sm cursor-pointer transition-all duration-200"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Hazard Resolved
            </Button>
          )}
          {currentTab === "resolved" && (
            <span className="text-[#16A34A] text-[10px] font-bold flex items-center justify-center gap-1 py-1.5 border border-[#16A34A]/20 bg-[#16A34A]/10 rounded-lg flex-grow">
              <CheckCircle className="h-3.5 w-3.5" /> Secured
            </span>
          )}
        </div>

        {/* Embedded Interactive Google Map */}
        {expandedMapCardId === item._id && (
          <div className="w-full h-40 border border-white/10 rounded-lg overflow-hidden mt-1 animate-fade-in">
            <iframe
              width="100%"
              height="100%"
              src={
                item.latitude && item.longitude
                  ? `https://maps.google.com/maps?q=${item.latitude},${item.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                  : `https://maps.google.com/maps?q=${encodeURIComponent(item.address || item.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
              }
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              title="Incident Location Map"
              className="opacity-80 invert filter contrast-125"
            />
          </div>
        )}
      </div>
    </div>
  );

  // --- TABLE ROW RENDERER ---
  const renderTableRow = (item, index) => (
    <tr
      key={item._id}
      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
        index % 2 === 0 ? "bg-[#0B0B0B]" : "bg-[#0E0E0E]"
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            item.priority === "Critical" ? "bg-red-500 animate-pulse" :
            item.priority === "High" ? "bg-orange-500" :
            item.priority === "Medium" ? "bg-amber-500" : "bg-blue-500"
          }`} />
          <span className="text-sm font-semibold text-white truncate max-w-[180px]">{item.name}</span>
          {item.language && item.language !== "English" && (
            <Badge className="bg-purple-950/40 text-purple-400 border-purple-800/40 text-[9px] px-1 py-0 shrink-0" variant="outline">
              {item.language === "Hindi" ? "🇮🇳 Hindi" : item.language === "Marathi" ? "🇮🇳 Marathi" : item.language}
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge className={`${getPriorityColor(item.priority)} text-[10px] px-1.5 py-0`} variant="outline">
          {item.priority}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-white/50 truncate max-w-[250px]">{item.description || item.message}</p>
      </td>
      <td className="px-4 py-3">
        {(item.address || item.location) && (
          <div className="flex flex-col gap-0.5 max-w-[200px]" title={item.address || item.location}>
            <div className="flex items-center gap-1 text-xs text-white font-bold">
              <MapPin className="h-3 w-3 text-red-500 shrink-0" />
              <span className="truncate">{item.address || item.location}</span>
            </div>
            {item.landmark && (
              <span className="text-[9px] font-semibold text-purple-400 bg-purple-950/30 border border-purple-800/20 px-1.5 py-0.5 rounded-md w-fit">
                {item.landmark}
              </span>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-white/40 font-mono">{formatDate(item.createdAt)}</span>
      </td>
      <td className="px-4 py-3 text-right">
        {currentTab === "pending" && (
          <Button
            size="sm"
            onClick={() => handleUpdateStatus(item._id, "InProgress")}
            className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-[10px] h-7 px-3 rounded-md gap-1 cursor-pointer border-none"
          >
            <Truck className="h-3 w-3" /> Dispatch
          </Button>
        )}
        {currentTab === "active" && (
          <Button
            size="sm"
            onClick={() => handleUpdateStatus(item._id, "Resolved")}
            className="bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[10px] h-7 px-3 rounded-md gap-1 cursor-pointer border-none"
          >
            <CheckCircle className="h-3 w-3" /> Resolve
          </Button>
        )}
        {currentTab === "resolved" && (
          <span className="text-[#16A34A] text-[10px] font-bold flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Closed
          </span>
        )}
      </td>
    </tr>
  );

  // --- EMPTY STATE ---
  const renderEmptyState = () => {
    const emptyConfig = {
      pending: { icon: Inbox, text: "No active fire alarms in queue.", color: "text-red-400" },
      active: { icon: Truck, text: "No engine units dispatched at present.", color: "text-orange-400" },
      resolved: { icon: CheckCircle, text: "No closed hazard logs found.", color: "text-emerald-400" },
    };
    const cfg = emptyConfig[currentTab] || emptyConfig.pending;
    const Icon = cfg.icon;
    return (
      <div className="text-center py-24 flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-4">
          <Icon className={`h-7 w-7 ${cfg.color}`} />
        </div>
        <p className="text-sm font-semibold text-white/70 mb-1">{cfg.text}</p>
        <p className="text-xs text-white/40">New alarms will appear here automatically via live feed.</p>
      </div>
    );
  };

  return (
    <DashboardLayout title="Fire & Hazard Containment" headerActions={headerActions}>
      <Toaster position="top-right" richColors />
      
      <div className="flex flex-col gap-6">
        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`rounded-xl border p-4 transition-all ${
            currentTab === "pending" 
              ? "border-red-500/50 bg-[#0B0B0B] shadow-[0_0_20px_rgba(239,68,68,0.05)]" 
              : "border-white/5 bg-[#0B0B0B]"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Active Alarms</span>
              <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Flame className="h-3.5 w-3.5 text-red-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{allPending.length}</p>
            <p className="text-[10px] text-white/30 mt-0.5">Awaiting response</p>
          </div>

          <div className={`rounded-xl border p-4 transition-all ${
            currentTab === "active" 
              ? "border-orange-500/50 bg-[#0B0B0B] shadow-[0_0_20px_rgba(245,158,11,0.05)]" 
              : "border-white/5 bg-[#0B0B0B]"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Dispatched</span>
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Truck className="h-3.5 w-3.5 text-orange-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{allInProgress.length}</p>
            <p className="text-[10px] text-white/30 mt-0.5">Engines en route</p>
          </div>

          <div className={`rounded-xl border p-4 transition-all ${
            currentTab === "resolved" 
              ? "border-emerald-500/50 bg-[#0B0B0B] shadow-[0_0_20px_rgba(16,185,129,0.05)]" 
              : "border-white/5 bg-[#0B0B0B]"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Resolved</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{allResolved.length}</p>
            <p className="text-[10px] text-white/30 mt-0.5">Hazards secured</p>
          </div>

          <div className="bg-[#0B0B0B] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Critical</span>
              <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{criticalCount}</p>
            <p className="text-[10px] text-white/30 mt-0.5">Need immediate action</p>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className={`flex h-2 w-2 rounded-full ${
                currentTab === "pending" ? "bg-red-500 animate-pulse" :
                currentTab === "active" ? "bg-orange-500 animate-pulse" : "bg-emerald-500"
              }`} />
              {currentTab === "pending" ? "Active Alarms Queue" :
               currentTab === "active" ? "Engines Dispatched" : "Resolved Incidents"}
            </h2>
            <Badge variant="secondary" className="bg-white/5 text-white/70 border border-white/10 font-bold text-[10px] px-2 rounded-full">
              {currentList.length}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <Input
                placeholder="Search fire cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-[#0B0B0B] border-white/10 text-white placeholder:text-white/30 focus:border-[#DC2626]/50 rounded-lg focus:ring-0"
              />
            </div>

            <div className="flex items-center border border-white/10 bg-[#0B0B0B] rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 transition-colors cursor-pointer ${viewMode === "grid" ? "bg-white/10 text-white" : "bg-transparent text-white/40 hover:text-white/70"}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 transition-colors cursor-pointer ${viewMode === "table" ? "bg-white/10 text-white" : "bg-transparent text-white/40 hover:text-white/70"}`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={fetchFireCases}
              className="h-8 w-8 border-white/10 bg-[#0B0B0B] hover:bg-white/5 shrink-0 rounded-lg text-white/60 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/40 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#DC2626]" />
            <p className="text-sm font-semibold text-white/60">Syncing station alarm status...</p>
          </div>
        ) : currentList.length === 0 ? (
          renderEmptyState()
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentList.map((item) => renderCaseCard(item))}
          </div>
        ) : (
          <div className="bg-[#0B0B0B] rounded-xl border border-white/5 shadow-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0E0E0E] border-b border-white/5">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-white/40 uppercase tracking-wider">Caller</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-white/40 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-white/40 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-white/40 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-white/40 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-white/40 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((item, index) => renderTableRow(item, index))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Incident reporting modal */}
      <ReportEmergencyDialog 
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        onSuccess={fetchFireCases}
      />
    </DashboardLayout>
  );
};

export default FirePanel;