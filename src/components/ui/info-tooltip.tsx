import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Tooltip } from './tooltip';

interface InfoTooltipProps {
  text: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  text,
  side = 'top',
  className = '',
}) => {
  return (
    <Tooltip
      content={
        <div className="max-w-[220px] text-[11px] leading-snug text-slate-200 font-sans whitespace-normal">
          {text}
        </div>
      }
      side={side}
    >
      <span
        tabIndex={0}
        aria-label="Information tooltip"
        className={`inline-flex items-center justify-center text-slate-400 hover:text-cyan-300 focus:text-cyan-300 cursor-help p-0.5 rounded transition-colors ${className}`}
      >
        <HelpCircle className="w-3 h-3 stroke-[2]" />
      </span>
    </Tooltip>
  );
};

