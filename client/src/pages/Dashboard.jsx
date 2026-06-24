import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/api";
import { Link } from "react-router-dom";
import {
  getPoliceEmergencies,
  getFireEmergencies,
  getHospitalEmergencies,
  updateEmergencyStatus,
} from "../services/emergencyApi";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import ReportEmergencyDialog from "../components/dashboard/ReportEmergencyDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import { 
  Shield, 
  Flame, 
  Activity, 
  Search, 
  Filter, 
  Clock, 
  Phone, 
  PhoneCall,
  Globe,
  Mic,
  AlertOctagon, 
  CheckCircle2, 
  Play, 
  Loader2,
  Users,
  Compass,
  ArrowUpRight
} from "lucide-react";

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

const Dashboard = () => {
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Filtering and searching states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  
  // Console log state for tracking dashboard events
  const [logs, setLogs] = useState([]);
  const socketRef = useRef(null);
  const audioEnabledRef = useRef(audioEnabled);

  const addLog = (message) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${message}`, ...prev.slice(0, 19)]);
  };

  const fetchDashboardData = async () => {
    try {
      addLog("Fetching fresh database records...");
      const [policeData, fireData, hospitalData] = await Promise.all([
        getPoliceEmergencies(),
        getFireEmergencies(),
        getHospitalEmergencies(),
      ]);

      const police = Array.isArray(policeData) ? policeData : policeData.data || [];
      const fire = Array.isArray(fireData) ? fireData : fireData.data || [];
      const hospital = Array.isArray(hospitalData) ? hospitalData : hospitalData.data || [];

      // Combine and sort by date descending
      const combined = [...police, ...fire, ...hospital].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setAllCases(combined);
      addLog(`Loaded ${combined.length} total incidents successfully.`);
    } catch (error) {
      console.log(error);
      addLog(`ERR: Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      addLog(`Updating case status to "${status}"...`);
      await updateEmergencyStatus(id, status);
      // Wait for socket to trigger or fetch locally
      fetchDashboardData();
    } catch (error) {
      console.log(error);
      addLog(`ERR: Status update failed: ${error.message}`);
    }
  };

  // Keep ref in sync without triggering socket reconnects
  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  // Socket Connection and Event Listeners
  useEffect(() => {
    fetchDashboardData();

    socketRef.current = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    const socket = socketRef.current;

    socket.on("connect", () => {
      setSocketConnected(true);
      addLog(`📡 Dispatch link established with backend server.`);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
      addLog(`❌ Alert: Dispatch link to backend disconnected.`);
    });

    socket.on("new-emergency", (emergency) => {
      addLog(`🚨 AI classified new incident: ${emergency.priority} Priority - ${emergency.department}`);

      // Play audio notification
      if (audioEnabledRef.current) {
        playAlertSound(emergency.priority);
      }

      // Show toast
      toast.error(`NEW INCIDENT ROUTED`, {
        description: `Routed to ${emergency.department} | Priority: ${emergency.priority}`,
        action: {
          label: "View Feed",
          onClick: () => {
            setSelectedDept("All");
            setSelectedPriority("All");
            setSearchQuery("");
          }
        },
        duration: 8000,
      });

      // Update state immediately for instant feedback
      setAllCases((prevCases) => {
        if (prevCases.some((c) => c._id === emergency._id)) return prevCases;
        return [emergency, ...prevCases];
      });

      fetchDashboardData();
    });

    socket.on("status-updated", (updated) => {
      addLog(`Case status updated for ${updated.name} -> ${updated.status}`);
      // Update state immediately
      setAllCases((prevCases) =>
        prevCases.map((c) => (c._id === updated._id ? updated : c))
      );
      fetchDashboardData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Derived Statistics
  const stats = {
    total: allCases.length,
    police: allCases.filter((c) => c.department === "Police").length,
    fire: allCases.filter((c) => c.department === "Fire Brigade").length,
    hospital: allCases.filter((c) => c.department === "Hospital").length,
    pending: allCases.filter((c) => c.status === "Pending").length,
    inProgress: allCases.filter((c) => c.status === "In Progress").length,
    resolved: allCases.filter((c) => c.status === "Resolved").length,
    critical: allCases.filter((c) => c.priority === "Critical").length,
  };

  // Filtered case logic
  const filteredCases = allCases.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.phone && item.phone.includes(searchQuery));
      
    const matchesDept = selectedDept === "All" || item.department === selectedDept;
    
    const matchesPriority = selectedPriority === "All" || item.priority === selectedPriority;
    
    return matchesSearch && matchesDept && matchesPriority;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-600/10 text-red-500 border-red-500/30";
      case "High":
        return "bg-orange-500/10 text-orange-500 border-orange-500/30";
      case "Medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    }
  };

  const getDeptColor = (dept) => {
    if (dept === "Police") return "border-l-blue-500";
    if (dept === "Fire Brigade") return "border-l-red-500";
    return "border-l-emerald-500";
  };

  const getDeptIcon = (dept) => {
    if (dept === "Police") return <Shield className="h-4 w-4 text-blue-500" />;
    if (dept === "Fire Brigade") return <Flame className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-emerald-500" />;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans transition-theme">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <DashboardHeader 
        socketConnected={socketConnected}
        onReportClick={() => setReportDialogOpen(true)}
        audioEnabled={audioEnabled}
        toggleAudio={() => {
          setAudioEnabled(!audioEnabled);
          addLog(`Audio notification sounds ${!audioEnabled ? "ENABLED" : "MUTED"}`);
        }}
      />

      {/* Main Dashboard Layout */}
      <main className="flex-1 p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
        
        {/* Banner for Critical Incidents */}
        {stats.critical > 0 && (
          <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 p-4 flex items-center justify-between text-red-500 animate-pulse">
            <div className="flex items-center gap-3">
              <AlertOctagon className="h-6 w-6 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">CRITICAL INCIDENTS DETECTED ({stats.critical})</h4>
                <p className="text-xs text-red-400">Immediate action required. Verify AI classifications and coordinate dispatch.</p>
              </div>
            </div>
          </div>
        )}

        {/* Dispatch Overview telemetry metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="col-span-1 border-muted/50 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Reports</CardDescription>
              <CardTitle className="text-3xl font-extrabold">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="col-span-1 border-muted/50 border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-blue-500">🚓 Police Cases</CardDescription>
              <CardTitle className="text-3xl font-extrabold text-blue-500">{stats.police}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="col-span-1 border-muted/50 border-l-4 border-l-red-500 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-red-500">🚒 Fire Cases</CardDescription>
              <CardTitle className="text-3xl font-extrabold text-red-500">{stats.fire}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="col-span-1 border-muted/50 border-l-4 border-l-emerald-500 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-emerald-500">🏥 Hospital Cases</CardDescription>
              <CardTitle className="text-3xl font-extrabold text-emerald-500">{stats.hospital}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="col-span-1 border-muted/50 border-l-4 border-l-amber-500 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-amber-500">🟡 Pending</CardDescription>
              <CardTitle className="text-3xl font-extrabold text-amber-500">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="col-span-1 border-muted/50 border-l-4 border-l-blue-600 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-blue-600">🔵 In Progress</CardDescription>
              <CardTitle className="text-3xl font-extrabold text-blue-600">{stats.inProgress}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="col-span-1 border-muted/50 border-l-4 border-l-emerald-600 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-emerald-600">🟢 Resolved</CardDescription>
              <CardTitle className="text-3xl font-extrabold text-emerald-600">{stats.resolved}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Dashboard Panels Grid Quicklinks */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link to="/police" className="group">
            <Card className="border-muted/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all shadow-sm rounded-xl">
              <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold group-hover:text-blue-500 transition-colors">🚓 Police Dispatch</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-xs text-muted-foreground">Manage law enforcement emergencies & tactical response.</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/fire" className="group">
            <Card className="border-muted/50 hover:border-red-500/50 hover:bg-red-500/5 transition-all shadow-sm rounded-xl">
              <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold group-hover:text-red-500 transition-colors">🚒 Fire & Rescue</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-red-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-xs text-muted-foreground">Manage structural fire containment, hazardous alerts, & rescue.</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/hospital" className="group">
            <Card className="border-muted/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all shadow-sm rounded-xl">
              <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold group-hover:text-emerald-500 transition-colors">🏥 EMS & Medical</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-xs text-muted-foreground">Coordinate hospital dispatching, ambulance logistics, & trauma services.</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/analytics" className="group">
            <Card className="border-muted/50 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all shadow-sm rounded-xl">
              <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold group-hover:text-purple-500 transition-colors">📊 Live Analytics</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-xs text-muted-foreground">View system metrics, department load levels, & incident timeline graphs.</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Live Feed & Tools Layout split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Unified Incident Activity Feed */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Search, Filter, Tabs Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border rounded-2xl p-4 bg-muted/20">
              
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by caller, details, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl border-muted/50 focus:border-primary"
                />
              </div>

              {/* Department Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Filters:
                </span>
                
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="rounded-xl border border-muted/60 text-xs font-semibold px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  <option value="Police">Police 🚓</option>
                  <option value="Fire Brigade">Fire Brigade 🚒</option>
                  <option value="Hospital">Hospital 🏥</option>
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="rounded-xl border border-muted/60 text-xs font-semibold px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical 🚨</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                {(searchQuery || selectedDept !== "All" || selectedPriority !== "All") && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedDept("All");
                      setSelectedPriority("All");
                    }}
                    className="h-8 text-xs font-bold rounded-xl text-red-500 hover:text-red-600"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Incidents Cards List */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Compass className="h-5 w-5 text-red-500" /> Unified Dispatch Log ({filteredCases.length})
              </h2>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-semibold">Synchronizing with command database...</p>
                </div>
              ) : filteredCases.length === 0 ? (
                <Card className="border-dashed border-2 py-16 flex flex-col items-center justify-center text-center rounded-2xl">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground/60 mb-2" />
                  <CardTitle className="text-base text-muted-foreground">No reports matching filters</CardTitle>
                  <CardDescription className="text-xs">Database is currently quiet. Submit a new case to test dispatching.</CardDescription>
                </Card>
              ) : (
                filteredCases.map((item) => (
                  <Card
                    key={item._id}
                    className={`border border-muted/60 border-l-4 shadow-sm hover:shadow transition-all rounded-2xl overflow-hidden ${getDeptColor(
                      item.department
                    )}`}
                  >
                    <div className="p-5 md:p-6 flex flex-col md:flex-row justify-between items-start gap-4">
                      
                      {/* Left: Caller info, Department, description */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-lg font-bold text-foreground">{item.name}</h3>
                          
                          {/* Department label */}
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-muted/80 bg-muted/40">
                            {getDeptIcon(item.department)}
                            <span className="text-muted-foreground">{item.department}</span>
                          </span>

                          {/* Priority label */}
                          <Badge variant="outline" className={`border ${getPriorityColor(item.priority)} font-bold text-xs`}>
                            {item.priority}
                          </Badge>

                          {/* Status label */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            item.status === 'In Progress' ? 'bg-blue-600/10 text-blue-500 border-blue-500/20' :
                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        {/* Caller detail Message */}
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium bg-muted/5 p-3.5 rounded-xl border border-muted/20">
                          {item.message}
                        </p>

                        {/* Telemetry data: Phone, Source & Time */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          {item.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" /> {item.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="h-3.5 w-3.5" /> {new Date(item.createdAt).toLocaleString()}
                          </span>

                          {/* Source Badge: Call or Web */}
                          {item.source === "call" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-500 border border-violet-500/20">
                              <PhoneCall className="h-3 w-3" /> Via Call
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-500 border border-sky-500/20">
                              <Globe className="h-3 w-3" /> Via Web
                            </span>
                          )}
                        </div>

                        {/* Recording Playback — only for call emergencies */}
                        {item.source === "call" && item.recordingUrl && (
                          <div className="mt-1">
                            <p className="text-[10px] font-bold text-muted-foreground mb-1.5 flex items-center gap-1">
                              <Mic className="h-3 w-3 text-violet-500" /> Caller Voice Recording
                            </p>
                            <audio
                              controls
                              src={item.recordingUrl}
                              className="w-full h-8 rounded-lg"
                              style={{ filter: "invert(0) sepia(0) saturate(1) hue-rotate(0deg)" }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Right: Dispatcher Workflow actions */}
                      <div className="flex md:flex-col gap-2 min-w-[130px] w-full md:w-auto pt-2 md:pt-0 shrink-0">
                        {item.status === "Pending" && (
                          <>
                            <Button
                              onClick={() => handleStatusUpdate(item._id, "In Progress")}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl h-9"
                              size="sm"
                            >
                              <Play className="h-3.5 w-3.5 mr-1" />
                              Dispatch Unit
                            </Button>
                            <Button
                              onClick={() => handleStatusUpdate(item._id, "Resolved")}
                              variant="outline"
                              className="font-bold text-xs rounded-xl h-9 hover:bg-emerald-500/5 hover:text-emerald-500 hover:border-emerald-500/30"
                              size="sm"
                            >
                              Resolve Direct
                            </Button>
                          </>
                        )}
                        
                        {item.status === "In Progress" && (
                          <Button
                            onClick={() => handleStatusUpdate(item._id, "Resolved")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl h-9"
                            size="sm"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Mark Resolved
                          </Button>
                        )}

                        {item.status === "Resolved" && (
                          <span className="text-emerald-500 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-500/20 bg-emerald-500/5 py-2 px-3 rounded-xl w-full">
                            <CheckCircle2 className="h-4 w-4" /> Case Closed
                          </span>
                        )}
                      </div>

                    </div>
                  </Card>
                ))
              )}
            </div>

          </div>

          {/* Right Sidebar: Operations console logs */}
          <div className="space-y-6">
            
            {/* Dispatcher operations info */}
            <Card className="border-muted/50 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 p-4 border-b border-muted/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Active Response Force
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">🚓 Police Patrols:</span>
                  <Badge variant="secondary" className="font-bold">Active dispatchers</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">🚒 Fire Brigades:</span>
                  <Badge variant="secondary" className="font-bold">Standby rescue</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">🏥 Hospital Ambulances:</span>
                  <Badge variant="secondary" className="font-bold">Trauma response</Badge>
                </div>
                <hr className="border-muted/50" />
                <div className="bg-muted/20 p-3 rounded-xl border border-muted/40 text-[10px] leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground block mb-1">AUTOMATED ROUTING SYS</span>
                  Incidents submitted by citizens are analyzed instantly. Classified departments and computed priorities are synced live.
                </div>
              </CardContent>
            </Card>

            {/* Live Telemetry Log Output */}
            <Card className="border-muted/50 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 p-4 border-b border-muted/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Telemetry Log Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-slate-950 p-4 text-[10.5px] font-mono text-slate-300 h-80 overflow-y-auto space-y-1.5 select-text">
                  {logs.length === 0 ? (
                    <span className="text-slate-500">Initializing logger console...</span>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="leading-relaxed break-all border-b border-slate-900 pb-1 last:border-0">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

      </main>

      {/* Incident reporting modal */}
      <ReportEmergencyDialog 
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
};

export default Dashboard;