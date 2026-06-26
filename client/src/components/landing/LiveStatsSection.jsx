import { useEffect, useState } from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { Shield, Flame, Activity, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

const StatCard = ({ IconComponent, label, value, color, delay, isVisible }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const end = value;
    const duration = 1400;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, value]);

  return (
    <div
      className={`group relative rounded-xl p-5 transition-all duration-500 bg-[#0A0A0A] border border-white/5 hover:border-white/10 ${
        isVisible ? 'animate-fade-in-up' : 'opacity-0'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px rounded-t-xl"
        style={{ background: `linear-gradient(to right, transparent, ${color}60, transparent)` }}
      />

      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center border shrink-0"
          style={{ color, backgroundColor: `${color}10`, borderColor: `${color}25` }}
        >
          <IconComponent className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">{label}</p>
          <p className="text-2xl font-extrabold tracking-tight text-white">
            {displayValue.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

const LiveStatsSection = () => {
  const [ref, isVisible] = useScrollAnimation();

  const departmentStats = [
    { IconComponent: Shield, label: 'Police Cases Assigned', value: 1247, color: '#3b82f6' },
    { IconComponent: Flame, label: 'Fire Incident Records', value: 389, color: '#ef4444' },
    { IconComponent: Activity, label: 'Hospital Triage Cases', value: 892, color: '#10b981' },
  ];

  const statusStats = [
    { IconComponent: AlertTriangle, label: 'Pending Dispatch Verification', value: 156, color: '#f59e0b' },
    { IconComponent: Clock, label: 'Active Response In Progress', value: 234, color: '#3b82f6' },
    { IconComponent: CheckCircle2, label: 'Successfully Mitigated & Closed', value: 2138, color: '#10b981' },
  ];

  return (
    <section
      id="stats"
      ref={ref}
      className="py-28 bg-[#030303] border-y border-white/5 relative"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232,96,46,0.025)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4"
            style={{
              background: 'rgba(232,96,46,0.08)',
              color: '#E8602E',
              border: '1px solid rgba(232,96,46,0.15)',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
            Live Command Statistics
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 text-white tracking-tight">
            Real-Time Response Telemetry
          </h2>
          <p className="text-sm max-w-xl mx-auto text-white/50 leading-relaxed">
            Monitor emergency response metrics and priority resolution cases across municipal command systems.
          </p>
        </div>

        {/* Row labels */}
        <div className={`mb-3 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">By Department</span>
        </div>

        {/* Department Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {departmentStats.map((stat, i) => (
            <StatCard
              key={stat.label}
              {...stat}
              delay={i * 100}
              isVisible={isVisible}
            />
          ))}
        </div>

        {/* Row label */}
        <div className={`mb-3 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">By Status</span>
        </div>

        {/* Status Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statusStats.map((stat, i) => (
            <StatCard
              key={stat.label}
              {...stat}
              delay={(i + 3) * 100}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveStatsSection;
