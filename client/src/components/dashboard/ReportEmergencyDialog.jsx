import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createEmergency } from "../../services/emergencyApi";
import { Loader2, Send, CheckCircle, AlertTriangle, Info, MapPin, Shield, Flame, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ReportEmergencyDialog = ({ open, onOpenChange, onSuccess }) => {
  const [formData, setFormData] = useState({ name: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [clientLocationInfo, setClientLocationInfo] = useState({
    clientAddress: "",
    clientArea: "",
    clientCity: "",
    clientLandmark: "",
  });

  // ── Reverse Geocoding (unchanged) ────────────────────────
  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`
      );
      if (!res.ok) throw new Error("Nominatim request failed");
      const data = await res.json();
      if (!data) return null;

      const addressDetails = data.address || {};
      const landmark = addressDetails.building || addressDetails.amenity || addressDetails.shop || addressDetails.tourism || addressDetails.historic || addressDetails.office || addressDetails.leisure || "";
      const area = addressDetails.neighbourhood || addressDetails.suburb || addressDetails.road || addressDetails.residential || "";
      const city = addressDetails.city || addressDetails.town || addressDetails.village || addressDetails.county || "";

      return { address: data.display_name || "", area, city, landmark };
    } catch (err) {
      console.error("Dialog reverse geocoding error:", err);
      return null;
    }
  };

  // ── Geolocation on open (unchanged) ──────────────────────
  useEffect(() => {
    if (open && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setCoords({ latitude: lat, longitude: lon });

          const resolved = await reverseGeocode(lat, lon);
          if (resolved) {
            setClientLocationInfo({
              clientAddress: resolved.address,
              clientArea: resolved.area,
              clientCity: resolved.city,
              clientLandmark: resolved.landmark,
            });
          }
        },
        (err) => {
          console.log("Dialog Geolocation permission denied/error:", err.message);
        }
      );
    }
  }, [open]);

  // ── Submit (unchanged) ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      setError("All fields are required.");
      return;
    }
    const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, "");
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Contact phone number must be exactly 10 digits.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await createEmergency({
        name: formData.name.trim(),
        phone: cleanPhone,
        message: formData.message.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        clientAddress: clientLocationInfo.clientAddress,
        clientArea: clientLocationInfo.clientArea,
        clientCity: clientLocationInfo.clientCity,
        clientLandmark: clientLocationInfo.clientLandmark,
      });
      if (res.success && res.data) {
        setResult(res.data);
        if (onSuccess) onSuccess(res.data);
      } else {
        setError("Failed to route emergency incident.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Operational link failure. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", phone: "", message: "" });
    setError("");
    setResult(null);
    setCoords({ latitude: null, longitude: null });
    setClientLocationInfo({ clientAddress: "", clientArea: "", clientCity: "", clientLandmark: "" });
    onOpenChange(false);
  };

  // ── Design Helpers ────────────────────────────────────────
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "Critical": return { color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" };
      case "High":     return { color: "#F97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)" };
      case "Medium":   return { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" };
      default:         return { color: "#3B82F6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.18)" };
    }
  };

  const getDeptConfig = (dept) => {
    if (dept === "Police")                       return { color: "#3B82F6", icon: <Shield className="h-3.5 w-3.5" />, emoji: "🚓" };
    if (dept === "Fire Brigade" || dept === "Fire") return { color: "#EF4444", icon: <Flame className="h-3.5 w-3.5" />, emoji: "🚒" };
    return { color: "#22C55E", icon: <Activity className="h-3.5 w-3.5" />, emoji: "🏥" };
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange(val); }}>
      <DialogContent
        className="sm:max-w-[480px] max-w-[90vw] overflow-y-auto max-h-[88vh] rounded-2xl p-0 border-0"
        style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Dialog Top Bar */}
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertTriangle className="h-4 w-4" style={{ color: "#EF4444" }} />
            </div>
            <DialogTitle className="text-sm font-bold text-white tracking-tight">Log New Emergency</DialogTitle>
          </div>
          <DialogDescription className="text-[11px] font-medium ml-11" style={{ color: "#6B7280" }}>
            Dictate or type incident narrative. The AI dispatch engine auto-classifies routing and priority.
          </DialogDescription>
        </div>

        <div className="px-6 py-5">
          {result ? (
            /* ── Success State ─────────────────────────────── */
            <div className="space-y-4 animate-fade-in">
              {/* Success Banner */}
              <div
                className="flex flex-col items-center justify-center text-center p-6 rounded-2xl"
                style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(34,197,94,0.1)" }}
                >
                  <CheckCircle className="h-7 w-7" style={{ color: "#22C55E" }} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Incident Filed & Routed</h3>
                <p className="text-[11px]" style={{ color: "#6B7280" }}>
                  Broadcasted live in operational command registry.
                </p>
              </div>

              {/* AI Analysis Block */}
              <div
                className="rounded-2xl p-4 space-y-3.5"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-[9px] uppercase font-black tracking-widest" style={{ color: "#6B7280" }}>
                  AI Dispatch Analysis
                </p>

                {/* Department */}
                {(() => {
                  const dept = getDeptConfig(result.department);
                  return (
                    <div className="flex items-center justify-between py-2.5"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Routed Department</span>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: `${dept.color}10`, color: dept.color, border: `1px solid ${dept.color}20` }}
                      >
                        {dept.icon}
                        {result.department === "Fire" ? "Fire Brigade" : result.department}
                      </span>
                    </div>
                  );
                })()}

                {/* Priority */}
                {(() => {
                  const ps = getPriorityStyle(result.priority);
                  return (
                    <div className="flex items-center justify-between py-2.5"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Threat Priority</span>
                      <span
                        className="text-[9px] font-black px-2.5 py-1 rounded tracking-widest uppercase"
                        style={{ background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}
                      >
                        {result.priority}
                      </span>
                    </div>
                  );
                })()}

                {/* Location */}
                {result.address && (
                  <div className="py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-[9px] uppercase font-black tracking-widest mb-1.5 flex items-center gap-1" style={{ color: "#6B7280" }}>
                      <MapPin className="h-3 w-3" /> Extracted Address
                    </p>
                    <p className="text-xs font-medium text-white leading-relaxed">{result.address}</p>
                  </div>
                )}

                {/* Narrative */}
                <div className="pt-1">
                  <p className="text-[9px] uppercase font-black tracking-widest mb-2" style={{ color: "#6B7280" }}>
                    Narrative Log
                  </p>
                  <p
                    className="text-xs italic font-medium leading-relaxed p-3 rounded-xl max-h-24 overflow-y-auto"
                    style={{ color: "#9CA3AF", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    "{result.message}"
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full h-10 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all"
                style={{ background: "#3B82F6" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Close Log Console
              </button>
            </div>
          ) : (
            /* ── Form State ────────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error */}
              {error && (
                <div
                  className="flex items-start gap-2.5 p-3.5 rounded-xl text-xs font-medium"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Reporter Name */}
              <div className="space-y-1.5">
                <label htmlFor="report-name"
                  className="block text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "#6B7280" }}>
                  Reporter Name
                </label>
                <input
                  id="report-name"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                  className="w-full h-10 px-3.5 rounded-xl text-sm text-white outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#F9FAFB",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label htmlFor="report-phone"
                  className="block text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "#6B7280" }}>
                  Contact Telephone
                </label>
                <input
                  id="report-phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  disabled={loading}
                  className="w-full h-10 px-3.5 rounded-xl text-sm text-white outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#F9FAFB",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>

              {/* Incident Statement */}
              <div className="space-y-1.5">
                <label htmlFor="report-message"
                  className="block text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "#6B7280" }}>
                  Incident Statement
                </label>
                <textarea
                  id="report-message"
                  placeholder="Provide specific details (e.g. 'A truck collided with a pole at Sector 4, driver is unconscious and there is fuel leakage...')"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  disabled={loading}
                  rows={4}
                  className="w-full px-3.5 py-3 rounded-xl text-sm text-white outline-none resize-none transition-all leading-relaxed"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#F9FAFB",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>

              {/* Location note */}
              {coords.latitude && (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl text-[10px] font-semibold"
                  style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)", color: "#22C55E" }}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>GPS location captured — will be attached to this report.</span>
                </div>
              )}

              {/* Info tip */}
              <div
                className="flex gap-2.5 p-3.5 rounded-xl text-[10px] leading-relaxed font-medium"
                style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.12)", color: "#6B7280" }}
              >
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "#3B82F6" }} />
                <span>Specify injury levels, fire hazards, or security threats for accurate AI routing classification.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 h-10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#9CA3AF",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#D1D5DB"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#9CA3AF"; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] h-10 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: "#3B82F6" }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.85"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      AI Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Route Incident
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportEmergencyDialog;
