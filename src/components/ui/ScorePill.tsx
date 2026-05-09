import React from "react";

interface ScorePillProps {
  score: number; // 0-100
  label?: string;
  size?: "sm" | "md" | "lg";
  id?: string;
}

export const ScorePill: React.FC<ScorePillProps> = ({ score, label, size = "md", id }) => {
  const getColorClasses = (val: number) => {
    if (val >= 80) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (val >= 60) return "bg-lime-500/20 text-lime-400 border-lime-500/30";
    if (val >= 40) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    if (val >= 20) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    return "bg-rose-500/20 text-rose-400 border-rose-500/30";
  };

  const getBarColor = (val: number) => {
    if (val >= 80) return "bg-emerald-500";
    if (val >= 60) return "bg-lime-500";
    if (val >= 40) return "bg-amber-500";
    if (val >= 20) return "bg-orange-500";
    return "bg-rose-500";
  };

  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-lg font-bold"
  };

  return (
    <div id={id} className={`inline-flex flex-col items-center gap-1`}>
      <div className={`rounded-xl border flex flex-col items-center justify-center min-w-[3.5rem] ${sizeStyles[size]} ${getColorClasses(score)}`}>
        <span className="font-mono">{score}</span>
        {label && <span className="text-[10px] uppercase tracking-tighter opacity-70 mt-0.5">{label}</span>}
      </div>
      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-0.5">
        <div 
          className={`h-full ${getBarColor(score)} transition-all duration-1000`} 
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};
