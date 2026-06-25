import React, { useEffect, useState, useRef } from "react";
import { getAllEmergencies, updateEmergencyStatus } from "../services/emergencyApi";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  Activity,
  Shield,
  Flame,
  Clock,
  AlertOctagon,
  CheckCircle2,
  Loader2,
  Layers,
  Inbox,
  Search,
  Filter,
  Eye,
  RefreshCw,
  AlertTriangle,
  PhoneCall,
  Globe,
  Mic,
  Zap,
  Target,
  Radio,
  ChevronUp,
} from "lucide-react";

// Vibrant Color System
const COLORS = {
  Police: "#6366F1",
  Fire: "#EF4444",
  Hospital: "#10B981",
  Pending: "#F59E0B",
  InProgress: "#3B82F6",
  Resolved: "#10B981",
  Critical: "#EF4444",
  High: "#F97316",
  Medium: "#EAB308",
  Low: "#22C55E",
};

const GRADIENTS = {
  Police: "from-indigo-500 to-purple-600",
  Fire: "from-red-500 to-rose-600",
  Hospital: "from-emerald-500 to-teal-600",
  Critical: "from-red-500 to-pink-600",
  Warning: "from-amber-500 to-orange-600",
  Success: "from-emerald-500 to-green-600",
  Info: "from-blue-500 to-indigo-600",
};

// Web Audio API beep sound generator
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

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-bold" style={{ color: p.color || p.fill }}>
            {p.name}: <span className="text-white">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedSource, setSelectedSource] = useState("All");
  const socketRef = useRef(null);

  const fetchDashboardData = async () => {
    try {
      const response = await getAllEmergencies();
      const cases = Array.isArray(response) ? response : response.data || [];
      setAllCases(cases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error("Failed to fetch admin dashboard data:", error);
      toast.error("Database connection failure", {
        description: "Failed to reload centralized incident registry.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    socketRef.current = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    const socket = socketRef.current;
    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("new-emergency", (emergency) => {
      playAlertSound(emergency.priority);
      toast.error(`NEW CENTRAL ALERT ROUTED`, {
        description: `Routed to ${emergency.department} | Priority: ${emergency.priority}`,
        duration: 8000,
      });
      setAllCases((prevCases) => {
        if (prevCases.some((c) => c._id === emergency._id)) return prevCases;
        return [emergency, ...prevCases];
      });
      fetchDashboardData();
    });
    socket.on("status-updated", (updated) => {
      if (updated && updated._id) {
        setAllCases((prevCases) =>
          prevCases.map((c) => (c._id === updated._id ? updated : c))
        );
      }
      fetchDashboardData();
    });
    return () => socket.disconnect();
  }, []);

  const handleStatusChange = async (caseId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const response = await updateEmergencyStatus(caseId, newStatus);
      if (response.success) {
        toast.success("Incident Status Updated", {
          description: `Incident ID: ${caseId.slice(-6).toUpperCase()} is now ${newStatus}`,
        });
        if (selectedCase && selectedCase._id === caseId) {
          setSelectedCase({ ...selectedCase, status: newStatus });
        }
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Update Action Failed");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Derived Statistics
  const activeCases = allCases.filter((c) => c.status !== "Resolved");
  const pendingCases = allCases.filter((c) => c.status === "Pending");
  const inProgressCases = allCases.filter((c) => c.status === "InProgress");
  const resolvedCases = allCases.filter((c) => c.status === "Resolved");
  const criticalCases = allCases.filter((c) => c.priority === "Critical" && c.status !== "Resolved");

  // Filtering Logic
  const filteredCases = allCases.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.landmark?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.aiAnalysis?.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === "All" || item.department?.toLowerCase() === selectedDept.toLowerCase();
    const matchesPriority = selectedPriority === "All" || item.priority?.toLowerCase() === selectedPriority.toLowerCase();
    const matchesStatus = selectedStatus === "All" || item.status?.toLowerCase() === selectedStatus.toLowerCase();
    const matchesSource = selectedSource === "All" || (item.source || "web") === selectedSource;

    return matchesSearch && matchesDept && matchesPriority && matchesStatus && matchesSource;
  });

  // Chart Data
  const policeCount = allCases.filter((c) => c.department === "Police").length;
  const fireCount = allCases.filter((c) => c.department === "Fire").length;
  const hospitalCount = allCases.filter((c) => c.department === "Hospital").length;

  const deptData = [
    { name: "Police", value: policeCount, color: COLORS.Police },
    { name: "Fire Dept", value: fireCount, color: COLORS.Fire },
    { name: "Hospital", value: hospitalCount, color: COLORS.Hospital },
  ].filter((d) => d.value > 0);

  const statusData = [
    { name: "Pending", value: pendingCases.length, color: COLORS.Pending },
    { name: "In Progress", value: inProgressCases.length, color: COLORS.InProgress },
    { name: "Resolved", value: resolvedCases.length, color: COLORS.Resolved },
  ].filter((d) => d.value > 0);

  const priorityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  allCases.forEach((c) => {
    if (priorityCounts[c.priority] !== undefined) priorityCounts[c.priority]++;
  });
  const priorityData = [
    { name: "Critical", count: priorityCounts.Critical, fill: COLORS.Critical },
    { name: "High", count: priorityCounts.High, fill: COLORS.High },
    { name: "Medium", count: priorityCounts.Medium, fill: COLORS.Medium },
    { name: "Low", count: priorityCounts.Low, fill: COLORS.Low },
  ];

  const getTrendData = () => {
    const dates = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dates[dateStr] = 0;
    }
    allCases.forEach((c) => {
      const dateStr = new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dates[dateStr] !== undefined) dates[dateStr]++;
    });
    return Object.keys(dates).map((date) => ({ date, Emergencies: dates[date] }));
  };
  const trendData = getTrendData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 animate-ping absolute" />
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="h-7 w-7 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-400 tracking-widest uppercase animate-pulse">
            Initializing Command Center...
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Central Command Overview">
      <Toaster position="top-right" richColors />

      {/* Hero Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Cases */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 p-5 shadow-lg shadow-indigo-500/20 group hover:shadow-indigo-500/40 transition-all duration-300">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-1 -bottom-6 w-16 h-16 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Total Cases</p>
              <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
                <Layers className="h-4.5 w-4.5 text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white mb-1">{allCases.length}</h3>
            <p className="text-xs text-indigo-200 font-medium flex items-center gap-1">
              <ChevronUp className="h-3 w-3" />
              Centrally logged incidents
            </p>
          </div>
        </div>

        {/* Active Encounters */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 p-5 shadow-lg shadow-blue-500/20 group hover:shadow-blue-500/40 transition-all duration-300">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-1 -bottom-6 w-16 h-16 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider">Active Encounters</p>
              <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
                <Activity className="h-4.5 w-4.5 text-white animate-pulse" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white mb-1">{activeCases.length}</h3>
            <p className="text-xs text-blue-200 font-medium">Live response operations</p>
          </div>
        </div>

        {/* Critical Threats */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-rose-700 p-5 shadow-lg shadow-red-500/20 group hover:shadow-red-500/40 transition-all duration-300">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-1 -bottom-6 w-16 h-16 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-red-200 uppercase tracking-wider">Critical Threats</p>
              <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
                <AlertOctagon className={`h-4.5 w-4.5 text-white ${criticalCases.length > 0 ? "animate-bounce" : ""}`} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white mb-1">{criticalCases.length}</h3>
            <p className="text-xs text-red-200 font-medium">
              {criticalCases.length > 0 ? "⚠ Immediate action required" : "No active critical threats"}
            </p>
          </div>
        </div>

        {/* Resolved */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-5 shadow-lg shadow-emerald-500/20 group hover:shadow-emerald-500/40 transition-all duration-300">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-1 -bottom-6 w-16 h-16 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Resolved Actions</p>
              <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="h-4.5 w-4.5 text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white mb-1">{resolvedCases.length}</h3>
            <p className="text-xs text-emerald-200 font-medium">
              {allCases.length > 0 ? `${Math.round((resolvedCases.length / allCases.length) * 100)}% resolution rate` : "No data yet"}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-gray-900/60 border border-white/8 p-4 flex items-center gap-4 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Pending Queue</p>
            <p className="text-xl font-black text-amber-400">{pendingCases.length}</p>
          </div>
        </div>
        <div className="rounded-xl bg-gray-900/60 border border-white/8 p-4 flex items-center gap-4 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
            <Target className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">In Progress</p>
            <p className="text-xl font-black text-blue-400">{inProgressCases.length}</p>
          </div>
        </div>
        <div className="rounded-xl bg-gray-900/60 border border-white/8 p-4 flex items-center gap-4 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <Shield className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Depts Active</p>
            <p className="text-xl font-black text-indigo-400">{deptData.length}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Department Distribution */}
        <div className="rounded-2xl bg-gray-900/70 border border-white/8 backdrop-blur-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-white/6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Department Allocation</h3>
              <p className="text-xs text-gray-500 mt-0.5">Distribution of active & resolved incidents</p>
            </div>
            <div className="flex items-center gap-2">
              {deptData.map((d, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-gray-400 font-medium">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 h-60 flex items-center justify-center">
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    style={{ outline: "none" }}
                  >
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-600">
                <Inbox className="h-8 w-8" />
                <p className="text-xs font-medium">No allocation data</p>
              </div>
            )}
          </div>
        </div>

        {/* Priority Bar Chart */}
        <div className="rounded-2xl bg-gray-900/70 border border-white/8 backdrop-blur-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-white/6">
            <h3 className="text-sm font-bold text-white">Priority Distribution</h3>
            <p className="text-xs text-gray-500 mt-0.5">Count of incidents by threat classification</p>
          </div>
          <div className="p-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {priorityData.map((entry, i) => (
                    <linearGradient key={i} id={`grad-${entry.name}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.fill} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.fill} stopOpacity={0.5} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#4B5563" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                <YAxis stroke="#4B5563" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#grad-${entry.name})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Timeline Trend */}
        <div className="rounded-2xl bg-gray-900/70 border border-white/8 backdrop-blur-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-white/6">
            <h3 className="text-sm font-bold text-white">Incident Timeline Trend</h3>
            <p className="text-xs text-gray-500 mt-0.5">Daily emergency call volume — past 7 days</p>
          </div>
          <div className="p-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#4B5563" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} />
                <YAxis stroke="#4B5563" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Emergencies"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  fill="url(#areaGrad)"
                  dot={{ fill: "#6366F1", r: 4, strokeWidth: 2, stroke: "#1e1b4b" }}
                  activeDot={{ r: 6, stroke: "#6366F1", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="rounded-2xl bg-gray-900/70 border border-white/8 backdrop-blur-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-white/6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Encounter Statuses</h3>
              <p className="text-xs text-gray-500 mt-0.5">Real-time status tracking of all responses</p>
            </div>
            <div className="flex items-center gap-2">
              {statusData.map((d, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-gray-400 font-medium">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 h-60 flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    style={{ outline: "none" }}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-600">
                <Inbox className="h-8 w-8" />
                <p className="text-xs font-medium">No status data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Incident Registry Table */}
      <div className="rounded-2xl bg-gray-900/70 border border-white/8 backdrop-blur-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Centralized Incident Registry</h3>
              <p className="text-xs text-gray-500 mt-0.5">Telemetry log of all security, health & rescue cases</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all text-xs font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Logs
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
              <input
                placeholder="Search incident, location, citizen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 h-9 bg-gray-800/60 border border-white/8 rounded-xl text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {[
              { value: selectedDept, setter: setSelectedDept, opts: ["All Departments", "Police", "Fire", "Hospital"], vals: ["All", "Police", "Fire", "Hospital"] },
              { value: selectedPriority, setter: setSelectedPriority, opts: ["All Priorities", "Critical", "High", "Medium", "Low"], vals: ["All", "Critical", "High", "Medium", "Low"] },
              { value: selectedStatus, setter: setSelectedStatus, opts: ["All Statuses", "Pending", "In Progress", "Resolved"], vals: ["All", "Pending", "InProgress", "Resolved"] },
              { value: selectedSource, setter: setSelectedSource, opts: ["All Sources", "🌐 Web Form", "📞 Phone Call"], vals: ["All", "web", "call"] },
            ].map((f, i) => (
              <select
                key={i}
                value={f.value}
                onChange={(e) => f.setter(e.target.value)}
                className="h-9 bg-gray-800/60 border border-white/8 rounded-xl px-3 text-xs text-gray-300 outline-none focus:border-indigo-500/50 transition-all"
              >
                {f.opts.map((opt, j) => (
                  <option key={j} value={f.vals[j]}>{opt}</option>
                ))}
              </select>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                {["Citizen", "Location", "Department", "Priority", "Status", "Source", "Time Logged", "Actions"].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest ${i === 7 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {filteredCases.length > 0 ? (
                filteredCases.map((item) => (
                  <tr key={item._id} className="group hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3.5 text-xs font-bold text-white">{item.name}</td>
                    <td className="px-4 py-3.5 max-w-[180px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-300 font-medium truncate">{item.address || item.location}</span>
                        {item.landmark && (
                          <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded px-1.5 py-0.5 w-fit">
                            📍 {item.landmark}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider"
                        style={{
                          backgroundColor: item.department === "Police" ? `${COLORS.Police}25` : item.department === "Fire" ? `${COLORS.Fire}25` : `${COLORS.Hospital}25`,
                          color: item.department === "Police" ? COLORS.Police : item.department === "Fire" ? COLORS.Fire : COLORS.Hospital,
                          border: `1px solid ${item.department === "Police" ? `${COLORS.Police}40` : item.department === "Fire" ? `${COLORS.Fire}40` : `${COLORS.Hospital}40`}`,
                        }}
                      >
                        {item.department === "Police" ? "🛡" : item.department === "Fire" ? "🔥" : "🏥"} {item.department === "Fire" ? "Fire Dept" : item.department}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${COLORS[item.priority]}20`,
                          color: COLORS[item.priority] || "#9CA3AF",
                          border: `1px solid ${COLORS[item.priority]}35`,
                        }}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${COLORS[item.status]}20`,
                          color: COLORS[item.status] || "#9CA3AF",
                          border: `1px solid ${COLORS[item.status]}35`,
                        }}
                      >
                        {item.status === "InProgress" ? "In Progress" : item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {item.source === "call" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          <PhoneCall className="h-2.5 w-2.5" /> Call
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          <Globe className="h-2.5 w-2.5" /> Web
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 font-medium">
                      {new Date(item.createdAt).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedCase(item)}
                        className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all text-[10px] font-bold"
                      >
                        <Eye className="h-3 w-3" /> Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                        <Inbox className="h-6 w-6 text-gray-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">No matching incidents found</p>
                      <p className="text-xs text-gray-700">Try adjusting your filters or search query</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-gray-600 font-medium">
            Showing <span className="text-gray-400 font-bold">{filteredCases.length}</span> of <span className="text-gray-400 font-bold">{allCases.length}</span> incidents
          </p>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-[10px] text-gray-600 font-medium">{socketConnected ? "Live sync active" : "Offline"}</span>
          </div>
        </div>
      </div>

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/8 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">
                  Emergency Report — ID: {selectedCase._id.slice(-6).toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-white">Incident Details & Dispatch Status</h3>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Primary Info */}
              <div className="grid grid-cols-3 gap-4 bg-gray-800/60 rounded-xl p-4 border border-white/6">
                {[
                  { label: "Citizen Name", val: selectedCase.name },
                  { label: "Phone Number", val: selectedCase.phone || "Not provided" },
                  { label: "Coordinates", val: selectedCase.location || "N/A" },
                ].map((f, i) => (
                  <div key={i}>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{f.label}</span>
                    <span className="text-sm font-bold text-white">{f.val}</span>
                  </div>
                ))}
              </div>

              {/* Location Intelligence */}
              {(selectedCase.address || selectedCase.area || selectedCase.city || selectedCase.landmark) && (
                <div className="rounded-xl border border-white/8 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-4 py-2.5 flex items-center justify-between border-b border-white/6">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">AI Location Intelligence</span>
                    <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">EXTRACTED ADDRESS</span>
                  </div>
                  <div className="p-4 space-y-3 bg-gray-800/40">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Full Address</span>
                        <span className="text-sm font-bold text-white">{selectedCase.address || "N/A"}</span>
                      </div>
                      {[
                        { label: "Area / Sector", val: selectedCase.area },
                        { label: "City", val: selectedCase.city },
                        { label: "Landmark", val: selectedCase.landmark },
                      ].map((f, i) => (
                        <div key={i}>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{f.label}</span>
                          <span className={`text-xs font-semibold ${i === 2 ? "text-purple-400" : "text-gray-300"}`}>{f.val || "N/A"}</span>
                        </div>
                      ))}
                    </div>
                    {/* Map */}
                    <div className="w-full h-52 rounded-xl overflow-hidden border border-white/8 mt-2">
                      <iframe
                        width="100%"
                        height="100%"
                        src={
                          selectedCase.latitude && selectedCase.longitude
                            ? `https://maps.google.com/maps?q=${selectedCase.latitude},${selectedCase.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                            : `https://maps.google.com/maps?q=${encodeURIComponent(selectedCase.address || selectedCase.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                        }
                        frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" title="Map"
                      />
                    </div>
                    {selectedCase.latitude && selectedCase.longitude && (
                      <p className="text-[9px] text-emerald-400 font-bold flex items-center justify-end gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        High-accuracy GPS coordinates captured
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Status & Department Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-800/40 rounded-xl border border-white/6">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Assigned Unit</span>
                    <span
                      className="inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${selectedCase.department === "Police" ? COLORS.Police : selectedCase.department === "Fire" ? COLORS.Fire : COLORS.Hospital}20`,
                        color: selectedCase.department === "Police" ? COLORS.Police : selectedCase.department === "Fire" ? COLORS.Fire : COLORS.Hospital,
                        border: `1px solid ${selectedCase.department === "Police" ? COLORS.Police : selectedCase.department === "Fire" ? COLORS.Fire : COLORS.Hospital}35`,
                      }}
                    >
                      {selectedCase.department === "Fire" ? "Fire Dept" : selectedCase.department}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Priority</span>
                    <span
                      className="inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${COLORS[selectedCase.priority]}20`,
                        color: COLORS[selectedCase.priority] || "#9CA3AF",
                        border: `1px solid ${COLORS[selectedCase.priority]}35`,
                      }}
                    >
                      {selectedCase.priority}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Update Status</span>
                  <select
                    disabled={updatingStatus}
                    value={selectedCase.status}
                    onChange={(e) => handleStatusChange(selectedCase._id, e.target.value)}
                    className="h-9 bg-gray-700/60 border border-white/10 rounded-xl px-3 text-xs text-gray-200 font-bold outline-none focus:border-indigo-500/50 transition-all"
                  >
                    <option value="Pending">Pending</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Incident Description</span>
                <p className="p-4 bg-gray-800/60 border border-white/6 rounded-xl text-xs leading-relaxed text-gray-300">
                  {selectedCase.message || selectedCase.description}
                </p>
              </div>

              {/* Voice Recording */}
              {selectedCase.source === "call" && (
                <div className="rounded-xl border border-violet-500/20 overflow-hidden">
                  <div className="bg-violet-500/10 px-4 py-2.5 flex items-center justify-between border-b border-violet-500/20">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Mic className="h-3.5 w-3.5" /> Caller Voice Recording
                    </span>
                    <span className="text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">PHONE CALL</span>
                  </div>
                  <div className="p-4 bg-gray-800/40">
                    {selectedCase.recordingUrl ? (
                      <audio controls src={selectedCase.recordingUrl} className="w-full" />
                    ) : (
                      <p className="text-xs text-violet-400 font-semibold">Recording is being processed...</p>
                    )}
                    <p className="text-[10px] text-gray-500 mt-2">
                      Caller: <strong className="text-gray-400">{selectedCase.callerPhone || selectedCase.phone}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              {selectedCase.aiAnalysis && (
                <div className="rounded-xl border border-indigo-500/20 overflow-hidden">
                  <div className="bg-indigo-500/10 px-4 py-2.5 flex items-center justify-between border-b border-indigo-500/20">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">AI Dispatch Engine Analysis</span>
                    <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">CLASSIFIED</span>
                  </div>
                  <div className="p-4 space-y-3.5 bg-gray-800/40">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Category</span>
                        <span className="text-sm font-bold text-white">{selectedCase.aiAnalysis.category}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Confidence</span>
                        <span className="text-sm font-bold text-indigo-400">{(selectedCase.aiAnalysis.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Recommended Units</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCase.aiAnalysis.recommendedUnits?.map((unit, idx) => (
                          <span key={idx} className="bg-gray-700/60 border border-white/10 text-gray-300 text-[10px] font-bold px-2.5 py-0.5 rounded-lg">{unit}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Dispatch Reason</span>
                      <p className="text-xs text-gray-400 italic leading-relaxed">{selectedCase.aiAnalysis.reason}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/8 bg-gray-900/50 flex justify-end">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-5 py-2 rounded-xl bg-gray-800 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all text-xs font-semibold"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
