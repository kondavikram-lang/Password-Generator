import React from 'react';
import { PasswordStrength } from '../lib/types';
import { Shield, ShieldAlert, ShieldCheck, Zap } from 'lucide-react';

interface StrengthMeterProps {
  strength: PasswordStrength;
  length: number;
}

export const StrengthMeter: React.FC<StrengthMeterProps> = ({ strength, length }) => {
  const getIcon = () => {
    switch (strength.score) {
      case 4:
        return <ShieldCheck className="w-4 h-4 text-[#10b981]" />;
      case 3:
        return <Shield className="w-4 h-4 text-[#818cf8]" />;
      case 2:
        return <Zap className="w-4 h-4 text-[#f59e0b]" />;
      case 1:
      default:
        return <ShieldAlert className="w-4 h-4 text-[#f43f5e]" />;
    }
  };

  const getBarColor = (index: number) => {
    if (index >= strength.score) {
      return 'bg-[#1c1f2a] opacity-40';
    }
    switch (strength.score) {
      case 4:
        return 'bg-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.5)]';
      case 3:
        return 'bg-[#6366f1] shadow-[0_0_12px_rgba(99,102,241,0.5)]';
      case 2:
        return 'bg-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.5)]';
      case 1:
      default:
        return 'bg-[#f43f5e] shadow-[0_0_12px_rgba(244,63,94,0.5)]';
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Top summary row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-[#908fa0]">Strength:</span>
          <span
            className="font-semibold tracking-wide"
            style={{ color: strength.color }}
          >
            {strength.label}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[#908fa0] font-mono tabular-nums text-[11px]">
          <span>{strength.entropyBits} bits entropy</span>
          <span>·</span>
          <span className="text-[#dfe2f1]">Est. Crack Time: {strength.crackTimeText}</span>
        </div>
      </div>

      {/* 4-segment gauge */}
      <div className="grid grid-cols-4 gap-1.5 h-2 w-full p-0.5 rounded-full bg-[#070a10] border border-white/5">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`h-full rounded-full transition-all duration-300 ${getBarColor(idx)}`}
          />
        ))}
      </div>

      {/* Helpful suggestions if password is weak */}
      {strength.score <= 2 && strength.suggestions.length > 0 && length > 0 && (
        <p className="text-[11px] text-[#c7c4d7] bg-white/[0.02] p-2 rounded-lg border border-white/5">
          <span className="text-[#f59e0b] font-medium mr-1.5">Tip:</span>
          {strength.suggestions.join(' ')}
        </p>
      )}
    </div>
  );
};
