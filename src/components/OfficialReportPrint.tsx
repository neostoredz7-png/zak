import React from 'react';
import { SchoolClass, Student, Assessment, Profile } from '../types';
import { Printer, Download, X } from 'lucide-react';

interface OfficialReportPrintProps {
  profile: Profile;
  schoolClass: SchoolClass;
  students: Student[];
  assessments: Assessment[];
  matrix: Record<string, Record<string, number | null>>;
  averages: Record<string, number | null>;
  classAverage: number;
  trimester: 1 | 2 | 3;
  onClose: () => void;
}

export const OfficialReportPrint: React.FC<OfficialReportPrintProps> = ({
  profile,
  schoolClass,
  students,
  assessments,
  matrix,
  averages,
  classAverage,
  trimester,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 p-4 sm:p-6 flex flex-col items-center">
      {/* Action Toolbar (no-print) */}
      <div className="w-full max-w-4xl bg-white rounded-t-xl p-4 border-b border-slate-200 flex items-center justify-between no-print shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة كشف النقاط الرسمي (PDF / طابعة)</span>
          </button>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Official Algerian Educational Document Sheet (A4 format) */}
      <div className="w-full max-w-4xl bg-white p-8 sm:p-12 shadow-2xl rounded-b-xl border border-slate-300 text-slate-900 text-right">
        {/* Official Header */}
        <div className="text-center pb-4 border-b-2 border-slate-800">
          <h2 className="text-sm font-bold tracking-wide">الجمهورية الجزائرية الديمقراطية الشعبية</h2>
          <h3 className="text-sm font-semibold">وزارة التربية الوطنية</h3>
          <div className="flex justify-between items-center text-xs mt-3 px-4 font-semibold text-slate-700">
            <div>
              <p>مديرية التربية لولاية: {profile.wilaya}</p>
              <p>المؤسسة: {profile.school_name}</p>
            </div>
            <div className="text-center font-bold text-sm bg-slate-100 px-4 py-1.5 rounded border border-slate-300">
              كشف التنقيط الدوري — مادة التربية البدنية والرياضية
            </div>
            <div className="text-left dir-ltr">
              <p className="text-right">الموسم الدراسي: {profile.academic_year}</p>
              <p className="text-right">الطور: التعليم الثانوي</p>
            </div>
          </div>
        </div>

        {/* Class and Session Metadata Strip */}
        <div className="my-4 bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-slate-500 font-semibold">القسم: </span>
            <span className="font-bold text-slate-900">{schoolClass.name}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">الشعبة: </span>
            <span className="font-bold text-slate-900">{schoolClass.track}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">الفصل الدراسي: </span>
            <span className="font-bold text-emerald-800">
              {trimester === 1 ? 'الفصل الأول' : trimester === 2 ? 'الفصل الثاني' : 'الفصل الثالث'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">أستاذ المادة: </span>
            <span className="font-bold text-slate-900">{profile.full_name}</span>
          </div>
        </div>

        {/* Official Marks Table */}
        <table className="w-full text-xs border border-slate-400 text-center my-4 border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-400">
              <th className="p-2 border border-slate-400 w-12 font-bold">الرقم</th>
              <th className="p-2 border border-slate-400 text-right font-bold w-48">اللقب والاسم</th>
              <th className="p-2 border border-slate-400 w-16 font-bold">الجنس</th>
              {assessments.map((a) => (
                <th key={a.id} className="p-2 border border-slate-400 font-bold">
                  <div>{a.title}</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    ({a.activity_name} — مع {a.weight})
                  </div>
                </th>
              ))}
              <th className="p-2 border border-slate-400 w-24 bg-emerald-50 text-emerald-900 font-bold">
                المعدل /20
              </th>
              <th className="p-2 border border-slate-400 font-bold">الملاحظات والتقديرات</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => {
              const avg = averages[student.id];
              return (
                <tr key={student.id} className="border-b border-slate-300 hover:bg-slate-50/50">
                  <td className="p-2 border border-slate-300 font-mono">{student.student_number || idx + 1}</td>
                  <td className="p-2 border border-slate-300 text-right font-semibold">
                    {student.last_name} {student.first_name}
                    {student.is_exempt && (
                      <span className="mr-1 text-[10px] text-rose-600 font-normal">(معفى طبياً)</span>
                    )}
                  </td>
                  <td className="p-2 border border-slate-300">{student.gender === 'M' ? 'ذكر' : 'أنثى'}</td>
                  {assessments.map((a) => {
                    const score = matrix[student.id]?.[a.id];
                    return (
                      <td key={a.id} className="p-2 border border-slate-300 font-mono">
                        {student.is_exempt
                          ? 'إ.ط'
                          : typeof score === 'number'
                          ? score.toFixed(1)
                          : '—'}
                      </td>
                    );
                  })}
                  <td className="p-2 border border-slate-300 font-bold font-mono bg-emerald-50/50 text-emerald-900">
                    {student.is_exempt ? 'معفى' : typeof avg === 'number' ? avg.toFixed(2) : '—'}
                  </td>
                  <td className="p-2 border border-slate-300 text-right text-[11px] text-slate-600">
                    {student.is_exempt
                      ? student.medical_reason || 'معفى بموجب شهادة طبية'
                      : typeof avg === 'number'
                      ? avg >= 16
                        ? 'ممتاز، نتائج مميزة وانضباط مثالي'
                        : avg >= 14
                        ? 'جيد جداً، مواظبة ومهارات رياضية جيدة'
                        : avg >= 10
                        ? 'متوسط، يمكن تحسين الجانب الفني'
                        : 'دون المتوسط، يحتاج لمضاعفة الجهد'
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
              <td colSpan={3 + assessments.length} className="p-2 border border-slate-400 text-left pl-4">
                المعدل العام للقسم:
              </td>
              <td className="p-2 border border-slate-400 font-mono bg-emerald-100 text-emerald-900 text-center text-sm">
                {classAverage.toFixed(2)}
              </td>
              <td className="p-2 border border-slate-400"></td>
            </tr>
          </tfoot>
        </table>

        {/* Footer & Teacher Signature */}
        <div className="mt-8 pt-6 border-t border-slate-300 flex justify-between items-start text-xs font-semibold">
          <div>
            <p>تأشيرة مدير المؤسسة:</p>
            <div className="h-16 w-36 border border-dashed border-slate-300 rounded mt-2 flex items-center justify-center text-[10px] text-slate-400">
              الختم والتوقيع
            </div>
          </div>
          <div className="text-center">
            <p>حرر بـ: {profile.municipality} في: {new Date().toLocaleDateString('ar-DZ')}</p>
          </div>
          <div className="text-left">
            <p>توقيع أستاذ المادة:</p>
            <p className="mt-1 font-bold text-slate-900">{profile.full_name}</p>
            <div className="h-14 w-36 border border-dashed border-slate-300 rounded mt-2 flex items-center justify-center text-[10px] text-slate-400">
              التوقيع
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
