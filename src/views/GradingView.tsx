import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { SchoolClass, Student, Assessment, Mark, Profile } from '../types';
import { dataRepository } from '../services/dataService';
import { OfficialReportPrint } from '../components/OfficialReportPrint';
import {
  GraduationCap,
  Save,
  Printer,
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trash2,
} from 'lucide-react';

interface GradingViewProps {
  profile: Profile;
  assignedClasses: SchoolClass[];
  initialClassId?: string;
}

export const GradingView: React.FC<GradingViewProps> = ({
  profile,
  assignedClasses,
  initialClassId,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || assignedClasses[0]?.id || ''
  );
  const [trimester, setTrimester] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAddAssessmentModal, setShowAddAssessmentModal] = useState(false);

  // New assessment form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'continuous' | 'formative' | 'summative'>('formative');
  const [newActivity, setNewActivity] = useState('ألعاب القوى');
  const [newWeight, setNewWeight] = useState(1);

  // Local table state for fast input & validation
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marksMatrix, setMarksMatrix] = useState<Record<string, Record<string, number | null>>>({});
  const [averages, setAverages] = useState<Record<string, number | null>>({});
  const [classAverage, setClassAverage] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (initialClassId && assignedClasses.some((c) => c.id === initialClassId)) {
      setSelectedClassId(initialClassId);
    } else if (!selectedClassId && assignedClasses.length > 0) {
      setSelectedClassId(assignedClasses[0].id);
    }
  }, [initialClassId, assignedClasses]);

  const loadData = () => {
    if (!selectedClassId) return;
    const res = dataRepository.getAllMarksForClassAndTrimester(selectedClassId, trimester);
    setAssessments(res.assessments);
    setStudents(res.students);
    setMarksMatrix(res.matrix);
    setAverages(res.averages);
    setClassAverage(res.classAverage);
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId, trimester]);

  // Handle cell edit
  const handleScoreChange = (studentId: string, assessmentId: string, valueStr: string) => {
    setStatusMessage(null);
    let val: number | null = null;
    if (valueStr.trim() !== '') {
      const parsed = parseFloat(valueStr);
      if (isNaN(parsed) || parsed < 0 || parsed > 20) {
        setStatusMessage({ type: 'error', text: 'العلامة يجب أن تكون بين 0 و20 فقط' });
        return;
      }
      val = parsed;
    }

    const updatedMatrix = {
      ...marksMatrix,
      [studentId]: {
        ...(marksMatrix[studentId] || {}),
        [assessmentId]: val,
      },
    };
    setMarksMatrix(updatedMatrix);

    // Recompute averages locally
    let sum = 0;
    let totalWeight = 0;
    assessments.forEach((a) => {
      const v = updatedMatrix[studentId]?.[a.id];
      if (typeof v === 'number') {
        sum += v * a.weight;
        totalWeight += a.weight;
      }
    });

    const newAvg = totalWeight > 0 ? Number((sum / totalWeight).toFixed(2)) : null;
    const updatedAverages = { ...averages, [studentId]: newAvg };
    setAverages(updatedAverages);

    // Recompute class average
    let classSum = 0;
    let gradedCount = 0;
    Object.values(updatedAverages).forEach((a) => {
      if (typeof a === 'number') {
        classSum += a;
        gradedCount++;
      }
    });
    setClassAverage(gradedCount > 0 ? Number((classSum / gradedCount).toFixed(2)) : 0);
  };

  const handleSaveAllMarks = async () => {
    if (!selectedClassId) return;
    try {
      for (const student of students) {
        for (const assessment of assessments) {
          const score = marksMatrix[student.id]?.[assessment.id] ?? null;
          await dataRepository.saveMark(assessment.id, student.id, score);
        }
      }
      setStatusMessage({ type: 'success', text: 'تم حفظ كافة العلامات في قاعدة البيانات بنجاح!' });
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'حدث خطأ أثناء الحفظ: ' + err.message });
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !newTitle.trim()) return;

    await dataRepository.addAssessment({
      class_id: selectedClassId,
      user_id: profile.id,
      trimester,
      title: newTitle.trim(),
      assessment_type: newType,
      activity_name: newActivity,
      max_score: 20,
      weight: newWeight,
      assessment_date: new Date().toISOString().split('T')[0],
    });

    setNewTitle('');
    setShowAddAssessmentModal(false);
    loadData();
    setStatusMessage({ type: 'success', text: 'تمت إضافة التقييم بنجاح' });
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم وعلاماته المرتبطة؟')) return;
    await dataRepository.deleteAssessment(assessmentId);
    loadData();
    setStatusMessage({ type: 'success', text: 'تم حذف التقييم' });
  };

  const handleExportToExcel = () => {
    const currentClass = assignedClasses.find((c) => c.id === selectedClassId);
    if (!currentClass) return;

    const dataToExport = students.map((s, idx) => {
      const row: any = {
        'الرقم': s.student_number || idx + 1,
        'اللقب والاسم': `${s.last_name} ${s.first_name}`,
        'الجنس': s.gender === 'M' ? 'ذكر' : 'أنثى',
      };
      assessments.forEach((a) => {
        row[`${a.title} (${a.activity_name})`] = marksMatrix[s.id]?.[a.id] ?? '';
      });
      row['المعدل النهائي /20'] = averages[s.id] ?? '';
      row['ملاحظات'] = s.is_exempt ? 'معفى طبياً' : '';
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `كشف نقاط ${currentClass.name}`);
    XLSX.writeFile(wb, `كشف_نقاط_${currentClass.name}_فصل_${trimester}.xlsx`);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.first_name.includes(searchQuery) ||
      s.last_name.includes(searchQuery) ||
      s.student_number.includes(searchQuery)
  );

  const currentClass = assignedClasses.find((c) => c.id === selectedClassId);

  if (assignedClasses.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">لا توجد أقسام مسندة إليك بعد</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          يرجى الذهاب إلى إعدادات المؤسسة وإسناد الأقسام التي تدرّسها لعرض دفاتر التنقيط الخاصة بها.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Top Filter Bar matching reference image screen 2 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Class Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">القسم المسند:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {assignedClasses.map((cls, idx) => (
                  <option key={cls.id ? `${cls.id}-${idx}` : idx} value={cls.id}>
                    {cls.name} — {cls.track} ({cls.group_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Trimester Tabs */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">الفصل الدراسي:</label>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {[1, 2, 3].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTrimester(t as 1 | 2 | 3)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      trimester === t
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t === 1 ? 'الفصل الأول' : t === 2 ? 'الفصل الثاني' : 'الفصل الثالث'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setShowAddAssessmentModal(true)}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تقويم</span>
            </button>

            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>تصدير Excel</span>
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>كشف رسمي للطباعة</span>
            </button>

            <button
              onClick={handleSaveAllMarks}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </div>

        {/* Student Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن تلميذ بالاسم أو اللقب أو الرقم..."
            className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
          />
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
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
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3 text-center w-14">الرقم</th>
                <th className="p-3 min-w-[160px]">اللقب والاسم</th>
                {assessments.map((a) => (
                  <th key={a.id} className="p-3 min-w-[130px] text-center border-r border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{a.title}</span>
                      <button
                        onClick={() => handleDeleteAssessment(a.id)}
                        title="حذف هذا التقييم"
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      {a.activity_name} · المعامل: {a.weight}
                    </div>
                  </th>
                ))}
                <th className="p-3 text-center w-28 bg-emerald-50 text-emerald-900 border-r border-slate-200 font-black">
                  المعدل /20
                </th>
                <th className="p-3 min-w-[140px] border-r border-slate-200">الحالة والملاحظة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={3 + assessments.length} className="p-8 text-center text-slate-400">
                    لا يوجد تلاميذ مسجلين في هذا القسم. يمكنك إضافتهم من صفحة القسم أو استيرادهم من إكسل.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const studentAvg = averages[student.id];
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-center font-mono text-slate-500 font-bold">
                        {student.student_number || idx + 1}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {student.last_name} {student.first_name}
                        {student.is_exempt && (
                          <span className="mr-1.5 text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded font-normal">
                            معفى طبياً
                          </span>
                        )}
                      </td>
                      {assessments.map((a) => {
                        const val = marksMatrix[student.id]?.[a.id];
                        return (
                          <td key={a.id} className="p-2 text-center border-r border-slate-100">
                            {student.is_exempt ? (
                              <span className="text-[11px] text-slate-400 font-bold">إعفاء</span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                max="20"
                                step="0.5"
                                value={typeof val === 'number' ? val : ''}
                                onChange={(e) => handleScoreChange(student.id, a.id, e.target.value)}
                                placeholder="—"
                                className="w-18 text-center py-1 px-1.5 font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                              />
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-center border-r border-slate-100 font-mono font-bold text-sm bg-emerald-50/40 text-emerald-900">
                        {student.is_exempt ? (
                          <span className="text-xs text-slate-400 font-normal">معفى</span>
                        ) : typeof studentAvg === 'number' ? (
                          <span
                            className={
                              studentAvg >= 14
                                ? 'text-emerald-700'
                                : studentAvg >= 10
                                ? 'text-blue-700'
                                : 'text-rose-700'
                            }
                          >
                            {studentAvg.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-[11px] text-slate-500">
                        {student.notes || (student.is_exempt ? student.medical_reason : '—')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Class Average (matching image.png) */}
        <div className="bg-emerald-900 text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-700">
              <span className="text-xs text-emerald-200 ml-2">متوسط القسم:</span>
              <span className="text-xl font-black font-mono tracking-tight text-white">
                {classAverage.toFixed(2)}
              </span>
              <span className="text-xs text-emerald-300 mr-1">/20</span>
            </div>
            <div className="text-xs text-emerald-100">
              <span>عدد التلاميذ المنقطين: </span>
              <span className="font-bold">
                {Object.values(averages).filter((v) => typeof v === 'number').length} من {students.length}
              </span>
            </div>
          </div>

          <button
            onClick={handleSaveAllMarks}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            حفظ العلامات في قاعدة البيانات
          </button>
        </div>
      </div>

      {/* Add Assessment Modal */}
      {showAddAssessmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-right border border-slate-100 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-3">إضافة تقويم جديد للقسم</h3>
            <form onSubmit={handleCreateAssessment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان التقييم:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: التقويم التكويني (الوثب الطويل)"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع التقييم:</label>
                <select
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="continuous">تقويم مستمر (سلوك، مواظبة، انضباط)</option>
                  <option value="formative">تقويم تكويني (نشاط فردي)</option>
                  <option value="summative">تقويم ختامي (نشاط جماعي / اختبار)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">النشاط الرياضي:</label>
                <input
                  type="text"
                  required
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  placeholder="ألعاب القوى، كرة السلة، كرة اليد..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المعامل (الوزن في المعدل):</label>
                <input
                  type="number"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={newWeight}
                  onChange={(e) => setNewWeight(parseFloat(e.target.value) || 1)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAssessmentModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl"
                >
                  إضافة الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Print Modal */}
      {showPrintModal && currentClass && (
        <OfficialReportPrint
          profile={profile}
          schoolClass={currentClass}
          students={students}
          assessments={assessments}
          matrix={marksMatrix}
          averages={averages}
          classAverage={classAverage}
          trimester={trimester}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
