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

// Detect Devanagari script (Hindi + Marathi)
const hasDevanagari = (text) => /[\u0900-\u097F]/.test(text);

// Map browser locale → Web Speech API lang code
const getBrowserLang = () => {
  const nav = navigator.language || navigator.userLanguage || "en";
  if (nav.startsWith("hi")) return { code: "hi-IN", label: "हिन्दी", id: "Hindi" };
  if (nav.startsWith("mr")) return { code: "mr-IN", label: "मराठी", id: "Marathi" };
  return { code: "en-IN", label: "English", id: "English" };
};

const VoiceReportPage = () => {
  // Auto-detected language
  const [detectedLang, setDetectedLang] = useState(getBrowserLang());
  const detectedLangRef = useRef(getBrowserLang());

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isSupported, setIsSupported] = useState(true);

  // Form
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

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const transcriptRef = useRef("");
  const finalizedTranscriptRef = useRef("");

  // Keep isRecordingRef in sync with isRecording state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Keep transcriptRef in sync with transcript state
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Reverse Geocoding helper using OpenStreetMap Nominatim API
  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`
      );
      if (!res.ok) throw new Error("Nominatim request failed");
      const data = await res.json();
      if (!data) return null;

      const addressDetails = data.address || {};

      // Landmark matching
      const landmark =
        addressDetails.building ||
        addressDetails.amenity ||
        addressDetails.shop ||
        addressDetails.tourism ||
        addressDetails.historic ||
        addressDetails.office ||
        addressDetails.leisure ||
        "";

      // Area matching
      const area =
        addressDetails.neighbourhood ||
        addressDetails.suburb ||
        addressDetails.road ||
        addressDetails.residential ||
        "";

      // City matching
      const city =
        addressDetails.city ||
        addressDetails.town ||
        addressDetails.village ||
        addressDetails.county ||
        "";

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

  // Check browser support and fetch GPS coordinates + reverse geocode
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setCoords({
            latitude: lat,
            longitude: lon,
          });

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

  // Sync transcript to editable field
  useEffect(() => {
    setEditedTranscript(transcript);
  }, [transcript]);

  const startRecording = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
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

      // Auto-detect language from script on first speech chunk
      const sampleText = sessionFinal || interim;
      if (!langSwitched && sampleText.trim().length > 2) {
        langSwitched = true;
        if (hasDevanagari(sampleText)) {
          // Devanagari detected — check if it's Marathi or Hindi
          // Marathi marker words (basic heuristic)
          const isMrHint = /माझ|आहे|आग|मी|होत|कर|आम्ही|झाल/.test(sampleText);
          const newLang = isMrHint
            ? { code: "mr-IN", label: "मराठी", id: "Marathi" }
            : { code: "hi-IN", label: "हिन्दी", id: "Hindi" };
          if (detectedLangRef.current.code !== newLang.code) {
            detectedLangRef.current = newLang;
            setDetectedLang(newLang);
            // Restart recognition with correct lang for next chunks
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
        setError("Microphone access denied. Please allow microphone access in your browser settings.");
        setIsRecording(false);
        isRecordingRef.current = false;
      } else if (event.error === "no-speech") {
        console.log("No speech detected. Web Speech API paused/silent.");
      } else {
        setError(`Voice recognition error: ${event.error}. Please try again.`);
        setIsRecording(false);
        isRecordingRef.current = false;
      }
    };

    recognition.onend = () => {
      // Save the accumulated text from this session
      finalizedTranscriptRef.current = transcriptRef.current;

      // Auto-restart with updated lang if still recording
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
      setError("Failed to start voice recognition. Please try again.");
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent auto-restart
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
      setError("Please enter your name.");
      return;
    }
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    if (!cleanPhone) {
      setError("Please enter your phone number.");
      return;
    }
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }
    if (!finalMessage) {
      setError("No transcript to submit. Please record your emergency.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await createEmergency({
        name: name.trim(),
        phone: phone.replace(/[\s\-\(\)]/g, ""),
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
        setError("Failed to submit emergency. Please try again.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Network error. Please check your connection and try again.");
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

  // --- SUCCESS SCREEN ---
  if (submitted && result) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#E8602E] selection:text-white">
        {/* Decorative Blur Blobs */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#E8602E]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Grid background with radial mask */}
        <div 
          className="absolute inset-0 hero-grid opacity-30 pointer-events-none" 
          style={{
            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
          }}
        />

        <div className="relative w-full max-w-lg z-10">
          <div className="bg-[#0B0B0B]/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>

            <h2 className="text-xl font-extrabold text-white mb-2">
              Emergency Report Filed
            </h2>
            <p className="text-sm text-white/60 mb-6">
              Your report has been classified and dispatched to the appropriate department.
            </p>

            {/* Classification Result */}
            <div className="bg-white/5 rounded-xl border border-white/5 p-5 mb-6 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Department</span>
                <Badge className={`text-xs font-bold px-2.5 py-0.5 border ${
                  result.department === "Police" ? "bg-blue-600/20 text-blue-400 border-blue-500/30" :
                  result.department === "Fire Brigade" ? "bg-red-600/20 text-red-400 border-red-500/30" :
                  result.department === "Hospital" ? "bg-green-600/20 text-green-400 border-green-500/30" :
                  "bg-white/10 text-white/70 border-white/20"
                }`} variant="outline">
                  {result.department}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Priority</span>
                <Badge className={`text-xs font-bold px-2.5 py-0.5 border ${
                  result.priority === "Critical" ? "bg-red-600/20 text-red-400 border-red-500/30 animate-pulse" :
                  result.priority === "High" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                  result.priority === "Medium" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                  "bg-blue-600/20 text-blue-400 border-blue-500/30"
                }`} variant="outline">
                  {result.priority}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Language</span>
                <span className="text-xs font-semibold text-white/90">{result.language || detectedLang.id}</span>
              </div>
              {result.address && (
                <div className="flex items-start justify-between gap-4 pt-1.5 border-t border-white/5">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider shrink-0 mt-0.5">Address</span>
                  <span className="text-xs font-semibold text-white/90 text-right">{result.address}</span>
                </div>
              )}
              {result.landmark && (
                <div className="flex items-center justify-between pt-1.5">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Landmark</span>
                  <span className="text-xs font-semibold text-purple-400 bg-purple-950/30 border border-purple-800/20 px-1.5 py-0.5 rounded-md">{result.landmark}</span>
                </div>
              )}
              <div className="pt-2.5 border-t border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Transcript</span>
                <p className="text-xs text-white/70 leading-relaxed">{result.message}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleNewReport}
                className="flex-1 bg-[#E8602E] hover:bg-[#D74E1D] hover:shadow-[0_0_20px_rgba(232,96,46,0.4)] text-white font-bold text-xs h-10 gap-1.5 border-none transition-all cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> File Another Report
              </Button>
              <Link to="/" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white/90 font-bold text-xs h-10 gap-1.5 transition-all text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN FORM ---
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans selection:bg-[#E8602E] selection:text-white">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#E8602E]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid background with radial mask */}
      <div 
        className="absolute inset-0 hero-grid opacity-30 pointer-events-none" 
        style={{
          WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
        }}
      />

      {/* Header Bar */}
      <header className="relative z-20 bg-black/70 border-b border-white/10 backdrop-blur-md shadow-lg shadow-black/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-white/5 border border-white/10 group-hover:border-[#E8602E]/50 group-hover:shadow-[0_0_15px_rgba(232,96,46,0.3)]">
              <Shield className="h-4 w-4 text-[#E8602E]" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block leading-tight group-hover:text-[#E8602E] transition-colors">
                Emergency Command
              </span>
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider block">
                Voice Report System
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] font-bold px-2 py-0.5 animate-pulse" variant="outline">
              <Phone className="h-3 w-3 mr-1" />
              112
            </Badge>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
            Report an Emergency
          </h1>
          <p className="text-sm text-white/60 leading-relaxed">
            Speak naturally in <strong>English, Hindi, or Marathi</strong> — language is detected automatically.
          </p>
        </div>

        {/* Unsupported Browser Warning */}
        {!isSupported && (
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-400 mb-1">Browser Not Supported</p>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                Voice recognition requires Chrome, Edge, or a Chromium-based browser.
                You can still type your emergency in the transcript field below.
              </p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* ── STEP 1: Voice Recording ── */}
          <div className="bg-[#0B0B0B]/85 backdrop-blur-md rounded-xl border border-white/5 p-6 hover:border-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#E8602E] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">1</span>
                </div>
                <h2 className="text-sm font-bold text-white">Record Your Emergency</h2>
                <Volume2 className="h-4 w-4 text-white/40" />
              </div>
              {/* Auto-detected language badge */}
              <div className="flex items-center gap-1.5 bg-[#E8602E]/10 border border-[#E8602E]/30 rounded-lg px-2.5 py-1">
                <Zap className="h-3 w-3 text-[#E8602E]" />
                <span className="text-[10px] font-bold text-[#E8602E] uppercase tracking-wide">Auto</span>
                <span className="text-[10px] font-semibold text-white/90">{detectedLang.label}</span>
              </div>
            </div>

            {/* Recording Controls */}
            <div className="flex flex-col items-center py-6">
              {/* Mic Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!isSupported && !transcript}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isRecording
                    ? "bg-red-600 hover:bg-red-700 shadow-[0_0_25px_rgba(220,38,38,0.5)]"
                    : "bg-[#E8602E] hover:bg-[#D74E1D] shadow-[0_0_25px_rgba(232,96,46,0.4)]"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isRecording ? (
                  <Square className="h-7 w-7 text-white" />
                ) : (
                  <Mic className="h-8 w-8 text-white" />
                )}

                {/* Pulse rings */}
                {isRecording && (
                  <>
                    <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-35" />
                    <span className="absolute -inset-2 rounded-full border border-red-300 animate-pulse opacity-25" />
                  </>
                )}
              </button>

              <p className={`mt-4 text-xs font-bold ${isRecording ? "text-red-400" : "text-white/60"}`}>
                {isRecording ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Listening in {detectedLang.label}... Tap to stop
                  </span>
                ) : transcript ? (
                  "Tap to record more"
                ) : (
                  "Tap mic and speak in any language"
                )}
              </p>
            </div>

            {/* Live Transcript Display */}
            {(transcript || interimText) && (
              <div className="bg-white/5 rounded-lg border border-white/5 p-4 mt-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <FileText className="h-3 w-3 text-white/40" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Live Transcript</span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                  {transcript}
                  {interimText && (
                    <span className="text-white/40 italic"> {interimText}</span>
                  )}
                </p>
              </div>
            )}

            {transcript && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={resetTranscript}
                  className="text-[10px] font-bold text-white/40 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" /> Clear transcript
                </button>
              </div>
            )}
          </div>

          {/* ── STEP 2: Review & Edit ── */}
          <div className="bg-[#0B0B0B]/85 backdrop-blur-md rounded-xl border border-white/5 p-6 hover:border-white/10 transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-[#E8602E] flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">2</span>
              </div>
              <h2 className="text-sm font-bold text-white">Review & Edit Transcript</h2>
            </div>

            <textarea
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              placeholder="Type your emergency here or record it above..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/20 focus:border-[#E8602E]/60 focus:ring-1 focus:ring-[#E8602E]/30 outline-none resize-none leading-relaxed transition-all"
            />
            <p className="text-[10px] text-white/40 mt-1.5">
              You can edit the transcript to correct any errors before submitting.
            </p>
          </div>

          {/* ── STEP 3: Contact Info & Submit ── */}
          <div className="bg-[#0B0B0B]/85 backdrop-blur-md rounded-xl border border-white/5 p-6 hover:border-white/10 transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-[#E8602E] flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">3</span>
              </div>
              <h2 className="text-sm font-bold text-white">Contact Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="pl-9 h-10 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#E8602E] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#E8602E] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1.5">
                  Phone Number * <span className="normal-case text-white/20 font-normal">(10 digits)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    value={phone}
                    onChange={(e) => {
                      // Only allow digits, max 10
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhone(digits);
                    }}
                    placeholder="10-digit mobile number"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className={`pl-9 h-10 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#E8602E] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#E8602E] transition-all ${
                      phone.length > 0 && phone.length < 10 ? "border-amber-500/50 focus-visible:border-amber-500" : ""
                    } ${
                      phone.length === 10 ? "border-green-500/50 focus-visible:border-green-500" : ""
                    }`}
                  />
                  {phone.length > 0 && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold ${
                      phone.length === 10 ? "text-green-500" : "text-amber-500"
                    }`}>
                      {phone.length}/10
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitting || (!editedTranscript.trim())}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm h-12 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] border-none gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Classifying & Dispatching...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Emergency Report
                </>
              )}
            </Button>

            <p className="text-[10px] text-center text-white/40 mt-3">
              Your report will be classified by AI and dispatched to the appropriate emergency department in real time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceReportPage;
