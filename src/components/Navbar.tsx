import React from 'react';
import {
  LayoutDashboard,
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
  MoreHorizontal,
  Printer,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'classes'
  | 'grading'
  | 'attendance'
  | 'lesson'
  | 'pedagogical'
  | 'tests'
  | 'stats'
  | 'equipment'
  | 'injuries'
  | 'regulations'
  | 'settings'
  | 'reports';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  assignedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, assignedCount }) => {
  const [showMoreMobileMenu, setShowMoreMobileMenu] = React.useState(false);

  const mainNavItems = [
    { id: 'dashboard' as ActiveTab, label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'classes' as ActiveTab, label: 'الأقسام المسندة', icon: Users, badge: assignedCount },
    { id: 'grading' as ActiveTab, label: 'دفتر التنقيط', icon: GraduationCap },
    { id: 'attendance' as ActiveTab, label: 'المتابعة والغيابات', icon: CalendarCheck },
    { id: 'lesson' as ActiveTab, label: 'الدفتر اليومي', icon: BookOpen },
    { id: 'pedagogical' as ActiveTab, label: 'الدفتر البيداغوجي', icon: FolderKanban },
    { id: 'tests' as ActiveTab, label: 'الاختبارات البدنية', icon: Activity },
    { id: 'stats' as ActiveTab, label: 'الإحصائيات والتقارير', icon: BarChart3 },
    { id: 'equipment' as ActiveTab, label: 'العتاد الرياضي', icon: Dumbbell },
    { id: 'injuries' as ActiveTab, label: 'الحوادث والإصابات', icon: ShieldAlert },
    { id: 'regulations' as ActiveTab, label: 'النصوص القانونية', icon: Scale },
    { id: 'settings' as ActiveTab, label: 'إعدادات المؤسسة', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Navigation Ribbon */}
      <nav className="bg-slate-900 text-slate-200 border-b border-slate-800 shadow-sm hidden md:block no-print">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-emerald-800 text-white' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Matches Algerian poster bottom bar) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-lg md:hidden no-print">
        <div className="grid grid-cols-4 h-16">
          {/* 1. الرئيسية */}
          <button
            onClick={() => {
              setShowMoreMobileMenu(false);
              onSelectTab('dashboard');
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'dashboard' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[11px]">الرئيسية</span>
          </button>

          {/* 2. الأقسام */}
          <button
            onClick={() => {
              setShowMoreMobileMenu(false);
              onSelectTab('classes');
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
              activeTab === 'classes' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[11px]">الأقسام</span>
            {assignedCount > 0 && (
              <span className="absolute top-2 right-6 bg-emerald-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {assignedCount}
              </span>
            )}
          </button>

          {/* 3. دفتر التنقيط */}
          <button
            onClick={() => {
              setShowMoreMobileMenu(false);
              onSelectTab('grading');
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'grading' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-[11px]">التنقيط</span>
          </button>

          {/* 4. المزيد */}
          <button
            onClick={() => setShowMoreMobileMenu(!showMoreMobileMenu)}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              showMoreMobileMenu ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[11px]">المزيد</span>
          </button>
        </div>

        {/* Mobile "More" Drawer Menu */}
        {showMoreMobileMenu && (
          <div className="absolute bottom-16 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl p-4 max-h-[70vh] overflow-y-auto rounded-t-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="font-bold text-slate-800 text-sm">كافة دفاتر وسجلات الأستاذ</span>
              <button
                onClick={() => setShowMoreMobileMenu(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                إغلاق
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setShowMoreMobileMenu(false);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-colors text-right ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
