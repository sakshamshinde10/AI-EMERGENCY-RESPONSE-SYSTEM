import { Shield, Sparkles, Send, BellRing, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    step: 1,
    title: 'Citizen Reports Emergency',
    description: 'Incidents are reported via local portals or dispatch relays with contact details and description.',
    icon: Shield,
    color: '#2563EB', // blue
  },
  {
    step: 2,
    title: 'AI Analyzes Incident',
    description: 'The dispatch engine runs natural language processing on the report to identify type and severity.',
    icon: Sparkles,
    color: '#0F172A', // navy
  },
  {
    step: 3,
    title: 'Department Assignment',
    description: 'The incident is automatically assigned to the correct dispatch unit — Police, Fire, or Hospital.',
    icon: Send,
    color: '#EA580C', // orange
  },
  {
    step: 4,
    title: 'Real-Time Dashboard Alert',
    description: 'Responders receive the incident instantly on their active dashboard via Socket.io channels.',
    icon: BellRing,
    color: '#DC2626', // red
  },
  {
    step: 5,
    title: 'Emergency Resolution',
    description: 'Responders track operational status in real-time until the threat is mitigated and closed.',
    icon: CheckCircle2,
    color: '#16A34A', // green
  },
];

const HowItWorksSection = () => {
  return (
    <section
      id="how-it-works"
      className="py-24 bg-white border-y border-[#E2E8F0]"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0F172A]/5 border border-[#0F172A]/10 text-[10px] font-bold text-[#0F172A] uppercase tracking-wider mb-4">
            Command Workflow
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-3">
            Operational Process Flow
          </h2>
          <p className="text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
            From the initial citizen report to department dispatch and final scene resolution.
          </p>
        </div>

        {/* Steps Timeline */}
        <div className="relative">
          {/* Vertical Connector Line */}
          <div
            className="absolute left-7 md:left-1/2 top-0 bottom-0 w-px bg-[#E2E8F0] -translate-x-[0.5px]"
          />

          {steps.map((step, index) => {
            const isLeft = index % 2 === 0;
            const IconComponent = step.icon;

            return (
              <div
                key={step.step}
                className="relative flex items-center mb-16 last:mb-0"
              >
                {/* Desktop layout */}
                <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-8 w-full">
                  {/* Left Column */}
                  <div className={isLeft ? 'text-right' : 'order-3 text-left'}>
                    <div
                      className="p-5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:shadow-sm transition-all"
                    >
                      <h3 className="text-sm font-bold text-[#0F172A] mb-1.5">
                        {step.title}
                      </h3>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Center Node */}
                  <div className="relative z-10 order-2 flex flex-col items-center">
                    <div
                      className="w-14 h-14 rounded-lg flex items-center justify-center border border-[#E2E8F0] bg-white text-white shadow-sm transition-transform hover:scale-105"
                      style={{ color: step.color }}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span
                      className="absolute -bottom-6 text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider"
                      style={{
                        backgroundColor: `${step.color}08`,
                        color: step.color,
                        borderColor: `${step.color}20`,
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
                      className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#E2E8F0] bg-white"
                      style={{ color: step.color }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 p-5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]"
                  >
                    <div
                      className="text-[9px] font-bold mb-1.5 inline-block px-2 py-0.5 rounded border uppercase tracking-wider"
                      style={{
                        backgroundColor: `${step.color}08`,
                        color: step.color,
                        borderColor: `${step.color}20`,
                      }}
                    >
                      Step 0{step.step}
                    </div>
                    <h3 className="text-xs font-bold text-[#0F172A] mb-1">
                      {step.title}
                    </h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">
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
