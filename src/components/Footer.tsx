import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 px-4 border-t border-slate-800 no-print text-center text-xs space-y-3">
      <div className="max-w-4xl mx-auto space-y-2">
        <p className="text-emerald-400 font-bold text-sm tracking-wide">
          معاً من أجل مدرسة ناجحة وتربية متميزة
        </p>
        <p className="text-slate-300 font-medium">
          واجهة سهلة وبسيطة · معالجة آمنة للبيانات · عمل بدون إنترنت · إمكانية الطباعة والتصدير · تحديثات مستمرة
        </p>
        <p className="text-slate-500 text-[11px]">
          رياضة... صحة... قيم... مستقبل أفضل
        </p>
      </div>

      <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between max-w-5xl mx-auto text-[11px] text-slate-500 gap-2">
        <div>
          تطبيق <span className="font-bold text-white">EPS DZ</span> — تسيير أستاذ التربية البدنية والرياضية (الطور الثانوي)
        </div>
        <div>الموسم الدراسي: 2026 / 2027</div>
      </div>
    </footer>
  );
};
