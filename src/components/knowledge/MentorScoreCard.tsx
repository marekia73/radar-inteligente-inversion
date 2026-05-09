import React from "react";
import { MentorScore, MentorProfile } from "../../types";
import { ScorePill } from "../ui/ScorePill";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface MentorScoreCardProps {
  mentorScore: MentorScore;
  mentor: MentorProfile;
  id?: string;
}

export const MentorScoreCard: React.FC<MentorScoreCardProps> = ({ mentorScore, mentor, id }) => {
  return (
    <div id={id} className="bg-slate-800/50 rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-xs">
            {mentor.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">{mentor.name}</h4>
            <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Análisis de Mentor</span>
          </div>
        </div>
        <ScorePill score={mentorScore.score} label={mentorScore.label} size="sm" />
      </div>
      
      <p className="text-sm text-slate-300 mb-4 h-12 line-clamp-3">
        {mentorScore.explanation}
      </p>

      {mentorScore.warnings.length > 0 && (
        <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
          {mentorScore.warnings.map((warning, index) => (
            <div key={index} className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/5 p-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
      
      {mentorScore.warnings.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/5 p-2 rounded-lg mt-4">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Cumple con los principios básicos del mentor.</span>
        </div>
      )}
    </div>
  );
};
