import { Brain, RefreshCw, Send, BarChart3, Clock, Lock } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Classification',
    description: 'Automatically detects incident type, intent, and threat severity using advanced LLM classification systems.',
    color: '#0F172A',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Telemetry',
    description: 'Instant status changes and alert propagation powered by Socket.io connections for low latency command feedback.',
    color: '#2563EB',
  },
  {
    icon: Send,
    title: 'Multi-Department Dispatch',
    description: 'Automated routing to Police, Fire Brigade, or Hospital response units based on intelligent classification recommendations.',
    color: '#EA580C',
  },
  {
    icon: BarChart3,
    title: 'Emergency Analytics',
    description: 'Centralized command center oversight with telemetry logs, weekly volume trends, and priority distribution metrics.',
    color: '#DC2626',
  },
  {
    icon: Clock,
    title: 'Incident Lifecycle Tracking',
    description: 'Track responders as they update status in real-time from initial Pending queue to In Progress and Resolved scene.',
    color: '#16A34A',
  },
  {
    icon: Lock,
    title: 'Secure Department Access',
    description: 'Role-based access control (RBAC) separating department-specific dashboards, backed by JWT validation.',
    color: '#64748B',
  },
];

const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="py-24 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0F172A]/5 border border-[#0F172A]/10 text-[10px] font-bold text-[#0F172A] uppercase tracking-wider mb-4">
            System Capabilities
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-3">
            Command Center Features
          </h2>
          <p className="text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
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
                className="group relative rounded-xl border border-[#E2E8F0] p-6 hover:shadow-sm transition-all"
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-5 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: `${feature.color}08`, color: feature.color }}
                >
                  <IconComponent className="h-5 w-5" />
                </div>

                {/* Content */}
                <h3 className="text-sm font-bold text-[#0F172A] mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
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
