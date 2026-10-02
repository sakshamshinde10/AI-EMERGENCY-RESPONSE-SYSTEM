import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { getPoliceEmergencies, updateEmergencyStatus } from "../services/emergencyApi";
import { getSocket, joinDepartmentRoom } from "../services/socket";
import { playEmergencySiren } from "../lib/soundAlert";
import DashboardLayout from "../components/layout/DashboardLayout";
import ReportEmergencyDialog from "../components/dashboard/ReportEmergencyDialog";
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
  DashboardHeader,
} from "@/components/watermelon/DashboardHeader";
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
  X,
  ArrowRight,
  ExternalLink,
  Plus,
  Radio,
  Car,
  Activity,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";


const ACCENT = "#3B82F6"; // Police Blue

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

  useEffect(() => { audioEnabledRef.current = audioEnabled; }, [audioEnabled]);

  const location = useLocation();
  const currentTab = new URLSearchParams(location.search).get("tab") || "pending";

  const fetchPoliceCases = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPoliceEmergencies();
      if (data?.success && data?.data) {
        setPoliceCases(data.data);
      } else if (Array.isArray(data)) {
        setPoliceCases(data);
      } else if (data?.data) {
        setPoliceCases(data.data);
      }
    } catch (error) {
      console.log("Error fetching police cases:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoliceCases();
    const socket = getSocket();
    socketRef.current = socket;
    joinDepartmentRoom("Police");

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    if (socket.connected) setSocketConnected(true);

    const handleNewEmergency = (emergency) => {
      if (emergency.department === "Police") {
        setPoliceCases((prev) => [emergency, ...prev]);
        if (audioEnabledRef.current) playEmergencySiren(emergency.priority);
        toast.error(`POLICE DISPATCH: NEW 911 CALL`, {
          description: `Caller: ${emergency.name} | Priority: ${emergency.priority}`,
          duration: 7000,
        });
      }
    };

    const handleStatusUpdated = (updated) => {
      if (!updated) return;
      if (updated.department === "Police") {
        setPoliceCases((prev) => {
          const exists = prev.some((c) => c._id === updated._id);
          if (exists) {
            return prev.map((c) => (c._id === updated._id ? updated : c));
          } else {
            if (audioEnabledRef.current) playEmergencySiren(updated.priority);
            toast.error(`UNIT ASSIGNED: POLICE DISPATCH`, {
              description: `${updated.name} | Priority: ${updated.priority}`,
              duration: 8000,
            });
            setNewAssignmentBanner(updated);
            return [updated, ...prev];
          }
        });
      } else {
        setPoliceCases((prev) => prev.filter((c) => c._id !== updated._id));
      }
    };

    socket.on("new-emergency", handleNewEmergency);
    socket.on("status-updated", handleStatusUpdated);

    return () => {
      socket.off("new-emergency", handleNewEmergency);
      socket.off("status-updated", handleStatusUpdated);
      // Don't disconnect singleton — let AuthContext manage lifecycle
    };
  }, [fetchPoliceCases]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await updateEmergencyStatus(id, newStatus);
      if (response?.success) {
        setPoliceCases((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c))
        );
        toast.success(`Patrol Status Updated: ${newStatus}`);
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,Caller,Phone,Priority,Status,Location,Date"]
        .concat(
          policeCases.map(
            (c) =>
              `"${c._id}","${c.name}","${c.phone}","${c.priority}","${c.status}","${c.location || c.address || ''}","${new Date(c.createdAt).toISOString()}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `police_patrol_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Police Logs Exported");
  };

  // Case buckets
  const pendingCases = policeCases.filter((c) => c.status === "Pending");
  const inProgressCases = policeCases.filter((c) => c.status === "InProgress");
  const resolvedCases = policeCases.filter((c) => c.status === "Resolved");
  const criticalCases = policeCases.filter((c) => c.priority === "Critical" && c.status !== "Resolved");

  const displayedCases = (
    currentTab === "active" ? inProgressCases :
    currentTab === "resolved" ? resolvedCases :
    pendingCases
  ).filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.phone?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q) ||
      item.address?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  });

  // Chart Data
  const chartDataByTimeframe = {
    "24h": [
      { label: "00:00", calls: 4, resolved: 3 },
      { label: "04:00", calls: 2, resolved: 2 },
      { label: "08:00", calls: 9, resolved: 6 },
      { label: "12:00", calls: 14, resolved: 10 },
      { label: "16:00", calls: 21, resolved: 17 },
      { label: "20:00", calls: 16, resolved: 14 },
      { label: "Now", calls: pendingCases.length + inProgressCases.length || 8, resolved: resolvedCases.length || 5 },
    ],
    shift: [
      { label: "Shift Start", calls: 3, resolved: 2 },
      { label: "+2 hrs", calls: 8, resolved: 6 },
      { label: "+4 hrs", calls: 12, resolved: 9 },
      { label: "+6 hrs", calls: 7, resolved: 6 },
      { label: "Active", calls: inProgressCases.length || 4, resolved: resolvedCases.length || 3 },
    ],
    weekly: [
      { label: "Mon", calls: 32, resolved: 28 },
      { label: "Tue", calls: 29, resolved: 26 },
      { label: "Wed", calls: 45, resolved: 39 },
      { label: "Thu", calls: 38, resolved: 34 },
      { label: "Fri", calls: 56, resolved: 49 },
      { label: "Sat", calls: 62, resolved: 54 },
      { label: "Sun", calls: 41, resolved: 38 },
    ],
  };

  // Police Crime Category Donut
  const crimeSegments = [
    { name: "Traffic / Accident", value: 14, fill: "#3B82F6" },
    { name: "Armed Robbery", value: 6, fill: "#EF4444" },
    { name: "Public Disturbance", value: 18, fill: "#F59E0B" },
    { name: "Domestic / Assault", value: 9, fill: "#8B5CF6" },
    { name: "Suspicious Activity", value: 12, fill: "#10B981" },
  ];

  // AI Intelligence Cards
  const policeAiInsights = [
    {
      id: "pol-1",
      tone: criticalCases.length > 0 ? "critical" : "insight",
      title: criticalCases.length > 0 ? `${criticalCases.length} Critical 911 Call(s) Need Immediate Squad Deployment` : "Patrol Coverage Optimal",
      description: criticalCases.length > 0
        ? `High-priority dispatch request active in ${criticalCases[0]?.location || 'North Sector'}. Deploy nearest cruiser with code 3 sirens.`
        : "Automated GPS telemetry indicates average squad response time is under 4.2 minutes across all sectors.",
      actionLabel: "Deploy Nearest",
    },
    {
      id: "pol-2",
      tone: "warning",
      title: "Patrol Density Advisory: Downtown Grid",
      description: "Nightclub closing hour traffic anticipated on 4th & Main. Recommend staging 2 additional cruisers.",
      actionLabel: "Stage Cruisers",
    },
  ];

  return (
    <DashboardLayout
      title="Police Emergency Dispatch & Patrol"
      audioEnabled={audioEnabled}
      onToggleAudio={() => setAudioEnabled(!audioEnabled)}
      notifications={pendingCases}
    >
      <Toaster richColors position="top-right" />

      {/* ── WATERMELON HEADER ────────────────────────────────────── */}
      <DashboardHeader
        title="Police Patrol & 911 Dispatch Command"
        subtitle="Sector Metro Tactical Operations"
        department="Metropolitan Police Department"
        accentColor="#3B82F6"
        icon={Shield}
        onRefresh={fetchPoliceCases}
        onExport={handleExport}
        isRefreshing={loading}
        extraActions={
          <Button
            onClick={() => setReportDialogOpen(true)}
            size="sm"
            className="h-9 gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="size-4" />
            <span>Log 911 Call</span>
          </Button>
        }
      />

      {/* ── TOP METRICS ─────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Clock}
            iconBg="bg-amber-500/10"
            iconClassName="text-amber-400"
            label="Pending Queue"
            value={pendingCases.length.toString()}
            note={pendingCases.length > 0 ? `${pendingCases.length} awaiting dispatch` : "Queue clear"}
            trend={pendingCases.length > 0 ? "down" : "up"}
          />
          <MetricCard
            icon={Car}
            iconBg="bg-blue-500/10"
            iconClassName="text-blue-400"
            label="Active Patrols"
            value={inProgressCases.length.toString()}
            note="Units currently en-route"
            trend="neutral"
          />
          <MetricCard
            icon={AlertTriangle}
            iconBg={criticalCases.length > 0 ? "bg-rose-500/10" : "bg-emerald-500/10"}
            iconClassName={criticalCases.length > 0 ? "text-rose-400 animate-pulse" : "text-emerald-400"}
            label="Critical Alarms"
            value={criticalCases.length.toString()}
            note={criticalCases.length > 0 ? "Immediate Squad Priority" : "Zero active criticals"}
            trend={criticalCases.length > 0 ? "down" : "up"}
          />
          <MetricCard
            icon={CheckCircle}
            iconBg="bg-emerald-500/10"
            iconClassName="text-emerald-400"
            label="Cleared Incidents"
            value={resolvedCases.length.toString()}
            note={policeCases.length > 0 ? `${Math.round((resolvedCases.length / policeCases.length) * 100)}% shift clearance` : "100%"}
            trend="up"
          />
        </div>
      </section>

      {/* ── QUICK ACTIONS ───────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Tactical Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            icon={Car}
            accentColor="#3B82F6"
            label="Dispatch Squad Car"
            description="Assign nearest active cruiser"
            onClick={() => toast.success("Squad car dispatched with sirens")}
          />
          <QuickActionCard
            icon={Radio}
            accentColor="#EF4444"
            label="Broadcast BOLO Alert"
            description="Send all-units alert bulletin"
            onClick={() => toast.info("BOLO broadcast transmitted to all sector radios")}
          />
          <QuickActionCard
            icon={Shield}
            accentColor="#8B5CF6"
            label="Deploy Tactical SWAT"
            description="High-risk perimeter team"
            onClick={() => toast.error("SWAT tactical team on standby")}
          />
          <QuickActionCard
            icon={Activity}
            accentColor="#10B981"
            label="Request Medical EMS"
            description="Coordinate ambulance escort"
            onClick={() => toast.success("Hospital EMS notified for scene staging")}
          />
        </div>
      </section>

      {/* ── CHARTS ROW ──────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8 items-stretch">
        <div className="lg:col-span-2">
          <CirculationActivityChart
            title="Police Call Volume & Clearance Rate"
            subtitle="Real-time 911 dispatch response trends"
            dataByTimeframe={chartDataByTimeframe}
            timeframeOptions={["24h", "shift", "weekly"]}
            defaultTimeframe="24h"
            primaryKey="calls"
            primaryLabel="Incoming 911 Calls"
            primaryColor="#3B82F6"
            secondaryKey="resolved"
            secondaryLabel="Cases Cleared"
            secondaryColor="#10B981"
            height={260}
          />
        </div>

        <div>
          <DualDonutChart
            title="Crime & Incident Breakdown"
            label="Total Cases"
            segments={crimeSegments}
            size={175}
          />
        </div>
      </section>

      {/* ── AI INTELLIGENCE ADVISORY ────────────────────────────── */}
      <section className="mb-8">
        <IntelligenceFeed
          title="Police AI Patrol Advisory & Threat Analysis"
          items={policeAiInsights}
          onActionClick={(card) => toast.info("Patrol Advisory Action", { description: card.title })}
        />
      </section>

      {/* ── TABBED CASE MANAGEMENT ROSTER ────────────────────────── */}
      <section className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-xs">
        {/* Subtabs + View Mode Bar */}
        <div className="p-4 sm:p-5 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-xl border border-border/40">
            <Link
              to="/police?tab=pending"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                currentTab === "pending"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="size-3.5" />
              <span>Pending Queue</span>
              {pendingCases.length > 0 && (
                <span className="size-4.5 rounded-full bg-white/20 text-white text-[10px] flex items-center justify-center font-black">
                  {pendingCases.length}
                </span>
              )}
            </Link>

            <Link
              to="/police?tab=active"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                currentTab === "active"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Car className="size-3.5" />
              <span>Active Patrols</span>
              {inProgressCases.length > 0 && (
                <span className="size-4.5 rounded-full bg-white/20 text-white text-[10px] flex items-center justify-center font-black">
                  {inProgressCases.length}
                </span>
              )}
            </Link>

            <Link
              to="/police?tab=resolved"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                currentTab === "resolved"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CheckCircle className="size-3.5" />
              <span>Closed Logs</span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search police calls..."
                className="h-8.5 pl-8 text-xs bg-secondary/50 border-border/60"
              />
            </div>

            <div className="flex items-center border border-border/50 rounded-lg p-0.5 bg-secondary/40">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => setViewMode("grid")}
                className="size-7"
              >
                <LayoutGrid className="size-3.5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => setViewMode("list")}
                className="size-7"
              >
                <List className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Case Cards Grid / Table */}
        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="size-7 animate-spin mx-auto text-blue-400" />
              <p className="text-xs text-muted-foreground mt-2 font-medium">Scanning police registry...</p>
            </div>
          ) : displayedCases.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="size-9 mx-auto opacity-30 text-muted-foreground mb-2" />
              <h3 className="text-sm font-bold text-foreground">No Police Cases Found</h3>
              <p className="text-xs text-muted-foreground mt-1">Current queue is clear for this filter selection.</p>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-4",
                viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              )}
            >
              {displayedCases.map((item) => {
                const isCritical = item.priority?.toLowerCase() === "critical";
                const isPending = item.status === "Pending";
                const isProgress = item.status === "InProgress";

                return (
                  <div
                    key={item._id}
                    className={cn(
                      "rounded-xl border p-4 transition-all duration-200 bg-secondary/50 hover:bg-secondary flex flex-col justify-between gap-3 group",
                      isCritical ? "border-rose-500/40 bg-rose-500/[0.03]" : "border-border/40 hover:border-border"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-border/20">
                        <span className="font-mono text-[11px] font-bold text-blue-400">
                          #{item._id.slice(-6).toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                              isCritical
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                : item.priority?.toLowerCase() === "high"
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            )}
                          >
                            {item.priority}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-foreground truncate">
                        {item.name || "Anonymous Caller"}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="size-3 text-slate-400" />
                        {item.phone || "No callback phone"}
                      </p>

                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="size-3 text-blue-400 shrink-0" />
                        <span className="truncate">{item.location || item.address || "Sector Location Logged"}</span>
                      </p>

                      {item.description && (
                        <p className="text-xs text-secondary-foreground mt-2 line-clamp-2 leading-relaxed bg-background/60 p-2 rounded-lg border border-border/30">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="pt-2 border-t border-border/20 flex items-center justify-between gap-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location || item.address || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink className="size-3" />
                        Map
                      </a>

                      <div className="flex items-center gap-1.5">
                        {isPending && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(item._id, "InProgress")}
                            className="h-7 px-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Car className="size-3.5 mr-1" />
                            Dispatch Squad
                          </Button>
                        )}
                        {isProgress && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(item._id, "Resolved")}
                            className="h-7 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle className="size-3.5 mr-1" />
                            Clear Incident
                          </Button>
                        )}
                        {item.status === "Resolved" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusChange(item._id, "Pending")}
                            className="h-7 px-2 text-xs font-semibold"
                          >
                            Re-Open
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Report Emergency Dialog */}
      <ReportEmergencyDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        preselectedDepartment="Police"
        onEmergencyCreated={() => fetchPoliceCases()}
      />
    </DashboardLayout>
  );
};

export default PolicePanel;