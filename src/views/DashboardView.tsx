import React from 'react';
import { SchoolClass, Student, Profile } from '../types';
import { ActiveTab } from '../components/Navbar';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  BookOpen,
  FolderKanban,
  Activity,
  BarChart3,
  Dumbbell,
  ShieldAlert,
  Scale,
  Settings,
  Printer,
  ChevronLeft,
  ArrowUpRight,
  TrendingUp,
  Award,
  Sparkles,
  Layers,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

interface DashboardViewProps {
  profile: Profile;
  assignedClasses: SchoolClass[];
  totalStudentsInAssigned: number;
  overallAverage: number;
  attendanceRate: number;
  onNavigate: (tab: ActiveTab, classId?: string) => void;
  onOpenSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  assignedClasses,
  totalStudentsInAssigned,
  overallAverage,
  attendanceRate,
  onNavigate,
  onOpenSettings,
}) => {
  // Format current date in Arabic
  const todayStr = new Intl.DateTimeFormat('ar-DZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const quickActions = [
    {
      id: 'grading' as ActiveTab,
      title: 'دفتر التنقيط والتقويم',
      desc: 'رصد نقاط التقويم المستمر، الاختبارات والمعدلات',
      icon: GraduationCap,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      id: 'attendance' as ActiveTab,
      title: 'المتابعة والغيابات',
      desc: 'تسجيل الحضور، الغيابات، التأخرات والإعفاءات الطبية',
      icon: CalendarCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      id: 'lesson' as ActiveTab,
      title: 'الدفتر اليومي والجذاذات',
      desc: 'سجل الحصص اليومية، الأهداف الإجرائية والملاحظات',
      icon: BookOpen,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      id: 'pedagogical' as ActiveTab,
      title: 'الدفتر البيداغوجي',
      desc: 'التخطيط السنوي وتوزيع الوحدات التعليمية التعلّمية',
      icon: FolderKanban,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      id: 'tests' as ActiveTab,
      title: 'الاختبارات البدنية',
      desc: 'قياس القدرات البدنية (كوبر، السرعة، المداومة، الوثب)',
      icon: Activity,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      id: 'stats' as ActiveTab,
      title: 'الإحصائيات والطباعة الرسمية',
      desc: 'استخراج كشوف النقاط الرسمية والتقارير الإحصائية',
      icon: BarChart3,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
  ];

  return (
    <div className="space-y-6 pb-8 text-right">
      {/* 1. Hero Welcome Card with Athletic Gymnasium Backdrop */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800">
        <img
          src="/src/assets/images/eps_gymnasium_banner_1792338185170.jpg"
          alt="Gymnasium Sports Court"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        {/* Measured Contrast Scrim */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-emerald-950/80" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>{todayStr}</span>
              <span aria-hidden="true">·</span>
              <span>الموسم الدراسي: {profile.academic_year}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              أهلاً بك، أستاذ {profile.full_name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              منصة تسيير أستاذ مادة التربية البدنية والرياضية — {profile.school_name || 'ثانوية أول نوفمبر 1954'}{' '}
              (مديرية التربية لولاية {profile.wilaya || 'غليزان'}).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('classes')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>إدارة الأقسام والتلاميذ</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('lesson')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs backdrop-blur-sm flex items-center gap-2 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>تحضير حصة اليوم</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Strip (Tabular Numerals & High Scannability) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Classes KPI */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500">الأقسام المسندة</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums">
              {assignedClasses.length}
            </p>
            <p className="text-[11px] text-slate-400">أفواج تحت الإشراف</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Students KPI */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500">إجمالي التلاميذ</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums">
              {totalStudentsInAssigned}
            </p>
            <p className="text-[11px] text-slate-400">تلميذ متمدرس</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Attendance Rate KPI */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500">نسبة المواظبة والنشاط</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tabular-nums">
              {attendanceRate}%
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">مستوى حضور ممتاز</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Trimester Average KPI */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500">المعدل الفصلي العام</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono tabular-nums">
                {overallAverage.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ 20</span>
            </div>
            <p className="text-[11px] text-slate-400">الفصل الأول</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Quick Pedagogical Tools Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>الأدوات والخدمات البيداغوجية السريعة</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">وصول فوري لكافة الدفاتر والسجلات</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onNavigate(action.id)}
                className="bg-white hover:bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm text-right transition-all group flex items-start gap-3.5"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${action.color} transition-transform group-hover:scale-105`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                      {action.title}
                    </h3>
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 group-hover:-translate-x-0.5 transition-transform shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {action.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Assigned Classes Showcase */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-black text-slate-900">
              أقسامك المسندة لهذا الموسم ({assignedClasses.length} أقسام)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('classes')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
          >
            <span>إدارة وتعديل الأقسام</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {assignedClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {assignedClasses.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('classes', cls.id)}
                      className="text-sm font-black text-slate-900 hover:text-emerald-700 text-right leading-tight transition-colors"
                    >
                      {cls.name}
                    </button>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                      {cls.grade_level}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    {cls.track} · {cls.group_name}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono tabular-nums">{cls.student_count}</span>
                    <span className="text-slate-500 font-normal">تلميذ</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onNavigate('grading')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                    >
                      التنقيط
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('attendance')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                    >
                      الغيابات
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('classes', cls.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition-colors"
                    >
                      التفاصيل
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">لم يتم إسناد أي قسم لك بعد</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              يمكنك استيراد أقسام وتلاميذ المؤسسة مباشرة من ملف إكسل الرقمنة أو إضافة قسم يدوياً.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('classes')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
            >
              <span>الانتقال لإدارة الأقسام</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
