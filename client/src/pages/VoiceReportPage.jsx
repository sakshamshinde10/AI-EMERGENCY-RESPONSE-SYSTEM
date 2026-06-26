import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { createEmergency } from "../services/emergencyApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Mic,
  Square,
  Phone,
  User,
  Send,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Volume2,
  FileText,
  RotateCcw,
  Zap,
} from "lucide-react";

const hasDevanagari = (text) => /[\u0900-\u097F]/.test(text);

const getBrowserLang = () => {
  const nav = navigator.language || navigator.userLanguage || "en";
  if (nav.startsWith("hi")) return { code: "hi-IN", label: "हिन्दी", id: "Hindi" };
  if (nav.startsWith("mr")) return { code: "mr-IN", label: "मराठी", id: "Marathi" };
  return { code: "en-IN", label: "English", id: "English" };
};

const VoiceReportPage = () => {
  const [detectedLang, setDetectedLang] = useState(getBrowserLang());
  const detectedLangRef = useRef(getBrowserLang());
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [editedTranscript, setEditedTranscript] = useState("");
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [clientLocationInfo, setClientLocationInfo] = useState({
    clientAddress: "",
    clientArea: "",
    clientCity: "",
    clientLandmark: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const transcriptRef = useRef("");
  const finalizedTranscriptRef = useRef("");

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

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

      return {
        address: data.display_name || "",
        area: area,
        city: city,
        landmark: landmark,
      };
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      return null;
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }

    if (navigator.geolocation) {
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
          console.log("Geolocation permission error/denied:", err.message);
        }
      );
    }
  }, []);

  useEffect(() => {
    setEditedTranscript(transcript);
  }, [transcript]);

  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = detectedLangRef.current.code;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let langSwitched = false;

    recognition.onresult = (event) => {
      let sessionFinal = "";
      let interim = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          sessionFinal += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }

      const fullText = (finalizedTranscriptRef.current + " " + sessionFinal).trim();
      setTranscript(fullText);
      setInterimText(interim);

      const sampleText = sessionFinal || interim;
      if (!langSwitched && sampleText.trim().length > 2) {
        langSwitched = true;
        if (hasDevanagari(sampleText)) {
          const isMrHint = /माझ|आहे|आग|मी|होत|कर|आम्ही|झाल/.test(sampleText);
          const newLang = isMrHint
            ? { code: "mr-IN", label: "मराठी", id: "Marathi" }
            : { code: "hi-IN", label: "हिन्दी", id: "Hindi" };
          if (detectedLangRef.current.code !== newLang.code) {
            detectedLangRef.current = newLang;
            setDetectedLang(newLang);
            try {
              recognitionRef.current.stop();
            } catch (_) {}
          }
        } else {
          const engLang = { code: "en-IN", label: "English", id: "English" };
          if (detectedLangRef.current.code !== "en-IN") {
            detectedLangRef.current = engLang;
            setDetectedLang(engLang);
            try {
              recognitionRef.current.stop();
            } catch (_) {}
          }
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please enable microphone permissions in your browser.");
        setIsRecording(false);
        isRecordingRef.current = false;
      } else if (event.error === "no-speech") {
        console.log("Speech recognition timeout: silent.");
      } else {
        setError(`Voice recognition failed: ${event.error}. Please try again.`);
        setIsRecording(false);
        isRecordingRef.current = false;
      }
    };

    recognition.onend = () => {
      finalizedTranscriptRef.current = transcriptRef.current;
      if (recognitionRef.current && isRecordingRef.current) {
        try {
          const newRec = new SpeechRecognition();
          newRec.lang = detectedLangRef.current.code;
          newRec.continuous = true;
          newRec.interimResults = true;
          newRec.maxAlternatives = 1;
          newRec.onresult = recognition.onresult;
          newRec.onerror = recognition.onerror;
          newRec.onend = recognition.onend;
          recognitionRef.current = newRec;
          newRec.start();
        } catch (e) {
          console.log("Recognition restart skipped:", e.message);
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      setIsRecording(true);
      isRecordingRef.current = true;
      recognition.start();
      setError("");
      setInterimText("");
    } catch (e) {
      console.error("Failed to start recognition:", e);
      setError("Failed to initialize voice recognition.");
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Recognition stop error:", e.message);
      }
      recognitionRef.current = null;
    }
    setInterimText("");
  }, []);

  const resetTranscript = () => {
    setTranscript("");
    setEditedTranscript("");
    setInterimText("");
    transcriptRef.current = "";
    finalizedTranscriptRef.current = "";
  };

  const handleSubmit = async () => {
    const finalMessage = editedTranscript.trim();

    if (!name.trim()) {
      setError("Citizen name is required.");
      return;
    }
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    if (!cleanPhone) {
      setError("Phone number is required.");
      return;
    }
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }
    if (!finalMessage) {
      setError("Please record your emergency before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await createEmergency({
        name: name.trim(),
        phone: cleanPhone,
        message: finalMessage,
        language: detectedLangRef.current.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        clientAddress: clientLocationInfo.clientAddress,
        clientArea: clientLocationInfo.clientArea,
        clientCity: clientLocationInfo.clientCity,
        clientLandmark: clientLocationInfo.clientLandmark,
      });

      if (response.success) {
        setResult(response.data);
        setSubmitted(true);
      } else {
        setError("Failed to file emergency report. Please try again.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Network connection failed. Please verify status and retry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewReport = () => {
    setTranscript("");
    setEditedTranscript("");
    setInterimText("");
    transcriptRef.current = "";
    finalizedTranscriptRef.current = "";
    setName("");
    setPhone("");
    setSubmitted(false);
    setResult(null);
    setError("");
    const defaultLang = getBrowserLang();
    setDetectedLang(defaultLang);
    detectedLangRef.current = defaultLang;
  };

  // Success Screen Redesign
  if (submitted && result) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center p-4 relative overflow-hidden font-sans select-none" style={{ background: "#0B1120" }}>
        {/* Decorative Blur Blobs */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Radial masked grid */}
        <div 
          className="absolute inset-0 hero-grid opacity-20 pointer-events-none" 
          style={{
            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
          }}
        />

        <div className="relative w-full max-w-[480px] z-10 animate-fade-in">
          <div className="bg-[#111827] rounded-2xl border border-white/5 shadow-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>

            <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-1.5">
              Incident Dispatch Routed
            </h2>
            <p className="text-xs text-slate-400 mb-6 font-semibold">
              The central AI classified and routed your emergency report to response units.
            </p>

            {/* Core Classification Info */}
            <div className="bg-[#1F2937]/20 rounded-xl border border-white/5 p-5 mb-6 text-left space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department</span>
                <Badge className={`text-[10px] font-bold px-2 py-0.5 border ${
                  result.department === "Police" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  result.department === "Fire Brigade" || result.department === "Fire" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  result.department === "Hospital" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  "bg-white/5 text-slate-400 border-white/10"
                }`} variant="outline">
                  {result.department === "Fire" ? "Fire Brigade" : result.department}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Threat Priority</span>
                <Badge className={`text-[10px] font-bold px-2 py-0.5 border ${
                  result.priority === "Critical" ? "bg-red-500/15 text-red-400 border-red-500/30 animate-pulse" :
                  result.priority === "High" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                  result.priority === "Medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`} variant="outline">
                  {result.priority}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Language</span>
                <span className="text-xs font-bold text-slate-300">{result.language || detectedLang.id}</span>
              </div>
              
              {result.address && (
                <div className="flex items-start justify-between gap-4 pt-2 border-t border-white/[0.04]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mt-0.5">Address</span>
                  <span className="text-xs font-bold text-slate-300 text-right leading-tight">{result.address}</span>
                </div>
              )}
              {result.landmark && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Landmark</span>
                  <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded uppercase tracking-wide">
                    {result.landmark}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-white/[0.04]">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Transcript narrative</span>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold italic">"{result.message}"</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleNewReport}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-10 gap-1.5 border-none transition-all cursor-pointer shadow-lg shadow-blue-500/10"
              >
                <RotateCcw className="h-3.5 w-3.5" /> File New Report
              </Button>
              <Link to="/" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs h-10 gap-1.5 transition-all hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Return Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden font-sans" style={{ background: "#0B1120" }}>
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid background */}
      <div 
        className="absolute inset-0 hero-grid opacity-20 pointer-events-none" 
        style={{
          WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
        }}
      />

      {/* Header Bar */}
      <header className="relative z-20 border-b border-white/5 backdrop-blur-md" style={{ background: "rgba(11,17,32,0.8)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-white/5 border border-white/5 group-hover:border-blue-500/30">
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block leading-tight tracking-wider uppercase">
                Emergency Command
              </span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">
                Citizen Reporting Hub
              </span>
            </div>
          </Link>

          <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[9px] font-bold px-2 py-0.5 animate-pulse uppercase tracking-wider" variant="outline">
            <Phone className="h-2.5 w-2.5 mr-1" />
            Line 112 Active
          </Badge>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wider mb-2 transition-colors">
              <ArrowLeft className="h-3 w-3" /> Back to portal
            </Link>
            <h1 className="text-xl font-bold text-white uppercase tracking-wider">
              Emergency Reporting Console
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Record voice or type details in English, Hindi, or Marathi (automatic localization).
            </p>
          </div>
        </div>

        {/* Not Supported Warning */}
        {!isSupported && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Browser Compatibility Notice</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Native voice streaming is not available on this browser. Chrome or Edge is recommended.
                You can still type details manually in the editor field below.
              </p>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider">{error}</p>
            </div>
          </div>
        )}

        {/* Split Recording & Form Layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Left Column: Recording Engine */}
          <div className="md:col-span-3 space-y-6">
            <div className="bg-[#111827] rounded-xl border border-white/5 p-6 flex flex-col justify-between min-h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-blue-400">1</span>
                  </div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">Voice Capture</h2>
                </div>
                <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-0.5">
                  <Zap className="h-3 w-3 text-blue-400 animate-pulse" />
                  <span className="text-[8px] font-bold text-blue-400 uppercase tracking-wider">{detectedLang.label}</span>
                </div>
              </div>

              {/* Waveform & Ring Mic */}
              <div className="flex flex-col items-center py-6">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!isSupported && !transcript}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                    isRecording
                      ? "bg-red-600/10 hover:bg-red-600/20 border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]"
                      : "bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {isRecording ? (
                    <Square className="h-6 w-6 text-red-500 animate-pulse" />
                  ) : (
                    <Mic className="h-6 w-6 text-blue-400" />
                  )}

                  {isRecording && (
                    <>
                      <span className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-30" />
                      <span className="absolute -inset-2 rounded-full border border-red-400/30 animate-pulse opacity-20" />
                    </>
                  )}
                </button>

                <p className={`mt-4 text-[10px] font-bold uppercase tracking-wider ${isRecording ? "text-red-400" : "text-slate-400"}`}>
                  {isRecording ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      Streaming audio... Tap to stop
                    </span>
                  ) : transcript ? (
                    "Capture complete. Tap to record more"
                  ) : (
                    "Tap mic and dictate statement"
                  )}
                </p>
              </div>

              {/* Real-time transcription */}
              {(transcript || interimText) && (
                <div className="bg-[#1F2937]/15 rounded-lg border border-white/5 p-4 mt-2">
                  <div className="flex items-center gap-1.5 mb-2 text-slate-500">
                    <FileText className="h-3 w-3 shrink-0" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">Live stream transcript</span>
                  </div>
                  <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                    {transcript}
                    {interimText && (
                      <span className="text-slate-500 italic"> {interimText}</span>
                    )}
                  </p>
                </div>
              )}

              {transcript && (
                <div className="flex justify-end mt-3">
                  <button
                    onClick={resetTranscript}
                    className="text-[9px] font-bold text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    <RotateCcw className="h-2.5 w-2.5" /> Clear Narrative
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Statement Review & Contact Info */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Statement Editor */}
            <div className="bg-[#111827] rounded-xl border border-white/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-blue-400">2</span>
                </div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Narrative Editor</h2>
              </div>

              <textarea
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                placeholder="Narrate details above or type statements here..."
                rows={4}
                className="w-full bg-[#1F2937]/20 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none resize-none leading-relaxed transition-all font-semibold"
              />
              <p className="text-[9px] text-slate-500 font-medium mt-1">
                Revise details for accuracy prior to official routing.
              </p>
            </div>

            {/* Contact Details */}
            <div className="bg-[#111827] rounded-xl border border-white/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-blue-400">3</span>
                </div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Citizen Identity</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Caller Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="pl-9 h-9 text-xs bg-[#1F2937]/20 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Contact Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <Input
                      value={phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhone(digits);
                      }}
                      placeholder="10-digit number"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      className={`pl-9 h-9 text-xs bg-[#1F2937]/20 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500 transition-all font-semibold ${
                        phone.length > 0 && phone.length < 10 ? "border-amber-500/50 focus-visible:border-amber-500" : ""
                      } ${
                        phone.length === 10 ? "border-green-500/50 focus-visible:border-green-500" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                onClick={handleSubmit}
                disabled={submitting || (!editedTranscript.trim())}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider h-10 rounded-lg shadow-lg shadow-red-500/10 border-none gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 mt-5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analyzing dispatch...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    File Central Dispatch
                  </>
                )}
              </Button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default VoiceReportPage;
