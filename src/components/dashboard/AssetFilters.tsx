import React from "react";
import { AssetType, Horizon, RiskLevel } from "../../types";
import { Search, Filter } from "lucide-react";

interface AssetFiltersProps {
  filters: {
    type: string;
    horizon: string;
    risk: string;
    search: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  id?: string;
}

export const AssetFilters: React.FC<AssetFiltersProps> = ({ filters, setFilters, id }) => {
  return (
    <div id={id} className="bg-slate-900 border border-white/5 p-4 rounded-2xl mb-6 flex flex-wrap items-center gap-4">
      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input 
          type="text"
          placeholder="Buscar por nombre o ticker..."
          className="w-full bg-slate-800 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          value={filters.search}
          onChange={(e) => setFilters((prev: any) => ({ ...prev, search: e.target.value }))}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500 mr-1" />
        
        <select 
          className="bg-slate-800 border border-white/5 rounded-xl py-2 px-3 text-xs text-slate-200 outline-none"
          value={filters.type}
          onChange={(e) => setFilters((prev: any) => ({ ...prev, type: e.target.value }))}
        >
          <option value="">Todos los tipos</option>
          {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select 
          className="bg-slate-800 border border-white/5 rounded-xl py-2 px-3 text-xs text-slate-200 outline-none"
          value={filters.horizon}
          onChange={(e) => setFilters((prev: any) => ({ ...prev, horizon: e.target.value }))}
        >
          <option value="">Cualquier horizonte</option>
          {Object.values(Horizon).map(h => <option key={h} value={h}>{h}</option>)}
        </select>

        <select 
          className="bg-slate-800 border border-white/5 rounded-xl py-2 px-3 text-xs text-slate-200 outline-none"
          value={filters.risk}
          onChange={(e) => setFilters((prev: any) => ({ ...prev, risk: e.target.value }))}
        >
          <option value="">Cualquier riesgo</option>
          {Object.values(RiskLevel).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
    </div>
  );
};
