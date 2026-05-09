import React from "react";
import { AlertTriangle, Info } from "lucide-react";

interface WarningBannerProps {
  message: string;
  type?: "warning" | "info" | "critical";
  id?: string;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({ message, type = "warning", id }) => {
  const styles = {
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-200",
    info: "bg-sky-500/10 border-sky-500/30 text-sky-200",
    critical: "bg-rose-500/20 border-rose-500/40 text-rose-100"
  };

  return (
    <div id={id} className={`flex items-start gap-4 p-4 rounded-xl border ${styles[type]} mb-6`}>
      {type === "info" ? (
        <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-sky-400" />
      ) : (
        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-400" />
      )}
      <div className="text-sm leading-relaxed">
        {message}
      </div>
    </div>
  );
};
