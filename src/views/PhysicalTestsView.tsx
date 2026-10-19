import React, { useState, useEffect } from 'react';
import { SchoolClass, Student, PhysicalTest, PhysicalTestResult } from '../types';
import { dataRepository } from '../services/dataService';
import {
  Activity,
  Plus,
  Save,
  CheckCircle2,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';

interface PhysicalTestsViewProps {
  assignedClasses: SchoolClass[];
}

export const PhysicalTestsView: React.FC<PhysicalTestsViewProps> = ({ assignedClasses }) => {
  const [selectedClassId, setSelectedClassId] = useState(assignedClasses[0]?.id || '');
  const [tests, setTests] = useState<PhysicalTest[]>(dataRepository.getPhysicalTests());
  const [selectedTestId, setSelectedTestId] = useState<string>(tests[0]?.id || '');
  const [students, setStudents] = useState<Student[]>([]);
  const [resultsMap, setResultsMap] = useState<Record<string, { value: number | ''; grade: number | '' }>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!assignedClasses.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(assignedClasses[0]?.id || '');
    }
  }, [assignedClasses, selectedClassId]);

  useEffect(() => {
    if (!selectedClassId) return;
    const classStudents = dataRepository.getStudentsByClass(selectedClassId);
    setStudents(classStudents);

    const testResults = dataRepository.getTestResults(selectedTestId);
    const map: Record<string, { value: number | ''; grade: number | '' }> = {};
    classStudents.forEach((st) => {
      const existing = testResults.find((r) => r.student_id === st.id);
      map[st.id] = {
        value: existing ? existing.result_value : '',
        grade: existing?.grade !== undefined ? existing.grade : '',
      };
    });
    setResultsMap(map);
  }, [selectedClassId, selectedTestId]);

  const activeTest = tests.find((t) => t.id === selectedTestId) || tests[0];

  const handleValueChange = (studentId: string, val: string) => {
    const num = val === '' ? '' : parseFloat(val);
    setResultsMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        value: num,
      },
    }));
  };

  const handleGradeChange = (studentId: string, val: string) => {
    const num = val === '' ? '' : parseFloat(val);
    setResultsMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        grade: num,
      },
    }));
  };

  const handleSaveAll = async () => {
    try {
      for (const st of students) {
        const item = resultsMap[st.id];
        if (typeof item?.value === 'number') {
          await dataRepository.saveTestResult(
            selectedTestId,
            st.id,
            item.value,
            typeof item.grade === 'number' ? item.grade : undefined
          );
        }
      }
      setStatusMessage('تم حفظ نتائج الاختبار البدني بنجاح!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert('خطأ أثناء الحفظ: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">سجل الاختبارات والقياسات البدنية</h2>
            <p className="text-xs text-slate-500">
              متابعة اللياقة، التحمل، السرعة، والقدرات الحركية للتلاميذ
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>حفظ نتائج الاختبار</span>
        </button>
      </div>

      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">القسم المسند:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
          >
            {assignedClasses.map((cls, idx) => (
              <option key={cls.id ? `${cls.id}-${idx}` : idx} value={cls.id}>
                {cls.name} — {cls.track}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">نوع الاختبار البدني:</label>
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
          >
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.test_name} (الوحدة: {t.measurement_unit})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Test Description Card */}
      {activeTest && (
        <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 text-xs text-right space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-900 text-sm">{activeTest.test_name}</span>
            <span className="bg-rose-100 text-rose-800 font-mono font-bold px-2.5 py-0.5 rounded-lg">
              وحدة القياس: {activeTest.measurement_unit}
            </span>
          </div>
          <p className="text-slate-700 leading-relaxed">{activeTest.description}</p>
          {activeTest.target_criteria && (
            <div className="bg-white p-2.5 rounded-xl border border-rose-100 font-mono text-[11px] whitespace-pre-line text-slate-600">
              {activeTest.target_criteria}
            </div>
          )}
        </div>
      )}

      {/* Students Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-right">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3 text-center w-14">الرقم</th>
                <th className="p-3">اللقب والاسم</th>
                <th className="p-3 text-center w-40">
                  النتيجة المحققة ({activeTest?.measurement_unit || ''})
                </th>
                <th className="p-3 text-center w-32">العلامة التقديرية /20</th>
                <th className="p-3">ملاحظات الأداء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((st, idx) => (
                <tr key={st.id} className="hover:bg-slate-50/80">
                  <td className="p-3 text-center font-mono text-slate-500 font-bold">
                    {st.student_number || idx + 1}
                  </td>
                  <td className="p-3 font-bold text-slate-900">
                    {st.last_name} {st.first_name}
                    {st.is_exempt && (
                      <span className="mr-1.5 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        معفى
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      step="0.01"
                      disabled={st.is_exempt}
                      value={resultsMap[st.id]?.value ?? ''}
                      onChange={(e) => handleValueChange(st.id, e.target.value)}
                      placeholder={st.is_exempt ? 'معفى' : '0.00'}
                      className="w-24 text-center py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      disabled={st.is_exempt}
                      value={resultsMap[st.id]?.grade ?? ''}
                      onChange={(e) => handleGradeChange(st.id, e.target.value)}
                      placeholder="—"
                      className="w-20 text-center py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
                    />
                  </td>
                  <td className="p-3 text-slate-500 text-[11px]">
                    {st.is_exempt ? 'معفى طبياً' : st.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
