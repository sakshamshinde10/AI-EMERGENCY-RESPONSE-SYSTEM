import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { getFireEmergencies, updateEmergencyStatus } from "../services/emergencyApi";
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
  Flame,
  Search,
  Clock,
  Phone,
  CheckCircle,
  Loader2,
  Inbox,
  Truck,
  Volume2,
  VolumeX,
  MapPin,
  AlertTriangle,
  RefreshCw,
  LayoutGrid,
  List,
  Plus,
  ExternalLink,
  Shield,
  Activity,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";


const ACCENT = "#EF4444"; // Fire Red

const FirePanel = () => {
  const [fireCases, setFireCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const socketRef = useRef(null);
  const audioEnabledRef = useRef(audioEnabled);

  useEffect(() => { audioEnabledRef.current = audioEnabled; }, [audioEnabled]);

  const location = useLocation();
  const currentTab = new URLSearchParams(location.search).get("tab") || "pending";

  const fetchFireCases = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFireEmergencies();
      if (data?.success && data?.data) {
        setFireCases(data.data);
      } else if (Array.isArray(data)) {
        setFireCases(data);
      } else if (data?.data) {
        setFireCases(data.data);
      }
    } catch (error) {
      console.log("Error fetching fire cases:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFireCases();
    const socket = getSocket();
    socketRef.current = socket;
    joinDepartmentRoom("Fire Brigade");

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    if (socket.connected) setSocketConnected(true);

    const handleNewEmergency = (emergency) => {
      if (emergency.department === "Fire" || emergency.department === "Fire Brigade") {
        setFireCases((prev) => [emergency, ...prev]);
        if (audioEnabledRef.current) playEmergencySiren(emergency.priority);
        toast.error(`FIRE BRIGADE: 3-ALARM CALL RECEIVED`, {
          description: `Caller: ${emergency.name} | Priority: ${emergency.priority}`,
          duration: 7000,
        });
      }
    };

    const handleStatusUpdated = (updated) => {
      if (!updated) return;
      if (updated.department === "Fire" || updated.department === "Fire Brigade") {
        setFireCases((prev) => {
          const exists = prev.some((c) => c._id === updated._id);
          if (exists) {
            return prev.map((c) => (c._id === updated._id ? updated : c));
          } else {
            if (audioEnabledRef.current) playEmergencySiren(updated.priority);
            toast.error(`UNIT ASSIGNED: FIRE BRIGADE`, {
              description: `${updated.name} | Priority: ${updated.priority}`,
              duration: 8000,
            });
            return [updated, ...prev];
          }
        });
      } else {
        setFireCases((prev) => prev.filter((c) => c._id !== updated._id));
      }
    };

    socket.on("new-emergency", handleNewEmergency);
    socket.on("status-updated", handleStatusUpdated);

    return () => {
      socket.off("new-emergency", handleNewEmergency);
      socket.off("status-updated", handleStatusUpdated);
    };
  }, [fetchFireCases]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await updateEmergencyStatus(id, newStatus);
      if (response?.success) {
        setFireCases((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c))
        );
        toast.success(`Fire Incident Status Updated: ${newStatus}`);
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
          fireCases.map(
            (c) =>
              `"${c._id}","${c.name}","${c.phone}","${c.priority}","${c.status}","${c.location || c.address || ''}","${new Date(c.createdAt).toISOString()}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fire_incident_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Fire Brigade Logs Exported");
  };

  // Case buckets
  const pendingCases = fireCases.filter((c) => c.status === "Pending");
  const inProgressCases = fireCases.filter((c) => c.status === "InProgress");
  const resolvedCases = fireCases.filter((c) => c.status === "Resolved");
  const criticalCases = fireCases.filter((c) => c.priority === "Critical" && c.status !== "Resolved");

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

  // Chart Data By Timeframe
  const chartDataByTimeframe = {
    "24h": [
      { label: "00:00", alarms: 2, resolved: 2 },
      { label: "04:00", alarms: 1, resolved: 1 },
      { label: "08:00", alarms: 5, resolved: 4 },
      { label: "12:00", alarms: 8, resolved: 6 },
      { label: "16:00", alarms: 12, resolved: 9 },
      { label: "20:00", alarms: 7, resolved: 6 },
      { label: "Now", alarms: pendingCases.length + inProgressCases.length || 5, resolved: resolvedCases.length || 4 },
    ],
    shift: [
      { label: "Alarm 1", alarms: 2, resolved: 2 },
      { label: "Alarm 2", alarms: 5, resolved: 4 },
      { label: "Alarm 3", alarms: 9, resolved: 7 },
      { label: "Alarm 4", alarms: 6, resolved: 5 },
      { label: "Current", alarms: inProgressCases.length || 3, resolved: resolvedCases.length || 3 },
    ],
    weekly: [
      { label: "Mon", alarms: 14, resolved: 13 },
      { label: "Tue", alarms: 18, resolved: 16 },
      { label: "Wed", alarms: 22, resolved: 20 },
      { label: "Thu", alarms: 19, resolved: 18 },
      { label: "Fri", alarms: 28, resolved: 25 },
      { label: "Sat", alarms: 31, resolved: 28 },
      { label: "Sun", alarms: 20, resolved: 19 },
    ],
  };

  // Fire Incident Classification Donut Segments
  const fireSegments = [
    { name: "Structure Fire", value: 12, fill: "#EF4444" },
    { name: "HazMat / Chemical", value: 4, fill: "#F59E0B" },
    { name: "Vehicle Rescue", value: 9, fill: "#3B82F6" },
    { name: "Wildfire / Brush", value: 6, fill: "#10B981" },
    { name: "Alarm / False Alert", value: 15, fill: "#8B5CF6" },
  ];

  // AI Intelligence Cards
  const fireAiInsights = [
    {
      id: "fire-1",
      tone: criticalCases.length > 0 ? "critical" : "insight",
      title: criticalCases.length > 0 ? `${criticalCases.length} 3-Alarm Fire Incident — High Spread Risk` : "Hydrant Pressure Optimal",
      description: criticalCases.length > 0
        ? `Structure fire in ${criticalCases[0]?.location || 'Industrial Sector'}. Wind velocity 14 knots NE. Deploy Ladder 2 and HazMat support.`
        : "Municipal water grid reports full 85 PSI pressure across all sector fire hydrants.",
      actionLabel: "Deploy Ladder Co.",
    },
    {
      id: "fire-2",
      tone: "warning",
      title: "HazMat Proximity Warning",
      description: "Chemical warehouse storage located 150m from incident radius. Automated containment zone established.",
      actionLabel: "View Perimeter",
    },
  ];

  return (
    <DashboardLayout
      title="Fire & Rescue Incident Command"
      audioEnabled={audioEnabled}
      onToggleAudio={() => setAudioEnabled(!audioEnabled)}
      notifications={pendingCases}
    >
      <Toaster richColors position="top-right" />

      {/* ── WATERMELON HEADER ────────────────────────────────────── */}
      <DashboardHeader
        title="Fire & Rescue Tactical Incident Command"
        subtitle="Station 1 Central Headquarters"
        department="Metropolitan Fire & Rescue Department"
        accentColor="#EF4444"
        icon={Flame}
        onRefresh={fetchFireCases}
        onExport={handleExport}
        isRefreshing={loading}
        extraActions={
          <Button
            onClick={() => setReportDialogOpen(true)}
            size="sm"
            className="h-9 gap-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="size-4" />
            <span>Log Fire Alarm</span>
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
            label="Active Alarms"
            value={pendingCases.length.toString()}
            note={pendingCases.length > 0 ? `${pendingCases.length} awaiting engine roll` : "No alarms"}
            trend={pendingCases.length > 0 ? "down" : "up"}
          />
          <MetricCard
            icon={Truck}
            iconBg="bg-red-500/10"
            iconClassName="text-red-400"
            label="Engines Dispatched"
            value={inProgressCases.length.toString()}
            note="Companies on-scene"
            trend="neutral"
          />
          <MetricCard
            icon={AlertTriangle}
            iconBg={criticalCases.length > 0 ? "bg-rose-500/10" : "bg-emerald-500/10"}
            iconClassName={criticalCases.length > 0 ? "text-rose-400 animate-pulse" : "text-emerald-400"}
            label="3-Alarm Blazes"
            value={criticalCases.length.toString()}
            note={criticalCases.length > 0 ? "Full Crew Response" : "Zero structural fires"}
            trend={criticalCases.length > 0 ? "down" : "up"}
          />
          <MetricCard
            icon={CheckCircle}
            iconBg="bg-emerald-500/10"
            iconClassName="text-emerald-400"
            label="Extinguished / Cleared"
            value={resolvedCases.length.toString()}
            note={fireCases.length > 0 ? `${Math.round((resolvedCases.length / fireCases.length) * 100)}% containment` : "100%"}
            trend="up"
          />
        </div>
      </section>

      {/* ── QUICK ACTIONS ───────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Fire Command Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            icon={Truck}
            accentColor="#EF4444"
            label="Dispatch Fire Engine"
            description="Roll pumper & ladder unit"
            onClick={() => toast.error("Fire Engine 1 rolling with code 3 sirens")}
          />
          <QuickActionCard
            icon={Zap}
            accentColor="#F59E0B"
            label="Deploy HazMat Unit"
            description="Chemical containment team"
            onClick={() => toast.warning("HazMat response unit deployed")}
          />
          <QuickActionCard
            icon={Activity}
            accentColor="#10B981"
            label="Request EMS Ambulance"
            description="Stage medical triage team"
            onClick={() => toast.success("Hospital EMS notified for burn/smoke care")}
          />
          <QuickActionCard
            icon={Shield}
            accentColor="#3B82F6"
            label="Order Sector Evacuation"
            description="Trigger local siren & broadcast"
            onClick={() => toast.error("Sector evacuation sirens activated")}
          />
        </div>
      </section>

      {/* ── CHARTS ROW ──────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8 items-stretch">
        <div className="lg:col-span-2">
          <CirculationActivityChart
            title="Fire Alarm Response & Knockdown Velocity"
            subtitle="Hourly alarm dispatch and containment timeline"
            dataByTimeframe={chartDataByTimeframe}
            timeframeOptions={["24h", "shift", "weekly"]}
            defaultTimeframe="24h"
            primaryKey="alarms"
            primaryLabel="Incoming Alarms"
            primaryColor="#EF4444"
            secondaryKey="resolved"
            secondaryLabel="Extinguished / Cleared"
            secondaryColor="#10B981"
            height={260}
          />
        </div>

        <div>
          <DualDonutChart
            title="Fire Incident Classification"
            label="Total Incidents"
            segments={fireSegments}
            size={175}
          />
        </div>
      </section>

      {/* ── AI INTELLIGENCE ADVISORY ────────────────────────────── */}
      <section className="mb-8">
        <IntelligenceFeed
          title="Fire AI Spread Projection & Hydrant Telemetry"
          items={fireAiInsights}
          onActionClick={(card) => toast.info("Fire Tactical Action", { description: card.title })}
        />
      </section>

      {/* ── TABBED CASE MANAGEMENT ROSTER ────────────────────────── */}
      <section className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-xs">
        {/* Subtabs + View Mode Bar */}
        <div className="p-4 sm:p-5 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-xl border border-border/40">
            <Link
              to="/fire?tab=pending"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                currentTab === "pending"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="size-3.5" />
              <span>Active Alarms</span>
              {pendingCases.length > 0 && (
                <span className="size-4.5 rounded-full bg-white/20 text-white text-[10px] flex items-center justify-center font-black">
                  {pendingCases.length}
                </span>
              )}
            </Link>

            <Link
              to="/fire?tab=active"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                currentTab === "active"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Truck className="size-3.5" />
              <span>Engines Dispatched</span>
              {inProgressCases.length > 0 && (
                <span className="size-4.5 rounded-full bg-white/20 text-white text-[10px] flex items-center justify-center font-black">
                  {inProgressCases.length}
                </span>
              )}
            </Link>

            <Link
              to="/fire?tab=resolved"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                currentTab === "resolved"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CheckCircle className="size-3.5" />
              <span>Resolved Incidents</span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fire alarms..."
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
              <Loader2 className="size-7 animate-spin mx-auto text-red-400" />
              <p className="text-xs text-muted-foreground mt-2 font-medium">Scanning fire brigade registry...</p>
            </div>
          ) : displayedCases.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="size-9 mx-auto opacity-30 text-muted-foreground mb-2" />
              <h3 className="text-sm font-bold text-foreground">No Fire Alarms Found</h3>
              <p className="text-xs text-muted-foreground mt-1">Current fire station roster is clear for this filter selection.</p>
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
                        <span className="font-mono text-[11px] font-bold text-red-400">
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
                        {item.name || "Caller / Alarm Sensor"}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="size-3 text-slate-400" />
                        {item.phone || "No callback phone"}
                      </p>

                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="size-3 text-red-400 shrink-0" />
                        <span className="truncate">{item.location || item.address || "Alarm Location Logged"}</span>
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
                        className="text-[11px] text-red-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink className="size-3" />
                        Map
                      </a>

                      <div className="flex items-center gap-1.5">
                        {isPending && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(item._id, "InProgress")}
                            className="h-7 px-2.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Truck className="size-3.5 mr-1" />
                            Dispatch Engine
                          </Button>
                        )}
                        {isProgress && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(item._id, "Resolved")}
                            className="h-7 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle className="size-3.5 mr-1" />
                            Extinguish / Clear
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
        preselectedDepartment="Fire Brigade"
        onEmergencyCreated={() => fetchFireCases()}
      />
    </DashboardLayout>
  );
};

export default FirePanel;