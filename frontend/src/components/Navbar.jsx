import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain } from 'lucide-react';

const navItems = [
  { label: 'Home', to: '/', protected: false },
  { label: 'Skills', to: '/skill-profile', protected: true },
  { label: 'Roles', to: '/roles', protected: true },
  { label: 'Dashboard', to: '/dashboard', protected: true },
  { label: 'Roadmap', to: '/roadmap', protected: true },
  { label: 'Insights', to: '/insights', protected: true },
  { label: 'Profile', to: '/profile-dashboard', protected: true },
];

const Navbar = ({ onNavigate, userName }) => {
  const location = useLocation();

  return (
    <nav className="glass-card fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl glow-button flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">SkillGap AI</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => onNavigate(item.to, item.protected)}
                className={`text-sm font-medium transition-all ${isActive ? 'text-violet-600 font-semibold' : 'text-gray-600 hover:text-violet-600'}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          {userName && (
            <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-violet-100 border border-blue-200">
              <span className="text-xs font-semibold text-violet-700">Hi, {userName}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => onNavigate('/skill-profile', true)}
            className="glow-button px-4 py-2 rounded-xl text-white text-sm font-medium"
          >
            Get Started
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/profile-dashboard', true)}
            className="px-4 py-2 rounded-xl border border-violet-300 bg-violet-100/80 text-violet-700 text-sm font-semibold hover:bg-violet-200/80 transition-all"
          >
            Profile
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
