import { Shield } from 'lucide-react';

const technologies = [
  {
    name: 'React.js',
    role: 'User Interface',
    detail: 'Component architecture library',
  },
  {
    name: 'Tailwind CSS',
    role: 'Style Framework',
    detail: 'Utility-first presentation',
  },
  {
    name: 'Node.js',
    role: 'Backend Runtime',
    detail: 'Asynchronous event execution',
  },
  {
    name: 'Express.js',
    role: 'API Framework',
    detail: 'Router and controller logic',
  },
  {
    name: 'MongoDB',
    role: 'Database Engine',
    detail: 'Document log indexing',
  },
  {
    name: 'Socket.io',
    role: 'Real-Time Relay',
    detail: 'Bi-directional alert stream',
  },
  {
    name: 'Groq AI SDK',
    role: 'Language Classifier',
    detail: 'Automated triage inference',
  },
];

const TechStackSection = () => {
  return (
    <section
      id="tech-stack"
      className="py-24 bg-[#F8FAFC] border-t border-[#E2E8F0]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0F172A]/5 border border-[#0F172A]/10 text-[10px] font-bold text-[#0F172A] uppercase tracking-wider mb-4">
            Platform Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-3">
            Technology Stack
          </h2>
          <p className="text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
            Engineered with modern, highly performant libraries and frameworks for robust operational stability.
          </p>
        </div>

        {/* Tech Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {technologies.map((tech) => (
            <div
              key={tech.name}
              className="flex flex-col p-5 rounded-lg border border-[#E2E8F0] bg-white transition-all duration-300 hover:shadow-sm"
            >
              <div className="w-8 h-8 rounded bg-[#0F172A]/5 text-[#0F172A] flex items-center justify-center mb-4">
                <Shield className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-[#0F172A] mb-1">
                {tech.name}
              </h3>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide mb-2">
                {tech.role}
              </p>
              <p className="text-[10px] text-[#94A3B8] leading-normal">
                {tech.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechStackSection;
