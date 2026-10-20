import React, { useState, useEffect } from 'react';
import { SchoolClass, GradeLevel } from '../types';
import { dataRepository } from '../services/dataService';
import { ExcelImportModal } from '../components/ExcelImportModal';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  ChevronLeft,
  Settings,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  CheckCircle2,
  Check,
  Search,
  Filter,
  Layers,
} from 'lucide-react';

interface ClassesViewProps {
  assignedClasses: SchoolClass[];
  onSelectClass: (classId: string) => void;
  onOpenSettings: () => void;
  onClassesUpdated?: () => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  assignedClasses,
  onSelectClass,
  onOpenSettings,
  onClassesUpdated,
}) => {
  const [classesList, setClassesList] = useState<SchoolClass[]>(assignedClasses);
  const [viewScope, setViewScope] = useState<'ASSIGNED' | 'ALL'>('ASSIGNED');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'ALL' | GradeLevel>('ALL');

  useEffect(() => {
    setClassesList(dataRepository.getAllSchoolClasses());
  }, [assignedClasses]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);
  const [showClearYearModal, setShowClearYearModal] = useState(false);
  const [clearYearMode, setClearYearMode] = useState<'all' | 'students_only' | 'reset_sample'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [classForm, setClassForm] = useState({
    name: '',
    code: '',
    grade_level: '3AS' as GradeLevel,
    track: 'علوم تجريبية',
    group_name: 'فوج 01',
    is_assigned: true,
  });

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const notifyChange = () => {
    setClassesList(dataRepository.getTeacherAssignedClasses());
    if (onClassesUpdated) {
      onClassesUpdated();
    }
  };

  const handleOpenAddModal = () => {
    setEditingClassId(null);
    setClassForm({
      name: '',
      code: '',
      grade_level: '3AS',
      track: 'علوم تجريبية',
      group_name: 'فوج 01',
      is_assigned: true,
    });
    setShowAddClassModal(true);
  };

  const handleOpenEditModal = (cls: SchoolClass, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingClassId(cls.id);
    setClassForm({
      name: cls.name,
      code: cls.code,
      grade_level: cls.grade_level,
      track: cls.track,
      group_name: cls.group_name,
      is_assigned: cls.is_assigned,
    });
    setShowAddClassModal(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) return;

    if (editingClassId) {
      await dataRepository.updateClass(editingClassId, classForm);
      showToast('تم تعديل بيانات القسم بنجاح');
    } else {
      await dataRepository.addClass({
        ...classForm,
        user_id: dataRepository.getProfile().id,
        academic_year: dataRepository.getProfile().academic_year,
        student_count: 0,
      });
      showToast('تمت إضافة القسم الجديد بنجاح');
    }

    notifyChange();
    setShowAddClassModal(false);
    setEditingClassId(null);
  };

  const handleConfirmDeleteClass = async () => {
    if (!classToDelete) return;
    const name = classToDelete.name;
    await dataRepository.deleteClass(classToDelete.id);
    notifyChange();
    setClassToDelete(null);
    showToast(`تم حذف قسم "${name}" وكافة تلاميذه ونقاطه بنجاح`);
  };

  const handleConfirmClearYear = async () => {
    if (clearYearMode === 'all') {
      await dataRepository.clearSchoolYearData(true);
      showToast('تم الحذف الكلي لكافة الأقسام والتلاميذ (موسم دراسي جديد فارغ)');
    } else if (clearYearMode === 'students_only') {
      await dataRepository.clearSchoolYearData(false);
      showToast('تم تفريغ كافة قوائم التلاميذ مع الحفاظ على هيكل الأقسام');
    } else if (clearYearMode === 'reset_sample') {
      dataRepository.resetToDefaultData();
      showToast('تمت استعادة البيانات النموذجية الافتراضية');
    }

    notifyChange();
    setShowClearYearModal(false);
  };

  const handleToggleAssignment = async (cls: SchoolClass, e: React.MouseEvent) => {
    e.stopPropagation();
    await dataRepository.toggleClassAssignment(cls.id, !cls.is_assigned);
    notifyChange();
    showToast(!cls.is_assigned ? 'تم إسناد القسم إليك' : 'تم إلغاء إسناد القسم');
  };

  const allSchool = dataRepository.getAllSchoolClasses();
  const assignedOnly = assignedClasses.filter((c) => Boolean(c.is_assigned === true || (c.is_assigned as any) === 'true'));
  const sourceClasses = viewScope === 'ASSIGNED' ? assignedOnly : allSchool;

  const displayedClasses = sourceClasses.filter((cls) => {
    const matchesGrade = gradeFilter === 'ALL' || cls.grade_level === gradeFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      cls.name.toLowerCase().includes(query) ||
      cls.track.toLowerCase().includes(query) ||
      cls.code.toLowerCase().includes(query);
    return matchesGrade && matchesSearch;
  });

  const count1AS = sourceClasses.filter((c) => c.grade_level === '1AS').length;
  const count2AS = sourceClasses.filter((c) => c.grade_level === '2AS').length;
  const count3AS = sourceClasses.filter((c) => c.grade_level === '3AS').length;

  return (
    <div className="space-y-6 pb-12 text-right">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] p-4 rounded-2xl shadow-xl flex items-center gap-3 border bg-slate-900 text-white border-slate-700 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Action Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">الأقسام التربوية</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {assignedClasses.length} أقسام مسندة إليك
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              الأقسام التي تدرّسها فعلياً هذا الموسم الدراسي (تظهر حصرياً في دفاتر التنقيط، الغيابات، والكشوفات)
            </p>
          </div>
        </div>

      </div>

      {/* Scope Selector Notice Banner */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-bold text-slate-800">نطاق عرض الأقسام:</span>
          <span className="text-slate-500 text-[11px]">
            {viewScope === 'ASSIGNED'
              ? 'تظهر لك فقط الأقسام المسندة إليك للتدريس'
              : 'عرض كافة أقسام الثانوية للتمكن من إسناد أو إلغاء إسناد أي قسم بسرعة'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewScope('ASSIGNED')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 ${
              viewScope === 'ASSIGNED'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>أقسامي المسندة ({assignedClasses.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewScope('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 ${
              viewScope === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>كل أقسام المؤسسة ({allSchool.length})</span>
          </button>
        </div>
      </div>

      {/* Search & Level Filter Toolbar */}
      {assignedClasses.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
            <button
              type="button"
              onClick={() => setGradeFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                gradeFilter === 'ALL'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              جميع المستويات ({assignedClasses.length})
            </button>
            <button
              type="button"
              onClick={() => setGradeFilter('1AS')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                gradeFilter === '1AS'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              1 ثانوي ({count1AS})
            </button>
            <button
              type="button"
              onClick={() => setGradeFilter('2AS')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                gradeFilter === '2AS'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              2 ثانوي ({count2AS})
            </button>
            <button
              type="button"
              onClick={() => setGradeFilter('3AS')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                gradeFilter === '3AS'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              3 ثانوي ({count3AS})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم القسم أو الشعبة..."
              className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Classes Grid */}
      {displayedClasses.length === 0 ? (
        assignedClasses.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
            <Search className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">لا توجد أقسام تطابق الفلترة المحددة</h3>
            <p className="text-xs text-slate-500">
              لم يتم العثور على أي نتائج تطابق البحث &quot;{searchQuery}&quot; في المستوى المحدد.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setGradeFilter('ALL');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              إعادة ضبط الفلترة
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">لا توجد أقسام مسندة إليك حالياً</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                يمكنك رفع ملف الرقمنة الخاص بمؤسستك مباشرة لاستيراد الأقسام والتلاميذ، أو إضافة قسم جديد يدوياً، أو إسناد أقسام من إعدادات المؤسسة.
              </p>
            </div>
            <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>استيراد ملف الرقمنة (Excel)</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs border border-slate-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم يدوياً</span>
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                className="bg-white hover:bg-slate-50 text-emerald-800 font-bold px-4 py-2.5 rounded-xl text-xs border border-emerald-300 transition-colors"
              >
                إسناد من أقسام المؤسسة
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedClasses.map((cls, idx) => (
            <div
              key={cls.id ? `${cls.id}-${idx}` : idx}
              onClick={() => onSelectClass(cls.id)}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between relative"
            >
              <div>
                {/* Level badge, assignment status, and action buttons */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {cls.grade_level === '1AS'
                        ? 'الأولى ثانوي'
                        : cls.grade_level === '2AS'
                        ? 'الثانية ثانوي'
                        : 'الثالثة ثانوي'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleToggleAssignment(cls, e)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                        cls.is_assigned
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                      title={cls.is_assigned ? 'انقر لإلغاء إسناد هذا القسم' : 'انقر لإسناد هذا القسم إليك'}
                    >
                      {cls.is_assigned ? '✓ مسند إليك' : '+ إسناد لي'}
                    </button>
                  </div>

                  {/* Quick Edit and Delete buttons right on the card */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditModal(cls, e)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 transition-colors border border-slate-200"
                      title="تعديل هذا القسم"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClassToDelete(cls);
                      }}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 transition-colors border border-rose-200"
                      title="حذف هذا القسم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {cls.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">{cls.track}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-slate-400 font-mono">{cls.code}</span>
                  <span className="text-[11px] text-slate-400">·</span>
                  <span className="text-[11px] text-slate-500 font-medium">{cls.group_name}</span>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold font-mono text-slate-900">{cls.student_count || 0}</span>
                  <span>تلميذ</span>
                </div>

                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 group-hover:translate-x-[-4px] transition-transform">
                  <span>فتح السجلات</span>
                  <ChevronLeft className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-right border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingClassId ? 'تعديل بيانات القسم' : 'إضافة قسم جديد إلى المنصة'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddClassModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
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
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="مثال: 3 ع ت 2 أو 1AS 1"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رمز القسم (الكود):</label>
                <input
                  type="text"
                  required
                  value={classForm.code}
                  onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                  placeholder="مثال: 3AS-SE-2"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-left dir-ltr"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المستوى التعليمي:</label>
                <select
                  value={classForm.grade_level}
                  onChange={(e: any) => setClassForm({ ...classForm, grade_level: e.target.value })}
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
                  value={classForm.track}
                  onChange={(e) => setClassForm({ ...classForm, track: e.target.value })}
                  placeholder="علوم تجريبية، رياضيات، تقني رياضي، آداب وفلسفة..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الفوج:</label>
                <input
                  type="text"
                  value={classForm.group_name}
                  onChange={(e) => setClassForm({ ...classForm, group_name: e.target.value })}
                  placeholder="فوج 01"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="classes_view_assign_chk"
                  checked={classForm.is_assigned}
                  onChange={(e) => setClassForm({ ...classForm, is_assigned: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="classes_view_assign_chk" className="font-bold text-slate-800 cursor-pointer">
                  إسناد هذا القسم لي فوراً (للتدريس هذا الموسم)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl shadow"
                >
                  {editingClassId ? 'حفظ التعديلات' : 'إضافة القسم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Class Confirmation Modal */}
      {classToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-right border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 border-b border-rose-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">تأكيد حذف القسم</h3>
                <p className="text-xs text-rose-600 font-medium">عملية غير قابلة للتراجع</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              هل أنت متأكد من حذف قسم <span className="font-bold text-slate-900">"{classToDelete.name}"</span> ({classToDelete.track})؟
              سيتم حذف جميع التلاميذ المسجلين في هذا القسم ({classToDelete.student_count || 0} تلميذ) وكافة علاماتهم وسجلات حضورهم نهائياً.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
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

      {/* Clear School Year / Total Delete Modal */}
      {showClearYearModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 text-right border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">الحذف الكلي للموسم الدراسي / تصفير البيانات</h3>
                  <p className="text-xs text-slate-500">تهيئة التطبيق لبدء الموسم الجديد واستيراد نظيف</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClearYearModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Option 1: Total clear everything */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  clearYearMode === 'all'
                    ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="clear_classes_mode"
                  checked={clearYearMode === 'all'}
                  onChange={() => setClearYearMode('all')}
                  className="mt-0.5 w-4 h-4 text-rose-600"
                />
                <div>
                  <span className="font-bold block text-sm mb-0.5">الحذف الكلي الشامل (أقسام + تلاميذ + علامات + غيابات)</span>
                  <span className="text-slate-500 text-[11px] leading-relaxed block">
                    يمسح كافة الأقسام والتلاميذ والنقاط لتجهيز المنصة لموسم جديد تماماً، لتتمكن من استيراد ملف الرقمنة النظيف مباشرة.
                  </span>
                </div>
              </label>

              {/* Option 2: Keep classes, delete students only */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  clearYearMode === 'students_only'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="clear_classes_mode"
                  checked={clearYearMode === 'students_only'}
                  onChange={() => setClearYearMode('students_only')}
                  className="mt-0.5 w-4 h-4 text-emerald-600"
                />
                <div>
                  <span className="font-bold block text-sm mb-0.5">تفريغ قوائم التلاميذ والنقاط فقط (مع الحفاظ على الأقسام)</span>
                  <span className="text-slate-500 text-[11px] leading-relaxed block">
                    يحتفظ بأسماء الأقسام ويمسح فقط أسماء التلاميذ والعلامات والغيابات.
                  </span>
                </div>
              </label>

              {/* Option 3: Reset sample data */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  clearYearMode === 'reset_sample'
                    ? 'bg-blue-50 border-blue-300 text-blue-950 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="clear_classes_mode"
                  checked={clearYearMode === 'reset_sample'}
                  onChange={() => setClearYearMode('reset_sample')}
                  className="mt-0.5 w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-bold block text-sm mb-0.5">استعادة البيانات النموذجية الأولية</span>
                  <span className="text-slate-500 text-[11px] leading-relaxed block">
                    يعيد تحميل الأقسام والتلاميذ والحصص النموذجية لولاية غليزان والأستاذ سعيد زكريا.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearYearModal(false)}
                className="px-4 py-2 text-slate-600 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmClearYear}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-colors"
              >
                تأكيد وتنفيذ العملية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showImportModal && (
        <ExcelImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          classes={dataRepository.getAllSchoolClasses()}
          onImportComplete={(importedCount, createdClassesCount) => {
            notifyChange();
            showToast(`تم استيراد ${importedCount} تلميذاً وتوزيعهم عبر ${createdClassesCount} أقسام بنجاح`);
          }}
        />
      )}
    </div>
  );
};
