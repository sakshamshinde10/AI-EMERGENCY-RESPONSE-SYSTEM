import { Shield, Sparkles, Send, BellRing, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    step: 1,
    title: 'Citizen Reports Emergency',
    description: 'Incidents are reported via voice calls or local portals, triggering automated system logs.',
    icon: Shield,
    color: '#E8602E', // orange
  },
  {
    step: 2,
    title: 'AI Incident Analysis',
    description: 'The AI engine transcribes voice recording streams and applies natural language classification to deduce emergency type, landmark, and priority.',
    icon: Sparkles,
    color: '#3B82F6', // blue
  },
  {
    step: 3,
    title: 'Intelligent Routing & Dispatch',
    description: 'The incident is instantly routed to the relevant response agency — Police, Fire, or Hospital.',
    icon: Send,
    color: '#10B981', // green
  },
  {
    step: 4,
    title: 'Real-Time Operator Alert',
    description: 'Assigned responders receive high-priority flash alerts on active dashboards via Socket.io channels.',
    icon: BellRing,
    color: '#EF4444', // red
  },
  {
    step: 5,
    title: 'Mitigation & Resolution',
    description: 'Responders deploy resources and track deployment telemetry in real-time until the scene is resolved.',
    icon: CheckCircle2,
    color: '#8B5CF6', // purple
  },
];

const HowItWorksSection = () => {
  return (
    <section
      id="how-it-works"
      className="py-28 bg-[#030303] border-y border-white/5 relative"
    >
      {/* Background soft blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-[#E8602E] uppercase tracking-widest mb-4">
            Operational Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Response Lifespan Flow
          </h2>
          <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed">
            From the initial citizen report to department dispatch and final scene resolution.
          </p>
        </div>

        {/* Steps Timeline */}
        <div className="relative">
          {/* Vertical Connector Line */}
          <div
            className="absolute left-7 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#E8602E]/30 via-blue-500/30 to-green-500/30 -translate-x-[0.5px]"
          />

          {steps.map((step, index) => {
            const isLeft = index % 2 === 0;
            const IconComponent = step.icon;

            return (
              <div
                key={step.step}
                className="relative flex items-center mb-20 last:mb-0"
              >
                {/* Desktop layout */}
                <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-10 w-full">
                  {/* Left Column */}
                  <div className={isLeft ? 'text-right' : 'order-3 text-left'}>
                    <div
                      className="p-6 rounded-xl border border-white/5 bg-[#0B0B0B] hover:bg-[#0E0E0E] hover:border-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] transition-all duration-300 group"
                    >
                      <h3 className="text-sm font-bold text-white mb-2 group-hover:text-[#E8602E] transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-xs text-white/50 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Center Node */}
                  <div className="relative z-10 order-2 flex flex-col items-center">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center border border-white/10 bg-[#0E0E0E] text-white shadow-lg transition-all duration-300 hover:scale-110"
                      style={{ 
                        color: step.color,
                        boxShadow: `0 0 20px ${step.color}20`
                      }}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span
                      className="absolute -bottom-7 text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                      style={{
                        backgroundColor: `${step.color}15`,
                        color: step.color,
                        borderColor: `${step.color}30`,
                      }}
                    >
                      Step 0{step.step}
                    </span>
                  </div>

                  {/* Right Column */}
                  <div className={isLeft ? 'order-3' : ''} />
                </div>

                {/* Mobile layout */}
                <div className="md:hidden flex items-start gap-4 w-full pl-2">
                  {/* Node */}
                  <div className="relative z-10 shrink-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/10 bg-[#0E0E0E]"
                      style={{ 
                        color: step.color,
                        boxShadow: `0 0 15px ${step.color}15`
                      }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 p-6 rounded-xl border border-white/5 bg-[#0B0B0B]"
                  >
                    <div
                      className="text-[9px] font-bold mb-2 inline-block px-2.5 py-0.5 rounded-full border uppercase tracking-wider"
                      style={{
                        backgroundColor: `${step.color}15`,
                        color: step.color,
                        borderColor: `${step.color}30`,
                      }}
                    >
                      Step 0{step.step}
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5">
                      {step.title}
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
