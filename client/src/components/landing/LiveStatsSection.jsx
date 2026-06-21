import { useEffect, useState } from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const StatCard = ({ icon, label, value, color, colorBg, delay, isVisible }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const end = value;
    const duration = 1500;
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
      className={`group relative rounded-2xl p-6 transition-all duration-500 hover:scale-105 hover:-translate-y-1 ${
        isVisible ? 'animate-fade-in-up' : 'opacity-0'
      }`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: `0 4px 24px var(--shadow-color)`,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Accent top bar */}
      <div
        className="absolute top-0 left-6 right-6 h-1 rounded-b-full transition-all duration-300 group-hover:left-4 group-hover:right-4"
        style={{ background: color }}
      />

      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ background: colorBg }}
        >
          {icon}
        </div>
        <div>
          <p
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </p>
          <p
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {displayValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: `0 8px 40px ${color}20`,
        }}
      />
    </div>
  );
};

const LiveStatsSection = () => {
  const [ref, isVisible] = useScrollAnimation();

  // Simulated live data — in production, connect to your Socket.io backend
  const departmentStats = [
    { icon: '🚓', label: 'Police Cases', value: 1247, color: '#3b82f6', colorBg: 'rgba(59,130,246,0.1)' },
    { icon: '🚒', label: 'Fire Cases', value: 389, color: '#ef4444', colorBg: 'rgba(239,68,68,0.1)' },
    { icon: '🏥', label: 'Hospital Cases', value: 892, color: '#10b981', colorBg: 'rgba(16,185,129,0.1)' },
  ];

  const statusStats = [
    { icon: '🟡', label: 'Pending Cases', value: 156, color: '#f59e0b', colorBg: 'rgba(245,158,11,0.1)' },
    { icon: '🔵', label: 'In Progress Cases', value: 234, color: '#3b82f6', colorBg: 'rgba(59,130,246,0.1)' },
    { icon: '🟢', label: 'Resolved Cases', value: 2138, color: '#10b981', colorBg: 'rgba(16,185,129,0.1)' },
  ];

  return (
    <section
      id="stats"
      ref={ref}
      className="py-24 transition-theme"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
            style={{
              background: 'rgba(59,130,246,0.1)',
              color: '#3b82f6',
              border: '1px solid rgba(59,130,246,0.2)',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            Live Statistics
          </div>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Real-Time Emergency Data
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Monitor emergency response metrics across all departments in real-time
          </p>
        </div>

        {/* Department Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {departmentStats.map((stat, i) => (
            <StatCard
              key={stat.label}
              {...stat}
              delay={i * 150}
              isVisible={isVisible}
            />
          ))}
        </div>

        {/* Status Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statusStats.map((stat, i) => (
            <StatCard
              key={stat.label}
              {...stat}
              delay={(i + 3) * 150}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveStatsSection;
