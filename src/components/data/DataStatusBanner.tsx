import React from 'react';
import { Database, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { DataQuality } from '../../types';
import { DATA_PROVIDER_MODE } from '../../services/dataProviderConfig';

interface DataStatusBannerProps {
  quality: DataQuality;
  isRefreshing?: boolean;
}

const statusTranslations: Record<string, string> = {
  "real": "Real",
  "cache": "Real en caché",
  "simulated": "Simulado",
  "partial": "Parcial",
  "error": "Error"
};

export const DataStatusBanner: React.FC<DataStatusBannerProps> = ({ quality, isRefreshing }) => {
  const isAllMock = quality.marketDataStatus === "simulated" && quality.macroDataStatus === "simulated";
  const hasError = quality.marketDataStatus === "error" || quality.macroDataStatus === "error";

  const getStatusColor = () => {
    if (hasError) return "text-red-400 bg-red-400/10 border-red-500/30";
    if (isAllMock) return "text-amber-400 bg-amber-400/10 border-amber-500/30";
    return "text-emerald-400 bg-emerald-400/10 border-emerald-500/30";
  };

  const getStatusIcon = () => {
    if (isRefreshing) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (hasError) return <AlertTriangle className="w-4 h-4" />;
    if (isAllMock) return <Database className="w-4 h-4" />;
    return <CheckCircle2 className="w-4 h-4" />;
  };

  return (
    <div className={`mt-4 px-4 py-2 border rounded-lg flex items-center gap-3 text-sm flex-wrap ${getStatusColor()}`}>
      {getStatusIcon()}
      <div className="flex-1 flex gap-4 flex-wrap">
        <span className="font-medium">
          Datos de Mercado: <strong>
            {statusTranslations[quality.marketDataStatus] || quality.marketDataStatus}
            {quality.isMarketRateLimited && quality.marketDataStatus === "simulated" && " por límite de Alpha"}
          </strong>
        </span>
        <span className="font-medium">
          Datos Macro: <strong>{statusTranslations[quality.macroDataStatus] || quality.macroDataStatus}</strong>
        </span>
      </div>
      <div className="text-xs opacity-80 w-full md:w-auto mt-2 md:mt-0 flex flex-col gap-1">
        {quality.isMarketRateLimited ? (
          <span className="text-amber-300">
            El proveedor de mercado (Yahoo Finance u otro) está limitando temporalmente las consultas o presenta errores. Se están utilizando datos en caché o simulados para mantener la experiencia educativa.
          </span>
        ) : (
          <span>Los datos pueden proceder de API real, caché o simulación de seguridad.</span>
        )}
        <span className="block text-[11px] opacity-90">
          💡 <strong>Caché</strong> significa que se usa el último dato real guardado para no consumir llamadas innecesarias.
        </span>
      </div>
    </div>
  );
};

