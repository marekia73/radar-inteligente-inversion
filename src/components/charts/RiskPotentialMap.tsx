import React from "react";
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LabelList
} from "recharts";
import { ProcessedAsset } from "../../types";
import { SafeChartContainer } from "./SafeChartContainer";

interface RiskPotentialMapProps {
  assets: ProcessedAsset[];
  id?: string;
}

export const RiskPotentialMap: React.FC<RiskPotentialMapProps> = ({ assets, id }) => {
  if (!assets || assets.length === 0) {
    return <div className="text-center text-slate-500 text-sm py-10">Sin datos suficientes para mostrar gráfico.</div>;
  }

  const data = assets
    .filter(a => Number.isFinite(a.scores?.risk) && Number.isFinite(a.scores?.potential))
    .map(a => ({
    name: a.ticker,
    fullName: a.name,
    risk: a.scores.risk,
    potential: a.scores.potential,
    size: a.opportunityScore
  }));

  if (data.length === 0) {
    return <div className="text-center text-slate-500 text-sm py-10">Sin datos suficientes para mostrar gráfico.</div>;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="font-bold text-white">{item.fullName} ({item.name})</p>
          <p className="text-sm text-slate-400">Riesgo: <span className="text-rose-400">{item.risk}</span></p>
          <p className="text-sm text-slate-400">Potencial: <span className="text-emerald-400">{item.potential}</span></p>
          <p className="text-xs text-slate-500 mt-1 italic">Puntaje Oportunidad: {item.size}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id={id} className="w-full">
      <SafeChartContainer minHeight={380}>
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis 
              type="number" 
              dataKey="risk" 
              name="risk" 
              label={{ value: 'Riesgo (%)', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 12 }} 
              stroke="#1e293b" 
              tick={{ fill: '#64748b' }}
              domain={[0, 100]}
            />
            <YAxis 
              type="number" 
              dataKey="potential" 
              name="potential" 
              label={{ value: 'Potencial (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
              stroke="#1e293b"
              tick={{ fill: '#64748b' }}
              domain={[0, 100]}
            />
            <ZAxis type="number" dataKey="size" range={[50, 400]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Activos" data={data}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.risk > 70 ? '#f43f5e' : entry.risk > 40 ? '#f59e0b' : '#10b981'} 
                  fillOpacity={0.6}
                  strokeWidth={1}
                  stroke="#fff"
                />
              ))}
              <LabelList dataKey="name" position="top" offset={10} style={{ fill: '#94a3b8', fontSize: 10 }} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </SafeChartContainer>
    </div>
  );
};
