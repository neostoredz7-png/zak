import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, School, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, isSupabaseConnected } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('سعيد زكريا');
  const [schoolName, setSchoolName] = useState('ثانوية أول نوفمبر 1954 - جديوية');
  const [wilaya, setWilaya] = useState('غليزان');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    if (mode === 'login') {
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'تم تسجيل الدخول بنجاح!' });
        setTimeout(() => onClose(), 700);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'حدث خطأ أثناء تسجيل الدخول' });
      }
    } else {
      const res = await signup(email, password, fullName, schoolName, wilaya);
      setLoading(false);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'تم إنشاء حساب الأستاذ بنجاح!' });
        setTimeout(() => onClose(), 700);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'فشل إنشاء الحساب' });
      }
    }
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    await login('prof.zakaria@education.dz');
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 text-right animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {mode === 'login' ? 'تسجيل دخول الأستاذ' : 'إنشاء حساب أستاذ جديد'}
            </h2>
            <p className="text-xs text-emerald-100">
              {isSupabaseConnected ? 'متصل بقاعدة بيانات Supabase السحابية' : 'وضع المعاينة والعمل المحلي'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => {
              setMode('login');
              setStatusMessage(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              mode === 'login'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setStatusMessage(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              mode === 'signup'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            حساب جديد
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الاسم واللقب</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: سعيد زكريا"
                    className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الثانوية</label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="مثال: ثانوية أول نوفمبر 1954"
                    className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الولاية</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    required
                    value={wilaya}
                    onChange={(e) => setWilaya(e.target.value)}
                    placeholder="مثال: غليزان"
                    className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@education.dz"
                className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-left dir-ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-left dir-ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'جاري المعالجة...' : mode === 'login' ? 'دخول' : 'تأكيد إنشاء الحساب'}
          </button>
        </form>

        {/* Quick Demo Access Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500 mb-2">للمعاينة الفورية لكامل ميزات أستاذ التربية البدنية:</p>
          <button
            onClick={handleQuickDemoLogin}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
          >
            الدخول المباشر كـ الأستاذ سعيد زكريا (بيانات نموذجية جاهزة)
          </button>
        </div>
      </div>
    </div>
  );
};
