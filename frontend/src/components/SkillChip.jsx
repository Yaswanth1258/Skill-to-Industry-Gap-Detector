import React from 'react';

const variantStyles = {
  blue: 'text-blue-700 border-blue-300 bg-blue-50/70',
  purple: 'text-violet-700 border-violet-300 bg-violet-50/70',
  cyan: 'text-cyan-700 border-cyan-300 bg-cyan-50/70',
  pink: 'text-rose-700 border-rose-300 bg-rose-50/70',
  green: 'text-emerald-700 border-emerald-300 bg-emerald-50/70',
};

const SkillChip = ({ label, removable = false, onRemove, variant = 'blue' }) => {
  const variantClass = variantStyles[variant] || variantStyles.blue;

  return (
    <span className={`skill-chip px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${variantClass}`}>
      {label}
      {removable && (
        <button type="button" className="hover:text-red-600" onClick={onRemove}>
          x
        </button>
      )}
    </span>
  );
};

export default SkillChip;

