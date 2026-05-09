import React from 'react';
import { MacroIndicator } from '../../types';
import { Globe2, Activity, Percent } from 'lucide-react';

interface MacroDashboardProps {
  indicators: MacroIndicator[];
}

export const MacroDashboard: React.FC<MacroDashboardProps> = ({ indicators }) => {
  if (!indicators || indicators.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Globe2 className="text-purple-400" />
        Panel Macroeconómico
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {indicators.map((indicator) => (
          <div key={indicator.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center justify-between">
                <span className="truncate pr-1">{indicator.region}</span>
                <span className={`text-[8px] px-1 rounded ${
                  indicator.status === 'real' ? (indicator.fromCache ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400') : 
                  indicator.status === 'error' ? 'bg-red-500/20 text-red-400' :
                  indicator.status === 'partial' || indicator.stale ? 'bg-amber-500/20 text-amber-400' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  {indicator.status === 'real' ? (indicator.fromCache ? 'CACHÉ' : 'REAL') : 
                   indicator.status === 'error' ? 'ERROR' : 
                   indicator.status === 'partial' ? 'PARCIAL' : 'SIMULADO'}
                </span>
              </p>
              <h3 className="text-xs text-slate-300 line-clamp-2 min-h-[32px]">
                {indicator.id === 'CPIAUCSL' ? 'IPC índice CPI (EE.UU.)' : indicator.name}
              </h3>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-bold text-white">
                {indicator.value !== null ? indicator.value.toFixed(2) : '--'}
              </span>
              <span className="text-xs text-slate-400">
                {indicator.id === 'CPIAUCSL' ? 'índice' : indicator.unit}
              </span>
            </div>
            {indicator.id === 'CPIAUCSL' && (
              <p className="text-[9px] text-blue-400 mt-1 mb-1 leading-tight">
                No es tasa interanual; es el nivel del índice CPI.
              </p>
            )}
            {indicator.lastUpdated && (
              <p className="text-[9px] text-slate-500 mt-2">
                Actualizado: {new Date(indicator.lastUpdated).toLocaleDateString()}
              </p>
            )}
            {(indicator.fallbackReason || indicator.errorReason) && (
              <p className="text-[8px] text-slate-500 mt-1 leading-tight border-t border-slate-700/50 pt-1">
                {indicator.fallbackReason || indicator.errorReason}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
