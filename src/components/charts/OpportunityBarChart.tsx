import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { ProcessedAsset } from "../../types";
import { SafeChartContainer } from "./SafeChartContainer";

interface OpportunityBarChartProps {
  assets: ProcessedAsset[];
  id?: string;
}

export const OpportunityBarChart: React.FC<OpportunityBarChartProps> = ({ assets, id }) => {
  if (!assets || assets.length === 0) {
    return <div className="text-center text-slate-500 text-sm py-10">Sin datos suficientes para mostrar gráfico.</div>;
  }

  const data = [...assets]
    .filter(a => Number.isFinite(a.opportunityScore))
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 10)
    .map(a => ({
      name: a.ticker,
      score: a.opportunityScore,
      fullName: a.name
    }));

  if (data.length === 0) {
    return <div className="text-center text-slate-500 text-sm py-10">Sin datos suficientes para mostrar gráfico.</div>;
  }

  return (
    <div id={id} className="w-full mt-4">
      <SafeChartContainer minHeight={380}>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis dataKey="name" type="category" stroke="#64748b" width={60} fontSize={12} />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
              itemStyle={{ color: '#10b981' }}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.score > 80 ? '#10b981' : entry.score > 60 ? '#84cc16' : '#f59e0b'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SafeChartContainer>
    </div>
  );
};
