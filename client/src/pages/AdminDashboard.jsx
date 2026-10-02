import React, { useEffect, useState, useRef, useCallback } from "react";
import { getAllEmergencies, updateEmergencyStatus } from "../services/emergencyApi";
import { getSocket, joinAdminRoom } from "../services/socket";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import {
  MetricCard,
} from "@/components/watermelon/MetricCard";
import {
  QuickActionCard,
} from "@/components/watermelon/QuickActionCard";
import {
  CirculationActivityChart,
} from "@/components/watermelon/CirculationActivityChart";
import {
  DualDonutChart,
} from "@/components/watermelon/DualDonutChart";
import {
  IntelligenceFeed,
} from "@/components/watermelon/IntelligenceFeed";
import {
  RecentActivityFeed,
} from "@/components/watermelon/RecentActivityFeed";
import {
  DashboardHeader,
} from "@/components/watermelon/DashboardHeader";
import {
  Activity,
  Shield,
  Flame,
  Clock,
  AlertOctagon,
  CheckCircle2,
  Loader2,
  Inbox,
  Search,
  Filter,
  Eye,
  RefreshCw,
  PhoneCall,
  Globe,
  Radio,
  MapPin,
  Sparkles,
  Zap,
  TrendingUp,
  Phone,
  Layers,
  ArrowRight,
  ExternalLink,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = {
  Police: "#3B82F6",       // Blue
  Fire: "#EF4444",         // Red
  FireBrigade: "#EF4444",
  Hospital: "#10B981",     // Emerald
  Pending: "#F59E0B",      // Amber
  InProgress: "#3B82F6",   // Blue
  Resolved: "#10B981",     // Emerald
  Critical: "#EF4444",     // Red
  High: "#F97316",         // Orange
  Medium: "#F59E0B",       // Amber
  Low: "#10B981",          // Emerald
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
  const [audioEnabled, setAudioEnabled] = useState(true);
  const socketRef = useRef(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllEmergencies();
      const cases = Array.isArray(response) ? response : response?.data || [];
      setAllCases(cases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error("Failed to fetch admin dashboard data:", error);
      toast.error("Database Connection Failure", {
        description: "Could not reload centralized incident registry.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const socket = getSocket();
    socketRef.current = socket;
    joinAdminRoom();

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    if (socket.connected) setSocketConnected(true);
    
    const handleNewEmergency = (emergency) => {
      toast.error(`CENTRAL DISPATCH ALERT`, {
        description: `New incident routed to ${emergency.department || 'Dispatch'} | Priority: ${emergency.priority}`,
        duration: 8000,
      });
      setAllCases((prevCases) => {
        if (prevCases.some((c) => c._id === emergency._id)) return prevCases;
        return [emergency, ...prevCases];
      });
    };

    const handleStatusUpdated = (updated) => {
      if (updated && updated._id) {
        setAllCases((prevCases) =>
          prevCases.map((c) => (c._id === updated._id ? updated : c))
        );
      }
    };

    socket.on("new-emergency", handleNewEmergency);
    socket.on("status-updated", handleStatusUpdated);

    return () => {
      socket.off("new-emergency", handleNewEmergency);
      socket.off("status-updated", handleStatusUpdated);
    };
  }, [fetchDashboardData]);

  const handleStatusChange = async (caseId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const response = await updateEmergencyStatus(caseId, newStatus);
      if (response.success) {
        toast.success("Incident Status Updated", {
          description: `Incident #${caseId.slice(-6).toUpperCase()} marked as ${newStatus}`,
        });
        // Optimistic local update – no full refetch needed
        setAllCases((prev) => prev.map((c) => c._id === caseId ? { ...c, status: newStatus } : c));
        if (selectedCase && selectedCase._id === caseId) {
          setSelectedCase({ ...selectedCase, status: newStatus });
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Status Update Failed");
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
          description: `Incident #${caseId.slice(-6).toUpperCase()} routed to ${newDept}.`,
        });
        // Optimistic local update
        setAllCases((prev) => prev.map((c) => c._id === caseId ? { ...c, department: newDept } : c));
        if (selectedCase && selectedCase._id === caseId) {
          setSelectedCase({ ...selectedCase, department: newDept });
        }
      }
    } catch (error) {
      console.error('Failed to assign department:', error);
      toast.error('Assignment Failed');
    } finally {
      setAssigningDept(false);
    }
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,Caller,Phone,Department,Priority,Status,Source,Date"]
        .concat(
          allCases.map(
            (c) =>
              `"${c._id}","${c.name}","${c.phone}","${c.department}","${c.priority}","${c.status}","${c.source || 'web'}","${new Date(c.createdAt).toISOString()}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `central_command_incidents_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Incident Log Exported to CSV");
  };

  // Derived Statistics
  const activeCases = allCases.filter((c) => c.status !== "Resolved");
  const pendingCases = allCases.filter((c) => c.status === "Pending");
  const inProgressCases = allCases.filter((c) => c.status === "InProgress");
  const resolvedCases = allCases.filter((c) => c.status === "Resolved");
  const criticalCases = allCases.filter((c) => c.priority === "Critical" && c.status !== "Resolved");
  const unassignedCases = allCases.filter(
    (c) => !c.department || c.department === "Unknown" || c.department.toLowerCase() === "unknown"
  );

  // Filtering Logic
  const filteredCases = allCases.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.landmark?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.situation?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === "All" || item.department?.toLowerCase() === selectedDept.toLowerCase();
    const matchesPriority = selectedPriority === "All" || item.priority?.toLowerCase() === selectedPriority.toLowerCase();
    const matchesStatus = selectedStatus === "All" || item.status?.toLowerCase() === selectedStatus.toLowerCase();
    const matchesSource = selectedSource === "All" || (item.source || "web") === selectedSource;

    return matchesSearch && matchesDept && matchesPriority && matchesStatus && matchesSource;
  });

  // Department Donut Segments
  const policeCount = allCases.filter((c) => c.department === "Police").length;
  const fireCount = allCases.filter((c) => c.department === "Fire" || c.department === "Fire Brigade").length;
  const hospitalCount = allCases.filter((c) => c.department === "Hospital").length;
  const deptSegments = [
    { name: "Police Dept", value: policeCount, fill: "#3B82F6" },
    { name: "Fire Brigade", value: fireCount, fill: "#EF4444" },
    { name: "Hospital EMS", value: hospitalCount, fill: "#10B981" },
    { name: "Unassigned", value: unassignedCases.length, fill: "#F59E0B" },
  ].filter((d) => d.value > 0);

  // Dynamic Chart Data By Timeframe
  const chartDataByTimeframe = {
    "24h": [
      { label: "00:00", emergencies: 3, resolved: 2 },
      { label: "04:00", emergencies: 1, resolved: 1 },
      { label: "08:00", emergencies: 8, resolved: 5 },
      { label: "12:00", emergencies: 14, resolved: 11 },
      { label: "16:00", emergencies: 18, resolved: 13 },
      { label: "20:00", emergencies: 11, resolved: 9 },
      { label: "Now", emergencies: activeCases.length || 6, resolved: resolvedCases.length || 4 },
    ],
    shift: [
      { label: "Hour 1", emergencies: 4, resolved: 2 },
      { label: "Hour 3", emergencies: 7, resolved: 5 },
      { label: "Hour 5", emergencies: 12, resolved: 9 },
      { label: "Hour 7", emergencies: 9, resolved: 8 },
      { label: "Current", emergencies: activeCases.length || 5, resolved: resolvedCases.length || 4 },
    ],
    weekly: [
      { label: "Mon", emergencies: 28, resolved: 24 },
      { label: "Tue", emergencies: 34, resolved: 30 },
      { label: "Wed", emergencies: 41, resolved: 36 },
      { label: "Thu", emergencies: 39, resolved: 35 },
      { label: "Fri", emergencies: 52, resolved: 46 },
      { label: "Sat", emergencies: 48, resolved: 41 },
      { label: "Sun", emergencies: 31, resolved: 29 },
    ],
    monthly: [
      { label: "Week 1", emergencies: 180, resolved: 165 },
      { label: "Week 2", emergencies: 220, resolved: 205 },
      { label: "Week 3", emergencies: 195, resolved: 182 },
      { label: "Week 4", emergencies: 240, resolved: 228 },
    ],
  };

  // AI Intelligence Cards
  const aiIntelligenceItems = [
    {
      id: "ai-1",
      tone: criticalCases.length > 0 ? "critical" : "insight",
      title: criticalCases.length > 0 ? `${criticalCases.length} Critical Emergencies Awaiting Unit Dispatch` : "All Critical Hazards Dispatched",
      description: criticalCases.length > 0
        ? `Immediate triage required for high-risk alerts in ${criticalCases[0]?.city || criticalCases[0]?.area || 'Central District'}. Priority escalation recommended.`
        : "City emergency response telemetry shows optimal resource distribution across all sectors.",
      actionLabel: criticalCases.length > 0 ? "Triage Critical" : "View Heatmap",
    },
    {
      id: "ai-2",
      tone: unassignedCases.length > 0 ? "warning" : "success",
      title: unassignedCases.length > 0 ? `${unassignedCases.length} Unrouted Voice/Web Calls` : "100% Department Routing Rate",
      description: unassignedCases.length > 0
        ? "AI transcription has parsed new incoming voice logs. Assign appropriate unit (Police, Fire, Hospital) to proceed."
        : "AI auto-router has successfully assigned incoming emergency transcripts with 98.4% confidence.",
      actionLabel: unassignedCases.length > 0 ? "Assign Units" : "Audit Confidence",
    },
    {
      id: "ai-3",
      tone: "insight",
      title: "Traffic & Response Route Optimization",
      description: "Severe arterial congestion detected near Highway 101 corridor. Alternate emergency vehicle routing broadcasted.",
      actionLabel: "View Routing",
    },
  ];

  return (
    <DashboardLayout
      title="Central Emergency Command HQ"
      audioEnabled={audioEnabled}
      onToggleAudio={() => setAudioEnabled(!audioEnabled)}
      notifications={activeCases}
    >
      <Toaster richColors position="top-right" />

      {/* ── WATERMELON DASHBOARD HEADER ──────────────────────────── */}
      <DashboardHeader
        title="Central Emergency Command Center"
        subtitle="Multi-Agency Dispatch & Triage"
        department="Universal Emergency Directorate"
        accentColor="#8B5CF6"
        icon={Zap}
        onRefresh={fetchDashboardData}
        onExport={handleExport}
        isRefreshing={loading}
      />

      {/* ── TOP METRICS (Watermelon MetricCards) ────────────────── */}
      <section className="mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Layers}
            iconBg="bg-purple-500/10"
            iconClassName="text-purple-400"
            label="Total Incidents"
            value={allCases.length.toString()}
            note="+8% vs last shift"
            trend="up"
          />
          <MetricCard
            icon={Activity}
            iconBg="bg-blue-500/10"
            iconClassName="text-blue-400"
            label="Active Operations"
            value={activeCases.length.toString()}
            note={`${pendingCases.length} pending triage`}
            trend="neutral"
          />
          <MetricCard
            icon={AlertOctagon}
            iconBg={criticalCases.length > 0 ? "bg-rose-500/10" : "bg-emerald-500/10"}
            iconClassName={criticalCases.length > 0 ? "text-rose-400 animate-pulse" : "text-emerald-400"}
            label="Critical Threats"
            value={criticalCases.length.toString()}
            note={criticalCases.length > 0 ? "Immediate Action Required" : "Zero high hazards"}
            trend={criticalCases.length > 0 ? "down" : "up"}
          />
          <MetricCard
            icon={CheckCircle2}
            iconBg="bg-emerald-500/10"
            iconClassName="text-emerald-400"
            label="Resolution Rate"
            value={allCases.length > 0 ? `${Math.round((resolvedCases.length / allCases.length) * 100)}%` : "100%"}
            note={`${resolvedCases.length} resolved cases`}
            trend="up"
          />
        </div>
      </section>

      {/* ── QUICK ACTIONS (Watermelon QuickActionCards) ────────── */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Emergency Command Actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            icon={Zap}
            accentColor="#8B5CF6"
            label="Broadcast City Alert"
            description="Send mass SMS & radio EAS"
            onClick={() => toast.info("Citywide Broadcast Ready", { description: "Configure broadcast banner in settings" })}
          />
          <QuickActionCard
            icon={Shield}
            accentColor="#3B82F6"
            label="Dispatch Police Squad"
            description="Deploy nearest patrol unit"
            onClick={() => toast.success("Routing squad cars to active sector")}
          />
          <QuickActionCard
            icon={Flame}
            accentColor="#EF4444"
            label="Deploy Fire Brigade"
            description="Dispatch ladder & hazmat"
            onClick={() => toast.error("Alarm triggered: Fire engine alerted")}
          />
          <QuickActionCard
            icon={Activity}
            accentColor="#10B981"
            label="Alert Hospital EMS"
            description="Pre-triage trauma bay"
            onClick={() => toast.success("Trauma unit alerted: EMS en-route")}
          />
        </div>
      </section>

      {/* ── WATERMELON CHARTS GRID ─────────────────────────────── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8 items-stretch">
        <div className="lg:col-span-2">
          <CirculationActivityChart
            title="Emergency Intake & Resolution Curve"
            subtitle="Real-time incident response velocity"
            dataByTimeframe={chartDataByTimeframe}
            timeframeOptions={["24h", "shift", "weekly", "monthly"]}
            defaultTimeframe="24h"
            primaryKey="emergencies"
            primaryLabel="Incoming Calls"
            primaryColor="#8B5CF6"
            secondaryKey="resolved"
            secondaryLabel="Closed Incidents"
            secondaryColor="#10B981"
            height={260}
          />
        </div>

        <div>
          <DualDonutChart
            title="Agency Fleet Allocation"
            label="Total Cases"
            segments={deptSegments}
            size={175}
          />
        </div>
      </section>

      {/* ── AI INTELLIGENCE & RECENT ACTIVITY ──────────────────── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <IntelligenceFeed
          title="AI Dispatch Advisory & Predictive Intelligence"
          items={aiIntelligenceItems}
          onActionClick={(card) => {
            if (card.id === "ai-1" && criticalCases.length > 0) {
              setSelectedCase(criticalCases[0]);
            } else if (card.id === "ai-2" && unassignedCases.length > 0) {
              setSelectedCase(unassignedCases[0]);
            } else {
              toast.info("Action Triggered", { description: card.title });
            }
          }}
        />

        <RecentActivityFeed
          title="Central Dispatch Stream"
          activities={allCases}
        />
      </section>

      {/* ── CENTRAL INCIDENT LOG REGISTRY ──────────────────────── */}
      <section className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-xs">
        {/* Table Header & Search Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-border/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
              <Layers className="size-4 text-purple-400" />
              Central Incident Registry
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live multi-jurisdictional emergency logbook
            </p>
          </div>

          {/* Search + Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases, location, caller..."
                className="h-8.5 pl-8 text-xs bg-secondary/50 border-border/60"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-8.5 bg-secondary/50 border border-border/60 rounded-lg px-2.5 text-xs text-secondary-foreground font-semibold outline-none cursor-pointer"
            >
              <option value="All" className="bg-card">All Depts</option>
              <option value="Police" className="bg-card">Police</option>
              <option value="Fire" className="bg-card">Fire Brigade</option>
              <option value="Hospital" className="bg-card">Hospital EMS</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-8.5 bg-secondary/50 border border-border/60 rounded-lg px-2.5 text-xs text-secondary-foreground font-semibold outline-none cursor-pointer"
            >
              <option value="All" className="bg-card">All Priorities</option>
              <option value="Critical" className="bg-card">Critical</option>
              <option value="High" className="bg-card">High</option>
              <option value="Medium" className="bg-card">Medium</option>
              <option value="Low" className="bg-card">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8.5 bg-secondary/50 border border-border/60 rounded-lg px-2.5 text-xs text-secondary-foreground font-semibold outline-none cursor-pointer"
            >
              <option value="All" className="bg-card">All Statuses</option>
              <option value="Pending" className="bg-card">Pending</option>
              <option value="InProgress" className="bg-card">In Progress</option>
              <option value="Resolved" className="bg-card">Resolved</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/30 bg-secondary/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3">Incident #</th>
                <th className="px-4 py-3">Caller & Location</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Loader2 className="size-6 animate-spin mx-auto text-purple-400" />
                    <p className="text-xs text-muted-foreground mt-2">Loading registry logs...</p>
                  </td>
                </tr>
              ) : filteredCases.length > 0 ? (
                filteredCases.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-secondary/40 transition-colors group"
                  >
                    <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-purple-400">
                      #{item._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-foreground text-xs">{item.name || "Anonymous Caller"}</span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="size-3 text-slate-400" />
                          {item.location || item.address || item.city || "Coordinates Recorded"}
                        </span>
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
                              handleAssignDepartment(item._id, newDept);
                            }
                          }}
                          className="h-7 bg-amber-500/10 border border-amber-500/30 rounded-md px-2 text-[10px] font-bold text-amber-400 outline-none cursor-pointer uppercase tracking-wider"
                        >
                          <option value="Unknown" className="bg-card text-amber-400">⚠️ Unassigned</option>
                          <option value="Police" className="bg-card text-blue-400">🚓 Police</option>
                          <option value="Fire Brigade" className="bg-card text-red-400">🚒 Fire</option>
                          <option value="Hospital" className="bg-card text-emerald-400">🏥 Hospital</option>
                        </select>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: item.department === "Police" ? "rgba(59,130,246,0.12)" : (item.department === "Fire" || item.department === "Fire Brigade") ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                            color: item.department === "Police" ? COLORS.Police : (item.department === "Fire" || item.department === "Fire Brigade") ? COLORS.Fire : COLORS.Hospital,
                            border: `1px solid ${item.department === "Police" ? "rgba(59,130,246,0.25)" : (item.department === "Fire" || item.department === "Fire Brigade") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
                          }}
                        >
                          {item.department === "Police" ? "🚓 Police" : (item.department === "Fire" || item.department === "Fire Brigade") ? "🚒 Fire" : "🏥 Hospital"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          item.priority?.toLowerCase() === "critical"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : item.priority?.toLowerCase() === "high"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        )}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          item.status === "Pending"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : item.status === "InProgress"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        )}
                      >
                        {item.status === "InProgress" ? "In Progress" : item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {item.source === "call" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <PhoneCall className="size-2.5" /> Call
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          <Globe className="size-2.5" /> Web
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground font-mono text-[11px]">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedCase(item)}
                        className="h-7 px-2.5 text-xs font-semibold gap-1 bg-secondary/80 hover:bg-secondary border border-border/50"
                      >
                        <Eye className="size-3.5" />
                        <span>Audit</span>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Inbox className="size-8 mx-auto opacity-40 mb-2" />
                    <p className="text-xs font-semibold">No incidents found matching current filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CASE AUDIT MODAL ────────────────────────────────────── */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-card rounded-2xl border border-border/50 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-border/30 flex items-center justify-between bg-secondary/30">
              <div>
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                  Incident Log #{selectedCase._id.slice(-6).toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-foreground">Case Audit & Dispatch Console</h3>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelectedCase(null)}
                className="size-8"
              >
                ✕
              </Button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary/50 border border-border/40">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Caller Information</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">{selectedCase.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="size-3" />
                    {selectedCase.phone || "No phone registered"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-secondary/50 border border-border/40">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Location & Landmark</span>
                  <p className="text-sm font-bold text-foreground mt-0.5 truncate">{selectedCase.location || selectedCase.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCase.location || selectedCase.address || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="size-3" />
                    Open Google Maps
                  </a>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border/40">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Emergency Situation Description</span>
                <p className="text-xs text-foreground mt-1 leading-relaxed">
                  {selectedCase.description || selectedCase.situation || "No specific situation notes provided."}
                </p>
              </div>

              {selectedCase.aiAnalysis && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold mb-1">
                    <Sparkles className="size-3.5" />
                    <span>AI Threat Analysis</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedCase.aiAnalysis.summary || selectedCase.aiAnalysis.rationale || JSON.stringify(selectedCase.aiAnalysis)}
                  </p>
                </div>
              )}

              {/* Status Update & Department Assignment Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-semibold">Assign Dept:</span>
                  <div className="flex items-center gap-1.5">
                    {["Police", "Fire Brigade", "Hospital"].map((dept) => (
                      <Button
                        key={dept}
                        size="sm"
                        variant={selectedCase.department === dept ? "default" : "outline"}
                        disabled={assigningDept}
                        onClick={() => handleAssignDepartment(selectedCase._id, dept)}
                        className="h-7 text-xs font-semibold"
                      >
                        {dept}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-semibold">Status:</span>
                  <div className="flex items-center gap-1.5">
                    {["Pending", "InProgress", "Resolved"].map((st) => (
                      <Button
                        key={st}
                        size="sm"
                        variant={selectedCase.status === st ? "default" : "secondary"}
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange(selectedCase._id, st)}
                        className="h-7 text-xs font-semibold capitalize"
                      >
                        {st === "InProgress" ? "In Progress" : st}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
