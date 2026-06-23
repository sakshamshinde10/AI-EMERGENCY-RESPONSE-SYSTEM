import { Brain, RefreshCw, Send, BarChart3, Clock, Lock } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Classification',
    description: 'Automatically detects incident type, intent, and threat severity using advanced LLM classification systems.',
    color: '#E8602E', // Orange
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Telemetry',
    description: 'Instant status changes and alert propagation powered by Socket.io connections for low latency command feedback.',
    color: '#3B82F6', // Blue
  },
  {
    icon: Send,
    title: 'Multi-Department Dispatch',
    description: 'Automated routing to Police, Fire Brigade, or Hospital response units based on intelligent classification recommendations.',
    color: '#10B981', // Green
  },
  {
    icon: BarChart3,
    title: 'Emergency Analytics',
    description: 'Centralized command center oversight with telemetry logs, weekly volume trends, and priority distribution metrics.',
    color: '#EF4444', // Red
  },
  {
    icon: Clock,
    title: 'Incident Lifecycle Tracking',
    description: 'Track responders as they update status in real-time from initial Pending queue to In Progress and Resolved scene.',
    color: '#8B5CF6', // Purple
  },
  {
    icon: Lock,
    title: 'Secure Department Access',
    description: 'Role-based access control (RBAC) separating department-specific dashboards, backed by JWT validation.',
    color: '#6B7280', // Grey
  },
];

const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="py-28 bg-[#000000] relative"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-[#E8602E]/2 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-[#E8602E] uppercase tracking-widest mb-4">
            System Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Command Center Features
          </h2>
          <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed">
            Engineered with modern, secure, and resilient technology for mission-critical response coordination.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-white/5 bg-[#0B0B0B] p-8 hover:bg-[#0E0E0E] hover:border-white/10 transition-all duration-300 hover:shadow-[0_0_35px_rgba(255,255,255,0.02)]"
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-105 border border-white/10"
                  style={{ 
                    backgroundColor: `${feature.color}10`, 
                    color: feature.color,
                    boxShadow: `0 0 15px ${feature.color}15`
                  }}
                >
                  <IconComponent className="h-5 w-5" />
                </div>

                {/* Content */}
                <h3 className="text-sm font-bold text-white mb-2.5 transition-colors group-hover:text-[#E8602E]">
                  {feature.title}
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
