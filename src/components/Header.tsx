import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Database, LogIn, LogOut, CloudCheck, CloudUpload, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenAuth }) => {
  const { user, logout, isFirebaseConnected, firebaseUser, loginWithGoogle, forceUploadToFirebase } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const handleSyncNow = async () => {
    if (!isFirebaseConnected) {
      await loginWithGoogle();
      return;
    }
    setSyncing(true);
    setSyncMsg(null);
    const res = await forceUploadToFirebase();
    setSyncing(false);
    if (res.success) {
      setSyncMsg('تم رفع ومزامنة كافة البيانات إلى Firebase بنجاح!');
      setTimeout(() => setSyncMsg(null), 3000);
    } else {
      setSyncMsg(res.error || 'فشلت المزامنة');
      setTimeout(() => setSyncMsg(null), 3500);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 no-print select-none">
      {/* Algerian Republic Official Banner */}
      <div className="bg-emerald-800 text-white py-1.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية</span>
          </div>
          <div className="flex items-center gap-3 text-emerald-100">
            <span>مديرية التربية لولاية {user?.wilaya || 'غليزان'}</span>
            <span>·</span>
            <span>{user?.school_name || 'ثانوية أول نوفمبر 1954 - جديوية'}</span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 shrink-0">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="2.5" />
                <path d="M7 21l3-7 3-3 4 2 3-1" />
                <path d="M10 14l-3-2-3 2" />
                <path d="M13 11l-2 5-4 5" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  <span className="text-emerald-700">EPS</span> <span className="text-slate-800">DZ</span>
                </h1>
                <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2 py-0.5 rounded">
                  الطور الثانوي
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                تسيير أستاذ التربية البدنية والرياضية (تنظيم — متابعة — تقويم — تكوين)
              </p>
            </div>
          </div>

          {/* Teacher Badge & Cloud Status */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
            {/* Firebase Status Badge */}
            {isFirebaseConnected ? (
              <div className="flex items-center gap-2">
                <div
                  title={`قاعدة بيانات Firebase متصلة بحساب ${firebaseUser?.email || ''}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-emerald-50 text-emerald-800 border-emerald-200"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Database className="w-3.5 h-3.5" />
                  <span>Firebase سحابي</span>
                </div>

                <button
                  onClick={handleSyncNow}
                  disabled={syncing}
                  title="رفع وتحديث كل البيانات في قاعدة بيانات Firebase الآن"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 border border-slate-200 transition-colors shadow-xs"
                >
                  {syncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5" />
                  )}
                  <span>{syncing ? 'جاري الرفع...' : 'مزامنة سحابية'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleSyncNow}
                title="اضغط لربط حساب Google ومزامنة البيانات مع قاعدة Firebase"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <CloudCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>ربط Firebase عبر Google</span>
              </button>
            )}

            {syncMsg && (
              <div className="text-[11px] font-bold px-2 py-1 rounded bg-slate-800 text-white animate-in fade-in">
                {syncMsg}
              </div>
            )}

            {/* Teacher Info Card */}
            {user ? (
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {user.full_name ? user.full_name.charAt(0) : 'أ'}
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    الأستاذ: {user.full_name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    الموسم: {user.academic_year}
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="تسجيل الخروج"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
