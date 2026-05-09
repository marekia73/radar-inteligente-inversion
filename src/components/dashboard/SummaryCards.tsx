import React from "react";
import { ProcessedAsset } from "../../types";
import { TrendingUp, ShieldAlert, Target, Users, Zap, Briefcase } from "lucide-react";

interface SummaryCardsProps {
  assets: ProcessedAsset[];
  id?: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ assets, id }) => {
  const topOpportunity = [...assets].sort((a, b) => b.opportunityScore - a.opportunityScore)[0];
  const bestForBeginners = [...assets].sort((a, b) => b.scores.beginnerFriendly - a.scores.beginnerFriendly)[0];
  const riskiest = [...assets].sort((a, b) => b.scores.risk - a.scores.risk)[0];
  
  const andreaTop = [...assets].sort((a, b) => {
    const aScore = a.mentorScores.find(m => m.mentorId === 'andrea_redondo')?.score || 0;
    const bScore = b.mentorScores.find(m => m.mentorId === 'andrea_redondo')?.score || 0;
    return bScore - aScore;
  })[0];

  const pabloTop = [...assets].sort((a, b) => {
    const aScore = a.mentorScores.find(m => m.mentorId === 'pablo_gil')?.score || 0;
    const bScore = b.mentorScores.find(m => m.mentorId === 'pablo_gil')?.score || 0;
    return bScore - aScore;
  })[0];

  const cards = [
    { label: "Activos Analizados", tooltip: "Número total de instrumentos en radar", value: assets.length, icon: <Briefcase />, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Mejor Oportunidad", tooltip: "Activo con la puntuación compuesta más alta (corto + largo plazo)", value: topOpportunity.ticker, sub: `${topOpportunity.opportunityScore}/100`, icon: <Target />, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Para Principiantes", tooltip: "Activo recomendado por su menor volatilidad y sencillez de comprensión", value: bestForBeginners.ticker, icon: <Users />, color: "text-sky-400", bg: "bg-sky-500/10" },
    { label: "Riesgo Máximo", tooltip: "Activo con mayor volatilidad potencial (solo perfiles agresivos)", value: riskiest.ticker, icon: <ShieldAlert />, color: "text-rose-400", bg: "bg-rose-500/10" },
    { label: "Top Andrea", tooltip: "Favorito actual según el perfil conservador/indexado", value: andreaTop.ticker, icon: <TrendingUp />, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Top Pablo Gil", tooltip: "Favorito actual según el análisis macro y volatilidad", value: pabloTop.ticker, icon: <Zap />, color: "text-orange-400", bg: "bg-orange-500/10" },
  ];

  return (
    <div id={id} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} title={card.tooltip} className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center hover:bg-slate-800 transition-colors cursor-help">
          <div className={`p-2 rounded-xl ${card.bg} ${card.color} mb-3`}>
            {React.cloneElement(card.icon as React.ReactElement, { size: 18 })}
          </div>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{card.label}</span>
          <span className="text-lg font-bold text-white mt-1">{card.value}</span>
          {card.sub && <span className="text-[10px] text-slate-400 font-mono">{card.sub}</span>}
        </div>
      ))}
    </div>
  );
};
