import React, { useState, useMemo } from 'react';
import { SectionCard } from '../ui/SectionCard';
import { WarningBanner } from '../ui/WarningBanner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const CompoundInterestCalculator: React.FC = () => {
  const [mode, setMode] = useState<'classic' | 'target'>('classic');
  const [age, setAge] = useState<number>(30);
  const [initialCapital, setInitialCapital] = useState<number>(10000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(300);
  const [targetCapital, setTargetCapital] = useState<number>(100000);
  const [years, setYears] = useState<number>(20);
  const [annualReturn, setAnnualReturn] = useState<number>(6);
  const [estimatedInflation, setEstimatedInflation] = useState<number>(2);

  const computedMonthlyContribution = useMemo(() => {
    if (mode === 'classic') return monthlyContribution;
    
    const rBase = Math.max(0, annualReturn) / 100;
    const r = Math.pow(1 + rBase, 1 / 12) - 1;
    const n = years * 12;
    
    if (r === 0) {
      const needed = (targetCapital - initialCapital) / n;
      return needed > 0 ? needed : 0;
    }
    
    const fv = targetCapital;
    const pv = initialCapital;
    const comp = Math.pow(1 + r, n);
    
    const pmt = (fv - pv * comp) * r / (comp - 1);
    return pmt > 0 ? pmt : 0;
  }, [mode, monthlyContribution, targetCapital, initialCapital, years, annualReturn]);

  const data = useMemo(() => {
    let currentAge = age;
    let balanceConservative = initialCapital;
    let balanceNormal = initialCapital;
    let balanceOptimistic = initialCapital;
    let totalContributed = initialCapital;

    const returnBase = Math.max(0, annualReturn) / 100;
    const returnCons = Math.max(0, returnBase - 0.02);
    const returnOpt = returnBase + 0.02;

    const monthlyRateCons = Math.pow(1 + returnCons, 1 / 12) - 1;
    const monthlyRateNormal = Math.pow(1 + returnBase, 1 / 12) - 1;
    const monthlyRateOpt = Math.pow(1 + returnOpt, 1 / 12) - 1;

    const yearlyData = [];

    // Add year 0
    yearlyData.push({
      year: 0,
      age: currentAge,
      totalContributed,
      conservador: balanceConservative,
      normal: balanceNormal,
      optimista: balanceOptimistic,
    });

    for (let y = 1; y <= years; y++) {
      currentAge++;
      for (let m = 1; m <= 12; m++) {
        balanceConservative = balanceConservative * (1 + monthlyRateCons) + computedMonthlyContribution;
        balanceNormal = balanceNormal * (1 + monthlyRateNormal) + computedMonthlyContribution;
        balanceOptimistic = balanceOptimistic * (1 + monthlyRateOpt) + computedMonthlyContribution;
        totalContributed += computedMonthlyContribution;
      }

      yearlyData.push({
        year: y,
        age: currentAge,
        totalContributed,
        conservador: Math.round(balanceConservative),
        normal: Math.round(balanceNormal),
        optimista: Math.round(balanceOptimistic),
      });
    }

    return yearlyData;
  }, [age, initialCapital, computedMonthlyContribution, years, annualReturn]);

  const finalData = data[data.length - 1];

  const inflationAdjustedNormal = useMemo(() => {
    if (!finalData || estimatedInflation === 0) return finalData?.normal;
    const inflRate = estimatedInflation / 100;
    return finalData.normal / Math.pow(1 + inflRate, years);
  }, [finalData, estimatedInflation, years]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      <WarningBanner 
          type="info"
          message="Esta calculadora es una simulación educativa. No garantiza rentabilidades futuras. La rentabilidad real puede ser positiva, negativa o distinta de la estimada. El interés compuesto consiste en que los rendimientos generados también pasan a generar nuevos rendimientos con el paso del tiempo."
      />

      <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setMode('classic')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
            mode === 'classic' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Proyectar Capital
        </button>
        <button
          onClick={() => setMode('target')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
            mode === 'target' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Calcular Objetivo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <label className="block text-xs font-medium text-slate-400 mb-1">Edad Actual</label>
          <input type="number" min={16} max={100} value={age || ''} onChange={e => {
              const v = e.target.value;
              setAge(v === '' ? '' as any as number : Math.min(100, Math.max(0, Number(v))));
          }} className="w-full bg-slate-800 border items-center border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <label className="block text-xs font-medium text-slate-400 mb-1">Capital Inicial (€)</label>
          <input type="number" min={0} value={initialCapital || 0} onChange={e => {
              const v = e.target.value;
              setInitialCapital(v === '' ? '' as any as number : Math.max(0, Number(v)));
          }} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
        </div>
        
        {mode === 'classic' ? (
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <label className="block text-xs font-medium text-slate-400 mb-1">Aportación Mensual (€)</label>
            <input type="number" min={0} value={monthlyContribution} onChange={e => {
                const v = e.target.value;
                setMonthlyContribution(v === '' ? '' as any as number : Math.max(0, Number(v)));
            }} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl p-4 border border-emerald-500/50 relative">
            <label className="block text-xs font-medium text-emerald-400 mb-1">Capital Objetivo (€)</label>
            <input type="number" min={0} value={targetCapital || 0} onChange={e => {
                const v = e.target.value;
                setTargetCapital(v === '' ? '' as any as number : Math.max(0, Number(v)));
            }} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
          </div>
        )}

        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <label className="block text-xs font-medium text-slate-400 mb-1">Años</label>
          <input type="number" min={1} max={60} value={years} onChange={e => {
              const v = e.target.value;
              setYears(v === '' ? '' as any as number : Math.min(60, Math.max(1, Number(v))));
          }} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <label className="block text-xs font-medium text-slate-400 mb-1">Rentabilidad (%)</label>
          <input type="number" min={0} max={20} step={0.5} value={annualReturn} onChange={e => setAnnualReturn(Math.min(20, Math.max(0, Number(e.target.value))))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <label className="block text-xs font-medium text-slate-400 mb-1">Inflación anual (%)</label>
          <input type="number" min={0} max={20} step={0.5} value={estimatedInflation} onChange={e => setEstimatedInflation(Math.min(20, Math.max(0, Number(e.target.value))))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 outline-none focus:border-amber-500" />
        </div>
      </div>

      {mode === 'target' && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 p-6 rounded-2xl mb-6 text-center shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)]">
           <h3 className="text-slate-300 font-medium mb-2">Para alcanzar {formatCurrency(targetCapital)} en {years} años:</h3>
           <div className="text-5xl font-extrabold text-emerald-400 mb-3">{formatCurrency(computedMonthlyContribution)} <span className="text-xl text-emerald-600 font-semibold">/ mes</span></div>
           <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Asumiendo rentabilidad anual normal del {annualReturn}%</p>
        </div>
      )}

      {/* Bloque Resumen */}
      <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">Resumen (Escenario Normal a {years} años)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-slate-400 mb-1">Capital Inicial</div>
            <div className="text-xl font-bold text-slate-200">{formatCurrency(initialCapital)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Tus aportaciones (Mes a mes)</div>
            <div className="text-xl font-bold text-slate-200">{formatCurrency(finalData?.totalContributed - initialCapital)}</div>
          </div>
          <div>
             <div className="text-xs text-emerald-500 font-medium mb-1 flex items-center gap-1">Ganancia por Interés Compuesto</div>
             <div className="text-xl font-extrabold text-emerald-400">+{formatCurrency((finalData?.normal || 0) - finalData?.totalContributed)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Capital Final (Nominal estimado)</div>
            <div className="text-xl font-extrabold text-white">{formatCurrency(finalData?.normal || 0)}</div>
          </div>
        </div>
        
        {estimatedInflation > 0 && (
          <div className="mt-5 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-0.5">Poder adquisitivo real ajustado a la inflación</div>
              <div className="text-xs text-slate-500">Capital estimado descontando una inflación anual de {estimatedInflation}% durante {years} años.</div>
            </div>
            <div className="text-2xl font-extrabold text-amber-500 text-right whitespace-nowrap">
              ~ {formatCurrency(inflationAdjustedNormal || 0)}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700 flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Escenario Conservador</h3>
          <p className="text-xs text-slate-500 mb-3">Rentabilidad: {Math.max(0, annualReturn - 2)}%</p>
          <div className="text-2xl font-bold text-amber-400 mb-2">{formatCurrency(finalData?.conservador || 0)}</div>
        </div>
        <div className="bg-slate-800/80 rounded-2xl p-5 border border-emerald-500/30 flex flex-col justify-center relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 bg-emerald-500 text-[10px] font-bold px-2 py-1 rounded-bl-lg text-slate-900">ESCENARIO NORMAL</div>
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Escenario Normal</h3>
          <p className="text-xs text-slate-400 mb-3">Rentabilidad: {annualReturn}%</p>
          <div className="text-3xl font-extrabold text-white mb-2">{formatCurrency(finalData?.normal || 0)}</div>
        </div>
        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700 flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Escenario Optimista</h3>
          <p className="text-xs text-slate-500 mb-3">Rentabilidad: {annualReturn + 2}%</p>
          <div className="text-2xl font-bold text-blue-400 mb-2">{formatCurrency(finalData?.optimista || 0)}</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">Proyección del Capital</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="age" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `Edad ${val}`} />
              <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                itemStyle={{ color: '#e2e8f0' }}
                formatter={(value: number) => [formatCurrency(value), '']}
                labelFormatter={(label) => `Edad: ${label}`}
              />
              <Legend />
              <Line type="monotone" name="Optimista" dataKey="optimista" stroke="#60a5fa" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              <Line type="monotone" name="Normal" dataKey="normal" stroke="#10b981" strokeWidth={3} dot={false} />
              <Line type="monotone" name="Conservador" dataKey="conservador" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              <Line type="monotone" name="Total Aportado" dataKey="totalContributed" stroke="#64748b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800 text-slate-300 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4 font-semibold">Año</th>
                <th className="py-3 px-4 font-semibold">Edad</th>
                <th className="py-3 px-4 font-semibold text-right">Total Aportado</th>
                <th className="py-3 px-4 font-semibold text-right text-amber-500">Conservador</th>
                <th className="py-3 px-4 font-semibold text-right text-emerald-500">Normal</th>
                <th className="py-3 px-4 font-semibold text-right text-blue-400">Optimista</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {data.filter((_, i) => i === 0 || i % 5 === 0 || i === data.length - 1).map((row) => (
                <tr key={row.year} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 text-slate-400">Año {row.year}</td>
                  <td className="py-3 px-4 font-medium text-slate-300">{row.age} años</td>
                  <td className="py-3 px-4 text-right text-slate-300">{formatCurrency(row.totalContributed)}</td>
                  <td className="py-3 px-4 text-right text-amber-500/80">{formatCurrency(row.conservador)}</td>
                  <td className="py-3 px-4 text-right font-medium text-emerald-400">{formatCurrency(row.normal)}</td>
                  <td className="py-3 px-4 text-right text-blue-400/80">{formatCurrency(row.optimista)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-900 text-xs text-slate-500 text-center border-t border-slate-800/50">
          Mostrando el inicio, intervalos de 5 años y el periodo final.
        </div>
      </div>
    </div>
  );
};
