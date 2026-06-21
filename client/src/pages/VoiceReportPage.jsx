import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { createEmergency } from "../services/emergencyApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Mic,
  MicOff,
  Square,
  Globe,
  Phone,
  User,
  Send,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Languages,
  Volume2,
  FileText,
  RotateCcw,
} from "lucide-react";

const LANGUAGES = [
  { code: "en-IN", label: "English", flag: "EN", id: "English" },
  { code: "hi-IN", label: "हिन्दी", flag: "HI", id: "Hindi" },
  { code: "mr-IN", label: "मराठी", flag: "MR", id: "Marathi" },
];

const VoiceReportPage = () => {
  // Language
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);

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
    recognition.lang = selectedLang.code;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

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

      // Auto-restart if still recording (handles browser auto-stop)
      if (recognitionRef.current && isRecordingRef.current) {
        try {
          recognitionRef.current.start();
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
  }, [selectedLang]);

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
    if (!phone.trim()) {
      setError("Please enter your phone number.");
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
        phone: phone.trim(),
        message: finalMessage,
        language: selectedLang.id,
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
    setSelectedLang(LANGUAGES[0]);
  };

  // --- SUCCESS SCREEN ---
  if (submitted && result) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#16A34A]/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-8 w-8 text-[#16A34A]" />
            </div>

            <h2 className="text-xl font-extrabold text-[#0F172A] mb-2">
              Emergency Report Filed
            </h2>
            <p className="text-sm text-[#64748B] mb-6">
              Your report has been classified and dispatched to the appropriate department.
            </p>

            {/* Classification Result */}
            <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-5 mb-6 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Department</span>
                <Badge className={`text-xs font-bold px-2.5 py-0.5 ${
                  result.department === "Police" ? "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30" :
                  result.department === "Fire Brigade" ? "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30" :
                  result.department === "Hospital" ? "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/30" :
                  "bg-[#64748B]/10 text-[#64748B] border-[#64748B]/30"
                }`} variant="outline">
                  {result.department}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Priority</span>
                <Badge className={`text-xs font-bold px-2.5 py-0.5 ${
                  result.priority === "Critical" ? "bg-red-600/10 text-red-600 border-red-600/30" :
                  result.priority === "High" ? "bg-orange-500/10 text-orange-500 border-orange-500/30" :
                  result.priority === "Medium" ? "bg-amber-500/10 text-amber-500 border-amber-500/30" :
                  "bg-blue-600/10 text-blue-600 border-blue-600/30"
                }`} variant="outline">
                  {result.priority}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Language</span>
                <span className="text-xs font-semibold text-[#0F172A]">{result.language || selectedLang.id}</span>
              </div>
              {result.address && (
                <div className="flex items-start justify-between gap-4 pt-1 border-t border-[#E2E8F0]/40">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider shrink-0 mt-0.5">Address</span>
                  <span className="text-xs font-semibold text-[#0F172A] text-right">{result.address}</span>
                </div>
              )}
              {result.landmark && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Landmark</span>
                  <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-md">{result.landmark}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1.5">Transcript</span>
                <p className="text-xs text-[#475569] leading-relaxed">{result.message}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleNewReport}
                className="flex-1 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs h-10 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> File Another Report
              </Button>
              <Link to="/" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-[#E2E8F0] text-[#475569] font-bold text-xs h-10 gap-1.5"
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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header Bar */}
      <header className="bg-[#0F172A] border-b border-[#1E293B]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block leading-tight">
                Emergency Command
              </span>
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">
                Voice Report System
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Badge className="bg-red-600/20 text-red-400 border-red-600/40 text-[10px] font-bold px-2 py-0.5 animate-pulse" variant="outline">
              <Phone className="h-3 w-3 mr-1" />
              112
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight mb-2">
            Report an Emergency
          </h1>
          <p className="text-sm text-[#64748B] leading-relaxed">
            Speak your emergency in English, Hindi, or Marathi. Our AI will classify and dispatch it to the right department.
          </p>
        </div>

        {/* Unsupported Browser Warning */}
        {!isSupported && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800 mb-1">Browser Not Supported</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Voice recognition requires Chrome, Edge, or a Chromium-based browser.
                You can still type your emergency in the transcript field below.
              </p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* ── STEP 1: Language Selection ── */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-[#0F172A] flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">1</span>
              </div>
              <h2 className="text-sm font-bold text-[#0F172A]">Select Language</h2>
              <Languages className="h-4 w-4 text-[#94A3B8] ml-1" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    if (isRecording) stopRecording();
                    setSelectedLang(lang);
                  }}
                  className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedLang.code === lang.code
                      ? "border-[#2563EB] bg-[#2563EB]/5 shadow-sm"
                      : "border-[#E2E8F0] bg-[#FAFBFC] hover:border-[#CBD5E1] hover:bg-white"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                    selectedLang.code === lang.code
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#F1F5F9] text-[#64748B]"
                  }`}>
                    {lang.flag}
                  </div>
                  <span className={`text-xs font-bold ${
                    selectedLang.code === lang.code ? "text-[#2563EB]" : "text-[#475569]"
                  }`}>
                    {lang.label}
                  </span>
                  {selectedLang.code === lang.code && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#2563EB]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── STEP 2: Voice Recording ── */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-[#0F172A] flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">2</span>
              </div>
              <h2 className="text-sm font-bold text-[#0F172A]">Record Your Emergency</h2>
              <Volume2 className="h-4 w-4 text-[#94A3B8] ml-1" />
            </div>

            {/* Recording Controls */}
            <div className="flex flex-col items-center py-6">
              {/* Mic Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!isSupported && !transcript}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isRecording
                    ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30"
                    : "bg-[#0F172A] hover:bg-[#1E293B] shadow-lg shadow-[#0F172A]/20"
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
                    <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-30" />
                    <span className="absolute -inset-2 rounded-full border border-red-300 animate-pulse opacity-20" />
                  </>
                )}
              </button>

              <p className={`mt-4 text-xs font-bold ${isRecording ? "text-red-600" : "text-[#64748B]"}`}>
                {isRecording ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Recording in {selectedLang.label}... Tap to stop
                  </span>
                ) : transcript ? (
                  "Tap to record more"
                ) : (
                  "Tap to start recording"
                )}
              </p>
            </div>

            {/* Live Transcript Display */}
            {(transcript || interimText) && (
              <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-4 mt-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <FileText className="h-3 w-3 text-[#94A3B8]" />
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Live Transcript</span>
                </div>
                <p className="text-sm text-[#0F172A] leading-relaxed">
                  {transcript}
                  {interimText && (
                    <span className="text-[#94A3B8] italic"> {interimText}</span>
                  )}
                </p>
              </div>
            )}

            {transcript && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={resetTranscript}
                  className="text-[10px] font-bold text-[#94A3B8] hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" /> Clear transcript
                </button>
              </div>
            )}
          </div>

          {/* ── STEP 3: Review & Edit ── */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-[#0F172A] flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">3</span>
              </div>
              <h2 className="text-sm font-bold text-[#0F172A]">Review & Edit Transcript</h2>
            </div>

            <textarea
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              placeholder={
                selectedLang.code === "hi-IN"
                  ? "यहाँ अपनी आपातकालीन स्थिति टाइप करें या ऊपर रिकॉर्ड करें..."
                  : selectedLang.code === "mr-IN"
                  ? "तुमची आणीबाणी येथे टाइप करा किंवा वर रेकॉर्ड करा..."
                  : "Type your emergency here or record it above..."
              }
              rows={4}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-sm text-[#0F172A] placeholder:text-[#CBD5E1] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none resize-none leading-relaxed"
            />
            <p className="text-[10px] text-[#94A3B8] mt-1.5">
              You can edit the transcript to correct any errors before submitting.
            </p>
          </div>

          {/* ── STEP 4: Contact Info & Submit ── */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-[#0F172A] flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">4</span>
              </div>
              <h2 className="text-sm font-bold text-[#0F172A]">Contact Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="pl-9 h-10 text-sm bg-[#F8FAFC] border-[#E2E8F0] focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    type="tel"
                    className="pl-9 h-10 text-sm bg-[#F8FAFC] border-[#E2E8F0] focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitting || (!editedTranscript.trim())}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm h-12 rounded-xl shadow-sm shadow-red-600/20 gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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

            <p className="text-[10px] text-center text-[#94A3B8] mt-3">
              Your report will be classified by AI and dispatched to the appropriate emergency department in real time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceReportPage;
