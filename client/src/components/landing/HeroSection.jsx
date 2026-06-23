import { Link } from 'react-router-dom';
import { Shield, ArrowRight, ChevronDown, Mic } from 'lucide-react';

const HeroSection = () => {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-28"
    >
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#E8602E]/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />

      {/* Grid background with radial mask */}
      <div 
        className="absolute inset-0 hero-grid opacity-40 pointer-events-none" 
        style={{
          WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
          maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* Active Command Badge */}
        <div className="animate-fade-in-down inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">
            Tactical Operations System &bull; Active
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-8 leading-[1.1] text-balance">
          Seconds Save Lives.<br />
          <span className="bg-gradient-to-r from-[#E8602E] to-[#F18861] bg-clip-text text-transparent">
            AI-Driven
          </span> Emergency Command.
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-in-up delay-100 text-base sm:text-lg md:text-xl font-medium text-white/60 mb-8 max-w-3xl mx-auto leading-relaxed text-balance">
          Centralized intelligent incident detection, automated multi-department classification, and real-time emergency dispatch telemetry.
        </p>

        {/* Description */}
        <p className="animate-fade-in-up delay-200 text-xs sm:text-sm text-white/40 max-w-2xl mx-auto mb-12 leading-relaxed">
          Integrated with Exotel voicebot streams and Socket.io channels to bridge the gap between citizens in need and emergency response units within milliseconds.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/report-emergency"
            id="hero-report-btn"
            className="w-full sm:w-auto px-8 py-3.5 text-xs font-bold text-white rounded-xl bg-[#E8602E] hover:bg-[#D74E1D] hover:shadow-[0_0px_45px_6px_rgba(232,96,46,0.55)] transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
          >
            <Mic className="h-4 w-4" />
            <span>Report Emergency</span>
          </Link>

          <Link
            to="/login"
            id="hero-login-btn"
            className="w-full sm:w-auto px-8 py-3.5 text-xs font-bold text-white rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Department Login</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <a
            href="#how-it-works"
            className="w-full sm:w-auto px-6 py-3.5 text-xs font-bold text-white/60 hover:text-white transition-all flex items-center justify-center gap-1.5"
          >
            <span>Explore Flow</span>
            <ChevronDown className="h-4 w-4" />
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="animate-fade-in delay-500 mt-20">
          <a href="#how-it-works" className="inline-flex flex-col items-center gap-2 text-white/30 hover:text-white/60 transition-colors">
            <span className="text-[10px] font-bold tracking-widest uppercase">Learn How It Works</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-[#E8602E]" />
          </a>
        </div>
      </div>

      {/* Bottom edge — subtle dark border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5" />
    </section>
  );
};

export default HeroSection;
