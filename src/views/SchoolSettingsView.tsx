import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { SchoolClass, Profile } from '../types';
import { dataRepository } from '../services/dataService';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig } from '../services/supabaseClient';
import { ExcelImportModal } from '../components/ExcelImportModal';
import {
  Settings,
  Building,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Database,
  FileSpreadsheet,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  X,
  Calendar,
} from 'lucide-react';

interface SchoolSettingsViewProps {
  profile: Profile;
  onUpdateProfile: (updates: Partial<Profile>) => Promise<void>;
  onClassesUpdated: () => void;
}

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onClassesUpdated,
}) => {
  const [classes, setClasses] = useState<SchoolClass[]>(dataRepository.getAllSchoolClasses());
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [profileForm, setProfileForm] = useState<Profile>(profile);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Class form modal
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [classForm, setClassForm] = useState({
    name: '',
    code: '',
    grade_level: '3AS' as '1AS' | '2AS' | '3AS',
    track: 'علوم تجريبية',
    group_name: 'فوج 01',
    is_assigned: true,
  });

  // Delete single class confirmation modal
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);

  // Clear School Year / Total Delete Modal
  const [showClearYearModal, setShowClearYearModal] = useState(false);
  const [clearYearMode, setClearYearMode] = useState<'all' | 'students_only' | 'reset_sample'>('all');

  // Supabase connection form
  const currentSupabase = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentSupabase.url);
  const [supabaseKey, setSupabaseKey] = useState(currentSupabase.anonKey);
  const [supabaseStatus, setSupabaseStatus] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateProfile(profileForm);
    setProfileSuccess(true);
    showToast('تم حفظ معلومات المؤسسة بنجاح');
  };

  const handleToggleAssignment = async (classId: string, current: boolean) => {
    await dataRepository.toggleClassAssignment(classId, !current);
    const updated = dataRepository.getAllSchoolClasses();
    setClasses(updated);
    onClassesUpdated();
    showToast(!current ? 'تم إسناد القسم إليك للتدريس' : 'تم إلغاء إسناد القسم');
  };

  const handleAssignAll = async () => {
    for (const c of classes) {
      if (!c.is_assigned) {
        await dataRepository.toggleClassAssignment(c.id, true);
      }
    }
    const updated = dataRepository.getAllSchoolClasses();
    setClasses(updated);
    onClassesUpdated();
    showToast('تم إسناد كافة أقسام المؤسسة إلى الأستاذ');
  };

  const handleUnassignAll = async () => {
    for (const c of classes) {
      if (c.is_assigned) {
        await dataRepository.toggleClassAssignment(c.id, false);
      }
    }
    const updated = dataRepository.getAllSchoolClasses();
    setClasses(updated);
    onClassesUpdated();
    showToast('تم إلغاء إسناد كافة الأقسام (يمكنك الآن إسناد الأقسام الخاصة بك فقط)');
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

  const handleOpenEditModal = (cls: SchoolClass) => {
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
        user_id: profile.id,
        academic_year: profile.academic_year,
        student_count: 0,
      });
      showToast('تمت إضافة القسم الجديد بنجاح');
    }

    const updated = dataRepository.getAllSchoolClasses();
    setClasses(updated);
    onClassesUpdated();
    setShowAddClassModal(false);
    setEditingClassId(null);
  };

  const handleConfirmDeleteClass = async () => {
    if (!classToDelete) return;
    const name = classToDelete.name;
    await dataRepository.deleteClass(classToDelete.id);
    const updated = dataRepository.getAllSchoolClasses();
    setClasses(updated);
    onClassesUpdated();
    setClassToDelete(null);
    showToast(`تم حذف قسم "${name}" وكافة تلاميذه ونقاطه بنجاح`);
  };

  const handleConfirmClearYear = async () => {
    if (clearYearMode === 'all') {
      await dataRepository.clearSchoolYearData(true);
      showToast('تم الحذف الكلي لكافة الأقسام والتلاميذ والنقاط (موسم جديد فارغ)');
    } else if (clearYearMode === 'students_only') {
      await dataRepository.clearSchoolYearData(false);
      showToast('تم تفريغ كافة قوائم التلاميذ والنقاط مع الحفاظ على هيكل الأقسام');
    } else if (clearYearMode === 'reset_sample') {
      dataRepository.resetToDefaultData();
      showToast('تمت استعادة البيانات النموذجية الافتراضية');
    }

    setClasses(dataRepository.getAllSchoolClasses());
    setProfileForm(dataRepository.getProfile());
    onClassesUpdated();
    setShowClearYearModal(false);
  };

  const handleSaveSupabaseConfig = () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      clearSupabaseConfig();
      setSupabaseStatus('تمت استعادة نمط التخزين المحلي');
      setTimeout(() => setSupabaseStatus(null), 3000);
      return;
    }
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setSupabaseStatus('تم حفظ إعدادات Supabase بنجاح! يتم الآن استخدام قاعدة البيانات السحابية.');
    setTimeout(() => setSupabaseStatus(null), 4000);
  };

  const handleExportClassesExcel = () => {
    const data = classes.map((c) => ({
      'رمز القسم': c.code,
      'اسم القسم': c.name,
      'المستوى': c.grade_level,
      'الشعبة': c.track,
      'الفوج': c.group_name,
      'عدد التلاميذ': c.student_count,
      'مسند للأستاذ': c.is_assigned ? 'نعم' : 'لا (في المؤسسة فقط)',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'أقسام المؤسسة');
    XLSX.writeFile(wb, `أقسام_${profile.school_name}.xlsx`);
  };

  return (
    <div className="space-y-8 pb-12 text-right">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Title & Year Management Buttons */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">إعدادات المؤسسة وإدارة الأقسام</h2>
            <p className="text-xs text-slate-500">
              تحديد معلومات الثانوية، إدارة الأقسام، وتهيئة الموسم الدراسي الجديد
            </p>
          </div>
        </div>

        {/* Global Year Clear / Reset Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowClearYearModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 px-3.5 py-2 rounded-xl transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>الحذف الكلي / تهيئة الموسم الجديد</span>
          </button>
        </div>
      </div>

      {/* 1. School & Teacher Information Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <span>أ. معلومات المؤسسة والأستاذ</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">اسم الثانوية:</label>
            <input
              type="text"
              required
              value={profileForm.school_name}
              onChange={(e) => setProfileForm({ ...profileForm, school_name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">الولاية:</label>
            <input
              type="text"
              required
              value={profileForm.wilaya}
              onChange={(e) => setProfileForm({ ...profileForm, wilaya: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">البلدية:</label>
            <input
              type="text"
              required
              value={profileForm.municipality}
              onChange={(e) => setProfileForm({ ...profileForm, municipality: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">الموسم الدراسي:</label>
            <input
              type="text"
              required
              value={profileForm.academic_year}
              onChange={(e) => setProfileForm({ ...profileForm, academic_year: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">اسم ولقب الأستاذ:</label>
            <input
              type="text"
              required
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">المادة والتخصص:</label>
            <input
              type="text"
              value={profileForm.specialty}
              onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-3 pt-2">
            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow transition-colors"
            >
              حفظ بيانات المؤسسة
            </button>
          </div>
        </form>
      </div>

      {/* 2. All High School Classes & Assignment Hub */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              ب. إدارة أقسام الثانوية والإسناد التربوي ({classes.length} أقسام)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              حدد الأقسام التي تدرّسها فعلياً من خلال زر التبديل (تظهر الأقسام المسندة فقط في لوحة القيادة ودفاتر التنقيط والغيابات)
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>استيراد من Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportClassesExcel}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              <span>تصدير الأقسام</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قسم جديد</span>
            </button>

            <button
              type="button"
              onClick={() => setShowClearYearModal(true)}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
              title="الحذف الكلي للموسم الدراسي"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>الحذف الكلي للموسم الدراسي</span>
            </button>
          </div>
        </div>

        {/* Assignment Notice Banner */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-950">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">قاعدة ظهور الأقسام للأستاذ في كامل التطبيق:</p>
            <p className="text-emerald-800 leading-relaxed text-[11px]">
              الأقسام المفعلة كـ <strong>«مسند إليك»</strong> أدناه ({classes.filter((c) => Boolean(c.is_assigned === true || (c.is_assigned as any) === 'true')).length} أقسام) هي الوحيدة التي ستظهر في لوحة التحكم، دفاتر التنقيط، المتابعة والغيابات، والدفتر اليومي. الأقسام غير المسندة تظل مسجلة في المؤسسة فقط.
            </p>
          </div>
        </div>

        {/* Assignment Filter Tabs & Bulk Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setAssignmentFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${
                assignmentFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              جميع أقسام المؤسسة ({classes.length})
            </button>
            <button
              type="button"
              onClick={() => setAssignmentFilter('ASSIGNED')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${
                assignmentFilter === 'ASSIGNED'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              المسندة إليك فقط ({classes.filter((c) => Boolean(c.is_assigned === true || (c.is_assigned as any) === 'true')).length})
            </button>
            <button
              type="button"
              onClick={() => setAssignmentFilter('UNASSIGNED')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${
                assignmentFilter === 'UNASSIGNED'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              غير المسندة ({classes.filter((c) => !Boolean(c.is_assigned === true || (c.is_assigned as any) === 'true')).length})
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAssignAll}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
            >
              إسناد الكل لي
            </button>
            <button
              type="button"
              onClick={handleUnassignAll}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
            >
              إلغاء إسناد الكل
            </button>
          </div>
        </div>

        {/* Classes Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3">اسم القسم</th>
                <th className="p-3">المستوى</th>
                <th className="p-3">الشعبة</th>
                <th className="p-3">الفوج</th>
                <th className="p-3 text-center">عدد التلاميذ</th>
                <th className="p-3 text-center">حالة الإسناد للأستاذ</th>
                <th className="p-3 text-center w-28">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.filter((c) => {
                const isAssigned = Boolean(c.is_assigned === true || (c.is_assigned as any) === 'true');
                if (assignmentFilter === 'ASSIGNED') return isAssigned;
                if (assignmentFilter === 'UNASSIGNED') return !isAssigned;
                return true;
              }).length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    لا توجد أقسام مسجلة في هذا التصنيف حالياً.
                  </td>
                </tr>
              ) : (
                classes
                  .filter((c) => {
                    const isAssigned = Boolean(c.is_assigned === true || (c.is_assigned as any) === 'true');
                    if (assignmentFilter === 'ASSIGNED') return isAssigned;
                    if (assignmentFilter === 'UNASSIGNED') return !isAssigned;
                    return true;
                  })
                  .map((cls, idx) => (
                  <tr
                    key={cls.id ? `${cls.id}-${idx}` : idx}
                    className={`hover:bg-slate-50 transition-colors ${
                      cls.is_assigned ? 'bg-emerald-50/20' : 'bg-slate-50/40 text-slate-500'
                    }`}
                  >
                    <td className="p-3 font-bold text-slate-900">
                      {cls.name}
                      <span className="block text-[11px] text-slate-400 font-mono">{cls.code}</span>
                    </td>
                    <td className="p-3 font-semibold">
                      {cls.grade_level === '1AS'
                        ? 'الأولى ثانوي'
                        : cls.grade_level === '2AS'
                        ? 'الثانية ثانوي'
                        : 'الثالثة ثانوي'}
                    </td>
                    <td className="p-3">{cls.track}</td>
                    <td className="p-3 font-mono">{cls.group_name}</td>
                    <td className="p-3 text-center font-mono font-bold">{cls.student_count || 0}</td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAssignment(cls.id, cls.is_assigned)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          cls.is_assigned
                            ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        <span>{cls.is_assigned ? 'مسند إليك' : 'غير مسند (في الثانوية)'}</span>
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(cls)}
                          className="flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg text-xs font-bold transition-colors border border-slate-200"
                          title="تعديل هذا القسم"
                        >
                          <Edit className="w-3.5 h-3.5 text-emerald-600" />
                          <span>تعديل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setClassToDelete(cls)}
                          className="flex items-center gap-1 px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors border border-rose-200"
                          title="حذف هذا القسم"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>حذف</span>
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

      {/* 3. Supabase Cloud Database Sync Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              ج. الربط مع قاعدة بيانات Supabase السحابية (PostgreSQL & Auth)
            </h3>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-mono">
            {currentSupabase.isConfigured ? 'تم التهيئة' : 'جاهز للربط'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          التطبيق يعمل حالياً بكامل وظائفه عبر التخزين المحلي الآمن. لربطه بقاعدة بيانات Supabase السحابية مع تفعيل سياسات الأمان (Row Level Security)، أدخل رابط مشروعك والمفتاح العام (anon key)، أو حمل ملف <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-800 font-mono">/supabase-schema.sql</code>.
        </p>

        {supabaseStatus && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{supabaseStatus}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Project URL (رابط المشروع):
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-left dir-ltr"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Anon Public Key (المفتاح العام):
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJh..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-left dir-ltr"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSaveSupabaseConfig}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow transition-colors"
          >
            حفظ وتفعيل الاتصال السحابي
          </button>

          <a
            href="/supabase-schema.sql"
            download="supabase-schema.sql"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs border border-slate-300 transition-colors"
          >
            تحميل ملف مخطط قاعدة البيانات (supabase-schema.sql)
          </a>
        </div>
      </div>

      {/* Add / Edit Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-right border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingClassId ? 'تعديل بيانات القسم' : 'إضافة قسم جديد إلى المؤسسة'}
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
                  placeholder="مثال: 3 ع ت 2"
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
                  id="assign_chk"
                  checked={classForm.is_assigned}
                  onChange={(e) => setClassForm({ ...classForm, is_assigned: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="assign_chk" className="font-bold text-slate-800 cursor-pointer">
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

      {/* Delete Single Class In-App Confirmation Modal */}
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
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">تهيئة الموسم الدراسي الجديد / الحذف الكلي</h3>
                  <p className="text-xs text-slate-500">اختر نوع العملية التي تريد تنفيذها لبدء الموسم</p>
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
                  name="clear_mode"
                  checked={clearYearMode === 'all'}
                  onChange={() => setClearYearMode('all')}
                  className="mt-0.5 w-4 h-4 text-rose-600"
                />
                <div>
                  <span className="font-bold block text-sm mb-0.5">الحذف الكلي الشامل (أقسام + تلاميذ + علامات + غيابات)</span>
                  <span className="text-slate-500 text-[11px] leading-relaxed block">
                    يمسح كافة الأقسام والتلاميذ لتجهيز المنصة لموسم جديد تماماً خالٍ من أي بيانات قديمة، للبدء بالاستيراد النظيف من الرقمنة.
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
                  name="clear_mode"
                  checked={clearYearMode === 'students_only'}
                  onChange={() => setClearYearMode('students_only')}
                  className="mt-0.5 w-4 h-4 text-emerald-600"
                />
                <div>
                  <span className="font-bold block text-sm mb-0.5">تفريغ قوائم التلاميذ والنقاط فقط (مع الحفاظ على الأقسام)</span>
                  <span className="text-slate-500 text-[11px] leading-relaxed block">
                    يحتفظ بهيكل الأقسام المسجلة في المؤسسة وإسناداتك، ويمسح فقط أسماء التلاميذ والعلامات والغيابات لإعادة ملئها بتلاميذ الفوج الجديد.
                  </span>
                </div>
              </label>

              {/* Option 3: Reset to sample demo data */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  clearYearMode === 'reset_sample'
                    ? 'bg-blue-50 border-blue-300 text-blue-950 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="clear_mode"
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
          classes={classes}
          onImportComplete={async (importedCount, createdClassesCount) => {
            setClasses(dataRepository.getAllSchoolClasses());
            onClassesUpdated();
            showToast(`تم استيراد ${importedCount} تلميذاً وتوزيعهم عبر ${createdClassesCount} أقسام`);
          }}
        />
      )}
    </div>
  );
};
