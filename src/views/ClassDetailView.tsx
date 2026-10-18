import React, { useState, useEffect } from 'react';
import { SchoolClass, Student, Profile } from '../types';
import { dataRepository } from '../services/dataService';
import { GradingView } from './GradingView';
import { AttendanceView } from './AttendanceView';
import { DailyLessonView } from './DailyLessonView';
import { PhysicalTestsView } from './PhysicalTestsView';
import { StatsReportsView } from './StatsReportsView';
import { ExcelImportModal } from '../components/ExcelImportModal';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  BookOpen,
  Activity,
  BarChart3,
  Info,
  Plus,
  Trash2,
  Edit,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Search,
  FileSpreadsheet,
  FileText,
  X,
} from 'lucide-react';

interface ClassDetailViewProps {
  classId: string;
  profile: Profile;
  assignedClasses: SchoolClass[];
  onBack: () => void;
  onClassesUpdated?: () => void;
}

export const ClassDetailView: React.FC<ClassDetailViewProps> = ({
  classId,
  profile,
  assignedClasses,
  onBack,
  onClassesUpdated,
}) => {
  const currentClass = dataRepository.getClassById(classId);
  const [activeSubTab, setActiveSubTab] = useState<
    'info' | 'students' | 'grading' | 'attendance' | 'lessons' | 'tests' | 'stats'
  >('students');

  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [classEditForm, setClassEditForm] = useState({
    name: currentClass?.name || '',
    code: currentClass?.code || '',
    grade_level: currentClass?.grade_level || '1AS',
    track: currentClass?.track || '',
    group_name: currentClass?.group_name || '',
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const [studentForm, setStudentForm] = useState({
    student_number: '',
    registration_number: '',
    national_id: '',
    first_name: '',
    last_name: '',
    gender: 'M' as 'M' | 'F',
    birth_date: '',
    birth_place: '',
    schooling_regime: 'خارجي',
    is_exempt: false,
    medical_reason: '',
    notes: '',
  });

  const loadStudents = () => {
    if (!classId) return;
    setStudents(dataRepository.getStudentsByClass(classId));
  };

  useEffect(() => {
    loadStudents();
  }, [classId]);

  if (!currentClass) {
    return (
      <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 text-right">
        <p className="text-sm font-bold text-slate-800">القسم غير موجود أو تم حذفه</p>
        <button
          onClick={onBack}
          className="mt-4 text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl"
        >
          العودة للأقسام
        </button>
      </div>
    );
  }

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.first_name.trim() || !studentForm.last_name.trim()) return;

    if (editingStudentId) {
      await dataRepository.updateStudent(editingStudentId, studentForm);
    } else {
      const nextNum = String(students.length + 1).padStart(2, '0');
      await dataRepository.addStudent({
        ...studentForm,
        student_number: studentForm.student_number || nextNum,
        class_id: classId,
        user_id: profile.id,
      });
    }

    setShowAddStudentModal(false);
    setEditingStudentId(null);
    setStudentForm({
      student_number: '',
      registration_number: '',
      national_id: '',
      first_name: '',
      last_name: '',
      gender: 'M',
      birth_date: '',
      birth_place: '',
      schooling_regime: 'خارجي',
      is_exempt: false,
      medical_reason: '',
      notes: '',
    });
    loadStudents();
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classEditForm.name.trim()) return;
    await dataRepository.updateClass(classId, classEditForm);
    setShowEditClassModal(false);
    onClassesUpdated?.();
  };

  const handleConfirmDeleteClass = async () => {
    await dataRepository.deleteClass(classId);
    setShowDeleteClassModal(false);
    onClassesUpdated?.();
    onBack();
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('هل تريد حذف هذا التلميذ نهائياً من القسم وسجلات التنقيط؟')) return;
    await dataRepository.deleteStudent(studentId);
    loadStudents();
  };

  const filteredStudents = students.filter(
    (s) =>
      s.first_name.includes(searchQuery) ||
      s.last_name.includes(searchQuery) ||
      s.student_number.includes(searchQuery) ||
      (s.registration_number && s.registration_number.includes(searchQuery)) ||
      (s.national_id && s.national_id.includes(searchQuery))
  );

  return (
    <div className="space-y-6 pb-12 text-right">
      {/* Back button and Class Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
              title="رجوع إلى قائمة الأقسام"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">{currentClass.name}</h2>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-lg">
                  {currentClass.grade_level === '1AS'
                    ? 'الأولى ثانوي'
                    : currentClass.grade_level === '2AS'
                    ? 'الثانية ثانوي'
                    : 'الثالثة ثانوي'}
                </span>
                <span className="text-xs text-slate-500 font-mono">({currentClass.code})</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {currentClass.track} · {currentClass.group_name} · إجمالي التلاميذ المسجلين: {students.length}
              </p>
            </div>
          </div>

          {/* Class Quick Actions (Edit / Delete) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setClassEditForm({
                  name: currentClass.name,
                  code: currentClass.code,
                  grade_level: currentClass.grade_level,
                  track: currentClass.track,
                  group_name: currentClass.group_name,
                });
                setShowEditClassModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold transition-colors border border-slate-200"
              title="تعديل اسم أو شعبة هذا القسم"
            >
              <Edit className="w-3.5 h-3.5 text-emerald-600" />
              <span>تعديل القسم</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteClassModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors border border-rose-200"
              title="حذف هذا القسم وكافة تلاميذه"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>حذف القسم</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs pills */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1 rounded-xl text-xs font-bold scrollbar-none">
            <button
              onClick={() => setActiveSubTab('students')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'students'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>قائمة التلاميذ ({students.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('grading')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'grading'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>دفتر التنقيط</span>
            </button>

            <button
              onClick={() => setActiveSubTab('attendance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'attendance'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>الغيابات والحضور</span>
            </button>

            <button
              onClick={() => setActiveSubTab('lessons')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'lessons'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>دفتر الحصص</span>
            </button>

            <button
              onClick={() => setActiveSubTab('tests')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'tests'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>الاختبارات البدنية</span>
            </button>

            <button
              onClick={() => setActiveSubTab('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'stats'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>التقارير</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Students Roster Tab */}
      {activeSubTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، اللقب، رقم القيد، أو رقم التعريف..."
                className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>استيراد ملف الرقمنة لهذا القسم (Excel)</span>
              </button>

              <button
                onClick={() => {
                  setEditingStudentId(null);
                  setStudentForm({
                    student_number: String(students.length + 1).padStart(2, '0'),
                    registration_number: '',
                    national_id: '',
                    first_name: '',
                    last_name: '',
                    gender: 'M',
                    birth_date: '',
                    birth_place: '',
                    schooling_regime: 'خارجي',
                    is_exempt: false,
                    medical_reason: '',
                    notes: '',
                  });
                  setShowAddStudentModal(true);
                }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة تلميذ يدوي</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-3 text-center w-12">الرقم</th>
                  <th className="p-3 text-center w-20 font-mono">رقم القيد</th>
                  <th className="p-3">اللقب</th>
                  <th className="p-3">الاسم</th>
                  <th className="p-3 text-center w-16">الجنس</th>
                  <th className="p-3 font-mono">تاريخ ومكان الازدياد</th>
                  <th className="p-3 text-center">نظام التمدرس</th>
                  <th className="p-3 font-mono text-[11px]">رقم التعريف</th>
                  <th className="p-3 text-center w-24">الحالة الصحية</th>
                  <th className="p-3 text-center w-20">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      لا يوجد تلاميذ يطابقون البحث في هذا القسم. يمكنك استيراد قائمة القسم مباشرة من ملف Excel الخاص بالرقمنة.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center font-mono font-bold text-slate-500">
                        {st.student_number || idx + 1}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-blue-700">
                        {st.registration_number || '—'}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{st.last_name}</td>
                      <td className="p-3 font-semibold text-slate-800">{st.first_name}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            st.gender === 'M' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {st.gender === 'M' ? 'ذكر' : 'أنثى'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {st.birth_date ? (
                          <span>
                            <span className="font-mono text-slate-800">{st.birth_date}</span>
                            {st.birth_place && <span className="text-slate-400 mr-1.5">({st.birth_place})</span>}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 text-center text-slate-600 font-medium">
                        {st.schooling_regime || 'خارجي'}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-400 truncate max-w-[110px]">
                        {st.national_id || '—'}
                      </td>
                      <td className="p-3 text-center">
                        {st.is_exempt ? (
                          <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-bold">
                            معفى طبياً
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-medium">ممارس</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingStudentId(st.id);
                              setStudentForm({
                                student_number: st.student_number,
                                registration_number: st.registration_number || '',
                                national_id: st.national_id || '',
                                first_name: st.first_name,
                                last_name: st.last_name,
                                gender: st.gender,
                                birth_date: st.birth_date || '',
                                birth_place: st.birth_place || '',
                                schooling_regime: st.schooling_regime || 'خارجي',
                                is_exempt: st.is_exempt,
                                medical_reason: st.medical_reason || '',
                                notes: st.notes || '',
                              });
                              setShowAddStudentModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50"
                            title="تعديل بيانات التلميذ"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(st.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Grading Sub-Tab */}
      {activeSubTab === 'grading' && (
        <GradingView profile={profile} assignedClasses={assignedClasses} initialClassId={classId} />
      )}

      {/* 3. Attendance Sub-Tab */}
      {activeSubTab === 'attendance' && (
        <AttendanceView profile={profile} assignedClasses={assignedClasses} initialClassId={classId} />
      )}

      {/* 4. Daily Lessons Sub-Tab */}
      {activeSubTab === 'lessons' && (
        <DailyLessonView profile={profile} assignedClasses={assignedClasses} />
      )}

      {/* 5. Physical Tests Sub-Tab */}
      {activeSubTab === 'tests' && <PhysicalTestsView assignedClasses={assignedClasses} />}

      {/* 6. Stats Sub-Tab */}
      {activeSubTab === 'stats' && <StatsReportsView profile={profile} assignedClasses={assignedClasses} />}

      {/* Add / Edit Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 text-right border border-slate-100 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              {editingStudentId ? 'تعديل بيانات التلميذ' : 'إضافة تلميذ جديد للقسم'}
            </h3>
            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرقم في القسم:</label>
                  <input
                    type="text"
                    value={studentForm.student_number}
                    onChange={(e) => setStudentForm({ ...studentForm, student_number: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم القيد:</label>
                  <input
                    type="text"
                    value={studentForm.registration_number}
                    onChange={(e) => setStudentForm({ ...studentForm, registration_number: e.target.value })}
                    placeholder="مثال: 989"
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الجنس:</label>
                  <select
                    value={studentForm.gender}
                    onChange={(e: any) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    <option value="M">ذكر</option>
                    <option value="F">أنثى</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اللقب (الاسم العائلي):</label>
                  <input
                    type="text"
                    required
                    value={studentForm.last_name}
                    onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })}
                    placeholder="مثال: لعريني"
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم الشخصي:</label>
                  <input
                    type="text"
                    required
                    value={studentForm.first_name}
                    onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })}
                    placeholder="مثال: سليمان"
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الازدياد:</label>
                  <input
                    type="text"
                    value={studentForm.birth_date}
                    onChange={(e) => setStudentForm({ ...studentForm, birth_date: e.target.value })}
                    placeholder="مثال: 05/09/2007"
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">مكان الازدياد:</label>
                  <input
                    type="text"
                    value={studentForm.birth_place}
                    onChange={(e) => setStudentForm({ ...studentForm, birth_place: e.target.value })}
                    placeholder="مثال: وادي ارهيو"
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم التعريف الوطني (الرقمنة):</label>
                  <input
                    type="text"
                    value={studentForm.national_id}
                    onChange={(e) => setStudentForm({ ...studentForm, national_id: e.target.value })}
                    placeholder="100075..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-left dir-ltr text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نظام التمدرس:</label>
                  <select
                    value={studentForm.schooling_regime}
                    onChange={(e) => setStudentForm({ ...studentForm, schooling_regime: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="خارجي">خارجي</option>
                    <option value="نصف داخلي">نصف داخلي</option>
                    <option value="داخلي">داخلي</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="exempt_chk"
                    checked={studentForm.is_exempt}
                    onChange={(e) => setStudentForm({ ...studentForm, is_exempt: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="exempt_chk" className="font-bold text-rose-800">
                    التلميذ معفى طبياً من ممارسة التربية البدنية
                  </label>
                </div>
              </div>

              {studentForm.is_exempt && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سبب الإعفاء الطبي ومصدر الشهادة:</label>
                  <input
                    type="text"
                    value={studentForm.medical_reason}
                    onChange={(e) => setStudentForm({ ...studentForm, medical_reason: e.target.value })}
                    placeholder="شهادة من طبيب الصحة المدرسية UDS..."
                    className="w-full p-2.5 border border-rose-300 bg-rose-50/50 rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات بيداغوجية اختيارية:</label>
                <input
                  type="text"
                  value={studentForm.notes}
                  onChange={(e) => setStudentForm({ ...studentForm, notes: e.target.value })}
                  placeholder="ملاحظات حول المهارة أو السلوك..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl"
                >
                  {editingStudentId ? 'حفظ التعديلات' : 'إضافة التلميذ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditClassModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-right border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">تعديل بيانات القسم ({currentClass.name})</h3>
              <button
                type="button"
                onClick={() => setShowEditClassModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم القسم:</label>
                <input
                  type="text"
                  required
                  value={classEditForm.name}
                  onChange={(e) => setClassEditForm({ ...classEditForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رمز القسم (الكود):</label>
                <input
                  type="text"
                  required
                  value={classEditForm.code}
                  onChange={(e) => setClassEditForm({ ...classEditForm, code: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-left dir-ltr"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المستوى التعليمي:</label>
                <select
                  value={classEditForm.grade_level}
                  onChange={(e: any) => setClassEditForm({ ...classEditForm, grade_level: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-bold"
                >
                  <option value="1AS">السنة الأولى ثانوي (1AS)</option>
                  <option value="2AS">السنة الثانية ثانوي (2AS)</option>
                  <option value="3AS">السنة الثالثة ثانوي (3AS)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الشعبة / الجذع المشترك:</label>
                <input
                  type="text"
                  required
                  value={classEditForm.track}
                  onChange={(e) => setClassEditForm({ ...classEditForm, track: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الفوج:</label>
                <input
                  type="text"
                  value={classEditForm.group_name}
                  onChange={(e) => setClassEditForm({ ...classEditForm, group_name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditClassModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl shadow"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Class Confirmation Modal */}
      {showDeleteClassModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-right border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 border-b border-rose-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">تأكيد حذف القسم نهائياً</h3>
                <p className="text-xs text-rose-600 font-medium">عملية غير قابلة للتراجع</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              هل أنت متأكد من حذف قسم <span className="font-bold text-slate-900">"{currentClass.name}"</span>؟
              سيتم حذف جميع التلاميذ المسجلين في هذا القسم ({students.length} تلميذ) وكافة علاماتهم وسجلات حضورهم نهائياً.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteClassModal(false)}
                className="px-4 py-2 text-slate-600 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClass}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow"
              >
                نعم، احذف القسم وتلاميذه
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal for this specific class */}
      {showImportModal && (
        <ExcelImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          classes={[currentClass, ...assignedClasses.filter((c) => c.id !== currentClass.id)]}
          onImportComplete={async (importedCount, createdClassesCount) => {
            loadStudents();
          }}
        />
      )}
    </div>
  );
};
