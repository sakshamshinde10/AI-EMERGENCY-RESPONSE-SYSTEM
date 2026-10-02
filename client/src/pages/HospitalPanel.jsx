import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { getHospitalEmergencies, updateEmergencyStatus } from "../services/emergencyApi";
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
  Activity,
  Search,
  Clock,
  Phone,
  HeartHandshake,
  CheckCircle,
  Loader2,
  Inbox,
  Stethoscope,
  Volume2,
  VolumeX,
  MapPin,
  AlertTriangle,
  RefreshCw,
  LayoutGrid,
  List,
  Plus,
  ExternalLink,
  Heart,
  Truck,
  Shield,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";


const ACCENT = "#10B981"; // Hospital Emerald

const HospitalPanel = () => {
  const [hospitalCases, setHospitalCases] = useState([]);
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

  const fetchHospitalCases = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getHospitalEmergencies();
      if (data?.success && data?.data) {
        setHospitalCases(data.data);
      } else if (Array.isArray(data)) {
        setHospitalCases(data);
      } else if (data?.data) {
        setHospitalCases(data.data);
      }
    } catch (error) {
      console.log("Error fetching hospital cases:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitalCases();
    const socket = getSocket();
    socketRef.current = socket;
    joinDepartmentRoom("Hospital");

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    if (socket.connected) setSocketConnected(true);

    const handleNewEmergency = (emergency) => {
      if (emergency.department === "Hospital") {
        setHospitalCases((prev) => [emergency, ...prev]);
        if (audioEnabledRef.current) playEmergencySiren(emergency.priority);
        toast.error(`HOSPITAL EMS: INCOMING MEDICAL ALERT`, {
          description: `Caller: ${emergency.name} | Priority: ${emergency.priority}`,
          duration: 7000,
        });
      }
    };

    const handleStatusUpdated = (updated) => {
      if (!updated) return;
      if (updated.department === "Hospital") {
        setHospitalCases((prev) => {
          const exists = prev.some((c) => c._id === updated._id);
          if (exists) {
            return prev.map((c) => (c._id === updated._id ? updated : c));
          } else {
            if (audioEnabledRef.current) playEmergencySiren(updated.priority);
            toast.error(`UNIT ASSIGNED: MEDICAL EMS`, {
              description: `${updated.name} | Priority: ${updated.priority}`,
              duration: 8000,
            });
            return [updated, ...prev];
          }
        });
      } else {
        setHospitalCases((prev) => prev.filter((c) => c._id !== updated._id));
      }
    };

    socket.on("new-emergency", handleNewEmergency);
    socket.on("status-updated", handleStatusUpdated);

    return () => {
      socket.off("new-emergency", handleNewEmergency);
      socket.off("status-updated", handleStatusUpdated);
    };
  }, [fetchHospitalCases]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await updateEmergencyStatus(id, newStatus);
      if (response?.success) {
        setHospitalCases((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c))
        );
        toast.success(`EMS Triage Status Updated: ${newStatus}`);
      }
    } catch (error) {
      toast.error("Failed to update triage status");
    }
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,Caller,Phone,Priority,Status,Location,Date"]
        .concat(
          hospitalCases.map(
            (c) =>
              `"${c._id}","${c.name}","${c.phone}","${c.priority}","${c.status}","${c.location || c.address || ''}","${new Date(c.createdAt).toISOString()}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hospital_ems_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Hospital EMS Logs Exported");
  };

  // Case buckets
  const pendingCases = hospitalCases.filter((c) => c.status === "Pending");
  const inProgressCases = hospitalCases.filter((c) => c.status === "InProgress");
  const resolvedCases = hospitalCases.filter((c) => c.status === "Resolved");
  const criticalCases = hospitalCases.filter((c) => c.priority === "Critical" && c.status !== "Resolved");

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
      { label: "00:00", intake: 2, discharged: 1 },
      { label: "04:00", intake: 1, discharged: 1 },
      { label: "08:00", intake: 6, discharged: 4 },
      { label: "12:00", intake: 11, discharged: 8 },
      { label: "16:00", intake: 15, discharged: 12 },
      { label: "20:00", intake: 9, discharged: 8 },
      { label: "Now", intake: pendingCases.length + inProgressCases.length || 6, discharged: resolvedCases.length || 4 },
    ],
    shift: [
      { label: "08:00", intake: 3, discharged: 2 },
      { label: "11:00", intake: 8, discharged: 6 },
      { label: "14:00", intake: 14, discharged: 10 },
      { label: "17:00", intake: 10, discharged: 8 },
      { label: "Current", intake: inProgressCases.length || 4, discharged: resolvedCases.length || 3 },
    ],
    weekly: [
      { label: "Mon", intake: 22, discharged: 19 },
      { label: "Tue", intake: 26, discharged: 24 },
      { label: "Wed", intake: 31, discharged: 28 },
      { label: "Thu", intake: 29, discharged: 27 },
      { label: "Fri", intake: 44, discharged: 38 },
      { label: "Sat", intake: 48, discharged: 42 },
      { label: "Sun", intake: 35, discharged: 33 },
    ],
  };

  // Medical Severity / Category Donut Segments
  const medicalSegments = [
    { name: "Cardiac Arrest", value: 8, fill: "#EF4444" },
    { name: "Trauma / Fracture", value: 16, fill: "#F59E0B" },
    { name: "Respiratory / Asthma", value: 11, fill: "#10B981" },
    { name: "Stroke / Neuro", value: 5, fill: "#8B5CF6" },
    { name: "General EMS Triage", value: 19, fill: "#3B82F6" },
  ];

  // AI Intelligence Cards
  const hospitalAiInsights = [
    {
      id: "hosp-1",
      tone: criticalCases.length > 0 ? "critical" : "insight",
      title: criticalCases.length > 0 ? `${criticalCases.length} Critical Trauma Call(s) — Pre-Alert Bay 1` : "Trauma Bay Capacity Ready",
      description: criticalCases.length > 0
        ? `Emergency caller reports critical vitals in ${criticalCases[0]?.location || 'Metro Area'}. Prepare ALS resuscitation team & blood units.`
        : "ICU & Emergency Room bed availability is currently at 78% capacity across regional medical centers.",
      actionLabel: "Prep Trauma Bay",
    },
    {
      id: "hosp-2",
      tone: "success",
      title: "Automated EMS Route Telemetry",
      description: "Ambulance Unit 4 is 3.2 minutes from patient pickup. Hospital ER ingress clear for immediate stretcher transfer.",
      actionLabel: "View Telemetry",
    },
  ];

  return (
    <DashboardLayout
      title="Hospital EMS & Emergency Triage"
      audioEnabled={audioEnabled}
      onToggleAudio={() => setAudioEnabled(!audioEnabled)}
      notifications={pendingCases}
    >
      <Toaster richColors position="top-right" />

      {/* ── WATERMELON HEADER ────────────────────────────────────── */}
      <DashboardHeader
        title="Hospital EMS & Emergency Triage Command"
        subtitle="Regional Trauma Center & Paramedic Dispatch"
        department="Emergency Medical Services Directorate"
        accentColor="#10B981"
        icon={Activity}
        onRefresh={fetchHospitalCases}
        onExport={handleExport}
        isRefreshing={loading}
        extraActions={
          <Button
            onClick={() => setReportDialogOpen(true)}
            size="sm"
            className="h-9 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="size-4" />
            <span>Log EMS Call</span>
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
            label="Triage Queue"
            value={pendingCases.length.toString()}
            note={pendingCases.length > 0 ? `${pendingCases.length} awaiting paramedic` : "Queue clear"}
            trend={pendingCases.length > 0 ? "down" : "up"}
          />
          <MetricCard
            icon={Truck}
            iconBg="bg-blue-500/10"
            iconClassName="text-blue-400"
            label="Ambulances En Route"
            value={inProgressCases.length.toString()}
            note="Active paramedic transports"
            trend="neutral"
          />
          <MetricCard
            icon={Heart}
            iconBg={criticalCases.length > 0 ? "bg-rose-500/10" : "bg-emerald-500/10"}
            iconClassName={criticalCases.length > 0 ? "text-rose-400 animate-pulse" : "text-emerald-400"}
            label="Critical Trauma"
            value={criticalCases.length.toString()}
            note={criticalCases.length > 0 ? "Priority 1 Medical Alert" : "Zero code reds"}
            trend={criticalCases.length > 0 ? "down" : "up"}
          />
          <MetricCard
            icon={CheckCircle}
            iconBg="bg-emerald-500/10"
            iconClassName="text-emerald-400"
            label="Admitted / Stabilized"
            value={resolvedCases.length.toString()}
            note={hospitalCases.length > 0 ? `${Math.round((resolvedCases.length / hospitalCases.length) * 100)}% patient clearance` : "100%"}
            trend="up"
          />
        </div>
      </section>

      {/* ── QUICK ACTIONS ───────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Medical Triage Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            icon={Truck}
            accentColor="#10B981"
            label="Dispatch Ambulance"
            description="Deploy nearest ALS / BLS unit"
            onClick={() => toast.success("Ambulance Unit Dispatched with siren")}
          />
          <QuickActionCard
            icon={Heart}
            accentColor="#EF4444"
            label="Pre-Alert Trauma Bay"
            description="Prepare ER surgical team"
            onClick={() => toast.error("Trauma Bay 1 alerted: Surgical crew ready")}
          />
          <QuickActionCard
            icon={Shield}
            accentColor="#3B82F6"
            label="Request Police Escort"
            description="Clear fast arterial lane"
            onClick={() => toast.info("Police escort routed for incoming ambulance")}
          />
          <QuickActionCard
            icon={Zap}
            accentColor="#8B5CF6"
            label="Mass Casualty Protocol"
            description="Activate regional surge beds"
            onClick={() => toast.warning("Mass casualty surge protocol initialized")}
          />
        </div>
      </section>

      {/* ── CHARTS ROW ──────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8 items-stretch">
        <div className="lg:col-span-2">
          <CirculationActivityChart
            title="EMS Patient Intake & Admission Velocity"
            subtitle="Hourly emergency room and paramedic volume"
            dataByTimeframe={chartDataByTimeframe}
            timeframeOptions={["24h", "shift", "weekly"]}
            defaultTimeframe="24h"
            primaryKey="intake"
            primaryLabel="Incoming Patients"
            primaryColor="#10B981"
            secondaryKey="discharged"
            secondaryLabel="Stabilized / Admitted"
            secondaryColor="#3B82F6"
            height={260}
          />
        </div>

        <div>
          <DualDonutChart
            title="Medical Severity Breakdown"
            label="Total Cases"
            segments={medicalSegments}
            size={175}
          />
        </div>
      </section>

      {/* ── AI INTELLIGENCE ADVISORY ────────────────────────────── */}
      <section className="mb-8">
        <IntelligenceFeed
          title="Hospital AI Triage Advisory & Bed Telemetry"
          items={hospitalAiInsights}
          onActionClick={(card) => toast.info("Medical Triage Action", { description: card.title })}
        />
      </section>

      {/* ── TABBED CASE MANAGEMENT ROSTER ────────────────────────── */}
      <section className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-xs">
        {/* Subtabs + View Mode Bar */}
        <div className="p-4 sm:p-5 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-xl border border-border/40">
            <Link
              to="/hospital?tab=pending"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                currentTab === "pending"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="size-3.5" />
              <span>Triage Queue</span>
              {pendingCases.length > 0 && (
                <span className="size-4.5 rounded-full bg-white/20 text-white text-[10px] flex items-center justify-center font-black">
                  {pendingCases.length}
                </span>
              )}
            </Link>

            <Link
              to="/hospital?tab=active"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                currentTab === "active"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Truck className="size-3.5" />
              <span>Ambulances En Route</span>
              {inProgressCases.length > 0 && (
                <span className="size-4.5 rounded-full bg-white/20 text-white text-[10px] flex items-center justify-center font-black">
                  {inProgressCases.length}
                </span>
              )}
            </Link>

            <Link
              to="/hospital?tab=resolved"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                currentTab === "resolved"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HeartHandshake className="size-3.5" />
              <span>Admitted / Closed</span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medical cases..."
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
              <Loader2 className="size-7 animate-spin mx-auto text-emerald-400" />
              <p className="text-xs text-muted-foreground mt-2 font-medium">Scanning hospital triage registry...</p>
            </div>
          ) : displayedCases.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="size-9 mx-auto opacity-30 text-muted-foreground mb-2" />
              <h3 className="text-sm font-bold text-foreground">No Medical Triage Cases</h3>
              <p className="text-xs text-muted-foreground mt-1">Current EMS queue is clear for this filter selection.</p>
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
                        <span className="font-mono text-[11px] font-bold text-emerald-400">
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
                        {item.name || "Patient / Caller"}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="size-3 text-slate-400" />
                        {item.phone || "No callback phone"}
                      </p>

                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="size-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{item.location || item.address || "Patient Location Recorded"}</span>
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
                        className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink className="size-3" />
                        Map
                      </a>

                      <div className="flex items-center gap-1.5">
                        {isPending && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(item._id, "InProgress")}
                            className="h-7 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Truck className="size-3.5 mr-1" />
                            Dispatch Unit
                          </Button>
                        )}
                        {isProgress && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(item._id, "Resolved")}
                            className="h-7 px-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <CheckCircle className="size-3.5 mr-1" />
                            Admit / Close
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
        preselectedDepartment="Hospital"
        onEmergencyCreated={() => fetchHospitalCases()}
      />
    </DashboardLayout>
  );
};

export default HospitalPanel;