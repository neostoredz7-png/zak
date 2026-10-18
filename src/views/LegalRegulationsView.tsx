import React, { useState } from 'react';
import { LegalRegulation } from '../types';
import { dataRepository } from '../services/dataService';
import { Scale, FileText, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export const LegalRegulationsView: React.FC = () => {
  const regulations = dataRepository.getRegulations();
  const [expandedId, setExpandedId] = useState<string | null>(regulations[0]?.id || null);

  return (
    <div className="space-y-6 pb-12 text-right">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-700 text-white flex items-center justify-center shadow-sm">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">النصوص التشريعية والمناشير الوزارية</h2>
            <p className="text-xs text-slate-500">
              المرجعية القانونية الرسمية لمادة التربية البدنية والرياضية في الجزائر
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {regulations.map((reg) => {
          const isExpanded = expandedId === reg.id;
          return (
            <div
              key={reg.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : reg.id)}
                className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded">
                      {reg.reference_number}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{reg.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{reg.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{reg.summary}</p>
                </div>

                <div className="p-1 rounded-lg bg-slate-100 text-slate-500 shrink-0 mt-1">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-700 space-y-2 leading-relaxed">
                  <span className="font-bold text-slate-900 block">فحوى النص القانوني:</span>
                  <p className="p-3 bg-white rounded-xl border border-slate-200 whitespace-pre-line font-medium">
                    {reg.full_content}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
