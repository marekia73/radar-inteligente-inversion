import React, { useState } from 'react';
import { Calculator, UserCheck } from 'lucide-react';
import { CompoundInterestCalculator } from './CompoundInterestCalculator';
import { InvestorProfileTest } from './InvestorProfileTest';

export const InvestorToolsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'profile'>('calculator');

  return (
    <div className="mb-10 w-full">
      <div className="flex items-center gap-2 mb-4 text-emerald-400">
        <Calculator size={18} />
        <h2 className="text-sm font-bold uppercase tracking-widest">Herramientas Educativas</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-6 bg-slate-900 border border-slate-800 p-1.5 rounded-xl w-full sm:w-fit shadow-lg">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'calculator' 
              ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <Calculator size={16} />
          Calculadora de Interés Compuesto
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'profile' 
              ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <UserCheck size={16} />
          Test de Perfil Inversor
        </button>
      </div>

      <div className="transition-all duration-300 w-full">
        {activeTab === 'calculator' ? <CompoundInterestCalculator /> : <InvestorProfileTest />}
      </div>
    </div>
  );
};
