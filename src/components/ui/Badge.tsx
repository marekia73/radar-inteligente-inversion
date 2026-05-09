import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "neutral" | "mentor";
  className?: string;
  id?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "neutral", className = "", id }) => {
  const baseClasses = "px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide border";
  
  const variants = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    mentor: "bg-violet-500/10 text-violet-400 border-violet-500/20"
  };

  return (
    <span id={id} className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
