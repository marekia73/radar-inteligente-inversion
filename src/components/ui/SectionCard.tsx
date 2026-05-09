import React from "react";
import { motion } from "motion/react";

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  id?: string;
  icon?: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ children, title, subtitle, className = "", id, icon }) => {
  return (
    <motion.div 
      id={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm ${className}`}
    >
      {(title || subtitle) && (
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              {icon}
              {title}
            </h3>}
            {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );
};
