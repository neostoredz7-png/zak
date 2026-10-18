import React, { useState } from 'react';
import { TeachingUnit, Lesson } from '../types';
import { dataRepository } from '../services/dataService';
import {
  FolderKanban,
  BookOpen,
  Calendar,
  Layers,
  Search,
  CheckCircle,
  Plus,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react';

export const PedagogicalUnitsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'units' | 'annual' | 'bank'>('units');
  const [selectedGrade, setSelectedGrade] = useState<'1AS' | '2AS' | '3AS'>('3AS');
  const [searchQuery, setSearchQuery] = useState('');

  const units = dataRepository.getTeachingUnits();
  const lessons = dataRepository.getLessons();

  const lessonBank = [
    {
      id: 'b-1',
      title: 'العدو السريع — الحصة 01: الانطلاق',
      sport: 'العدو السريع',
      unit: 'ألعاب القوى',
      grade: '3AS',
      objective: 'التعرف على أوامر الانطلاق والوضعية السليمة في المنطلق',
    },
    {
      id: 'b-2',
      title: 'العدو السريع — الحصة 02: وضعية الانطلاق',
      sport: 'العدو السريع',
      unit: 'ألعاب القوى',
      grade: '3AS',
      objective: 'تثبيت زاوية الخروج 45 درجة ودفع المنطلق بقوة',
    },
    {
      id: 'b-3',
      title: 'العدو السريع — الحصة 03: التسارع',
      sport: 'العدو السريع',
      unit: 'ألعاب القوى',
      grade: '3AS',
      objective: 'تطوير وتيرة الخطوة والتسارع التدريجي على مسافة 30 متراً',
    },
    {
      id: 'b-4',
      title: 'العدو السريع — الحصة 04: الحفاظ على السرعة',
      sport: 'العدو السريع',
      unit: 'ألعاب القوى',
      grade: '3AS',
      objective: 'الحفاظ على السرعة القصوى والتوازن الحركي حتى خط النهاية',
    },
    {
      id: 'b-5',
      title: 'العدو السريع — الحصة 05: سباق تطبيقي',
      sport: 'العدو السريع',
      unit: 'ألعاب القوى',
      grade: '3AS',
      objective: 'سباق تنافسي فردي في أروقة مخصصة مع قياس الزمن',
    },
    {
      id: 'b-6',
      title: 'الوثب الطويل — الحصة 01: الاقتراب والارتقاء',
      sport: 'الوثب الطويل',
      unit: 'ألعاب القوى',
      grade: '3AS',
      objective: 'ضبط علامة الانطلاق وخطوات الاقتراب السريعة',
    },
    {
      id: 'b-7',
      title: 'دفع الجلة — الحصة 01: مسك ووقفة الاستعداد',
      sport: 'دفع الجلة',
      unit: 'ألعاب القوى',
      grade: '3AS',
      objective: 'التموضع السليم في دائرة الرمي وتوجيه الدفع بزاوية مثالية',
    },
    {
      id: 'b-8',
      title: 'كرة السلة — الحصة 01: التمرير والمحاورة',
      sport: 'كرة السلة',
      unit: 'الرياضات الجماعية',
      grade: '3AS',
      objective: 'التمرير الصدري والتنقل بالكرة دون ارتكاب مخالفة المشي',
    },
    {
      id: 'b-9',
      title: 'كرة اليد — الحصة 01: التمرير والتحرك في الفضاء',
      sport: 'كرة اليد',
      unit: 'الرياضات الجماعية',
      grade: '3AS',
      objective: 'خلق خطوط التمرير وبناء الهجمة السريعة المنظمة',
    },
  ];

  const filteredBank = lessonBank.filter(
    (item) =>
      item.title.includes(searchQuery) ||
      item.sport.includes(searchQuery) ||
      item.objective.includes(searchQuery)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">الدفتر البيداغوجي والتخطيط السنوي</h2>
            <p className="text-xs text-slate-500">
              الوحدات التعلمية وبنك الجذاذات لمرحلة التعليم الثانوي بالجزائر
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('units')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'units' ? 'bg-purple-700 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الوحدات التعلمية
          </button>
          <button
            onClick={() => setActiveTab('annual')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'annual' ? 'bg-purple-700 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            التخطيط السنوي
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'bank' ? 'bg-purple-700 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            بنك الجذاذات
          </button>
        </div>
      </div>

      {/* Tab 1: Units View (matches screen 5) */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {units.map((unit, idx) => (
              <div
                key={unit.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-purple-300 transition-all text-right space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                    {unit.sport_family}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">3AS</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{unit.title}</h3>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500 mb-1">الأنشطة المبرمجة:</p>
                  {unit.sports.map((sp, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                      <span>{sp}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Annual Planning (matches screen 6) */}
      {activeTab === 'annual' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 text-right">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                التوزيع السنوي لمنهاج التربية البدنية والرياضية — السنة الثالثة ثانوي
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                توزيع فصلي متوازن بين الأنشطة الفردية (ألعاب القوى) والأنشطة الجماعية والبدنية
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-lg text-slate-700">
              2026 / 2027
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* الفصل الأول */}
            <div className="border border-emerald-200 bg-emerald-50/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-900">الفصل الأول</h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">12 أسبوعاً</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <p className="font-bold text-slate-900">الوحدة 1: ألعاب القوى</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">العدو السريع (الانطلاق، التسارع، السرعة القصوى) + الوثب الطويل</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <p className="font-bold text-slate-900">التقويم والقياس</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">اختبار كوبر الميداني للتحمل + تقويم ختامي</p>
                </div>
              </div>
            </div>

            {/* الفصل الثاني */}
            <div className="border border-blue-200 bg-blue-50/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-900">الفصل الثاني</h4>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">11 أسبوعاً</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                  <p className="font-bold text-slate-900">الوحدة 2: الرياضات الجماعية</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">كرة السلة (التنقل، التصويب) أو كرة اليد (الهجوم المنظم)</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                  <p className="font-bold text-slate-900">اللياقة والتحضير</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">تمارين القوة الانفجارية والرشاقة والتناسق</p>
                </div>
              </div>
            </div>

            {/* الفصل الثالث */}
            <div className="border border-purple-200 bg-purple-50/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-purple-900">الفصل الثالث</h4>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">8 أسابيع</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                  <p className="font-bold text-slate-900">الوحدة 3: التقييم النهائي والرمي</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">دفع الجلة والتحضير لامتحان شهادة البكالوريا</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                  <p className="font-bold text-slate-900">كشوف النقاط النهائية</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">المداولات، تثبيت المعدلات السنوية وإحصائيات النجاح</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Lesson Bank (matches screen 7 in image.png) */}
      {activeTab === 'bank' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في بنك الجذاذات (مثال: العدو السريع، كرة السلة، الوثب الطويل)..."
                className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredBank.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-purple-300 transition-all flex items-center justify-between text-right group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                      {item.grade}
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      {item.unit}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500">{item.objective}</p>
                </div>

                <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-purple-50 flex items-center justify-center text-slate-400 group-hover:text-purple-700 transition-colors shrink-0">
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
