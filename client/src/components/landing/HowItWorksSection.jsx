import { useRef } from 'react';
import { Shield, Sparkles, Send, BellRing, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    step: 1,
    title: 'Citizen Reports Emergency',
    description: 'Incidents are reported via voice calls or local portals, triggering automated system logs.',
    icon: Shield,
    color: '#E8602E', // orange
    glowClass: 'shadow-[0_0_20px_rgba(232,96,46,0.15)]',
  },
  {
    step: 2,
    title: 'AI Incident Analysis',
    description: 'The AI engine transcribes voice recording streams and applies natural language classification to deduce emergency type, landmark, and priority.',
    icon: Sparkles,
    color: '#3B82F6', // blue
    glowClass: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
  },
  {
    step: 3,
    title: 'Intelligent Routing & Dispatch',
    description: 'The incident is instantly routed to the relevant response agency — Police, Fire, or Hospital.',
    icon: Send,
    color: '#10B981', // green
    glowClass: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  },
  {
    step: 4,
    title: 'Real-Time Operator Alert',
    description: 'Assigned responders receive high-priority flash alerts on active dashboards via Socket.io channels.',
    icon: BellRing,
    color: '#EF4444', // red
    glowClass: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
  },
  {
    step: 5,
    title: 'Mitigation & Resolution',
    description: 'Responders deploy resources and track deployment telemetry in real-time until the scene is resolved.',
    icon: CheckCircle2,
    color: '#8B5CF6', // purple
    glowClass: 'shadow-[0_0_20px_rgba(139,92,246,0.15)]',
  },
];

const HowItWorksSection = () => {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  useGSAP(() => {
    // 1. Animate the timeline vertical line progress
    gsap.fromTo('.timeline-progress-line',
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: timelineRef.current,
          start: 'top 25%',
          end: 'bottom 75%',
          scrub: true,
        }
      }
    );

    // 2. Animate each step node and card as it enters the view
    const nodes = gsap.utils.toArray('.timeline-node-container');
    
    nodes.forEach((node) => {
      const card = node.querySelector('.timeline-card');
      const iconBox = node.querySelector('.timeline-icon-box');
      const stepBadge = node.querySelector('.timeline-step-badge');

      // Card entrance (fade in + slide)
      gsap.fromTo(card,
        { opacity: 0.15, y: 30, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          scrollTrigger: {
            trigger: node,
            start: 'top 80%',
            end: 'top 50%',
            scrub: true,
          }
        }
      );

      // Icon box highlight
      gsap.fromTo(iconBox,
        { filter: 'grayscale(1)', borderColor: 'rgba(255,255,255,0.05)', backgroundColor: '#0B0B0B' },
        {
          filter: 'grayscale(0)',
          borderColor: 'rgba(255,255,255,0.15)',
          backgroundColor: '#111111',
          scrollTrigger: {
            trigger: node,
            start: 'top 75%',
            end: 'top 50%',
            scrub: true,
          }
        }
      );

      // Step badge highlight
      if (stepBadge) {
        gsap.fromTo(stepBadge,
          { opacity: 0.3 },
          {
            opacity: 1,
            scrollTrigger: {
              trigger: node,
              start: 'top 75%',
              end: 'top 50%',
              scrub: true,
            }
          }
        );
      }
    });
  }, { scope: containerRef });

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="py-28 bg-black border-y border-white/5 relative overflow-hidden"
    >
      {/* Background cyber grid details */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] [background-size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.07] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-[#E8602E] uppercase tracking-widest mb-4 font-sans">
            Operational Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 font-sans">
            Response Lifespan Flow
          </h2>
          <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed font-sans">
            From the initial citizen report to department dispatch and final scene resolution.
          </p>
        </div>

        {/* Steps Timeline */}
        <div ref={timelineRef} className="relative timeline-container">
          
          {/* Base Gray Track Line */}
          <div className="absolute left-7 md:left-1/2 top-4 bottom-4 w-px bg-white/[0.05] -translate-x-[0.5px] pointer-events-none" />

          {/* Active Progress-colored Line */}
          <div 
            className="absolute left-7 md:left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-[#E8602E] via-[#3B82F6] to-[#8B5CF6] -translate-x-[0.5px] origin-top timeline-progress-line pointer-events-none"
            style={{ transform: 'scaleY(0)' }}
          />

          {steps.map((step, index) => {
            const isLeft = index % 2 === 0;
            const IconComponent = step.icon;

            return (
              <div
                key={step.step}
                className="relative flex items-center mb-24 last:mb-0 timeline-node-container"
              >
                {/* Desktop layout */}
                <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-10 w-full">
                  {/* Left Column */}
                  <div className={isLeft ? 'text-right' : 'order-3 text-left'}>
                    <div
                      className={`p-6 rounded-xl border border-white/5 bg-[#0B0B0B] hover:bg-[#0E0E0E] hover:border-white/10 hover:${step.glowClass} transition-all duration-300 group timeline-card`}
                    >
                      <h3 className="text-sm font-bold text-white mb-2 group-hover:text-white transition-colors font-sans">
                        {step.title}
                      </h3>
                      <p className="text-xs text-white/50 leading-relaxed font-sans">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Center Node */}
                  <div className="relative z-10 order-2 flex flex-col items-center">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center border border-white/10 bg-[#0E0E0E] text-white shadow-lg transition-all duration-300 hover:scale-110 timeline-icon-box"
                      style={{ 
                        color: step.color,
                        boxShadow: `0 0 20px ${step.color}15`
                      }}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span
                      className="absolute -bottom-8 text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-sans timeline-step-badge"
                      style={{
                        backgroundColor: `${step.color}10`,
                        color: step.color,
                        borderColor: `${step.color}25`,
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
                      className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/10 bg-[#0E0E0E] timeline-icon-box"
                      style={{ 
                        color: step.color,
                        boxShadow: `0 0 15px ${step.color}10`
                      }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 p-6 rounded-xl border border-white/5 bg-[#0B0B0B] timeline-card`}
                  >
                    <div
                      className="text-[9px] font-bold mb-2 inline-block px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-sans timeline-step-badge"
                      style={{
                        backgroundColor: `${step.color}10`,
                        color: step.color,
                        borderColor: `${step.color}25`,
                      }}
                    >
                      Step 0{step.step}
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5 font-sans">
                      {step.title}
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed font-sans">
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
