import React, { useEffect, useState, useRef } from "react";
import { getAllEmergencies, updateEmergencyStatus } from "../services/emergencyApi";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  PhoneCall,
  Globe,
  Mic,
  Zap,
  Target,
  Radio,
  MapPin,
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

const AdminDashboard = () => {
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assigningDept, setAssigningDept] = useState(false);
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
    
    const handleNewEmergency = (emergency) => {
      toast.error(`NEW CENTRAL ALERT ROUTED`, {
        description: `Routed to ${emergency.department} | Priority: ${emergency.priority}`,
        duration: 8000,
      });
      setAllCases((prevCases) => {
        if (prevCases.some((c) => c._id === emergency._id)) return prevCases;
        return [emergency, ...prevCases];
      });
      fetchDashboardData();
    };

    const handleStatusUpdated = (updated) => {
      if (updated && updated._id) {
        setAllCases((prevCases) =>
          prevCases.map((c) => (c._id === updated._id ? updated : c))
        );
      }
      fetchDashboardData();
    };

    socket.on("new-emergency", handleNewEmergency);
    socket.on("status-updated", handleStatusUpdated);

    return () => {
      socket.off("new-emergency", handleNewEmergency);
      socket.off("status-updated", handleStatusUpdated);
      socket.disconnect();
    };
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

  const handleAssignDepartment = async (caseId, newDept) => {
    setAssigningDept(true);
    try {
      const response = await updateEmergencyStatus(caseId, undefined, newDept);
      if (response.success) {
        toast.success(`Unit Assigned: ${newDept}`, {
          description: `Incident #${caseId.slice(-6).toUpperCase()} has been routed to ${newDept}.`,
        });
        if (selectedCase && selectedCase._id === caseId) {
          setSelectedCase({ ...selectedCase, department: newDept });
        }
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Failed to assign department:', error);
      toast.error('Department Assignment Failed', {
        description: 'Could not update unit. Please try again.',
      });
    } finally {
      setAssigningDept(false);
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
    { name: "Fire Brigade", value: fireCount, color: COLORS.Fire },
    { name: "Hospital EMS", value: hospitalCount, color: COLORS.Hospital },
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#060913" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-blue-500/20 animate-ping absolute" />
            <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/30">
              <Zap className="h-6 w-6 text-blue-500 animate-pulse" />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase animate-pulse">
            Connecting Command Registry...
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Central Command Overview">
      <Toaster position="top-right" richColors />

      {/* Flat Header Stats - Linear Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Cases */}
        <div className="bg-[#0d1222]/85 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incident Logged</span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-2xl font-black text-white">{allCases.length}</h3>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Cumulative registry cases</p>
        </div>

        {/* Active Encounters */}
        <div className="bg-[#0d1222]/85 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Patrols</span>
            <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
          </div>
          <h3 className="text-2xl font-black text-white">{activeCases.length}</h3>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">In-progress response operations</p>
        </div>

        {/* Critical Threats */}
        <div className={`bg-[#0d1222]/85 backdrop-blur-md border rounded-xl p-5 hover:border-red-500/20 transition-all ${criticalCases.length > 0 ? "border-red-500/30 shadow-[inset_0_0_12px_rgba(239,68,68,0.06)]" : "border-white/5"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Critical Threats</span>
            <AlertOctagon className={`h-4 w-4 text-red-500 ${criticalCases.length > 0 ? "animate-pulse" : ""}`} />
          </div>
          <h3 className="text-2xl font-black text-white">{criticalCases.length}</h3>
          <p className="text-[10px] text-red-400/70 mt-1 font-medium">
            {criticalCases.length > 0 ? "⚠ Dispatch forces immediately" : "Zero critical emergencies"}
          </p>
        </div>

        {/* Resolved */}
        <div className="bg-[#0d1222]/85 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolved Actions</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-white">{resolvedCases.length}</h3>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">
            {allCases.length > 0 ? `${Math.round((resolvedCases.length / allCases.length) * 100)}% absolute resolution` : "No cases logs"}
          </p>
        </div>
      </div>

      {/* Sub Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg bg-[#0d1222]/50 border border-white/5 p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pending</p>
            <p className="text-sm font-black text-amber-500">{pendingCases.length}</p>
          </div>
        </div>
        <div className="rounded-lg bg-[#0d1222]/50 border border-white/5 p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Target className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">In Progress</p>
            <p className="text-sm font-black text-blue-500">{inProgressCases.length}</p>
          </div>
        </div>
        <div className="rounded-lg bg-[#0d1222]/50 border border-white/5 p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Shield className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Resolved</p>
            <p className="text-sm font-black text-emerald-500">{resolvedCases.length}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Department Allocation */}
        <div className="rounded-xl bg-[#0d1222]/85 backdrop-blur-md border border-white/5 overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Department Allocation</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Active & resolved incident distribution</p>
            </div>
            <div className="flex items-center gap-2.5">
              {deptData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{d.name}</span>
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
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
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
              <div className="flex flex-col items-center gap-2 text-slate-600">
                <Inbox className="h-8 w-8 text-slate-700" />
                <p className="text-xs font-semibold">No active allocation logs</p>
              </div>
            )}
          </div>
        </div>

        {/* Priority Bar Chart */}
        <div className="rounded-xl bg-[#0d1222]/85 backdrop-blur-md border border-white/5 overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-white/5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Priority Distribution</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Categorized threat intelligence cases count</p>
          </div>
          <div className="p-4 h-60">
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

        {/* Incident Timeline Trend */}
        <div className="rounded-xl bg-[#0d1222]/85 backdrop-blur-md border border-white/5 overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-white/5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Incident Timeline Trend</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Daily incoming emergency operations logs</p>
          </div>
          <div className="p-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={9} fontWeight={700} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={9} fontWeight={700} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Emergencies"
                  name="Incidents"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                  dot={{ fill: "#3B82F6", r: 3, strokeWidth: 1, stroke: "#0B1120" }}
                  activeDot={{ r: 5, stroke: "#3B82F6", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="rounded-xl bg-[#0d1222]/85 backdrop-blur-md border border-white/5 overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Encounter Statuses</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Real-time dispatcher logs status breakdown</p>
            </div>
            <div className="flex items-center gap-2.5">
              {statusData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{d.name}</span>
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
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
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
              <div className="flex flex-col items-center gap-2 text-slate-600">
                <Inbox className="h-8 w-8 text-slate-700" />
                <p className="text-xs font-semibold">No operational queue data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Centralized Incident Registry */}
      <div className="rounded-xl bg-[#0d1222]/85 backdrop-blur-md border border-white/5 overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Centralized Incident Registry</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Real-time log of security, medical, and fire dispatch entries</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sync Logs
            </button>
          </div>

          {/* Grid Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                placeholder="Search citizen, location, details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 h-9 bg-[#1F2937]/30 border border-white/10 rounded-lg text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {[
              { value: selectedDept, setter: setSelectedDept, opts: ["All Departments", "Police Force", "Fire Brigade", "Hospital EMS"], vals: ["All", "Police", "Fire", "Hospital"] },
              { value: selectedPriority, setter: setSelectedPriority, opts: ["All Priorities", "Critical", "High", "Medium", "Low"], vals: ["All", "Critical", "High", "Medium", "Low"] },
              { value: selectedStatus, setter: setSelectedStatus, opts: ["All Statuses", "Pending Queue", "In Progress", "Case Resolved"], vals: ["All", "Pending", "InProgress", "Resolved"] },
              { value: selectedSource, setter: setSelectedSource, opts: ["All Sources", "🌐 Web Portal", "📞 Telephony"], vals: ["All", "web", "call"] },
            ].map((f, i) => (
              <select
                key={i}
                value={f.value}
                onChange={(e) => f.setter(e.target.value)}
                className="h-9 bg-[#1F2937]/30 border border-white/10 rounded-lg px-2.5 text-xs text-slate-300 outline-none focus:border-blue-500/50 transition-all cursor-pointer"
              >
                {f.opts.map((opt, j) => (
                  <option key={j} value={f.vals[j]} className="bg-[#111827] text-white">{opt}</option>
                ))}
              </select>
            ))}
          </div>
        </div>

        {/* Interactive Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                {["ID/Name", "Location Details", "Unit Assigned", "Priority", "Encounter Status", "Report Type", "Timestamp", "Details"].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest ${i === 7 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCases.length > 0 ? (
                filteredCases.map((item) => (
                  <tr key={item._id} className="group hover:bg-white/[0.02] transition-all">
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-white">{item.name}</span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-mono text-slate-500 uppercase">#{item._id.slice(-6)}</span>
                          {item.phone && (
                            <span className="text-[9px] font-bold text-blue-400/90 flex items-center gap-0.5" title="Telephone Number">
                              📞 {item.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-slate-300 truncate font-semibold">{item.address || item.location}</span>
                        {item.landmark && (
                          <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded px-1.5 py-0.5 w-fit uppercase">
                            Near {item.landmark}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {(!item.department || item.department === "Unknown" || item.department.toLowerCase() === "unknown") ? (
                        <select
                          disabled={updatingStatus}
                          value="Unknown"
                          onChange={async (e) => {
                            const newDept = e.target.value;
                            if (newDept !== "Unknown") {
                              try {
                                const response = await updateEmergencyStatus(item._id, undefined, newDept);
                                if (response.success) {
                                  toast.success("Department unit assigned successfully");
                                  fetchDashboardData();
                                }
                              } catch (err) {
                                toast.error("Failed to assign department");
                              }
                            }
                          }}
                          className="h-7 bg-amber-500/10 border border-amber-500/30 rounded px-2 text-[9px] font-bold text-amber-500 outline-none focus:border-amber-500 transition-all cursor-pointer uppercase tracking-wider"
                        >
                          <option value="Unknown" className="bg-[#111827] text-amber-500">⚠️ Unassigned</option>
                          <option value="Police" className="bg-[#111827] text-[#3B82F6]">🚓 Police</option>
                          <option value="Fire Brigade" className="bg-[#111827] text-[#EF4444]">🚒 Fire Brigade</option>
                          <option value="Hospital" className="bg-[#111827] text-[#10B981]">🏥 Hospital EMS</option>
                        </select>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: item.department === "Police" ? "rgba(59,130,246,0.1)" : (item.department === "Fire" || item.department === "Fire Brigade") ? "rgba(239,110,110,0.1)" : "rgba(16,185,129,0.1)",
                            color: item.department === "Police" ? COLORS.Police : (item.department === "Fire" || item.department === "Fire Brigade") ? COLORS.Fire : COLORS.Hospital,
                            border: `1px solid ${item.department === "Police" ? "rgba(59,130,246,0.2)" : (item.department === "Fire" || item.department === "Fire Brigade") ? "rgba(239,110,110,0.2)" : "rgba(16,185,129,0.2)"}`,
                          }}
                        >
                          {item.department === "Police" ? "🚓" : (item.department === "Fire" || item.department === "Fire Brigade") ? "🚒" : "🏥"} {item.department === "Fire" || item.department === "Fire Brigade" ? "Fire Dept" : item.department}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${COLORS[item.priority]}12`,
                          color: COLORS[item.priority],
                          border: `1px solid ${COLORS[item.priority]}25`,
                        }}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${COLORS[item.status]}12`,
                          color: COLORS[item.status],
                          border: `1px solid ${COLORS[item.status]}25`,
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
                    <td className="px-4 py-3.5 text-xs text-slate-500 font-semibold font-mono">
                      {new Date(item.createdAt).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedCase(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider"
                      >
                        <Eye className="h-3 w-3" /> Audit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                        <Inbox className="h-5 w-5 text-slate-600" />
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No cases matches filters</p>
                      <p className="text-[10px] text-slate-500">Modify your search keywords or selection toggles</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Status Bar */}
        <div className="px-5 py-3.5 border-t border-white/5 bg-white/[0.005] flex items-center justify-between">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Showing <span className="text-slate-400 font-black">{filteredCases.length}</span> of <span className="text-slate-400 font-black">{allCases.length}</span> recorded logs
          </p>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{socketConnected ? "Live network active" : "Offline"}</span>
          </div>
        </div>
      </div>

      {/* Case Details Audit Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111827] rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 bg-[#1F2937]/20 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono text-blue-400 uppercase tracking-widest block mb-0.5">
                  Registry Incident log — #{selectedCase._id.slice(-6)}
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Case Audit Console</h3>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Scroll Container */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">

              {/* ⚠️ UNKNOWN DEPARTMENT ALERT — Action Required */}
              {(!selectedCase.department || selectedCase.department === 'Unknown' || selectedCase.department.toLowerCase() === 'unknown') && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/[0.07] overflow-hidden">
                  <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
                    <AlertOctagon className="h-4 w-4 text-amber-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Unit Unassigned — Admin Action Required</span>
                  </div>
                  <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Phone Number Call CTA */}
                    <div className="flex-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Citizen Contact Number</p>
                      {selectedCase.phone ? (
                        <a
                          href={`tel:${selectedCase.phone}`}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all group"
                        >
                          <PhoneCall className="h-4 w-4 group-hover:animate-pulse" />
                          <span className="text-sm font-black tracking-wide">{selectedCase.phone}</span>
                          <span className="text-[8px] font-bold text-emerald-300/60 uppercase ml-1">Tap to Call</span>
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-red-400">No phone number recorded</span>
                      )}
                    </div>

                    {/* Department Assignment Selector */}
                    <div className="flex-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assign Responding Unit</p>
                      <div className="flex items-center gap-2">
                        <select
                          disabled={assigningDept}
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) handleAssignDepartment(selectedCase._id, e.target.value);
                          }}
                          className="h-9 flex-1 bg-[#1F2937]/50 border border-amber-500/30 focus:border-amber-500 rounded-lg px-2.5 text-xs text-amber-400 font-bold outline-none transition-all cursor-pointer uppercase tracking-wider"
                        >
                          <option value="" className="bg-[#111827] text-slate-400">— Select Unit —</option>
                          <option value="Police" className="bg-[#111827] text-[#3B82F6]">🚓 Police Force</option>
                          <option value="Fire Brigade" className="bg-[#111827] text-[#EF4444]">🚒 Fire Brigade</option>
                          <option value="Hospital" className="bg-[#111827] text-[#10B981]">🏥 Hospital EMS</option>
                        </select>
                        {assigningDept && <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />}
                      </div>
                      <p className="text-[8px] text-amber-400/50 mt-1 font-medium">Contact the citizen before assigning if needed</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Core Information Panel */}
              <div className="grid grid-cols-3 gap-4 bg-[#1F2937]/20 rounded-xl p-4 border border-white/5">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Caller Name</span>
                  <span className="text-xs font-bold text-white truncate block">{selectedCase.name}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Telephone Number</span>
                  {selectedCase.phone ? (
                    <a href={`tel:${selectedCase.phone}`} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                      <PhoneCall className="h-3 w-3" />
                      {selectedCase.phone}
                    </a>
                  ) : (
                    <span className="text-xs font-bold text-slate-500">Not recorded</span>
                  )}
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">GPS Coordinates</span>
                  <span className="text-xs font-bold text-white truncate block">{selectedCase.location || 'N/A'}</span>
                </div>
              </div>

              {/* Location Intelligence */}
              {(selectedCase.address || selectedCase.area || selectedCase.city || selectedCase.landmark) && (
                <div className="rounded-xl border border-white/5 overflow-hidden">
                  <div className="bg-[#1F2937]/30 px-4 py-2.5 flex items-center justify-between border-b border-white/5">
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> AI Geospacial Intel
                    </span>
                    <span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">AUTO-EXTRACTED</span>
                  </div>
                  <div className="p-4 space-y-3.5 bg-[#1F2937]/10">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-3">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Extracted Address</span>
                        <span className="text-xs font-bold text-white leading-relaxed">{selectedCase.address || "N/A"}</span>
                      </div>
                      {[
                        { label: "Area Sector", val: selectedCase.area },
                        { label: "City", val: selectedCase.city },
                        { label: "Landmark Target", val: selectedCase.landmark },
                      ].map((f, i) => (
                        <div key={i}>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">{f.label}</span>
                          <span className={`text-xs font-bold ${i === 2 ? "text-purple-400" : "text-slate-300"}`}>{f.val || "N/A"}</span>
                        </div>
                      ))}
                    </div>
                    {/* Embedded Interactive Map */}
                    <div className="w-full h-44 rounded-lg overflow-hidden border border-white/5 mt-2 bg-[#0B1120]">
                      <iframe
                        width="100%"
                        height="100%"
                        src={
                          selectedCase.latitude && selectedCase.longitude
                            ? `https://maps.google.com/maps?q=${selectedCase.latitude},${selectedCase.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                            : `https://maps.google.com/maps?q=${encodeURIComponent(selectedCase.address || selectedCase.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                        }
                        frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" title="Geoloc Map"
                        className="opacity-80"
                      />
                    </div>
                    {selectedCase.latitude && selectedCase.longitude && (
                      <p className="text-[9px] text-emerald-400 font-bold flex items-center justify-end gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Accurate cellular GPS signal verified
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Status Update Options */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#1F2937]/15 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Assigned Unit</span>
                    {(!selectedCase.department || selectedCase.department === 'Unknown' || selectedCase.department.toLowerCase() === 'unknown') ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertOctagon className="h-2.5 w-2.5" /> Unassigned
                      </span>
                    ) : (
                      <span
                        className="inline-block px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: selectedCase.department === 'Police' ? 'rgba(59,130,246,0.1)' : (selectedCase.department === 'Fire' || selectedCase.department === 'Fire Brigade') ? 'rgba(239,110,110,0.1)' : 'rgba(16,185,129,0.1)',
                          color: selectedCase.department === 'Police' ? COLORS.Police : (selectedCase.department === 'Fire' || selectedCase.department === 'Fire Brigade') ? COLORS.Fire : COLORS.Hospital,
                          border: `1px solid ${selectedCase.department === 'Police' ? 'rgba(59,130,246,0.2)' : (selectedCase.department === 'Fire' || selectedCase.department === 'Fire Brigade') ? 'rgba(239,110,110,0.2)' : 'rgba(16,185,129,0.2)'}`,
                        }}
                      >
                        {(selectedCase.department === 'Fire' || selectedCase.department === 'Fire Brigade') ? '🚒 Fire Brigade' : selectedCase.department === 'Police' ? '🚓 Police' : '🏥 Hospital EMS'}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Threat Priority</span>
                    <span
                      className="inline-block px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${COLORS[selectedCase.priority]}12`,
                        color: COLORS[selectedCase.priority],
                        border: `1px solid ${COLORS[selectedCase.priority]}25`,
                      }}
                    >
                      {selectedCase.priority}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Update Status</span>
                  <select
                    disabled={updatingStatus}
                    value={selectedCase.status}
                    onChange={(e) => handleStatusChange(selectedCase._id, e.target.value)}
                    className="h-8 bg-[#1F2937]/55 border border-white/10 rounded-lg px-2.5 text-xs text-white font-bold outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                  >
                    <option value="Pending" className="bg-[#111827]">Pending</option>
                    <option value="InProgress" className="bg-[#111827]">In Progress</option>
                    <option value="Resolved" className="bg-[#111827]">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Citizen Narrative */}
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Narrative Transcript</span>
                <p className="p-4 bg-[#1F2937]/10 border border-white/5 rounded-xl text-xs leading-relaxed text-slate-300 font-semibold">
                  "{selectedCase.message || selectedCase.description}"
                </p>
              </div>

              {/* Call Telephony Recording */}
              {selectedCase.source === "call" && (
                <div className="rounded-xl border border-violet-500/20 overflow-hidden">
                  <div className="bg-violet-500/10 px-4 py-2.5 flex items-center justify-between border-b border-violet-500/20">
                    <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1">
                      <Mic className="h-3.5 w-3.5" /> Call Telephony audio log
                    </span>
                    <span className="text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded">RECORDING</span>
                  </div>
                  <div className="p-4 bg-[#1F2937]/10 flex flex-col gap-2">
                    {selectedCase.recordingUrl ? (
                      <audio controls src={selectedCase.recordingUrl} className="w-full h-8" />
                    ) : (
                      <p className="text-xs text-violet-400 font-bold">Audio stream processing...</p>
                    )}
                    <span className="text-[9px] text-slate-500 font-bold uppercase">
                      Phone Number: {selectedCase.phone}
                    </span>
                  </div>
                </div>
              )}

              {/* AI Dispatch Engine Analysis */}
              {selectedCase.aiAnalysis && (
                <div className="rounded-xl border border-blue-500/20 overflow-hidden">
                  <div className="bg-blue-500/10 px-4 py-2.5 flex items-center justify-between border-b border-blue-500/20">
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">AI Classification Summary</span>
                    <span className="text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">RESOLVED</span>
                  </div>
                  <div className="p-4 space-y-4 bg-[#1F2937]/10">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Classification Category</span>
                        <span className="text-xs font-bold text-white uppercase">{selectedCase.aiAnalysis.category}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Engine Confidence</span>
                        <span className="text-xs font-bold text-blue-400 font-mono">{(selectedCase.aiAnalysis.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Recommended Response Vehicles</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCase.aiAnalysis.recommendedUnits?.map((unit, idx) => (
                          <span key={idx} className="bg-[#1F2937] border border-white/5 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">{unit}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Dispatch Decision Logic</span>
                      <p className="text-xs text-slate-400 italic leading-relaxed font-medium">"{selectedCase.aiAnalysis.reason}"</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-white/5 bg-[#1F2937]/20 flex justify-end">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all text-xs font-semibold uppercase tracking-wider"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
