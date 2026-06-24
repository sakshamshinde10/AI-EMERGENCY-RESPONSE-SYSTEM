import React, { useEffect, useState, useRef } from "react";
import { getAllEmergencies } from "../services/emergencyApi";
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
  Volume2,
  VolumeX,
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

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    oscillator.start();
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime + 0.15);
    oscillator.stop(audioCtx.currentTime + 0.2);
  } catch (error) {
    console.log("AudioContext playback failed", error);
  }
};

const AnalyticsDashboard = () => {
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const socketRef = useRef(null);
  const audioEnabledRef = useRef(audioEnabled);

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

  // Keep ref in sync without triggering socket reconnects
  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  useEffect(() => {
    fetchAllCases();

    socketRef.current = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    const socket = socketRef.current;

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    const handleNewEmergency = (emergency) => {
      setAllCases((prevCases) => {
        const newCases = [emergency, ...prevCases];
        return newCases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });

      if (audioEnabledRef.current) {
        playAlertSound(emergency.priority);
      }

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
      socket.disconnect();
    };
  }, []);

  // Compute Metrics
  const policeCount = allCases.filter(c => c.department === "Police").length;
  const fireCount = allCases.filter(c => c.department === "Fire" || c.department === "Fire Brigade").length;
  const hospitalCount = allCases.filter(c => c.department === "Hospital").length;

  const pendingCount = allCases.filter(c => c.status === "Pending").length;
  const inProgressCount = allCases.filter(c => c.status === "InProgress").length;
  const resolvedCount = allCases.filter(c => c.status === "Resolved").length;

  const criticalCount = allCases.filter(c => c.priority === "Critical").length;
  const highCount = allCases.filter(c => c.priority === "High").length;
  const mediumCount = allCases.filter(c => c.priority === "Medium").length;
  const lowCount = allCases.filter(c => c.priority === "Low").length;

  // Chart Data preparation
  const deptData = [
    { name: "Police", value: policeCount, color: COLORS.Police },
    { name: "Fire Dept", value: fireCount, color: COLORS.Fire },
    { name: "Hospital", value: hospitalCount, color: COLORS.Hospital },
  ].filter(d => d.value > 0);

  const statusData = [
    { name: "Pending", value: pendingCount, color: COLORS.Pending },
    { name: "In Progress", value: inProgressCount, color: COLORS.InProgress },
    { name: "Resolved", value: resolvedCount, color: COLORS.Resolved },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: "Critical", count: criticalCount, fill: COLORS.Critical },
    { name: "High", count: highCount, fill: COLORS.High },
    { name: "Medium", count: mediumCount, fill: COLORS.Medium },
    { name: "Low", count: lowCount, fill: COLORS.Low },
  ];

  // Group by date for line chart
  const dateMap = {};
  // Seed last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dateMap[dateStr] = 0;
  }

  allCases.forEach((c) => {
    const d = new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (dateMap[d] !== undefined) {
      dateMap[d]++;
    }
  });
  
  const trendData = Object.keys(dateMap).map(dateStr => ({
    date: dateStr,
    Emergencies: dateMap[dateStr],
  }));

  const textStyle = {
    fill: "#475569",
    fontSize: 11,
    fontWeight: 500
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-600/10 text-red-600 border-red-600/20";
      case "High":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-blue-600/10 text-blue-600 border-blue-600/20";
    }
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setAudioEnabled(!audioEnabled)}
        title={audioEnabled ? "Mute audio alerts" : "Unmute audio alerts"}
        className="h-9 w-9 rounded-lg border-[#E2E8F0] hover:bg-[#F8FAFC] shrink-0"
      >
        {audioEnabled ? (
          <Volume2 className="h-4 w-4 text-emerald-600 animate-pulse" />
        ) : (
          <VolumeX className="h-4 w-4 text-[#64748B]" />
        )}
      </Button>
    </div>
  );

  return (
    <DashboardLayout title="Operational Analytics Log" headerActions={headerActions}>
      <Toaster position="top-right" richColors />
      
      <div className="flex flex-col space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-[#0F172A]">
            <TrendingUp className="h-6 w-6 text-[#0F172A]" />
            Operations Analytics Dashboard
          </h1>
          <p className="text-[#64748B] text-xs mt-0.5 font-medium">Timeline trends, load distribution, and department-wise cases statistics analysis.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#64748B] gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#0F172A]" />
            <p className="text-sm font-semibold">Aggregating telemetry analytics...</p>
          </div>
        ) : (
          <>
            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Departments */}
              <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Department Load</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0F172A] flex items-center gap-1.5"><Shield className="h-4 w-4 text-[#2563EB]" /> Police Cases</span>
                    <span className="font-bold text-[#2563EB]">{policeCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0F172A] flex items-center gap-1.5"><Flame className="h-4 w-4 text-[#DC2626]" /> Fire Cases</span>
                    <span className="font-bold text-[#DC2626]">{fireCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0F172A] flex items-center gap-1.5"><Activity className="h-4 w-4 text-[#16A34A]" /> Medical Cases</span>
                    <span className="font-bold text-[#16A34A]">{hospitalCount}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Statuses */}
              <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Case Status</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0F172A] flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Pending</span>
                    <span className="font-bold text-amber-500">{pendingCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0F172A] flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" /> Active Dispatches</span>
                    <span className="font-bold text-blue-500">{inProgressCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0F172A] flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Closed Cases</span>
                    <span className="font-bold text-emerald-500">{resolvedCount}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Priorities */}
              <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Priority Metrics</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0F172A] flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#DC2626]" /> Critical</span>
                    <span className="font-bold text-[#DC2626]">{criticalCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0F172A] flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#EA580C]" /> High</span>
                    <span className="font-bold text-[#EA580C]">{highCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0F172A] flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#D97706]" /> Medium</span>
                    <span className="font-bold text-[#D97706]">{mediumCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0F172A] flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#65A30D]" /> Low</span>
                    <span className="font-bold text-[#65A30D]">{lowCount}</span>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart 1: Department Distribution */}
              <Card className="border-[#E2E8F0] shadow-sm rounded-xl p-5 bg-white">
                <h3 className="text-sm font-bold mb-4 text-center text-[#0F172A]">Department Allocation</h3>
                <div className="h-72 flex items-center justify-center">
                  {deptData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deptData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={5}
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
                      <Inbox className="h-4 w-4" /> No logs logged
                    </div>
                  )}
                </div>
              </Card>

              {/* Chart 2: Status Distribution */}
              <Card className="border-[#E2E8F0] shadow-sm rounded-xl p-5 bg-white">
                <h3 className="text-sm font-bold mb-4 text-center text-[#0F172A]">Active Case Statuses</h3>
                <div className="h-72 flex items-center justify-center">
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={5}
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
                      <Inbox className="h-4 w-4" /> No logged statuses
                    </div>
                  )}
                </div>
              </Card>

              {/* Chart 3: Priority Bar Chart */}
              <Card className="border-[#E2E8F0] shadow-sm rounded-xl p-5 bg-white">
                <h3 className="text-sm font-bold mb-4 text-center text-[#0F172A]">Priority Rating Metrics</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData} margin={{ top: 10, right: 20, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748B" tick={textStyle} tickLine={false} />
                      <YAxis stroke="#64748B" tick={textStyle} tickLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }}
                        cursor={{ fill: "rgba(0,0,0,0.01)" }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Chart 4: Daily Trend */}
              <Card className="border-[#E2E8F0] shadow-sm rounded-xl p-5 bg-white">
                <h3 className="text-sm font-bold mb-4 text-center text-[#0F172A]">Daily Trend Timeline</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 20, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748B" tick={textStyle} tickLine={false} />
                      <YAxis stroke="#64748B" tick={textStyle} tickLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Emergencies" 
                        stroke="#0F172A" 
                        strokeWidth={3}
                        dot={{ fill: "#0F172A", r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

            </div>

            {/* Recent Table */}
            <Card className="border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden bg-white">
              <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <h3 className="text-sm font-bold text-[#0F172A]">Incident Telemetry Log</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[#64748B] text-xs uppercase tracking-wider border-b border-[#E2E8F0]">
                      <th className="p-4 font-bold text-[10px]">Name</th>
                      <th className="p-4 font-bold text-[10px]">Department</th>
                      <th className="p-4 font-bold text-[10px]">Priority</th>
                      <th className="p-4 font-bold text-[10px]">Status</th>
                      <th className="p-4 font-bold text-[10px] text-right">Time Logged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-xs font-semibold text-[#0F172A]">
                    {allCases.slice(0, 10).map((item) => (
                      <tr key={item._id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-4 font-bold">{item.name}</td>
                        <td className="p-4">
                          <span 
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                            style={{ 
                              backgroundColor: 
                                item.department === "Police" 
                                  ? COLORS.Police 
                                  : (item.department === "Fire" || item.department === "Fire Brigade") 
                                  ? COLORS.Fire 
                                  : COLORS.Hospital 
                            }}
                          >
                            {item.department === "Fire" || item.department === "Fire Brigade" ? "Fire Dept" : item.department}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className={getPriorityBadgeColor(item.priority)}>
                            {item.priority}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                            style={{ backgroundColor: COLORS[item.status] || "#64748B" }}
                          >
                            {item.status === "InProgress" ? "In Progress" : item.status}
                          </span>
                        </td>
                        <td className="p-4 text-right text-[#64748B]">
                          {new Date(item.createdAt).toLocaleString("en-US", { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsDashboard;
