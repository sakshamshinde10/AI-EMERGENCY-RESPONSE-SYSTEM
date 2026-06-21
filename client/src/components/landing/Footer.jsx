import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0F172A] text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Branding */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/10">
                <Shield className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight block">
                  Emergency Command
                </span>
                <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase block">
                  Government Platform
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Centralized emergency dispatch operations control system. Automatically classifying, 
              assigning, and monitoring municipal security, fire, and health incidents.
            </p>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4">
              Personnel Login
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-300">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Super Admin Console
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Police Tactical Console
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Fire Brigade Dispatch Board
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Hospital Medical Triage Panel
                </Link>
              </li>
            </ul>
          </div>

          {/* Security Notice */}
          <div>
            <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4">
              System Notice
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This system is restricted to authorized public safety personnel. Unauthorized access attempts, 
              probing, or misrepresentation are logged and subject to administrative action and prosecution.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-slate-500 font-medium">
            © {currentYear} Emergency Command Platform. Prepared for municipal public safety.
          </p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Control System Active
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
