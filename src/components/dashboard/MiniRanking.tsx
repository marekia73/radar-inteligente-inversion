import React from "react";
import { ProcessedAsset } from "../../types";
import { Badge } from "../ui/Badge";

interface MiniRankingProps {
  title: string;
  assets: ProcessedAsset[];
  scoreKey: "shortTermScore" | "mediumTermScore" | "longTermScore" | "opportunityScore" | "andreaScore" | "pabloScore";
  onSelect: (asset: ProcessedAsset) => void;
  id?: string;
  limit?: number;
}

export const MiniRanking: React.FC<MiniRankingProps> = ({ title, assets, scoreKey, onSelect, id, limit = 5 }) => {
  const sorted = [...assets]
    .sort((a, b) => (b[scoreKey] as number) - (a[scoreKey] as number))
    .slice(0, limit);

  return (
    <div id={id} className="bg-slate-900 border border-white/5 rounded-2xl p-5 mb-6">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
        {title}
      </h4>
      <div className="space-y-3">
        {sorted.map((asset, index) => (
          <div 
            key={asset.id} 
            className="flex items-center justify-between group cursor-pointer"
            onClick={() => onSelect(asset)}
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-slate-600">0{index + 1}</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{asset.ticker}</span>
                <span className="text-[9px] text-slate-500">{asset.type}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">{(asset[scoreKey] as number)}</span>
              <div className={`w-1 h-3 rounded-full ${index === 0 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
