import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getPoliceEmergencies, updateEmergencyStatus } from "../services/emergencyApi";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import ReportEmergencyDialog from "../components/dashboard/ReportEmergencyDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import { 
  Shield, 
  Search, 
  Clock, 
  Phone, 
  CheckCircle, 
  Play, 
  Loader2,
  Inbox,
  Volume2,
  VolumeX,
  MapPin,
  AlertTriangle,
  RefreshCw,
  LayoutGrid,
  List,
} from "lucide-react";

const playAlertSound = (priority) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    oscillator.start();
    
    oscillator.frequency.linearRampToValueAtTime(1000, audioCtx.currentTime + 0.15);
    oscillator.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    oscillator.stop(audioCtx.currentTime + 0.35);
  } catch (error) {
    console.log("AudioContext playback failed", error);
  }
};

const PolicePanel = () => {
  const [policeCases, setPoliceCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [expandedMapCardId, setExpandedMapCardId] = useState(null);
  const [newAssignmentBanner, setNewAssignmentBanner] = useState(null);
  const socketRef = useRef(null);
  const audioEnabledRef = useRef(audioEnabled);
  const fetchPoliceCasesRef = useRef(null);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  const location = useLocation();
  const currentTab = new URLSearchParams(location.search).get("tab") || "pending";

  const fetchPoliceCases = async () => {
    try {
      const data = await getPoliceEmergencies();
      if (data.success && data.data) {
        setPoliceCases(data.data);
      } else if (Array.isArray(data)) {
        setPoliceCases(data);
      } else if (data.data) {
        setPoliceCases(data.data);
      }
    } catch (error) {
      console.log("Error fetching police cases:", error);
    } finally {
      setLoading(false);
    }
  };

  // Keep a ref to always call the latest fetchPoliceCases from socket handlers
  useEffect(() => { fetchPoliceCasesRef.current = fetchPoliceCases; });

  useEffect(() => {
    fetchPoliceCases();

    socketRef.current = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    const socket = socketRef.current;

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    const handleNewEmergency = (emergency) => {
      if (emergency.department === "Police") {
        setPoliceCases((prevCases) => [emergency, ...prevCases]);
        
        if (audioEnabledRef.current) {
          playAlertSound(emergency.priority);
        }

        toast.error(`TACTICAL ALERT: POLICE DISPATCH REQUIRED`, {
          description: `Caller: ${emergency.name} | Priority: ${emergency.priority}`,
          duration: 7000,
        });
      }
    };

    const handleStatusUpdated = (updatedEmergency) => {
      if (!updatedEmergency) return;
      if (updatedEmergency.department === "Police") {
        setPoliceCases((prevCases) => {
          const exists = prevCases.some((c) => c._id === updatedEmergency._id);
          if (exists) {
            // Update the existing record in-place
            return prevCases.map((c) => (c._id === updatedEmergency._id ? updatedEmergency : c));
          } else {
            // Newly assigned to Police by admin — do a full server re-fetch
            // to guarantee accuracy regardless of timing
            if (fetchPoliceCasesRef.current) fetchPoliceCasesRef.current();
            if (audioEnabledRef.current) playAlertSound(updatedEmergency.priority);
            toast.error(`UNIT ASSIGNED: POLICE DISPATCH`, {
              description: `${updatedEmergency.name} | Priority: ${updatedEmergency.priority} | Check PENDING tab`,
              duration: 9000,
            });
            setNewAssignmentBanner(updatedEmergency);
            return [updatedEmergency, ...prevCases];
          }
        });
      } else {
        // Department was changed away from Police — remove from this panel
        setPoliceCases((prevCases) =>
          prevCases.filter((c) => c._id !== updatedEmergency._id)
        );
      }
    };

    socket.on("new-emergency", handleNewEmergency);
    socket.on("status-updated", handleStatusUpdated);

    return () => {
      socket.off("new-emergency", handleNewEmergency);
      socket.off("status-updated", handleStatusUpdated);
      socket.disconnect();
    };
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await updateEmergencyStatus(id, status);
      if (response.success && response.data) {
        setPoliceCases((prevCases) =>
          prevCases.map((c) => (c._id === id ? response.data : c))
        );
        toast.success(`Unit Status Updated`, {
          description: `Case updated to ${status}`,
        });
      } else {
        fetchPoliceCases();
        toast.success(`Unit Status Updated`, {
          description: `Case status set to ${status}`,
        });
      }
    } catch (error) {
      console.log("Failed to update status:", error);
      toast.error("Operation failed", {
        description: "Failed to update patrol status.",
      });
    }
  };

  const filteredCases = policeCases.filter((item) => {
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

  const allPending = policeCases.filter((c) => c.status === "Pending");
  const allInProgress = policeCases.filter((c) => c.status === "InProgress");
  const allResolved = policeCases.filter((c) => c.status === "Resolved");
  const criticalCount = policeCases.filter((c) => c.priority === "Critical" && c.status !== "Resolved").length;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "High":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  const getBorderColor = (priority) => {
    switch (priority) {
      case "Critical": return "border-l-red-500";
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
        className="h-8 w-8 rounded-lg border-white/10 bg-white/5 hover:bg-white/10 shrink-0 text-slate-300 hover:text-white"
      >
        {audioEnabled ? (
          <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse" />
        ) : (
          <VolumeX className="h-4 w-4 text-slate-500" />
        )}
      </Button>

      <Button
        onClick={() => setReportDialogOpen(true)}
        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-8 px-3 rounded-lg border-none shadow-lg shadow-blue-500/20"
      >
        <span>+ Log Incident</span>
      </Button>
    </div>
  );

  const renderCaseCard = (item) => (
    <div
      key={item._id}
      className={`bg-[#0d1222]/85 backdrop-blur-md rounded-xl border border-white/5 hover:border-white/10 shadow-2xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden border-l-4 ${getBorderColor(item.priority)}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 truncate flex-1">
            <h3 className="text-sm font-bold text-white leading-tight truncate">
              {item.name}
            </h3>
            {item.language && item.language !== "English" && (
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px] px-1.5 py-0 shrink-0 hover:bg-purple-500/20 font-bold" variant="outline">
                {item.language}
              </Badge>
            )}
          </div>
          <Badge className={`${getPriorityColor(item.priority)} text-[9px] font-bold px-1.5 py-0 shrink-0 uppercase tracking-wider`} variant="outline">
            {item.priority}
          </Badge>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4 font-semibold">
          {item.description || item.message}
        </p>

        <div className="space-y-2">
          {(item.address || item.location) && (
            <div className="flex items-start gap-1.5 text-xs text-slate-300 font-semibold bg-white/[0.02] border border-white/5 rounded-lg p-2.5">
              <MapPin className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="leading-tight">{item.address || item.location}</span>
                {item.area && <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Sector: {item.area}</span>}
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.04] text-[10px] font-bold text-slate-500">
            {item.phone ? (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {item.phone}
              </span>
            ) : (
              <span />
            )}
            <span className="flex items-center gap-1 font-mono">
              <Clock className="h-3 w-3" /> {formatTime(item.createdAt)} · {formatDate(item.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-0 flex flex-col gap-2">
        <div className="flex gap-2">
          {(item.latitude || item.address || item.location) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedMapCardId(expandedMapCardId === item._id ? null : item._id)}
              className={`flex-1 font-bold text-[10px] h-8 rounded-lg flex items-center justify-center gap-1 border-white/10 bg-[#1F2937]/20 hover:bg-[#1F2937]/40 text-slate-300 hover:text-white ${expandedMapCardId === item._id ? 'bg-[#1F2937]/50 text-white' : ''}`}
            >
              {expandedMapCardId === item._id ? 'Hide Location Map' : 'View Incident Map'}
            </Button>
          )}

          {currentTab === "pending" && (
            <Button
              onClick={() => handleUpdateStatus(item._id, "InProgress")}
              className="flex-grow bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-8 rounded-lg flex items-center justify-center gap-1 shadow-lg shadow-blue-500/10 border-none cursor-pointer"
            >
              <Play className="h-3 w-3 fill-white" /> Dispatch Patrol
            </Button>
          )}
          {currentTab === "active" && (
            <Button
              onClick={() => handleUpdateStatus(item._id, "Resolved")}
              className="flex-grow bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 rounded-lg flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/10 border-none cursor-pointer"
            >
              <CheckCircle className="h-3 w-3" /> Close Dispatch
            </Button>
          )}
          {currentTab === "resolved" && (
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 py-1.5 border border-emerald-500/20 bg-emerald-500/5 rounded-lg flex-grow">
              <CheckCircle className="h-3.5 w-3.5" /> Resolved Case
            </span>
          )}
        </div>

        {expandedMapCardId === item._id && (
          <div className="w-full h-40 border border-white/5 rounded-lg overflow-hidden mt-1 bg-[#0B1120] animate-fade-in">
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
              className="opacity-75 invert filter contrast-125"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderTableRow = (item, index) => (
    <tr
      key={item._id}
      className={`border-b border-white/5 hover:bg-white/[0.01] transition-colors ${
        index % 2 === 0 ? "bg-[#0d1222]/80" : "bg-[#0d1222]/40"
      }`}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            item.priority === "Critical" ? "bg-red-500 animate-pulse" :
            item.priority === "High" ? "bg-orange-500" :
            item.priority === "Medium" ? "bg-amber-500" : "bg-blue-500"
          }`} />
          <span className="text-xs font-bold text-white truncate max-w-[180px]">{item.name}</span>
          {item.language && item.language !== "English" && (
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px] px-1.5 py-0 shrink-0 font-bold" variant="outline">
              {item.language}
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <Badge className={`${getPriorityColor(item.priority)} text-[9px] font-bold px-1.5 py-0 uppercase tracking-wider`} variant="outline">
          {item.priority}
        </Badge>
      </td>
      <td className="px-4 py-3.5">
        <p className="text-xs text-slate-400 font-semibold truncate max-w-[250px]">{item.description || item.message}</p>
      </td>
      <td className="px-4 py-3.5">
        {(item.address || item.location) && (
          <div className="flex flex-col gap-0.5 max-w-[200px]" title={item.address || item.location}>
            <div className="flex items-center gap-1 text-xs text-slate-300 font-semibold">
              <MapPin className="h-3 w-3 text-red-500 shrink-0" />
              <span className="truncate">{item.address || item.location}</span>
            </div>
            {item.landmark && (
              <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded w-fit uppercase">
                {item.landmark}
              </span>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-500 font-bold font-mono">
        {formatDate(item.createdAt)}
      </td>
      <td className="px-4 py-3.5 text-right">
        {currentTab === "pending" && (
          <Button
            size="sm"
            onClick={() => handleUpdateStatus(item._id, "InProgress")}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[9px] uppercase tracking-wider h-7 px-2.5 rounded-lg border-none cursor-pointer"
          >
            <Play className="h-3 w-3 mr-1 fill-white" /> Dispatch
          </Button>
        )}
        {currentTab === "active" && (
          <Button
            size="sm"
            onClick={() => handleUpdateStatus(item._id, "Resolved")}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] uppercase tracking-wider h-7 px-2.5 rounded-lg border-none cursor-pointer"
          >
            <CheckCircle className="h-3 w-3 mr-1" /> Resolve
          </Button>
        )}
        {currentTab === "resolved" && (
          <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-end gap-1">
            <CheckCircle className="h-3 w-3" /> Closed
          </span>
        )}
      </td>
    </tr>
  );

  const renderEmptyState = () => {
    const emptyConfig = {
      pending: { icon: Inbox, text: "No pending dispatch cases in queue.", color: "text-amber-400" },
      active: { icon: Shield, text: "No active patrol units in field.", color: "text-blue-400" },
      resolved: { icon: CheckCircle, text: "No closed case files logged.", color: "text-emerald-400" },
    };
    const cfg = emptyConfig[currentTab] || emptyConfig.pending;
    const Icon = cfg.icon;
    return (
      <div className="text-center py-20 flex flex-col items-center justify-center bg-[#0d1222]/40 rounded-xl border border-white/5">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mb-3">
          <Icon className={`h-6 w-6 ${cfg.color}`} />
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{cfg.text}</p>
        <p className="text-[10px] text-slate-500">Incoming dispatch cases will sync to this console instantly.</p>
      </div>
    );
  };

  return (
    <DashboardLayout title="Police Tactical Operations" headerActions={headerActions}>
      <Toaster position="top-right" richColors />
      
      <div className="flex flex-col gap-6">
        {/* Statistics Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`rounded-xl border p-4 transition-all ${
            currentTab === "pending" 
              ? "border-amber-500/50 bg-[#0d1222]/85 backdrop-blur-md shadow-[inset_0_0_12px_rgba(245,158,11,0.06)]" 
              : "border-white/5 bg-[#0d1222]/85 backdrop-blur-md"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Dispatch</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/25">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{allPending.length}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Pending Queue</p>
          </div>

          <div className={`rounded-xl border p-4 transition-all ${
            currentTab === "active" 
              ? "border-blue-500/50 bg-[#0d1222]/85 backdrop-blur-md shadow-[inset_0_0_12px_rgba(59,130,246,0.06)]" 
              : "border-white/5 bg-[#0d1222]/85 backdrop-blur-md"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Operations</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/25">
                <Shield className="h-3.5 w-3.5 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{allInProgress.length}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Units Dispatched</p>
          </div>

          <div className={`rounded-xl border p-4 transition-all ${
            currentTab === "resolved" 
              ? "border-emerald-500/50 bg-[#0d1222]/85 backdrop-blur-md shadow-[inset_0_0_12px_rgba(16,185,129,0.06)]" 
              : "border-white/5 bg-[#0d1222]/85 backdrop-blur-md"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cases Resolved</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{allResolved.length}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Closed Audit Logs</p>
          </div>

          <div className="bg-[#0d1222]/85 backdrop-blur-md border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Critical Threats</span>
              <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/25">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 animate-pulse" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{criticalCount}</p>
            <p className="text-[9px] text-red-400/80 font-bold uppercase mt-0.5">Immediate Attention</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d1222]/40 p-3.5 border border-white/5 rounded-xl">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className={`flex h-1.5 w-1.5 rounded-full ${
                currentTab === "pending" ? "bg-amber-500 animate-pulse" :
                currentTab === "active" ? "bg-blue-500 animate-pulse" : "bg-emerald-500"
              }`} />
              {currentTab === "pending" ? "Pending Patrol Dispatch" :
               currentTab === "active" ? "Active Dispatch Encounters" : "Archived Security Logs"}
            </h2>
            <Badge variant="secondary" className="bg-white/5 text-slate-400 border border-white/5 font-bold text-[9px] px-2 rounded-full">
              {currentList.length}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <Input
                placeholder="Search patrol logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-[#1F2937]/20 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/40 rounded-lg focus:ring-0"
              />
            </div>

            <div className="flex items-center border border-white/10 bg-[#1F2937]/10 rounded-lg overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 transition-colors cursor-pointer ${viewMode === "grid" ? "bg-white/10 text-white" : "bg-transparent text-slate-500 hover:text-slate-300"}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 transition-colors cursor-pointer ${viewMode === "table" ? "bg-white/10 text-white" : "bg-transparent text-slate-500 hover:text-slate-300"}`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={fetchPoliceCases}
              className="h-8 w-8 border-white/10 bg-white/5 hover:bg-white/10 shrink-0 rounded-lg text-slate-300 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Incidents Feed */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing operations database...</p>
          </div>
        ) : currentList.length === 0 ? (
          renderEmptyState()
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentList.map((item) => renderCaseCard(item))}
          </div>
        ) : (
          <div className="bg-[#0d1222]/85 rounded-xl border border-white/5 shadow-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.01] border-b border-white/5">
                  {["Caller", "Priority", "Description", "Location Address", "Time Logged", "Action"].map((th, i) => (
                    <th key={i} className={`px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest ${i === 5 ? "text-right" : ""}`}>{th}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentList.map((item, index) => renderTableRow(item, index))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReportEmergencyDialog 
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        onSuccess={fetchPoliceCases}
      />
    </DashboardLayout>
  );
};

export default PolicePanel;