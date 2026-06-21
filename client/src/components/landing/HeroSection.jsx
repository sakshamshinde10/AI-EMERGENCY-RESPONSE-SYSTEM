import { Link } from 'react-router-dom';
import { Shield, ArrowRight, ChevronDown, Mic } from 'lucide-react';

const HeroSection = () => {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0F172A]"
    >
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 hero-grid opacity-30" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32 pb-24">
        {/* Government Badge */}
        <div className="animate-fade-in-down inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-white/5 border border-white/10 mb-8 shadow-sm">
          <Shield className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            National Public Safety & Command Operations
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
          AI Emergency Response System
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-in-up delay-100 text-lg sm:text-xl font-medium text-slate-300 mb-6 max-w-3xl mx-auto leading-relaxed">
          Intelligent Emergency Detection, Classification and Real-Time Dispatch Platform
        </p>

        {/* Description */}
        <p className="animate-fade-in-up delay-200 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          A centralized emergency management system that automatically analyzes emergency reports, 
          routes incidents to the correct department, and enables real-time response coordination.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/report-emergency"
            id="hero-report-btn"
            className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-white rounded-lg bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Mic className="h-4 w-4" />
            <span>Report Emergency</span>
          </Link>

          <a
            href="#how-it-works"
            className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-slate-200 hover:text-white rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Learn More</span>
            <ChevronDown className="h-4 w-4" />
          </a>

          <Link
            to="/login"
            id="hero-login-btn"
            className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-white rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md shadow-[#2563EB]/20 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Department Login</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="animate-fade-in delay-500 mt-20">
          <a href="#how-it-works" className="inline-flex flex-col items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors">
            <span className="text-[10px] font-bold tracking-widest uppercase">Explore Operations</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </a>
        </div>
      </div>

      {/* Bottom edge — clean dark cutoff */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[#1E293B]" />
    </section>
  );
};

export default HeroSection;
