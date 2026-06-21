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
    { label: 'Features', href: '#features' },
  ];

  return (
    <nav
      id="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'py-3 bg-white/95 border-b border-[#E2E8F0] shadow-sm'
          : 'py-5 bg-transparent'
      }`}
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand/Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            scrolled ? 'bg-[#0F172A]' : 'bg-white/10 border border-white/20'
          }`}>
            <Shield className={`h-5 w-5 ${scrolled ? 'text-white' : 'text-white'}`} />
          </div>
          <div>
            <span
              className={`text-sm font-bold tracking-tight block leading-tight ${
                scrolled ? 'text-[#0F172A]' : 'text-white'
              }`}
            >
              Emergency Command
            </span>
            <span
              className={`text-[9px] font-bold tracking-wider uppercase block ${
                scrolled ? 'text-[#64748B]' : 'text-white/60'
              }`}
            >
              Government Platform
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                scrolled 
                  ? 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]' 
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/report-emergency"
            id="nav-report-btn"
            className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white border border-red-600 transition-all flex items-center gap-1 shadow-sm"
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Report Emergency</span>
          </Link>
          <Link
            to="/login"
            id="nav-login-btn"
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all flex items-center gap-1 ${
              scrolled
                ? 'bg-[#0F172A] border-[#0F172A] hover:bg-[#1E293B] text-white'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/30'
            }`}
          >
            <span>Department Login</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          id="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg"
          style={{
            color: scrolled ? '#0F172A' : '#ffffff',
          }}
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
        <div className="md:hidden mt-2 mx-4 rounded-xl border border-[#E2E8F0] p-4 bg-white shadow-lg animate-fade-in-down">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-2 text-xs font-semibold rounded-lg text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <hr className="my-2 border-[#E2E8F0]" />
            <Link
              to="/report-emergency"
              className="w-full text-center px-4 py-2.5 text-xs font-bold text-white rounded-lg bg-red-600 hover:bg-red-700 flex items-center justify-center gap-1"
              onClick={() => setMobileOpen(false)}
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Report Emergency</span>
            </Link>
            <Link
              to="/login"
              className="w-full text-center px-4 py-2.5 text-xs font-bold text-white rounded-lg bg-[#0F172A] hover:bg-[#1E293B] flex items-center justify-center gap-1"
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
