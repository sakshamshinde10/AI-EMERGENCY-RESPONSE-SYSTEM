import React from "react";
import { Zap, Loader2 } from "lucide-react";

const PageLoadingFallback = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans"
      style={{ background: "#0B1120" }}
    >
      {/* Decorative ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        {/* Brand Icon with Pulse */}
        <div
          className="size-12 rounded-2xl flex items-center justify-center border shadow-xl relative"
          style={{
            background: "rgba(59,130,246,0.1)",
            borderColor: "rgba(59,130,246,0.25)",
            color: "#3B82F6",
          }}
        >
          <Zap className="size-6 animate-pulse" />
          <span className="absolute -inset-1 rounded-2xl border border-blue-500/20 animate-ping" />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <h2 className="text-sm font-bold text-white tracking-widest uppercase">
            EMERGENCY COMMAND HQ
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="size-3.5 animate-spin text-blue-500" />
            <span>Initializing secure operational link...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLoadingFallback;
