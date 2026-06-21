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
import { Loader2, Send, CheckCircle, ShieldAlert, AlertTriangle, Info } from "lucide-react";
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
      const landmark =
        addressDetails.building ||
        addressDetails.amenity ||
        addressDetails.shop ||
        addressDetails.tourism ||
        addressDetails.historic ||
        addressDetails.office ||
        addressDetails.leisure ||
        "";
      const area =
        addressDetails.neighbourhood ||
        addressDetails.suburb ||
        addressDetails.road ||
        addressDetails.residential ||
        "";
      const city =
        addressDetails.city ||
        addressDetails.town ||
        addressDetails.village ||
        addressDetails.county ||
        "";

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
    if (!formData.name || !formData.phone || !formData.message) {
      setError("Please fill out all fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await createEmergency({
        ...formData,
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
        setError("Failed to report emergency.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "An error occurred while submitting.");
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
        return <Badge className="bg-red-600 hover:bg-red-500 font-bold uppercase tracking-wider text-xs">Critical</Badge>;
      case "High":
        return <Badge className="bg-orange-500 hover:bg-orange-400 font-bold uppercase tracking-wider text-xs">High</Badge>;
      case "Medium":
        return <Badge className="bg-amber-500 hover:bg-amber-400 font-bold uppercase tracking-wider text-xs">Medium</Badge>;
      default:
        return <Badge className="bg-blue-500 hover:bg-blue-400 font-bold uppercase tracking-wider text-xs">Low</Badge>;
    }
  };

  const getDeptColor = (dept) => {
    if (dept === "Police") return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    if (dept === "Fire Brigade") return "text-red-500 bg-red-500/10 border-red-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  };

  const getDeptIcon = (dept) => {
    if (dept === "Police") return "🚓";
    if (dept === "Fire Brigade") return "🚒";
    return "🏥";
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange(val); }}>
      <DialogContent className="sm:max-w-[500px] max-w-[90vw] overflow-y-auto max-h-[85vh] rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <span className="text-2xl animate-pulse">🚨</span> Report Emergency
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Enter the details of the emergency incident. Groq AI will automatically classify the department and determine response priority.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center text-center p-6 border rounded-2xl bg-emerald-500/5 border-emerald-500/20">
              <CheckCircle className="h-12 w-12 text-emerald-500 mb-3 animate-bounce" />
              <h3 className="text-lg font-bold text-foreground">Emergency Submitted Successfully</h3>
              <p className="text-muted-foreground text-xs mt-1">Broadcasted in real-time to response units.</p>
            </div>

            <div className="space-y-3.5 border rounded-2xl p-5 bg-muted/20">
              <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground">AI Dispatch Routing</h4>
              
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-sm font-semibold text-muted-foreground">Routed Department</span>
                <span className={`px-3.5 py-1.5 rounded-xl border text-sm font-bold flex items-center gap-1.5 ${getDeptColor(result.department)}`}>
                  <span>{getDeptIcon(result.department)}</span>
                  {result.department}
                </span>
              </div>

              <div className="flex items-center justify-between border-b pb-3 pt-1">
                <span className="text-sm font-semibold text-muted-foreground">AI Priority Assessment</span>
                {getPriorityBadge(result.priority)}
              </div>

              {result.address && (
                <div className="flex flex-col gap-1 border-b pb-3 pt-1">
                  <span className="text-xs font-semibold text-muted-foreground">Extracted Address</span>
                  <span className="text-xs font-bold text-foreground">{result.address}</span>
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold text-muted-foreground block">Incident Logged</span>
                <p className="text-xs italic font-medium text-foreground bg-background p-3 rounded-xl border border-muted/50 max-h-24 overflow-y-auto">
                  "{result.message}"
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl">
                Close Dispatch Form
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-3">
            {error && (
              <div className="flex items-start gap-2 p-3.5 rounded-xl border bg-destructive/10 border-destructive/20 text-destructive text-xs font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-bold text-muted-foreground">Reporter's Name</label>
              <Input
                id="name"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
                className="rounded-xl h-11 border-muted/50 focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-xs font-bold text-muted-foreground">Contact Phone Number</label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. +1 555-0199"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                disabled={loading}
                className="rounded-xl h-11 border-muted/50 focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="message" className="text-xs font-bold text-muted-foreground">Emergency Details</label>
              <Textarea
                id="message"
                placeholder="Describe the emergency in detail (e.g. 'There is a heavy fire in a warehouse on 5th avenue. Multiple workers trapped...')"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                disabled={loading}
                rows={4}
                className="rounded-xl border-muted/50 focus:border-primary resize-none"
              />
            </div>

            <div className="flex gap-2 p-3 border rounded-xl bg-muted/40 text-muted-foreground text-[10px] leading-relaxed">
              <Info className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
              <span>Ensure description contains critical info (injuries, fire, weapons) to help the AI classifier assess department routing and priority accurately.</span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="rounded-xl h-11 border-muted/50 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-500 text-white rounded-xl h-11 font-semibold flex items-center justify-center gap-2 shadow-md shadow-red-600/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing Incident...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit and Route
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
