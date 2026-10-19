import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  School,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Activity,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import gymBanner from '../assets/images/eps_gymnasium_banner_1792338185170.jpg';

interface LoginViewProps {
  onLoginSuccess?: () => void;
  onContinueAsGuest?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onContinueAsGuest }) => {
  const { login, signup, isSupabaseConnected } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('prof.zakaria@education.dz');
  const [password, setPassword] = useState('eps1954');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Signup fields
  const [fullName, setFullName] = useState('سعيد زكريا');
  const [schoolName, setSchoolName] = useState('ثانوية أول نوفمبر 1954');
  const [wilaya, setWilaya] = useState('غليزان');
  const [municipality, setMunicipality] = useState('جديوية');
  const [academicYear, setAcademicYear] = useState('2026 / 2027');

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    if (mode === 'login') {
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'تم تسجيل الدخول بنجاح! جاري تحويلك...' });
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess();
        }, 500);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'فشل تسجيل الدخول، يرجى التحقق من البريد أو كلمة المرور' });
      }
    } else {
      const res = await signup(email, password, fullName, schoolName, wilaya, municipality, academicYear);
      setLoading(false);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'تم إنشاء حساب الأستاذ بنجاح! مرحباً بك في المنصة.' });
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess();
        }, 600);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'حدث خطأ أثناء إنشاء الحساب' });
      }
    }
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setStatusMessage(null);
    const res = await login('neostoredz7@gmail.com', 'eps1954');
    setLoading(false);
    if (res.success) {
      if (onLoginSuccess) onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white text-right font-sans">
      {/* Official Top State Banner */}
      <div className="bg-emerald-950/90 text-white text-[11px] py-1.5 px-4 border-b border-emerald-900/60 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-emerald-200/80 text-[10px]">
            <span>بوابة الرقمنة البيداغوجية لمادة التربية البدنية والرياضية</span>
          </div>
        </div>
      </div>

      {/* Main Centered Content Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/70">
          {/* Right Column: Hero Visual & Pedagogical Highlights */}
          <div className="lg:col-span-5 relative bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-8 lg:p-10 flex flex-col justify-between overflow-hidden">
            {/* Background Image with Deep Emerald Scrim */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay pointer-events-none scale-105 transition-transform duration-700"
              style={{ backgroundImage: `url(${gymBanner})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-900/90 to-transparent pointer-events-none" />

            {/* Top Brand & Badge */}
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-bold">الموسم الدراسي 2026 / 2027</span>
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20">
                    EPS
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-white">منصة الأستاذ</h1>
                    <p className="text-xs text-emerald-300 font-medium">التربية البدنية والرياضية — التعليم الثانوي</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Platform Value Pillars */}
            <div className="relative z-10 space-y-4 my-8">
              <div className="flex items-start gap-3 bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">إسناد الأقسام التربوية</h3>
                  <p className="text-[11px] text-emerald-200/80 leading-relaxed mt-0.5">
                    إدارة دقيقة لأقسام المؤسسة، مع إظهار الأقسام المسندة إليك فقط في سجلات التنقيط والغيابات.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">استيراد الرقمنة الجزائرية (Excel)</h3>
                  <p className="text-[11px] text-emerald-200/80 leading-relaxed mt-0.5">
                    فرز ذكي وتلقائي لأفواج وأقسام المستوى نفسه (مثل 2 آداب وفلسفة 1 و 2) وتوزيع سليم للتلاميذ.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">الدفاتر البيداغوجية والتقويم</h3>
                  <p className="text-[11px] text-emerald-200/80 leading-relaxed mt-0.5">
                    حساب آلي للمعدلات، متابعة الغيابات والإعفاءات الطبية، واستخراج كشوف رسمية متوافقة مع الوزارة.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Footer Quote */}
            <div className="relative z-10 pt-4 border-t border-white/10 text-[11px] text-emerald-300/80 flex items-center justify-between">
              <span>مديريات التربية الوطنية</span>
              <span className="font-mono text-[10px]">نظام آمن ومحلي</span>
            </div>
          </div>

          {/* Left Column: Login / Signup Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Header Titles */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {mode === 'login' ? 'لوحة تسجيل دخول الأستاذ' : 'فتح حساب أستاذ جديد'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {mode === 'login'
                      ? 'أدخل بيانات الاعتماد الخاصة بك للوصول إلى أقسامك وسجلاتك البيداغوجية'
                      : 'أدخل معلومات الثانوية وبياناتك الشخصية لبدء تهيئة الموسم الدراسي'}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
              </div>

              {/* Mode Switch Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setStatusMessage(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl transition-all ${
                    mode === 'login'
                      ? 'bg-white text-emerald-900 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setStatusMessage(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl transition-all ${
                    mode === 'signup'
                      ? 'bg-white text-emerald-900 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  إنشاء حساب جديد
                </button>
              </div>

              {/* Feedback Alert */}
              {statusMessage && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center gap-3 mb-5 border animate-in fade-in ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
                  )}
                  <span className="font-semibold">{statusMessage.text}</span>
                </div>
              )}

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'login' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        البريد الإلكتروني أو رقم التعريف المهني
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="مثال: prof.zakaria@education.dz"
                          className="w-full pr-10 pl-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">كلمة المرور</label>
                        <span className="text-[11px] text-emerald-700 font-semibold cursor-pointer hover:underline">
                          نسيت كلمة المرور؟
                        </span>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pr-10 pl-10 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                        />
                        <span>تذكر بيانات الدخول على هذا المتصفح</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <span>جاري التحقق من البيانات...</span>
                      ) : (
                        <>
                          <span>تسجيل الدخول إلى حساب الأستاذ</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">الاسم واللقب</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="الأستاذ سعيد زكريا"
                            className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">اسم الثانوية</label>
                        <div className="relative">
                          <School className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            placeholder="ثانوية أول نوفمبر 1954"
                            className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">الولاية</label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={wilaya}
                            onChange={(e) => setWilaya(e.target.value)}
                            placeholder="غليزان"
                            className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">البلدية</label>
                        <input
                          type="text"
                          required
                          value={municipality}
                          onChange={(e) => setMunicipality(e.target.value)}
                          placeholder="جديوية"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">الموسم الدراسي</label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            placeholder="2026 / 2027"
                            className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="prof.zakaria@education.dz"
                            className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الجديدة</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <span>جاري إنشاء الحساب...</span> : <span>إنشاء الحساب وبدء العمل</span>}
                    </button>
                  </>
                )}
              </form>

              {/* Quick Demo Login Option */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400">
                    أو الدخول المباشر للتجربة السريعة
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="w-full py-2.5 px-4 rounded-xl border-2 border-emerald-600/40 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs group"
                >
                  <Sparkles className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                  <span>دخول فوري بحساب الأستاذ التجريبي (سعيد زكريا — ثانوية أول نوفمبر 1954)</span>
                </button>
              </div>
            </div>

            {/* Bottom Links & Supabase status */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isSupabaseConnected ? 'سحابي متصل (Supabase)' : 'وضع التخزين المحلي الآمن'}</span>
              </div>
              {onContinueAsGuest && (
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  className="text-slate-600 hover:text-emerald-700 font-bold hover:underline"
                >
                  المتابعة كزائر ←
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
