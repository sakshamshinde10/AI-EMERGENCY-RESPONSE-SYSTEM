import { useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Phone, Play, Clock, CheckCircle2, AlertTriangle, Heart } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import WarpText from '../ui/WarpText';

const RadarGlobe = lazy(() => import('./RadarGlobe'));

const HeroSection = () => {
  const containerRef = useRef(null);
  const reportBtnRef = useRef(null);
  const exploreBtnRef = useRef(null);

  // GSAP Entrance Animations
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1 } });
    
    tl.fromTo('.hero-anim-badge', 
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, delay: 0.2 }
    )
    .fromTo('.hero-anim-title',
      { opacity: 0, y: 35 },
      { opacity: 1, y: 0 },
      '-=0.75'
    )
    .fromTo('.hero-anim-desc',
      { opacity: 0, y: 20 },
      { opacity: 0.6, y: 0 },
      '-=0.75'
    )
    .fromTo('.hero-anim-ctas',
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0 },
      '-=0.75'
    )
    .fromTo('.hero-anim-globe',
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 1.5 },
      '-=0.75'
    );
  }, { scope: containerRef });

  // Magnetic button effects using contextSafe
  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleMagneticMove = contextSafe((e, btnRef) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(btn, {
      x: x * 0.35,
      y: y * 0.35,
      duration: 0.3,
      ease: 'power2.out',
    });
  });

  const handleMagneticLeave = contextSafe((btnRef) => {
    const btn = btnRef.current;
    if (!btn) return;
    gsap.to(btn, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: 'elastic.out(1, 0.4)',
    });
  });

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#020205] pt-28 pb-10"
      style={{
        backgroundImage: "linear-gradient(to bottom, rgba(2, 2, 5, 0.5), rgba(2, 2, 5, 0.95)), url('https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1920&auto=format&fit=crop')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Background dot matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Cybernetic grid lines (subtle telemetry background) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] border border-white/[0.015] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] border border-white/[0.025] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-white/[0.035] rounded-full pointer-events-none" />

      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E8602E]/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-blue-600/[0.02] rounded-full blur-[130px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[calc(100vh-7rem)]">
        {/* Left Information Column */}
        <div className="lg:col-span-5 flex flex-col items-start text-left">
          {/* Tactical System Status Badge */}
          <div className="hero-anim-badge opacity-0 inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/5 bg-white/[0.02] mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest font-sans">
              SYSTEM STATUS: ALL SYSTEMS OPERATIONAL
            </span>
          </div>

          {/* Headline - Every Second Counts with WarpText */}
          <div className="hero-anim-title opacity-0 w-full mb-6 max-w-xl">
            <WarpText
              text={"Every\nSecond\nCounts."}
              color={['#ffffff', '#ffffff', '#E8602E']}
              align="left"
              fontFamily="Inter, sans-serif"
              fontSize="clamp(3.5rem, 6.5vw, 6.2rem)"
              fontWeight={900}
              letterSpacing="-0.04em"
              lineHeight={0.92}
              warpStrength={0.08}
              warpScale={1.7}
              speed={0.55}
              pointerInfluence={0.42}
              pointerStrength={0.38}
              refraction={0.018}
              ripple
              className="h-[220px] sm:h-[270px] lg:h-[310px] w-full"
            />
          </div>

          {/* Description */}
          <p className="hero-anim-desc opacity-0 text-[15px] text-white/50 mb-9 max-w-lg leading-relaxed font-sans font-medium">
            AI-powered emergency management that detects, analyzes, and dispatches help faster than ever. One platform. Every response.
          </p>

          {/* CTA Action Buttons */}
          <div className="hero-anim-ctas opacity-0 flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto mb-10">
            <Link
              to="/report-emergency"
              id="hero-report-btn"
              ref={reportBtnRef}
              onMouseMove={(e) => handleMagneticMove(e, reportBtnRef)}
              onMouseLeave={() => handleMagneticLeave(reportBtnRef)}
              className="w-full sm:w-auto px-7 py-3.5 text-xs font-bold text-white rounded-xl bg-[#E8602E] hover:bg-[#D74E1D] transition-colors flex items-center justify-center gap-2 select-none shadow-[0_4px_20px_rgba(232,96,46,0.15)]"
            >
              <Phone className="h-3.5 w-3.5 fill-white text-transparent" />
              <span>Report an Emergency</span>
            </Link>

            <Link
              to="/login"
              id="hero-login-btn"
              ref={exploreBtnRef}
              onMouseMove={(e) => handleMagneticMove(e, exploreBtnRef)}
              onMouseLeave={() => handleMagneticLeave(exploreBtnRef)}
              className="w-full sm:w-auto px-7 py-3.5 text-xs font-bold text-white rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.07] hover:border-white/20 transition-all flex items-center justify-center gap-2 select-none"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mini Stats Row */}
          <div className="pt-8 border-t border-white/5 grid grid-cols-3 gap-8 w-full max-w-xs">
            {[
              { value: '3', label: 'Departments' },
              { value: '<2min', label: 'Avg Response' },
              { value: '97.4%', label: 'AI Accuracy' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xl font-extrabold text-white font-sans leading-none">{s.value}</p>
                <p className="text-[9px] font-bold text-white/35 uppercase tracking-wider mt-1 font-sans">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Globe Column */}
        <div className="lg:col-span-7 flex justify-center items-center relative hero-anim-globe opacity-0 select-none">
          <Suspense fallback={<div className="w-[300px] h-[300px] sm:w-[450px] sm:h-[450px]" />}>
            <RadarGlobe />
          </Suspense>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
