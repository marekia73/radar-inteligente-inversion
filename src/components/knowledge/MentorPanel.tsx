import React from "react";
import { MentorProfile } from "../../types";
import { User, Shield, Target, AlertTriangle } from "lucide-react";
import { SectionCard } from "../ui/SectionCard";
import { Badge } from "../ui/Badge";

interface MentorPanelProps {
  mentors: MentorProfile[];
  id?: string;
}

export const MentorPanel: React.FC<MentorPanelProps> = ({ mentors, id }) => {
  return (
    <div id={id} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {mentors.map(mentor => (
        <SectionCard key={mentor.id} className="border-violet-500/10">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${mentor.id === 'andrea_redondo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{mentor.name}</h3>
                <Badge variant="mentor">Mentor</Badge>
              </div>
              <p className="text-sm text-slate-400 mt-1 italic">{mentor.style}</p>
              <p className="text-sm text-slate-300 mt-3">{mentor.description}</p>
              
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1 mb-2">
                    <Shield className="w-3 h-3" /> Principios
                  </h4>
                  <ul className="space-y-1">
                    {mentor.principles.slice(0, 3).map((p, i) => (
                      <li key={i} className="text-xs text-slate-400">• {p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1 mb-2">
                    <AlertTriangle className="w-3 h-3" /> Red Flags
                  </h4>
                  <ul className="space-y-1">
                    {mentor.redFlags.slice(0, 3).map((p, i) => (
                      <li key={i} className="text-xs text-slate-400">• {p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      ))}
    </div>
  );
};
