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
      className="py-28 bg-[#030303] border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-[#E8602E] uppercase tracking-widest mb-4">
            Platform Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Technology Stack
          </h2>
          <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed">
            Engineered with modern, highly performant libraries and frameworks for robust operational stability.
          </p>
        </div>

        {/* Tech Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {technologies.map((tech) => (
            <div
              key={tech.name}
              className="flex flex-col p-5 rounded-xl border border-white/5 bg-[#0B0B0B] hover:border-white/10 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.01)] group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 text-[#E8602E] border border-white/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Shield className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1 group-hover:text-[#E8602E] transition-colors">
                {tech.name}
              </h3>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-2">
                {tech.role}
              </p>
              <p className="text-[10px] text-white/30 leading-normal">
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
