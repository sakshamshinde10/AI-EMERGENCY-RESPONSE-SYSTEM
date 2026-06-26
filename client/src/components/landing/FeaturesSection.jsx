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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative rounded-xl border border-white/5 bg-[#0A0A0A] p-6 hover:bg-[#0D0D0D] hover:border-white/10 transition-all duration-300 overflow-hidden"
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(to right, transparent, ${feature.color}50, transparent)` }}
                />

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-5 border"
                  style={{ 
                    backgroundColor: `${feature.color}10`, 
                    color: feature.color,
                    borderColor: `${feature.color}25`
                  }}
                >
                  <IconComponent className="h-4.5 w-4.5" />
                </div>

                {/* Content */}
                <h3 className="text-sm font-bold text-white mb-2 transition-colors group-hover:text-[#E8602E]">
                  {feature.title}
                </h3>
                <p className="text-xs text-white/45 leading-relaxed">
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
