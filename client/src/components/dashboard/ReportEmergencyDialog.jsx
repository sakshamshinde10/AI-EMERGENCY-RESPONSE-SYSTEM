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
import { Loader2, Send, CheckCircle, AlertTriangle, Info, MapPin } from "lucide-react";
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

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Critical":
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-bold uppercase tracking-wider text-[9px]">Critical</Badge>;
      case "High":
        return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 font-bold uppercase tracking-wider text-[9px]">High</Badge>;
      case "Medium":
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold uppercase tracking-wider text-[9px]">Medium</Badge>;
      default:
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold uppercase tracking-wider text-[9px]">Low</Badge>;
    }
  };

  const getDeptColor = (dept) => {
    if (dept === "Police") return "text-blue-400 bg-blue-500/10 border-blue-500/25";
    if (dept === "Fire Brigade" || dept === "Fire") return "text-red-400 bg-red-500/10 border-red-500/25";
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
  };

  const getDeptIcon = (dept) => {
    if (dept === "Police") return "🚓";
    if (dept === "Fire Brigade" || dept === "Fire") return "🚒";
    return "🏥";
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange(val); }}>
      <DialogContent className="sm:max-w-[480px] max-w-[90vw] overflow-y-auto max-h-[85vh] rounded-2xl p-6 bg-[#111827] border border-white/5 text-white">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-wider text-white">
            Log New Emergency
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs font-semibold">
            Dictate or type incident narrative. The dispatch engine automates routing classification and priority mapping.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-5 py-2">
            <div className="flex flex-col items-center justify-center text-center p-5 border rounded-xl bg-emerald-500/5 border-emerald-500/15">
              <CheckCircle className="h-10 w-10 text-emerald-500 mb-2.5 animate-pulse" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Incident Filed</h3>
              <p className="text-slate-500 text-[10px] mt-0.5">Broadcasted live in operational command registry.</p>
            </div>

            <div className="space-y-3.5 border rounded-xl p-4.5 bg-[#1F2937]/10 border-white/5">
              <h4 className="text-[9px] uppercase font-bold tracking-widest text-slate-500">AI Dispatch Analysis</h4>
              
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2.5">
                <span className="text-xs font-semibold text-slate-400">Routed Department</span>
                <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${getDeptColor(result.department)}`}>
                  <span>{getDeptIcon(result.department)}</span>
                  {result.department === "Fire" ? "Fire Brigade" : result.department}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2.5 pt-1">
                <span className="text-xs font-semibold text-slate-400">Threat Priority</span>
                {getPriorityBadge(result.priority)}
              </div>

              {result.address && (
                <div className="flex flex-col gap-1 border-b border-white/[0.04] pb-2.5 pt-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Extracted Address
                  </span>
                  <span className="text-xs font-bold text-slate-300 leading-normal">{result.address}</span>
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block">Narrative log</span>
                <p className="text-xs italic font-semibold text-slate-400 bg-white/[0.02] p-3 rounded-lg border border-white/5 max-h-24 overflow-y-auto">
                  "{result.message}"
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg border-none">
                Close Log Console
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-1.5">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg border bg-red-950/20 border-red-500/20 text-red-400 text-xs font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="name" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reporter Name</label>
              <Input
                id="name"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
                className="rounded-lg h-9 bg-[#1F2937]/30 border-white/10 text-white placeholder-slate-600 focus:border-blue-500/50 transition-all text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Telephone</label>
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                disabled={loading}
                className="rounded-lg h-9 bg-[#1F2937]/30 border-white/10 text-white placeholder-slate-600 focus:border-blue-500/50 transition-all text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="message" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incident Statement Description</label>
              <Textarea
                id="message"
                placeholder="Provide specific details (e.g. 'A truck collided with a pole at Sector 4, driver is unconscious and there is fuel leakage...')"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                disabled={loading}
                rows={4}
                className="rounded-lg bg-[#1F2937]/30 border-white/10 text-white placeholder-slate-600 focus:border-blue-500/50 resize-none text-xs leading-normal"
              />
            </div>

            <div className="flex gap-2 p-3 border border-white/5 rounded-lg bg-white/[0.01] text-slate-400 text-[10px] leading-relaxed font-semibold">
              <Info className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
              <span>Ensure description specifies injury levels, fire hazards, or security threats to facilitate accurate AI routing logic.</span>
            </div>

            <DialogFooter className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="rounded-lg h-9 border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg h-9 font-bold uppercase tracking-wider flex-1 flex items-center justify-center gap-1.5 border-none shadow-lg shadow-blue-500/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Route incident
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReportEmergencyDialog;
