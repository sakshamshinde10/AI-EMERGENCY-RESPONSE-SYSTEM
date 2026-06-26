import React, { useEffect, useState, useRef } from "react";
import { getAllEmergencies } from "../services/emergencyApi";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Toaster, toast } from "sonner";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import {
  TrendingUp, Activity, Shield, Flame, Clock,
  AlertOctagon, CheckCircle2, Loader2, Inbox,
  Volume2, VolumeX, Zap, Target, BarChart2,
} from "lucide-react";

const COLORS = {
  Police: "#3B82F6",       // Blue
  Fire: "#EF4444",         // Red
  Hospital: "#10B981",     // Emerald
  Pending: "#F59E0B",      // Amber
  InProgress: "#3B82F6",   // Blue
  Resolved: "#10B981",     // Emerald
  Critical: "#EF4444",     // Red
  High: "#F97316",         // Orange
  Medium: "#F59E0B",       // Amber
  Low: "#10B981",          // Emerald
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
      <div className="bg-[#111827] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs font-semibold" style={{ color: p.color || p.fill }}>
            {p.name}: <span className="text-white font-bold">{p.value}</span>
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

    const handleNewEmergency = (emergency) => {
      setAllCases((prevCases) =>
        [emergency, ...prevCases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
      if (audioEnabledRef.current) playAlertSound(emergency.priority);
      toast.info(`ANALYTICS SYNCED`, {
        description: `New case recorded for ${emergency.department}`,
        duration: 4000,
      });
    };

    const handleStatusUpdated = (updatedEmergency) => {
      setAllCases((prevCases) =>
        prevCases.map((c) => (c._id === updatedEmergency._id ? updatedEmergency : c))
      );
    };

    socket.on("new-emergency", handleNewEmergency);
    socket.on("status-updated", handleStatusUpdated);

    return () => {
      socket.off("new-emergency", handleNewEmergency);
      socket.off("status-updated", handleStatusUpdated);
      socket.disconnect();
    };
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
    { name: "Police Patrol", value: policeCount, color: COLORS.Police },
    { name: "Fire Brigade", value: fireCount, color: COLORS.Fire },
    { name: "Hospital EMS", value: hospitalCount, color: COLORS.Hospital },
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
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
    >
      {audioEnabled ? <Volume2 className="h-3.5 w-3.5 text-emerald-400 animate-pulse" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}
      <span className="hidden sm:inline">{audioEnabled ? "Alerts Active" : "Alerts Muted"}</span>
    </button>
  );

  return (
    <DashboardLayout title="Operational Analytics" headerActions={headerActions}>
      <Toaster position="top-right" richColors />

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
              <BarChart2 className="h-4 w-4 text-blue-500" />
            </div>
            Analytics Engine
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Centralized timeline, system loads, and department throughput logs</p>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
          <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          {socketConnected ? "Network Sync Active" : "Disconnected"}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase animate-pulse">Aggregating telemetry logs...</p>
        </div>
      ) : (
        <>
          {/* Top KPI Row - Flat, premium Linear cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Incidents", value: allCases.length, icon: Zap, statusColor: "text-blue-500" },
              { label: "Active Operations", value: inProgressCount + pendingCount, icon: Activity, statusColor: "text-amber-500 animate-pulse" },
              { label: "Critical Cases", value: criticalCount, icon: AlertOctagon, statusColor: "text-red-500 animate-pulse" },
              { label: "Absolute Resolution", value: `${resolutionRate}%`, icon: Target, statusColor: "text-emerald-500" },
            ].map((kpi, i) => (
              <div
                key={i}
                className="bg-[#0d1222]/85 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className={`h-4 w-4 ${kpi.statusColor}`} />
                </div>
                <p className="text-2xl font-black text-white">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Progress / Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Dept Load */}
            <div className="bg-[#0d1222]/85 backdrop-blur-md border border-white/5 rounded-xl p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Departmental load</p>
              <div className="space-y-4">
                {[
                  { icon: Shield, label: "Police Patrol", value: policeCount, color: COLORS.Police },
                  { icon: Flame, label: "Fire Brigade", value: fireCount, color: COLORS.Fire },
                  { icon: Activity, label: "Hospital EMS", value: hospitalCount, color: COLORS.Hospital },
                ].map((row, i) => {
                  const total = policeCount + fireCount + hospitalCount;
                  const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5 font-bold text-slate-300">
                          <row.icon className="h-3.5 w-3.5" style={{ color: row.color }} />
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

            {/* Status Breakdown */}
            <div className="bg-[#0d1222]/85 backdrop-blur-md border border-white/5 rounded-xl p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Operational queue status</p>
              <div className="space-y-3.5">
                {[
                  { label: "Pending Response", value: pendingCount, color: COLORS.Pending },
                  { label: "Active Dispatch", value: inProgressCount, color: COLORS.InProgress, pulse: true },
                  { label: "Closed Actions", value: resolvedCount, color: COLORS.Resolved },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2 text-slate-400">
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${row.pulse ? "animate-pulse" : ""}`}
                        style={{ backgroundColor: row.color }}
                      />
                      {row.label}
                    </span>
                    <span className="text-sm font-black" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Metrics */}
            <div className="bg-[#0d1222]/85 backdrop-blur-md border border-white/5 rounded-xl p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Threat priority distribution</p>
              <div className="space-y-3">
                {[
                  { label: "Critical Threat", value: criticalCount, color: COLORS.Critical },
                  { label: "High Priority", value: highCount, color: COLORS.High },
                  { label: "Medium Priority", value: mediumCount, color: COLORS.Medium },
                  { label: "Low Priority", value: lowCount, color: COLORS.Low },
                ].map((row, i) => {
                  const total = criticalCount + highCount + mediumCount + lowCount;
                  const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.color }} />
                          {row.label}
                        </span>
                        <span className="font-black" style={{ color: row.color }}>{row.value}</span>
                      </div>
                      <div className="h-0.5 rounded-full bg-white/5 overflow-hidden">
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
            {/* Dept allocation */}
            <div className="bg-[#0d1222]/85 backdrop-blur-md border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4 flex-col sm:flex-row gap-2">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Department Allocation</h3>
                  <p className="text-[9px] text-slate-500 mt-0.5">Incident load allocation ratio</p>
                </div>
                <div className="flex items-center gap-2">
                  {deptData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">{d.name.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-64 flex items-center justify-center">
                {deptData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" style={{ outline: "none" }}>
                        {deptData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-600">
                    <Inbox className="h-8 w-8 text-slate-700" />
                    <p className="text-xs font-semibold">No department allocations</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status distribution */}
            <div className="bg-[#0d1222]/85 backdrop-blur-md border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4 flex-col sm:flex-row gap-2">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Queue Distribution</h3>
                  <p className="text-[9px] text-slate-500 mt-0.5">Response pipeline distribution</p>
                </div>
                <div className="flex items-center gap-2">
                  {statusData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-64 flex items-center justify-center">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" style={{ outline: "none" }}>
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-600">
                    <Inbox className="h-8 w-8 text-slate-700" />
                    <p className="text-xs font-semibold">No operations pipeline status</p>
                  </div>
                )}
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-[#0d1222]/85 backdrop-blur-md border border-white/5 rounded-xl p-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Threat Priority Ratings</h3>
              <p className="text-[9px] text-slate-500 mb-4">Volume per priority classification level</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={9} fontWeight={700} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={9} fontWeight={700} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-[#0d1222]/85 backdrop-blur-md border border-white/5 rounded-xl p-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Daily Call Volume</h3>
              <p className="text-[9px] text-slate-500 mb-4">7-day incoming telemetry timeline trend</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analyticsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" stroke="#475569" fontSize={9} fontWeight={700} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={9} fontWeight={700} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Emergencies" name="Incidents" stroke="#8B5CF6" strokeWidth={2} fill="url(#analyticsAreaGrad)"
                      dot={{ fill: "#8B5CF6", r: 3, strokeWidth: 1, stroke: "#0B1120" }}
                      activeDot={{ r: 5, stroke: "#8B5CF6", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent incidents */}
          <div className="bg-[#0d1222]/85 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Telemetry Registry</h3>
              <p className="text-[9px] text-slate-500 mt-0.5 font-semibold">Latest 10 incoming central emergency case logs</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-white/5">
                    {["Citizen Name", "Assigned Unit", "Priority", "Encounter Status", "Time Logged"].map((h, i) => (
                      <th key={i} className={`px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest ${i === 4 ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allCases.slice(0, 10).map((item) => (
                    <tr key={item._id} className="group hover:bg-white/[0.01] transition-all">
                      <td className="px-4 py-3.5 text-xs font-bold text-white">{item.name}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: item.department === "Police" ? "rgba(59,130,246,0.1)" : (item.department === "Fire" || item.department === "Fire Brigade") ? "rgba(239,110,110,0.1)" : "rgba(16,185,129,0.1)",
                            color: item.department === "Police" ? COLORS.Police : (item.department === "Fire" || item.department === "Fire Brigade") ? COLORS.Fire : COLORS.Hospital,
                            border: `1px solid ${item.department === "Police" ? "rgba(59,130,246,0.2)" : (item.department === "Fire" || item.department === "Fire Brigade") ? "rgba(239,110,110,0.2)" : "rgba(16,185,129,0.2)"}`,
                          }}
                        >
                          {item.department === "Police" ? "🚓" : (item.department === "Fire" || item.department === "Fire Brigade") ? "🚒" : "🏥"} {item.department === "Fire" || item.department === "Fire Brigade" ? "Fire Dept" : item.department}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: `${COLORS[item.priority] || "#6B7280"}12`,
                            color: COLORS[item.priority] || "#6B7280",
                            border: `1px solid ${COLORS[item.priority] || "#6B7280"}25`,
                          }}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: `${COLORS[item.status] || "#6B7280"}12`,
                            color: COLORS[item.status] || "#6B7280",
                            border: `1px solid ${COLORS[item.status] || "#6B7280"}25`,
                          }}
                        >
                          {item.status === "InProgress" ? "In Progress" : item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 font-bold font-mono text-right">
                        {new Date(item.createdAt).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  ))}
                  {allCases.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Inbox className="h-6 w-6 text-slate-700" />
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No registry cases logged</p>
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
