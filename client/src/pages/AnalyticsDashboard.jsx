import React, { useEffect, useState, useRef } from "react";
import { getAllEmergencies } from "../services/emergencyApi";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Toaster, toast } from "sonner";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, LineChart,
  Line, Area, AreaChart,
} from "recharts";
import {
  TrendingUp, Activity, Shield, Flame, Clock,
  AlertOctagon, CheckCircle2, Loader2, Inbox,
  Volume2, VolumeX, Zap, Target, BarChart2,
} from "lucide-react";

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

const playAlertSound = (priority) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    oscillator.start();
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime + 0.15);
    oscillator.stop(audioCtx.currentTime + 0.2);
  } catch (error) {
    console.log("AudioContext playback failed", error);
  }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-[10px] text-gray-500 font-medium mb-1 uppercase tracking-wider">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-bold">
            <span style={{ color: p.color || p.fill }}>{p.name}: </span>
            <span className="text-white">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsDashboard = () => {
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const socketRef = useRef(null);
  const audioEnabledRef = useRef(audioEnabled);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  const fetchAllCases = async () => {
    try {
      const response = await getAllEmergencies();
      const cases = Array.isArray(response) ? response : response.data || [];
      setAllCases(cases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.log("Error fetching cases for analytics:", error);
      toast.error("Database connection failure");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCases();
    socketRef.current = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    const socket = socketRef.current;
    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));

    socket.on("new-emergency", (emergency) => {
      setAllCases((prevCases) =>
        [emergency, ...prevCases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
      if (audioEnabledRef.current) playAlertSound(emergency.priority);
      toast.info(`ANALYTICS SYNCED`, {
        description: `New case recorded for ${emergency.department}`,
        duration: 4000,
      });
    });

    socket.on("status-updated", (updatedEmergency) => {
      setAllCases((prevCases) =>
        prevCases.map((c) => (c._id === updatedEmergency._id ? updatedEmergency : c))
      );
    });

    return () => socket.disconnect();
  }, []);

  // Metrics
  const policeCount = allCases.filter((c) => c.department === "Police").length;
  const fireCount = allCases.filter((c) => c.department === "Fire" || c.department === "Fire Brigade").length;
  const hospitalCount = allCases.filter((c) => c.department === "Hospital").length;
  const pendingCount = allCases.filter((c) => c.status === "Pending").length;
  const inProgressCount = allCases.filter((c) => c.status === "InProgress").length;
  const resolvedCount = allCases.filter((c) => c.status === "Resolved").length;
  const criticalCount = allCases.filter((c) => c.priority === "Critical").length;
  const highCount = allCases.filter((c) => c.priority === "High").length;
  const mediumCount = allCases.filter((c) => c.priority === "Medium").length;
  const lowCount = allCases.filter((c) => c.priority === "Low").length;
  const resolutionRate = allCases.length > 0 ? Math.round((resolvedCount / allCases.length) * 100) : 0;

  // Chart data
  const deptData = [
    { name: "Police", value: policeCount, color: COLORS.Police },
    { name: "Fire Dept", value: fireCount, color: COLORS.Fire },
    { name: "Hospital", value: hospitalCount, color: COLORS.Hospital },
  ].filter((d) => d.value > 0);

  const statusData = [
    { name: "Pending", value: pendingCount, color: COLORS.Pending },
    { name: "In Progress", value: inProgressCount, color: COLORS.InProgress },
    { name: "Resolved", value: resolvedCount, color: COLORS.Resolved },
  ].filter((d) => d.value > 0);

  const priorityData = [
    { name: "Critical", count: criticalCount, fill: COLORS.Critical },
    { name: "High", count: highCount, fill: COLORS.High },
    { name: "Medium", count: mediumCount, fill: COLORS.Medium },
    { name: "Low", count: lowCount, fill: COLORS.Low },
  ];

  const dateMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dateMap[dateStr] = 0;
  }
  allCases.forEach((c) => {
    const d = new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (dateMap[d] !== undefined) dateMap[d]++;
  });
  const trendData = Object.keys(dateMap).map((dateStr) => ({ date: dateStr, Emergencies: dateMap[dateStr] }));

  const headerActions = (
    <button
      onClick={() => setAudioEnabled(!audioEnabled)}
      title={audioEnabled ? "Mute audio alerts" : "Unmute audio alerts"}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-xs font-semibold"
      style={{
        background: audioEnabled ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)",
        border: audioEnabled ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.08)",
        color: audioEnabled ? "#10B981" : "rgba(255,255,255,0.4)",
      }}
    >
      {audioEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{audioEnabled ? "Audio On" : "Audio Off"}</span>
    </button>
  );

  return (
    <DashboardLayout title="Operational Analytics" headerActions={headerActions}>
      <Toaster position="top-right" richColors />

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <BarChart2 className="h-4 w-4 text-white" />
            </div>
            Analytics Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Timeline trends, load distribution & department statistics</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
          <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          {socketConnected ? "Live" : "Offline"}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/30 animate-pulse">
            <BarChart2 className="h-7 w-7 text-white" />
          </div>
          <p className="text-sm font-semibold text-gray-500 tracking-widest uppercase">Aggregating telemetry...</p>
        </div>
      ) : (
        <>
          {/* Top KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Incidents", value: allCases.length, icon: Zap, gradient: "from-indigo-500 to-purple-600", shadow: "indigo" },
              { label: "Active Cases", value: inProgressCount, icon: Activity, gradient: "from-blue-500 to-cyan-600", shadow: "blue" },
              { label: "Critical Active", value: criticalCount, icon: AlertOctagon, gradient: "from-red-500 to-rose-600", shadow: "red" },
              { label: "Resolution Rate", value: `${resolutionRate}%`, icon: Target, gradient: "from-emerald-500 to-teal-600", shadow: "emerald" },
            ].map((kpi, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${kpi.gradient} p-5 shadow-lg`}
                style={{ boxShadow: `0 8px 24px rgba(var(--${kpi.shadow}-rgb, 0,0,0), 0.2)` }}
              >
                <div className="absolute -right-3 -top-3 w-20 h-20 rounded-full bg-white/10" />
                <div className="absolute -right-1 -bottom-5 w-14 h-14 rounded-full bg-white/5" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{kpi.label}</p>
                    <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                      <kpi.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-white">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Dept Load */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Department Load</p>
              <div className="space-y-3">
                {[
                  { icon: Shield, label: "Police Cases", value: policeCount, color: COLORS.Police },
                  { icon: Flame, label: "Fire Cases", value: fireCount, color: COLORS.Fire },
                  { icon: Activity, label: "Medical Cases", value: hospitalCount, color: COLORS.Hospital },
                ].map((row, i) => {
                  const total = policeCount + fireCount + hospitalCount;
                  const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="flex items-center gap-1.5 font-semibold text-gray-300">
                          <row.icon className="h-3.5 w-3.5" style={{ color: row.color }} />
                          {row.label}
                        </span>
                        <span className="font-black" style={{ color: row.color }}>{row.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: row.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Case Status</p>
              <div className="space-y-3">
                {[
                  { label: "Pending", value: pendingCount, color: COLORS.Pending, pulse: false },
                  { label: "Active Dispatches", value: inProgressCount, color: COLORS.InProgress, pulse: true },
                  { label: "Closed Cases", value: resolvedCount, color: COLORS.Resolved, pulse: false },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-gray-400">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${row.pulse ? "animate-pulse" : ""}`}
                        style={{ backgroundColor: row.color }}
                      />
                      {row.label}
                    </span>
                    <span className="text-base font-black" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Metrics */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Priority Metrics</p>
              <div className="space-y-3">
                {[
                  { label: "Critical", value: criticalCount, color: COLORS.Critical },
                  { label: "High", value: highCount, color: COLORS.High },
                  { label: "Medium", value: mediumCount, color: COLORS.Medium },
                  { label: "Low", value: lowCount, color: COLORS.Low },
                ].map((row, i) => {
                  const total = criticalCount + highCount + mediumCount + lowCount;
                  const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5 font-medium text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.color }} />
                          {row.label}
                        </span>
                        <span className="font-black" style={{ color: row.color }}>{row.value}</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: row.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Dept Pie */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Department Allocation</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Incident share per department</p>
                </div>
                <div className="flex items-center gap-2">
                  {deptData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[9px] text-gray-500 font-medium">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-64 flex items-center justify-center">
                {deptData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ outline: "none" }}>
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
                    <p className="text-xs font-medium">No data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Pie */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Case Status Distribution</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Current response pipeline status</p>
                </div>
                <div className="flex items-center gap-2">
                  {statusData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[9px] text-gray-500 font-medium">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-64 flex items-center justify-center">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ outline: "none" }}>
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

            {/* Priority Bar */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-sm font-bold text-white mb-1">Priority Rating Metrics</h3>
              <p className="text-xs text-gray-600 mb-4">Breakdown by threat classification level</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      {priorityData.map((entry, i) => (
                        <linearGradient key={i} id={`ag-${entry.name}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={entry.fill} stopOpacity={1} />
                          <stop offset="100%" stopColor={entry.fill} stopOpacity={0.4} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" stroke="#374151" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tick={{ fill: "#6B7280" }} />
                    <YAxis stroke="#374151" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "#6B7280" }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#ag-${entry.name})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Trend Area */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-sm font-bold text-white mb-1">Daily Incident Timeline</h3>
              <p className="text-xs text-gray-600 mb-4">7-day emergency call volume trend</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analyticsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" stroke="#374151" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} tick={{ fill: "#6B7280" }} />
                    <YAxis stroke="#374151" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "#6B7280" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Emergencies" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#analyticsAreaGrad)"
                      dot={{ fill: "#8B5CF6", r: 4, strokeWidth: 2, stroke: "#1e1b4b" }}
                      activeDot={{ r: 6, stroke: "#8B5CF6", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Incidents Table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-sm font-bold text-white">Incident Telemetry Log</h3>
              <p className="text-xs text-gray-600 mt-0.5">Most recent 10 emergency records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {["Citizen", "Department", "Priority", "Status", "Time Logged"].map((h, i) => (
                      <th key={i} className={`px-4 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest ${i === 4 ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allCases.slice(0, 10).map((item) => (
                    <tr key={item._id} className="transition-colors group" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td className="px-4 py-3.5 text-xs font-bold text-white">{item.name}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: `${item.department === "Police" ? COLORS.Police : (item.department === "Fire" || item.department === "Fire Brigade") ? COLORS.Fire : COLORS.Hospital}20`,
                            color: item.department === "Police" ? COLORS.Police : (item.department === "Fire" || item.department === "Fire Brigade") ? COLORS.Fire : COLORS.Hospital,
                            border: `1px solid ${item.department === "Police" ? COLORS.Police : (item.department === "Fire" || item.department === "Fire Brigade") ? COLORS.Fire : COLORS.Hospital}30`,
                          }}
                        >
                          {item.department === "Fire" || item.department === "Fire Brigade" ? "Fire Dept" : item.department}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: `${COLORS[item.priority] || "#6B7280"}20`,
                            color: COLORS[item.priority] || "#6B7280",
                            border: `1px solid ${COLORS[item.priority] || "#6B7280"}30`,
                          }}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: `${COLORS[item.status] || "#6B7280"}20`,
                            color: COLORS[item.status] || "#6B7280",
                            border: `1px solid ${COLORS[item.status] || "#6B7280"}30`,
                          }}
                        >
                          {item.status === "InProgress" ? "In Progress" : item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 font-medium text-right">
                        {new Date(item.createdAt).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  ))}
                  {allCases.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Inbox className="h-8 w-8 text-gray-700" />
                          <p className="text-sm font-medium text-gray-600">No incidents logged yet</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default AnalyticsDashboard;
