import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from './Navbar';
import { SchoolClass, Profile } from '../types';
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
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Database,
  LogIn,
  LogOut,
  Sparkles,
  Layers,
  ChevronDown,
  Plus,
  FileSpreadsheet,
  CloudUpload,
  CloudCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface ModernLayoutProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab, classId?: string) => void;
  assignedClasses: SchoolClass[];
  selectedClassId?: string | null;
  profile: Profile;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onOpenLogin?: () => void;
  onOpenImportModal?: () => void;
  onOpenAddClassModal?: () => void;
  children: React.ReactNode;
}

export const ModernLayout: React.FC<ModernLayoutProps> = ({
  activeTab,
  onSelectTab,
  assignedClasses,
  selectedClassId,
  profile,
  onOpenAuth,
  onOpenSettings,
  onOpenLogin,
  onOpenImportModal,
  onOpenAddClassModal,
  children,
}) => {
  const { user, isAuthenticated, logout, isFirebaseConnected, firebaseUser, loginWithGoogle, forceUploadToFirebase } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    setSyncFeedback(null);
    const res = await loginWithGoogle();
    setIsConnectingGoogle(false);
    if (res.success) {
      setSyncFeedback('تم ربط حساب Google ومزامنة كافة البيانات مع Firebase بنجاح!');
      setTimeout(() => setSyncFeedback(null), 4000);
    } else {
      alert(res.error || 'فشل الاتصال بـ Google');
    }
  };

  const handleSyncNow = async () => {
    setIsSyncingNow(true);
    setSyncFeedback(null);
    const res = await forceUploadToFirebase();
    setIsSyncingNow(false);
    if (res.success) {
      setSyncFeedback(`تم رفع ومزامنة ${res.count} عنصراً مع Firebase بنجاح!`);
      setTimeout(() => setSyncFeedback(null), 4000);
    } else {
      alert(res.error || 'حدث خطأ أثناء المزامنة');
    }
  };

  // Grouped Navigation Structure for maximum clarity and ease of use
  const navSections = [
    {
      group: 'الملاحة العامة',
      items: [
        { id: 'dashboard' as ActiveTab, label: 'لوحة التحكم العامة', icon: LayoutDashboard },
        { id: 'classes' as ActiveTab, label: 'الأقسام والتلاميذ', icon: Users, badge: assignedClasses.length },
      ],
    },
    {
      group: 'العمل البيداغوجي اليومي',
      items: [
        { id: 'grading' as ActiveTab, label: 'دفتر التنقيط والتقويم', icon: GraduationCap },
        { id: 'attendance' as ActiveTab, label: 'المتابعة والغيابات', icon: CalendarCheck },
        { id: 'lesson' as ActiveTab, label: 'الدفتر اليومي والجذاذات', icon: BookOpen },
        { id: 'pedagogical' as ActiveTab, label: 'الدفتر البيداغوجي', icon: FolderKanban },
      ],
    },
    {
      group: 'التقويم والنشاط الرياضي',
      items: [
        { id: 'tests' as ActiveTab, label: 'الاختبارات البدنية', icon: Activity },
        { id: 'stats' as ActiveTab, label: 'الإحصائيات والكشوفات', icon: BarChart3 },
        { id: 'equipment' as ActiveTab, label: 'العتاد والمعدات', icon: Dumbbell },
      ],
    },
    {
      group: 'التنظيم والإدارة',
      items: [
        { id: 'injuries' as ActiveTab, label: 'سجل الحوادث والإصابات', icon: ShieldAlert },
        { id: 'regulations' as ActiveTab, label: 'النصوص القانونية', icon: Scale },
        { id: 'settings' as ActiveTab, label: 'إعدادات المؤسسة', icon: Settings },
      ],
    },
  ];

  // Current active label for Top Bar
  const allNavItems = navSections.flatMap((s) => s.items);
  const currentItem = allNavItems.find((i) => i.id === activeTab);

  const selectedClass = assignedClasses.find((c) => c.id === selectedClassId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 text-right selection:bg-emerald-600 selection:text-white">
      {/* Official Top State Banner */}
      <div className="bg-emerald-900 text-white text-[11px] py-1 px-4 no-print border-b border-emerald-950">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-emerald-200 text-[10px]">
            <span>مديرية التربية لولاية {profile.wilaya || 'غليزان'}</span>
            <span>·</span>
            <span>{profile.school_name || 'ثانوية أول نوفمبر 1954'}</span>
            <span>·</span>
            <span>الموسم: {profile.academic_year}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Collapsible Modern Sidebar */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-l border-slate-200/90 shadow-sm transition-all duration-300 z-30 ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Sidebar Header Brand */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-sm shadow-emerald-700/20 shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="5" r="2.5" />
                    <path d="M7 21l3-7 3-3 4 2 3-1" />
                    <path d="M10 14l-3-2-3 2" />
                    <path d="M13 11l-2 5-4 5" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">
                    <span className="text-emerald-700">EPS</span> <span className="text-slate-800">DZ</span>
                  </h1>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    التربية البدنية والرياضية
                  </p>
                </div>
              </div>
            )}

            {isSidebarCollapsed && (
              <div className="mx-auto w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-sm shrink-0">
                <span className="font-black text-xs">EPS</span>
              </div>
            )}

            {/* Collapse toggle */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={isSidebarCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
            >
              {isSidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                {!isSidebarCollapsed && (
                  <p className="px-2.5 text-[10px] font-bold text-slate-400 tracking-wider">
                    {section.group}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectTab(item.id)}
                        title={isSidebarCollapsed ? item.label : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        {!isSidebarCollapsed && <span className="flex-1 text-right truncate">{item.label}</span>}
                        {!isSidebarCollapsed && typeof item.badge === 'number' && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                              isActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
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
            ))}
          </div>

          {/* Sidebar Footer Teacher Profile */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            {!isSidebarCollapsed ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                      {profile.full_name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">{profile.full_name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{profile.school_name || 'ثانوية أول نوفمبر 1954'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {onOpenLogin && (
                      <button
                        type="button"
                        onClick={onOpenLogin}
                        title="لوحة تسجيل الدخول / تبديل الحساب"
                        className="p-1 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                      </button>
                    )}
                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={logout}
                        title="تسجيل الخروج والعودة للوحة الدخول"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-medium"
                  >
                    <Database className="w-3 h-3 text-slate-400" />
                    <span>{isFirebaseConnected ? 'Firebase سحابي' : 'غير متصل بالسحابة'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="text-emerald-700 hover:underline font-bold"
                  >
                    الإعدادات
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  {profile.full_name.charAt(0)}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Sleek Top Header Bar */}
          <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 sticky top-0 z-20 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Title & Current Breadcrumb */}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                    {currentItem?.icon && <currentItem.icon className="w-4 h-4 text-emerald-700 hidden sm:inline" />}
                    <span>{currentItem?.label || 'لوحة التحكم'}</span>
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  الموسم الدراسي: {profile.academic_year} · {profile.school_name || 'ثانوية أول نوفمبر 1954'}
                </p>
              </div>
            </div>

            {/* Quick Class Switcher & Quick Actions */}
            <div className="flex items-center gap-2.5">
              {/* Active Class Switcher Dropdown */}
              {assignedClasses.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{selectedClass ? selectedClass.name : 'جميع الأقسام'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {isClassDropdownOpen && (
                    <div className="absolute left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-right animate-in fade-in">
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-100">
                        الانتقال السريع لقسم:
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsClassDropdownOpen(false);
                          onSelectTab('classes');
                        }}
                        className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 text-right flex items-center justify-between"
                      >
                        <span>عرض قائمة كل الأقسام</span>
                        <span className="text-[10px] text-slate-400 font-mono">({assignedClasses.length})</span>
                      </button>
                      <div className="border-t border-slate-100 my-1"></div>
                      {assignedClasses.map((cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                            setIsClassDropdownOpen(false);
                            onSelectTab('classes', cls.id);
                          }}
                          className={`w-full px-3 py-1.5 text-xs text-right flex items-center justify-between hover:bg-emerald-50 ${
                            selectedClassId === cls.id ? 'bg-emerald-50/80 text-emerald-800 font-bold' : 'text-slate-700 font-medium'
                          }`}
                        >
                          <span>{cls.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{cls.student_count} تلميذ</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Action Button */}
              {onOpenImportModal && (
                <button
                  type="button"
                  onClick={onOpenImportModal}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>استيراد إكسل</span>
                </button>
              )}

              {onOpenAddClassModal && (
                <button
                  type="button"
                  onClick={onOpenAddClassModal}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">قسم جديد</span>
                </button>
              )}

              {onOpenLogin && (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-600 bg-slate-50 hover:bg-emerald-50/50 text-slate-800 text-xs font-bold transition-all group"
                  title="فتح لوحة تسجيل الدخول أو تبديل حساب الأستاذ"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">
                    {profile.full_name ? profile.full_name.charAt(0) : 'أ'}
                  </div>
                  <span className="hidden md:inline font-medium text-slate-700 group-hover:text-emerald-800">
                    لوحة الدخول
                  </span>
                  <LogIn className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
                </button>
              )}
            </div>
          </header>

          {/* Cloud Synchronization Status Banner */}
          {!isFirebaseConnected ? (
            <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 sm:px-6 py-2.5 text-amber-950 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                <span className="font-extrabold text-amber-900">تنبيه المزامنة السحابية (Firebase):</span>
                <span className="text-amber-800 font-medium">
                  أنت تعمل في الوضع المحلي. لن تظهر بيانات الأقسام والتلاميذ على أجهزتك الأخرى حتى تسجل الدخول بحساب Google.
                </span>
              </div>
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isConnectingGoogle}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <CloudUpload className="w-4 h-4" />
                <span>{isConnectingGoogle ? 'جاري الاتصال بـ Google...' : 'ربط Google ومزامنة السحابة الآن'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50 border-b border-emerald-200/80 px-4 sm:px-6 py-1.5 text-emerald-900 text-[11px] flex flex-wrap items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span className="font-bold">قاعدة بيانات Firebase متصلة:</span>
                <span className="text-emerald-800 font-mono text-[10px] bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200">
                  ai-studio-epsdz · {firebaseUser?.email || 'Google Account'}
                </span>
                <span className="text-emerald-700 font-medium hidden sm:inline">
                  (المزامنة الحية نشطة لكل أجهزتك)
                </span>
              </div>
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncingNow}
                className="text-emerald-700 hover:text-emerald-950 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingNow ? 'animate-spin' : ''}`} />
                <span>{isSyncingNow ? 'جاري الرفع...' : 'رفع البيانات للسحابة الآن'}</span>
              </button>
            </div>
          )}

          {/* Temporary sync feedback message */}
          {syncFeedback && (
            <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center animate-in fade-in">
              {syncFeedback}
            </div>
          )}

          {/* Main Body Viewport */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto mb-16 lg:mb-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Drawer Navigation (When menu clicked) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col p-4 text-right z-50 animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  EPS
                </div>
                <span className="font-bold text-sm text-slate-900">القائمة الرئيسية</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-4">
              {navSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 px-2">{section.group}</p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            onSelectTab(item.id);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="flex-1 text-right">{item.label}</span>
                          {typeof item.badge === 'number' && (
                            <span className="text-[10px] px-1.5 rounded-full font-mono bg-emerald-700 text-white">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs">
              <p className="font-bold text-slate-800">{profile.full_name}</p>
              <p className="text-[11px] text-slate-500">{profile.school_name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (4 high-frequency buttons) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg lg:hidden no-print">
        <div className="grid grid-cols-5 h-14">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'dashboard' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px]">الرئيسية</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('classes')}
            className={`flex flex-col items-center justify-center gap-0.5 relative ${
              activeTab === 'classes' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px]">الأقسام</span>
            {assignedClasses.length > 0 && (
              <span className="absolute top-1.5 right-6 w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[8px] flex items-center justify-center font-bold">
                {assignedClasses.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('grading')}
            className={`flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'grading' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span className="text-[10px]">التنقيط</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('attendance')}
            className={`flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'attendance' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span className="text-[10px]">المتابعة</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 text-slate-500"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[10px]">المزيد</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
