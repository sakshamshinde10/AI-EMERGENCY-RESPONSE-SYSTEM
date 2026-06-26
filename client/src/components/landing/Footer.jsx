import { Link } from 'react-router-dom';
import { Shield, Zap } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const techStack = ['React 18', 'Express.js', 'MongoDB', 'Socket.io', 'Gemini AI', 'JWT'];

  return (
    <footer className="bg-[#000000] text-white border-t border-white/5 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-10">

          {/* Branding */}
          <div>
            <div className="flex items-center gap-2.5 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#E8602E]/30 transition-colors">
                <Shield className="h-4 w-4 text-[#E8602E]" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight block text-white leading-tight">
                  Emergency Command
                </span>
                <span className="text-[9px] font-bold tracking-wider text-white/35 uppercase block">
                  Government Operations Platform
                </span>
              </div>
            </div>
            <p className="text-xs text-white/40 leading-relaxed max-w-xs">
              Centralized dispatch and incident management system for municipal police, fire, and hospital operations.
            </p>
          </div>

          {/* Personnel Links */}
          <div>
            <h4 className="text-[9px] font-bold tracking-widest text-white/30 uppercase mb-4">
              Department Portals
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Admin Console', to: '/login' },
                { label: 'Police Tactical Board', to: '/login' },
                { label: 'Fire Brigade Dispatch', to: '/login' },
                { label: 'Hospital Triage Panel', to: '/login' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-xs font-semibold text-white/50 hover:text-[#E8602E] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Security Notice */}
          <div>
            <h4 className="text-[9px] font-bold tracking-widest text-white/30 uppercase mb-4">
              System Notice
            </h4>
            <p className="text-[11px] text-white/35 leading-relaxed">
              Access is restricted to authorized public safety personnel only. Unauthorized access attempts are
              logged and subject to administrative and legal action.
            </p>
          </div>
        </div>

        {/* Tech Stack Pills */}
        <div className="py-6 border-t border-white/5 border-b">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 mr-2">
              <Zap className="h-3 w-3 text-[#E8602E]" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Powered by</span>
            </div>
            {techStack.map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 rounded border border-white/5 bg-white/[0.03] text-[9px] font-bold text-white/35 uppercase tracking-wider"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-white/25 font-medium">
            &copy; {currentYear} Emergency Command Platform &mdash; Municipal public safety operations.
          </p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
