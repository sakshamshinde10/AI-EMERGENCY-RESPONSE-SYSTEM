import React, { useEffect, useState, useRef } from "react";
import { getAllEmergencies, updateEmergencyStatus } from "../services/emergencyApi";
import { io } from "socket.io-client";
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
  Calendar,
  Layers,
  Inbox,
  Search,
  Filter,
  Eye,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

// Professional Government Colors
const COLORS = {
  Police: "#2563EB", // blue-600
  Fire: "#DC2626",   // red-600
  Hospital: "#16A34A", // green-600
  Pending: "#D97706", // amber-600
  InProgress: "#2563EB", // blue-600
  Resolved: "#16A34A", // green-600
  Critical: "#DC2626", // red-600
  High: "#EA580C", // orange-600
  Medium: "#D97706", // amber-600
  Low: "#65A30D", // lime-600
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
      oscillator.frequency.setValueAtTime(988, audioCtx.currentTime); // B5
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      oscillator.start();
      
      // Double beep
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime + 0.12);
      oscillator.frequency.setValueAtTime(988, audioCtx.currentTime + 0.18);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.18);
      gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.stop(audioCtx.currentTime + 0.35);
    } else {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(659, audioCtx.currentTime); // E5
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

const AdminDashboard = () => {
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Filtering and searching states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

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

    // Socket Connection and Event Listeners
    socketRef.current = io("http://localhost:5000");
    const socket = socketRef.current;

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("new-emergency", (emergency) => {
      // Play audio notification
      playAlertSound(emergency.priority);

      // Show toast
      toast.error(`NEW CENTRAL ALERT ROUTED`, {
        description: `Routed to ${emergency.department} | Priority: ${emergency.priority}`,
        duration: 8000,
      });

      fetchDashboardData();
    });

    socket.on("status-updated", () => {
      fetchDashboardData();
    });

    return () => {
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

    return matchesSearch && matchesDept && matchesPriority && matchesStatus;
  });

  // Chart 1: Department Distribution
  const policeCount = allCases.filter((c) => c.department === "Police").length;
  const fireCount = allCases.filter((c) => c.department === "Fire").length;
  const hospitalCount = allCases.filter((c) => c.department === "Hospital").length;

  const deptData = [
    { name: "Police", value: policeCount, color: COLORS.Police },
    { name: "Fire Dept", value: fireCount, color: COLORS.Fire },
    { name: "Hospital", value: hospitalCount, color: COLORS.Hospital },
  ].filter((d) => d.value > 0);

  // Chart 2: Status Distribution
  const statusData = [
    { name: "Pending", value: pendingCases.length, color: COLORS.Pending },
    { name: "In Progress", value: inProgressCases.length, color: COLORS.InProgress },
    { name: "Resolved", value: resolvedCases.length, color: COLORS.Resolved },
  ].filter((d) => d.value > 0);

  // Chart 3: Priority Distribution
  const priorityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  allCases.forEach((c) => {
    if (priorityCounts[c.priority] !== undefined) {
      priorityCounts[c.priority]++;
    }
  });
  const priorityData = [
    { name: "Critical", count: priorityCounts.Critical, fill: COLORS.Critical },
    { name: "High", count: priorityCounts.High, fill: COLORS.High },
    { name: "Medium", count: priorityCounts.Medium, fill: COLORS.Medium },
    { name: "Low", count: priorityCounts.Low, fill: COLORS.Low },
  ];

  // Chart 4: Daily Trend (Last 7 days)
  const getTrendData = () => {
    const dates = {};
    // Seed last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dates[dateStr] = 0;
    }

    allCases.forEach((c) => {
      const dateStr = new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dates[dateStr] !== undefined) {
        dates[dateStr]++;
      }
    });

    return Object.keys(dates).map((date) => ({
      date,
      Emergencies: dates[date],
    }));
  };
  const trendData = getTrendData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#0F172A]" />
          <p className="text-sm font-semibold text-[#64748B] tracking-wide">
            Initializing Unified Control Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Central Command Overview">
      <Toaster position="top-right" richColors />
      
      {/* Central Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                Central Cases Logged
              </p>
              <h3 className="text-2xl font-bold text-[#0F172A]">{allCases.length}</h3>
            </div>
            <div className="w-10 h-10 bg-[#0F172A]/5 text-[#0F172A] rounded-lg flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                Active Encounters
              </p>
              <h3 className="text-2xl font-bold text-[#2563EB]">{activeCases.length}</h3>
            </div>
            <div className="w-10 h-10 bg-[#2563EB]/5 text-[#2563EB] rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm border-l-4 border-l-[#DC2626]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                Critical Threats
              </p>
              <h3 className="text-2xl font-bold text-[#DC2626]">{criticalCases.length}</h3>
            </div>
            <div className="w-10 h-10 bg-[#DC2626]/5 text-[#DC2626] rounded-lg flex items-center justify-center">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                Resolved Actions
              </p>
              <h3 className="text-2xl font-bold text-[#16A34A]">{resolvedCases.length}</h3>
            </div>
            <div className="w-10 h-10 bg-[#16A34A]/5 text-[#16A34A] rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Chart 1: Department Distribution */}
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#0F172A]">Department Allocation</CardTitle>
            <CardDescription className="text-xs">Distribution of all active and resolved emergency incidents</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    style={{ outline: "none" }}
                  >
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5">
                <Inbox className="h-4 w-4" /> No logged allocations
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Priority Bar Chart */}
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#0F172A]">Priority Distribution</CardTitle>
            <CardDescription className="text-xs">Count of incidents filtered by classified threat levels</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} fontWeight={500} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} fontWeight={500} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }} cursor={{ fill: "rgba(15,23,42,0.01)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 3: Weekly Daily Trend */}
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#0F172A]">Incident Timeline Trend</CardTitle>
            <CardDescription className="text-xs">Daily logged emergency call volume over the past week</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} fontWeight={500} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} fontWeight={500} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }} />
                <Line
                  type="monotone"
                  dataKey="Emergencies"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  dot={{ fill: "#0F172A", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 4: Case Resolution Statuses */}
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#0F172A]">Encounter Statuses</CardTitle>
            <CardDescription className="text-xs">Real-time status tracking of all emergency responses</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    style={{ outline: "none" }}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5">
                <Inbox className="h-4 w-4" /> No logs recorded
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emergency Registry Table Section */}
      <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-[#E2E8F0] bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-[#0F172A]">Centralized Incident Registry</CardTitle>
              <CardDescription className="text-xs">Telemetry log of all security, health, and rescue cases</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboardData}
                className="h-9 text-xs font-semibold gap-1 text-[#64748B] hover:text-[#0F172A] border-[#E2E8F0]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh Logs
              </Button>
            </div>
          </div>

          {/* Filtering Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <Input
                placeholder="Search incident, location, citizen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-[#F8FAFC] border-[#E2E8F0] focus:ring-[#0F172A]/20 focus:border-[#0F172A]"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full h-9 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0F172A]/20 focus:border-[#0F172A]"
              >
                <option value="All">All Departments</option>
                <option value="Police">Police</option>
                <option value="Fire">Fire Dept</option>
                <option value="Hospital">Hospital</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full h-9 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0F172A]/20 focus:border-[#0F172A]"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-xs text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0F172A]/20 focus:border-[#0F172A]"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="InProgress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </CardHeader>

        {/* Incident Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#64748B] text-xs uppercase tracking-wider border-b border-[#E2E8F0]">
                <th className="p-4 font-bold text-[10px]">Citizen</th>
                <th className="p-4 font-bold text-[10px]">Location</th>
                <th className="p-4 font-bold text-[10px]">Department</th>
                <th className="p-4 font-bold text-[10px]">Priority</th>
                <th className="p-4 font-bold text-[10px]">Status</th>
                <th className="p-4 font-bold text-[10px]">Time Logged</th>
                <th className="p-4 font-bold text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs font-semibold text-[#0F172A]">
              {filteredCases.length > 0 ? (
                filteredCases.map((item) => (
                  <tr key={item._id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-4 font-bold">{item.name}</td>
                    <td className="p-4 text-[#0F172A] font-bold max-w-[200px]" title={item.address || item.location}>
                      <div className="flex flex-col gap-0.5">
                        <span className="truncate">{item.address || item.location}</span>
                        {item.landmark && (
                          <span className="text-[9px] font-semibold text-purple-600 bg-purple-50 border border-purple-100/60 rounded px-1 py-0.25 w-fit">
                            L: {item.landmark}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                        style={{
                          backgroundColor:
                            item.department === "Police"
                              ? COLORS.Police
                              : item.department === "Fire"
                              ? COLORS.Fire
                              : COLORS.Hospital,
                        }}
                      >
                        {item.department === "Fire" ? "Fire Dept" : item.department}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                        style={{ backgroundColor: COLORS[item.priority] || "#64748B" }}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                        style={{ backgroundColor: COLORS[item.status] || "#64748B" }}
                      >
                        {item.status === "InProgress" ? "In Progress" : item.status}
                      </span>
                    </td>
                    <td className="p-4 text-[#64748B]">
                      {new Date(item.createdAt).toLocaleString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCase(item)}
                        className="h-7 text-[10px] font-bold border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] gap-1 px-2.5"
                      >
                        <Eye className="h-3 w-3" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#64748B] font-medium text-xs">
                    <div className="flex flex-col items-center gap-1.5">
                      <Inbox className="h-6 w-6 text-[#94A3B8]" />
                      No matching incident logs found in database.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Case Details Dialog */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest block mb-0.5">
                  Emergency Report - ID: {selectedCase._id.slice(-6).toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-[#0F172A]">Incident Details & Dispatch Status</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCase(null)}
                className="h-8 w-8 p-0 text-[#64748B] hover:text-[#0F172A]"
              >
                &times;
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[#0F172A]">
              {/* Primary Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0]">
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Citizen Name</span>
                  <span className="font-bold">{selectedCase.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Phone Number</span>
                  <span className="font-bold">{selectedCase.phone || "Not provided"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Location Coordinates</span>
                  <span className="font-bold truncate block">{selectedCase.location || "N/A"}</span>
                </div>
              </div>

              {/* Location Intelligence Grid */}
              {(selectedCase.address || selectedCase.area || selectedCase.city || selectedCase.landmark) && (
                <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                  <div className="bg-[#0F172A] text-white px-4 py-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider">AI Location Intelligence</span>
                    <Badge variant="outline" className="text-white border-white/20 text-[9px] font-bold">
                      EXTRACTED ADDRESS
                    </Badge>
                  </div>
                  <div className="p-4 space-y-3.5 bg-slate-50 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-3">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Full Extracted Address</span>
                        <span className="font-bold text-[#0F172A] text-sm">{selectedCase.address || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-0.5">Area / Sector</span>
                        <span className="font-semibold text-[#0F172A]">{selectedCase.area || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-0.5">City</span>
                        <span className="font-semibold text-[#0F172A]">{selectedCase.city || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-0.5">Landmark</span>
                        <span className="font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded w-fit inline-block">{selectedCase.landmark || "N/A"}</span>
                      </div>
                    </div>

                    {/* Google Map Embed */}
                    <div className="w-full h-56 border border-[#E2E8F0] rounded-lg overflow-hidden mt-4">
                      <iframe
                        width="100%"
                        height="100%"
                        src={
                          selectedCase.latitude && selectedCase.longitude
                            ? `https://maps.google.com/maps?q=${selectedCase.latitude},${selectedCase.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                            : `https://maps.google.com/maps?q=${encodeURIComponent(selectedCase.address || selectedCase.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                        }
                        frameBorder="0"
                        scrolling="no"
                        marginHeight="0"
                        marginWidth="0"
                        title="Incident Location Map"
                      />
                    </div>
                    {selectedCase.latitude && selectedCase.longitude && (
                      <p className="text-[9px] text-emerald-600 font-bold mt-1 text-right flex items-center justify-end gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        High-accuracy browser GPS coordinates captured.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Status and Department Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-[#E2E8F0] rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Assigned Unit</span>
                    <span
                      className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                      style={{
                        backgroundColor:
                          selectedCase.department === "Police"
                            ? COLORS.Police
                            : selectedCase.department === "Fire"
                            ? COLORS.Fire
                            : COLORS.Hospital,
                      }}
                    >
                      {selectedCase.department === "Fire" ? "Fire Dept" : selectedCase.department}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Classified Priority</span>
                    <span
                      className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                      style={{ backgroundColor: COLORS[selectedCase.priority] || "#64748B" }}
                    >
                      {selectedCase.priority}
                    </span>
                  </div>
                </div>

                {/* Status Dropdown to Update Case */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Update Status</span>
                  <select
                    disabled={updatingStatus}
                    value={selectedCase.status}
                    onChange={(e) => handleStatusChange(selectedCase._id, e.target.value)}
                    className="h-9 rounded-md border border-[#E2E8F0] bg-white px-3 py-1 text-xs text-[#0F172A] font-bold outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                  >
                    <option value="Pending">Pending</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Incident Description */}
              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">Incident Description</span>
                <p className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs leading-relaxed text-[#0F172A]">
                  {selectedCase.description}
                </p>
              </div>

              {/* AI Analysis Summary */}
              {selectedCase.aiAnalysis && (
                <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                  <div className="bg-[#0F172A] text-white px-4 py-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider">AI Command Dispatch Engine Analysis</span>
                    <Badge variant="outline" className="text-white border-white/20 text-[9px] font-bold">
                      SYSTEM CLASSIFIED
                    </Badge>
                  </div>
                  <div className="p-4 space-y-3.5 bg-slate-50 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-0.5">Identified Category</span>
                        <span className="font-bold text-[#0F172A]">{selectedCase.aiAnalysis.category}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-0.5">Confidence Score</span>
                        <span className="font-bold text-[#0F172A]">{(selectedCase.aiAnalysis.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-0.5">Recommended Response Units</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedCase.aiAnalysis.recommendedUnits?.map((unit, idx) => (
                          <span key={idx} className="bg-white border border-[#E2E8F0] text-[#0F172A] text-[10px] font-bold px-2 py-0.5 rounded">
                            {unit}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-0.5">Automated Dispatch Reason</span>
                      <p className="text-[#64748B] italic mt-0.5 leading-relaxed">{selectedCase.aiAnalysis.reason}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCase(null)}
                className="h-9 text-xs font-semibold border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]"
              >
                Close View
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
