import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Menu, X, ArrowRight, Mic } from 'lucide-react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Departments', href: '#departments' },
    { label: 'Live Stats', href: '#stats' },
    { label: 'Features', href: '#features' },
    // { label: 'Tech Stack', href: '#tech-stack' },
  ];

  return (
    <nav
      id="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'py-3.5 bg-black/70 border-b border-white/10 shadow-lg shadow-black/20'
          : 'py-5.5 bg-transparent'
        }`}
      style={{
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand/Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-all bg-white/5 border border-white/10 group-hover:border-[#E8602E]/50 group-hover:shadow-[0_0_15px_rgba(232,96,46,0.3)]">
            <Shield className="h-5 w-5 text-[#E8602E]" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight block leading-tight text-white group-hover:text-[#E8602E] transition-colors">
              Emergency Command
            </span>
            <span className="text-[9px] font-bold tracking-wider uppercase block text-white/40">
              Government Platform
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3.5 py-1.5 text-xs font-semibold text-white/60 hover:text-[#E8602E] hover:bg-white/5 rounded-md transition-all duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/report-emergency"
            id="nav-report-btn"
            className="px-4.5 py-2 text-xs font-bold rounded-lg bg-[#E8602E] hover:bg-[#D74E1D] text-white transition-all duration-300 flex items-center gap-1.5 hover:shadow-[0_0_25px_rgba(232,96,46,0.5)]"
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Report Emergency</span>
          </Link>
          <Link
            to="/login"
            id="nav-login-btn"
            className="px-4.5 py-2 text-xs font-bold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white hover:border-white/20 transition-all flex items-center gap-1.5"
          >
            <span>Department Login</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          id="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-white/80 hover:text-white"
          aria-label="Toggle mobile menu"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden mt-2 mx-4 rounded-xl border border-white/10 p-4 bg-black/95 backdrop-blur-2xl shadow-xl shadow-black/50 animate-fade-in-down">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-2 text-xs font-semibold rounded-lg text-white/70 hover:text-[#E8602E] hover:bg-white/5 transition-all"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <hr className="my-2 border-white/10" />
            <Link
              to="/report-emergency"
              className="w-full text-center px-4 py-2.5 text-xs font-bold text-white rounded-lg bg-[#E8602E] hover:bg-[#D74E1D] flex items-center justify-center gap-1.5 transition-all duration-300"
              onClick={() => setMobileOpen(false)}
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Report Emergency</span>
            </Link>
            <Link
              to="/login"
              className="w-full text-center px-4 py-2.5 text-xs font-bold text-white rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-1.5 transition-all"
              onClick={() => setMobileOpen(false)}
            >
              <span>Department Login</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
