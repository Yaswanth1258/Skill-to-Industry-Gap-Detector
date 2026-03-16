import React from 'react';
import { Loader2 } from 'lucide-react';

const AnimatedButton = ({ children, onClick, loading = false, className = '', type = 'button', variant = 'primary' }) => {
  const baseClass = variant === 'outline'
    ? 'glass-card-strong text-gray-700 hover:glow-border'
    : 'glow-button text-white';

  return (
    <button
      type={type}
      disabled={loading}
      onClick={onClick}
      className={`${baseClass} px-6 py-3 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
};

export default AnimatedButton;
