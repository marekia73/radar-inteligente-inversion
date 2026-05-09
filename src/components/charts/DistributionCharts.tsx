import React from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from "recharts";
import { ProcessedAsset } from "../../types";
import { SafeChartContainer } from "./SafeChartContainer";

interface DistributionChartsProps {
  assets: ProcessedAsset[];
  id?: string;
}

export const DistributionCharts: React.FC<DistributionChartsProps> = ({ assets, id }) => {
  if (!assets || assets.length === 0) {
    return <div className="text-center text-slate-500 text-sm py-10">Sin datos suficientes para mostrar gráfico.</div>;
  }

  // Prep data for Types
  const typeCount = assets.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

  // Prep data for Risk
  const riskCount = assets.reduce((acc, a) => {
    acc[a.riskLevel] = (acc[a.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskData = Object.entries(riskCount).map(([name, value]) => ({ name, value }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];
  const RISK_COLORS: Record<string, string> = {
    "Bajo": "#10b981",
    "Medio": "#f59e0b",
    "Alto": "#f43f5e",
    "Extremo": "#881337"
  };

  return (
    <div id={id} className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-4">
      <div>
        <h4 className="text-center text-xs font-semibold text-slate-400 mb-2">POR TIPO</h4>
        <SafeChartContainer minHeight={320}>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={typeData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </SafeChartContainer>
      </div>

      <div>
        <h4 className="text-center text-xs font-semibold text-slate-400 mb-2">POR RIESGO</h4>
        <SafeChartContainer minHeight={320}>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={riskData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </SafeChartContainer>
      </div>
    </div>
  );
};
