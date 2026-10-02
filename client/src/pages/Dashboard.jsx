import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/api";
import { Link } from "react-router-dom";
import {
  getPoliceEmergencies,
  getFireEmergencies,
  getHospitalEmergencies,
  updateEmergencyStatus,
} from "../services/emergencyApi";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import ReportEmergencyDialog from "../components/dashboard/ReportEmergencyDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import {
  Shield,
  Flame,
  Activity,
  Search,
  Filter,
  Clock,
  Phone,
  PhoneCall,
  Globe,
  Mic,
  AlertOctagon,
  CheckCircle2,
  Play,
  Loader2,
  Users,
  Compass,
  ArrowUpRight,
} from "lucide-react";

// ── Web Audio API (business logic — unchanged) ─────────────────
const playAlertSound = (priority) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    if (priority === "Critical" || priority === "High") {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(988, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      oscillator.start();
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime + 0.12);
      oscillator.frequency.setValueAtTime(988, audioCtx.currentTime + 0.18);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.18);
      gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.stop(audioCtx.currentTime + 0.35);
    } else {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(659, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime + 0.2);
      oscillator.stop(audioCtx.currentTime + 0.25);
    }
  } catch (error) {
    console.log("AudioContext playback failed", error);
  }
};

const Dashboard = () => {
  // ── All state (unchanged) ──────────────────────────────────
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [logs, setLogs] = useState([]);
  const socketRef = useRef(null);
  const audioEnabledRef = useRef(audioEnabled);

  const addLog = (message) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${message}`, ...prev.slice(0, 19)]);
  };

  // ── All API/Socket logic (unchanged) ──────────────────────
  const fetchDashboardData = async () => {
    try {
      addLog("Fetching fresh database records...");
      const [policeData, fireData, hospitalData] = await Promise.all([
        getPoliceEmergencies(),
        getFireEmergencies(),
        getHospitalEmergencies(),
      ]);
      const police = Array.isArray(policeData) ? policeData : policeData.data || [];
      const fire = Array.isArray(fireData) ? fireData : fireData.data || [];
      const hospital = Array.isArray(hospitalData) ? hospitalData : hospitalData.data || [];
      const combined = [...police, ...fire, ...hospital].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setAllCases(combined);
      addLog(`Loaded ${combined.length} total incidents successfully.`);
    } catch (error) {
      console.log(error);
      addLog(`ERR: Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      addLog(`Updating case status to "${status}"...`);
      await updateEmergencyStatus(id, status);
      fetchDashboardData();
    } catch (error) {
      console.log(error);
      addLog(`ERR: Status update failed: ${error.message}`);
    }
  };

  useEffect(() => { audioEnabledRef.current = audioEnabled; }, [audioEnabled]);

  useEffect(() => {
    fetchDashboardData();
    socketRef.current = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    const socket = socketRef.current;

    socket.on("connect", () => {
      setSocketConnected(true);
      addLog(`📡 Dispatch link established with backend server.`);
    });
    socket.on("disconnect", () => {
      setSocketConnected(false);
      addLog(`❌ Alert: Dispatch link to backend disconnected.`);
    });
    socket.on("new-emergency", (emergency) => {
      addLog(`🚨 AI classified new incident: ${emergency.priority} Priority - ${emergency.department}`);
      if (audioEnabledRef.current) playAlertSound(emergency.priority);
      toast.error(`NEW INCIDENT ROUTED`, {
        description: `Routed to ${emergency.department} | Priority: ${emergency.priority}`,
        action: {
          label: "View Feed",
          onClick: () => { setSelectedDept("All"); setSelectedPriority("All"); setSearchQuery(""); },
        },
        duration: 8000,
      });
      setAllCases((prevCases) => {
        if (prevCases.some((c) => c._id === emergency._id)) return prevCases;
        return [emergency, ...prevCases];
      });
      fetchDashboardData();
    });
    socket.on("status-updated", (updated) => {
      addLog(`Case status updated for ${updated.name} -> ${updated.status}`);
      setAllCases((prevCases) => prevCases.map((c) => (c._id === updated._id ? updated : c)));
      fetchDashboardData();
    });
    return () => { socket.disconnect(); };
  }, []);

  // ── Derived data (unchanged) ───────────────────────────────
  const stats = {
    total:    allCases.length,
    police:   allCases.filter((c) => c.department === "Police").length,
    fire:     allCases.filter((c) => c.department === "Fire Brigade").length,
    hospital: allCases.filter((c) => c.department === "Hospital").length,
    pending:  allCases.filter((c) => c.status === "Pending").length,
    inProgress: allCases.filter((c) => c.status === "In Progress").length,
    resolved: allCases.filter((c) => c.status === "Resolved").length,
    critical: allCases.filter((c) => c.priority === "Critical").length,
  };

  const filteredCases = allCases.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.phone && item.phone.includes(searchQuery));
    const matchesDept = selectedDept === "All" || item.department === selectedDept;
    const matchesPriority = selectedPriority === "All" || item.priority === selectedPriority;
    return matchesSearch && matchesDept && matchesPriority;
  });

  // ── Design helpers ─────────────────────────────────────────
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "Critical": return { color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" };
      case "High":     return { color: "#F97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)" };
      case "Medium":   return { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" };
      default:         return { color: "#3B82F6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.18)" };
    }
  };

  const getDeptConfig = (dept) => {
    if (dept === "Police")      return { color: "#3B82F6", border: "#3B82F6", icon: <Shield className="h-3.5 w-3.5" />, label: "🚓 Police" };
    if (dept === "Fire Brigade") return { color: "#EF4444", border: "#EF4444", icon: <Flame className="h-3.5 w-3.5" />, label: "🚒 Fire" };
    return { color: "#22C55E", border: "#22C55E", icon: <Activity className="h-3.5 w-3.5" />, label: "🏥 Hospital" };
  };

  const getStatusStyle = (status) => {
    if (status === "Pending")    return { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.18)" };
    if (status === "In Progress") return { color: "#3B82F6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.18)" };
    return { color: "#22C55E", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.15)" };
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: "#09090B" }}>
      <Toaster position="top-right" richColors />

      {/* Header */}
      <DashboardHeader
        socketConnected={socketConnected}
        onReportClick={() => setReportDialogOpen(true)}
        audioEnabled={audioEnabled}
        toggleAudio={() => {
          setAudioEnabled(!audioEnabled);
          addLog(`Audio notification sounds ${!audioEnabled ? "ENABLED" : "MUTED"}`);
        }}
      />

      <main className="flex-1 px-4 py-6 md:px-6 md:py-8 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Critical Banner */}
        {stats.critical > 0 && (
          <div
            className="rounded-2xl p-4 flex items-center justify-between animate-fade-in"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertOctagon className="h-4.5 w-4.5 text-red-400 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-red-400">CRITICAL INCIDENTS DETECTED ({stats.critical})</h4>
                <p className="text-xs text-red-400/60 mt-0.5">Immediate action required. Verify AI classifications and coordinate dispatch.</p>
              </div>
            </div>
          </div>
        )}

        {/* Stat Bar — 7 cols */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Total Reports", value: stats.total, color: "#9CA3AF" },
            { label: "Police Cases", value: stats.police, color: "#3B82F6", emoji: "🚓" },
            { label: "Fire Cases", value: stats.fire, color: "#EF4444", emoji: "🚒" },
            { label: "Hospital Cases", value: stats.hospital, color: "#22C55E", emoji: "🏥" },
            { label: "Pending", value: stats.pending, color: "#F59E0B", emoji: "🟡" },
            { label: "In Progress", value: stats.inProgress, color: "#3B82F6", emoji: "🔵" },
            { label: "Resolved", value: stats.resolved, color: "#22C55E", emoji: "🟢" },
          ].map(({ label, value, color, emoji }) => (
            <div key={label} className="rounded-2xl p-4 transition-all"
              style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: color === "#9CA3AF" ? "#6B7280" : color }}>
                {emoji} {label}
              </p>
              <p className="text-3xl font-black leading-none" style={{ color: color === "#9CA3AF" ? "#F9FAFB" : color }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Quick-link Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { to: "/police",    label: "Police Dispatch",     desc: "Manage law enforcement emergencies & tactical response.", color: "#3B82F6", emoji: "🚓" },
            { to: "/fire",      label: "Fire & Rescue",       desc: "Manage structural fire containment, hazardous alerts, & rescue.", color: "#EF4444", emoji: "🚒" },
            { to: "/hospital",  label: "EMS & Medical",       desc: "Coordinate hospital dispatching, ambulance logistics, & trauma.", color: "#22C55E", emoji: "🏥" },
            { to: "/analytics", label: "Live Analytics",      desc: "View system metrics, department load levels, & incident timelines.", color: "#8B5CF6", emoji: "📊" },
          ].map(({ to, label, desc, color, emoji }) => (
            <Link to={to} key={to} className="group block">
              <div
                className="h-full rounded-2xl p-5 transition-all duration-200 cursor-pointer"
                style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${color}30`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.transform = "";
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm font-bold text-white">{emoji} {label}</p>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    style={{ color: "#6B7280" }} />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
                <div className="mt-4 h-0.5 rounded-full w-0 group-hover:w-full transition-all duration-300"
                  style={{ background: color }} />
              </div>
            </Link>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Feed — 3 cols */}
          <div className="lg:col-span-3 space-y-4">

            {/* Search + Filters */}
            <div
              className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl"
              style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                <input
                  placeholder="Search by caller, details, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 rounded-xl text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "#F9FAFB",
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />

                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="h-8 rounded-lg text-xs font-medium px-2.5 cursor-pointer outline-none"
                  style={{
                    background: "#1F2937",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#D1D5DB",
                  }}
                >
                  <option value="All">All Departments</option>
                  <option value="Police">Police 🚓</option>
                  <option value="Fire Brigade">Fire Brigade 🚒</option>
                  <option value="Hospital">Hospital 🏥</option>
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="h-8 rounded-lg text-xs font-medium px-2.5 cursor-pointer outline-none"
                  style={{
                    background: "#1F2937",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#D1D5DB",
                  }}
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical 🚨</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                {(searchQuery || selectedDept !== "All" || selectedPriority !== "All") && (
                  <button
                    onClick={() => { setSearchQuery(""); setSelectedDept("All"); setSelectedPriority("All"); }}
                    className="h-8 px-3 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.15)" }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Incidents List */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4" style={{ color: "#EF4444" }} />
                <h2 className="text-base font-bold text-white">Unified Dispatch Log</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#9CA3AF" }}>
                  {filteredCases.length}
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#3B82F6" }} />
                  <p className="text-sm font-medium" style={{ color: "#6B7280" }}>Synchronizing with command database...</p>
                </div>
              ) : filteredCases.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center rounded-2xl animate-fade-in"
                  style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <CheckCircle2 className="h-10 w-10 mb-3" style={{ color: "#374151" }} />
                  <p className="text-sm font-semibold" style={{ color: "#6B7280" }}>No reports matching filters</p>
                  <p className="text-xs mt-1" style={{ color: "#374151" }}>Database is currently quiet. Submit a new case to test dispatching.</p>
                </div>
              ) : (
                filteredCases.map((item) => {
                  const dept = getDeptConfig(item.department);
                  const ps = getPriorityStyle(item.priority);
                  const ss = getStatusStyle(item.status);
                  return (
                    <div
                      key={item._id}
                      className="rounded-2xl overflow-hidden animate-fade-in transition-all duration-200"
                      style={{
                        background: "#111827",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderLeft: `3px solid ${dept.border}`,
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
                    >
                      <div className="p-5 md:p-5 flex flex-col md:flex-row justify-between items-start gap-4">
                        {/* Left */}
                        <div className="flex-1 space-y-3 min-w-0">
                          {/* Name + badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-white leading-tight">{item.name}</h3>

                            {/* Dept badge */}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                              style={{ background: `${dept.color}10`, color: dept.color, border: `1px solid ${dept.color}20` }}>
                              {dept.icon} {item.department}
                            </span>

                            {/* Priority badge */}
                            <span className="text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase"
                              style={{ background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>
                              {item.priority}
                            </span>

                            {/* Status badge */}
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                              style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
                              {item.status}
                            </span>
                          </div>

                          {/* Message */}
                          <p className="text-sm leading-relaxed p-3 rounded-xl"
                            style={{ color: "#9CA3AF", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                            {item.message}
                          </p>

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "#6B7280" }}>
                            {item.phone && (
                              <span className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3" /> {item.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5 font-mono">
                              <Clock className="h-3 w-3" /> {new Date(item.createdAt).toLocaleString()}
                            </span>
                            {item.source === "call" ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ background: "rgba(167,139,250,0.08)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.18)" }}>
                                <PhoneCall className="h-3 w-3" /> Via Call
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ background: "rgba(56,189,248,0.08)", color: "#38BDF8", border: "1px solid rgba(56,189,248,0.18)" }}>
                                <Globe className="h-3 w-3" /> Via Web
                              </span>
                            )}
                          </div>

                          {/* Recording */}
                          {item.source === "call" && item.recordingUrl && (
                            <div>
                              <p className="text-[10px] font-bold mb-1.5 flex items-center gap-1" style={{ color: "#6B7280" }}>
                                <Mic className="h-3 w-3" style={{ color: "#A78BFA" }} /> Caller Voice Recording
                              </p>
                              <audio controls src={item.recordingUrl} className="w-full h-8 rounded-lg" />
                            </div>
                          )}
                        </div>

                        {/* Right — Actions */}
                        <div className="flex md:flex-col gap-2 min-w-[130px] w-full md:w-auto pt-1 md:pt-0 shrink-0">
                          {item.status === "Pending" && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(item._id, "In Progress")}
                                className="flex items-center justify-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold text-white transition-all w-full"
                                style={{ background: "#3B82F6" }}
                                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                              >
                                <Play className="h-3.5 w-3.5" /> Dispatch Unit
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(item._id, "Resolved")}
                                className="flex items-center justify-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold transition-all w-full"
                                style={{
                                  background: "rgba(34,197,94,0.06)",
                                  border: "1px solid rgba(34,197,94,0.15)",
                                  color: "#22C55E",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(34,197,94,0.12)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(34,197,94,0.06)"}
                              >
                                Resolve Direct
                              </button>
                            </>
                          )}
                          {item.status === "In Progress" && (
                            <button
                              onClick={() => handleStatusUpdate(item._id, "Resolved")}
                              className="flex items-center justify-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold text-white transition-all w-full"
                              style={{ background: "#22C55E" }}
                              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
                            </button>
                          )}
                          {item.status === "Resolved" && (
                            <span className="flex items-center justify-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold w-full"
                              style={{ color: "#22C55E", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                              <CheckCircle2 className="h-4 w-4" /> Case Closed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar — 1 col */}
          <div className="space-y-4">

            {/* Active Response Force */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="px-4 py-3.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" style={{ color: "#3B82F6" }} />
                  Active Response Force
                </h3>
              </div>
              <div className="p-4 space-y-3.5">
                {[
                  { label: "Police Patrols", badge: "Active dispatchers", color: "#3B82F6" },
                  { label: "Fire Brigades", badge: "Standby rescue", color: "#EF4444" },
                  { label: "Hospital Ambulances", badge: "Trauma response", color: "#22C55E" },
                ].map(({ label, badge, color }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span style={{ color: "#9CA3AF" }}>{label}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${color}10`, color: color, border: `1px solid ${color}20` }}>
                      {badge}
                    </span>
                  </div>
                ))}
                <div className="mt-2 pt-3 rounded-xl p-3 text-[11px] leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#6B7280" }}>
                  <span className="font-bold text-white block mb-1 text-xs">AUTOMATED ROUTING SYS</span>
                  Incidents submitted by citizens are analyzed instantly. Classified departments and computed priorities are synced live.
                </div>
              </div>
            </div>

            {/* Telemetry Log */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="px-4 py-3.5 flex items-center gap-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="live-dot" />
                <h3 className="text-xs font-bold text-white">Telemetry Log Feed</h3>
              </div>
              <div className="terminal p-4 h-80 overflow-y-auto space-y-1.5">
                {logs.length === 0 ? (
                  <span style={{ color: "#374151" }}>Initializing logger console...</span>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="leading-relaxed break-all pb-1"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <ReportEmergencyDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        onSuccess={() => { fetchDashboardData(); }}
      />
    </div>
  );
};

export default Dashboard;