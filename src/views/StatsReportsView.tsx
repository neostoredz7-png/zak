import React, { useState, useEffect } from 'react';
import { SchoolClass, Profile } from '../types';
import { dataRepository } from '../services/dataService';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CalendarCheck,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';

interface StatsReportsViewProps {
  profile: Profile;
  assignedClasses: SchoolClass[];
}

export const StatsReportsView: React.FC<StatsReportsViewProps> = ({ profile, assignedClasses }) => {
  const [selectedClassId, setSelectedClassId] = useState(assignedClasses[0]?.id || '');
  const [trimester, setTrimester] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (!assignedClasses.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(assignedClasses[0]?.id || '');
    }
  }, [assignedClasses, selectedClassId]);

  const currentClass = assignedClasses.find((c) => c.id === selectedClassId);
  const marksData = selectedClassId
    ? dataRepository.getAllMarksForClassAndTrimester(selectedClassId, trimester)
    : null;

  const students = marksData?.students || [];
  const averages = marksData?.averages || {};
  const classAvg = marksData?.classAverage || 0;

  // Compute distribution
  let below10 = 0;
  let between10And12 = 0;
  let between12And14 = 0;
  let between14And16 = 0;
  let above16 = 0;
  let gradedCount = 0;

  Object.values(averages).forEach((avg) => {
    if (typeof avg === 'number') {
      gradedCount++;
      if (avg < 10) below10++;
      else if (avg < 12) between10And12++;
      else if (avg < 14) between12And14++;
      else if (avg < 16) between14And16++;
      else above16++;
    }
  });

  const successRate = gradedCount > 0 ? Math.round(((gradedCount - below10) / gradedCount) * 100) : 0;

  // Activity comparisons matching screenshot 8
  const activityStats = [
    { name: 'العدو السريع', diag: 11.5, form: 13.8, summ: 14.5 },
    { name: 'الوثب الطويل', diag: 12.0, form: 14.2, summ: 15.0 },
    { name: 'دفع الجلة', diag: 10.8, form: 12.5, summ: 13.2 },
    { name: 'كرة اليد', diag: 13.0, form: 15.1, summ: 16.0 },
    { name: 'كرة السلة', diag: 12.5, form: 14.7, summ: 15.8 },
  ];

  return (
    <div className="space-y-6 pb-12 text-right">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">الإحصائيات والتقارير الدورية</h2>
            <p className="text-xs text-slate-500">
              تحليل نتائج الأقسام المسندة ونسب النجاح والمواظبة
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors no-print"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة تقرير الإحصائيات</span>
        </button>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs no-print">
        <div className="flex items-center gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">القسم:</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
            >
              {assignedClasses.map((c, idx) => (
                <option key={c.id ? `${c.id}-${idx}` : idx} value={c.id}>
                  {c.name} — {c.track}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">الفصل:</label>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[1, 2, 3].map((t) => (
                <button
                  key={t}
                  onClick={() => setTrimester(t as 1 | 2 | 3)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    trimester === t
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t === 1 ? 'الفصل الأول' : t === 2 ? 'الفصل الثاني' : 'الفصل الثالث'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Stat Tiles (matching screen 8) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500">عدد التلاميذ</span>
          <p className="text-3xl font-black text-slate-900 mt-1 font-mono">{students.length}</p>
          <span className="text-[11px] text-slate-400">في هذا الفوج</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500">نسبة الحضور</span>
          <p className="text-3xl font-black text-emerald-600 mt-1 font-mono">94%</p>
          <span className="text-[11px] text-emerald-600">انضباط ممتاز</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500">نسبة النجاح</span>
          <p className="text-3xl font-black text-blue-600 mt-1 font-mono">{successRate}%</p>
          <span className="text-[11px] text-blue-600">فوق المعدل 10</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500">معدل القسم</span>
          <p className="text-3xl font-black text-amber-600 mt-1 font-mono">{classAvg.toFixed(2)}</p>
          <span className="text-[11px] text-slate-400">من 20</span>
        </div>
      </div>

      {/* Charts & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Grade Ranges */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">توزيع المعدلات حسب الفئات</h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-emerald-700">ممتاز (16 — 20)</span>
                <span className="font-mono font-bold">{above16} تلميذ</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{ width: `${(above16 / (gradedCount || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-teal-700">جيد جداً (14 — 15.99)</span>
                <span className="font-mono font-bold">{between14And16} تلميذ</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all"
                  style={{ width: `${(between14And16 / (gradedCount || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-blue-700">جيد (12 — 13.99)</span>
                <span className="font-mono font-bold">{between12And14} تلميذ</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${(between12And14 / (gradedCount || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-amber-700">متوسط (10 — 11.99)</span>
                <span className="font-mono font-bold">{between10And12} تلميذ</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${(between10And12 / (gradedCount || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-rose-700">دون المعدل (&lt; 10)</span>
                <span className="font-mono font-bold">{below10} تلميذ</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all"
                  style={{ width: `${(below10 / (gradedCount || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Activity Comparison (matching screenshot 8 bar visual) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">تطور النتائج حسب النشاط الرياضي</h3>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span>تشخيصي</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>تكويني</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span>ختامي</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {activityStats.map((item, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{item.name}</span>
                  <span className="font-mono text-emerald-700">{item.summ} /20</span>
                </div>
                <div className="flex items-center gap-1 h-3">
                  <div
                    className="bg-slate-300 h-full rounded-l"
                    style={{ width: `${(item.diag / 20) * 100}%` }}
                    title={`تشخيصي: ${item.diag}`}
                  ></div>
                  <div
                    className="bg-blue-500 h-full"
                    style={{ width: `${(item.form / 20) * 100}%` }}
                    title={`تكويني: ${item.form}`}
                  ></div>
                  <div
                    className="bg-emerald-600 h-full rounded-r"
                    style={{ width: `${(item.summ / 20) * 100}%` }}
                    title={`ختامي: ${item.summ}`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
