import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { SchoolClass, Profile } from '../types';
import { dataRepository } from '../services/dataService';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { useAuth } from '../context/AuthContext';
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
  UserCheck,
  Lock,
  KeyRound,
  ShieldCheck,
  LogOut,
  Phone,
  Mail,
  GraduationCap,
  Layers,
  ArrowRightLeft,
  Briefcase,
  FileBadge,
  CloudCheck,
  CloudUpload,
  RefreshCw,
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
  const { user, updateCredentials, logout, isFirebaseConnected, firebaseUser, loginWithGoogle, forceUploadToFirebase } = useAuth();
  const [activeTab, setActiveTab] = useState<'classes' | 'teacher_auth' | 'school_season' | 'database'>('classes');

  const [classes, setClasses] = useState<SchoolClass[]>(dataRepository.getAllSchoolClasses());
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  
  // Teacher & Institution Profile Form
  const [profileForm, setProfileForm] = useState<Profile>({
    ...profile,
    matricule: profile.matricule || '102948',
    director_name: profile.director_name || 'السيد مدير المؤسسة',
    inspector_name: profile.inspector_name || 'السيد مفتش المقاطعة التربوية',
    phone: profile.phone || '0550123456',
  });

  // Login Credentials Form
  const [credentialsForm, setCredentialsForm] = useState({
    email: profile.email || 'prof.zakaria@education.dz',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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

  // Firebase sync state
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save Teacher Profile & Login Credentials
  const handleSaveTeacherAndAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (credentialsForm.newPassword) {
      if (credentialsForm.newPassword !== credentialsForm.confirmPassword) {
        showToast('كلمة المرور الجديدة وتأكيدها غير متطابقين', 'error');
        return;
      }
      if (credentialsForm.newPassword.length < 4) {
        showToast('كلمة المرور يجب أن لا تقل عن 4 أحرف أو أرقام', 'error');
        return;
      }
    }

    const updates: Partial<Profile> = {
      full_name: profileForm.full_name,
      matricule: profileForm.matricule,
      specialty: profileForm.specialty,
      phone: profileForm.phone,
      email: credentialsForm.email,
      wilaya: profileForm.wilaya,
      school_name: profileForm.school_name,
    };

    const res = await updateCredentials(updates, credentialsForm.newPassword || undefined);
    if (res.success) {
      await onUpdateProfile(updates);
      showToast('تم حفظ وتحديث بيانات الأستاذ ومعلومات الدخول بنجاح');
      setCredentialsForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } else {
      showToast(res.error || 'حدث خطأ أثناء حفظ البيانات', 'error');
    }
  };

  // Save School & Academic Year Settings
  const handleSaveSchoolAndSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<Profile> = {
      school_name: profileForm.school_name,
      wilaya: profileForm.wilaya,
      municipality: profileForm.municipality,
      academic_year: profileForm.academic_year,
      director_name: profileForm.director_name,
      inspector_name: profileForm.inspector_name,
    };

    await onUpdateProfile(updates);
    showToast('تم حفظ إعدادات المؤسسة والموسم الدراسي بنجاح');
  };

  // Class assignment toggle
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
        academic_year: profileForm.academic_year || profile.academic_year,
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

  const handleForceFirebaseUpload = async () => {
    if (!isFirebaseConnected) {
      showToast('يرجى تسجيل الدخول بحساب Google أولاً لربط قاعدة البيانات السحابية', 'error');
      await loginWithGoogle();
      return;
    }
    setIsSyncingFirebase(true);
    const res = await forceUploadToFirebase();
    setIsSyncingFirebase(false);
    if (res.success) {
      showToast(`تم رفع ومزامنة ${res.count} عنصراً إلى قاعدة بيانات Firebase بنجاح! البيانات الآن متطابقة على كل الأجهزة.`);
    } else {
      showToast(res.error || 'فشلت المزامنة مع Firebase', 'error');
    }
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
    XLSX.writeFile(wb, `أقسام_${profileForm.school_name || profile.school_name}.xlsx`);
  };

  const assignedCount = classes.filter((c) => Boolean(c.is_assigned === true || (c.is_assigned as any) === 'true')).length;
  const unassignedCount = classes.length - assignedCount;

  return (
    <div className="space-y-6 pb-12 text-right">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-[9999] p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold animate-in fade-in slide-in-from-bottom-5 ${
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

      {/* Main Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">مركز الإعدادات الشامل</h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {profileForm.academic_year}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              إسناد الأقسام، إضافة قسم، استيراد الرقمنة، إعدادات المؤسسة والموسم، وتعديل بيانات الأستاذ ومعلومات الدخول
            </p>
          </div>
        </div>

        {/* Global Year Clear / Reset Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowClearYearModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 px-3.5 py-2 rounded-xl transition-all shadow-xs"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>تهيئة الموسم / الحذف الكلي</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'classes'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>إسناد وإدارة الأقسام ({classes.length})</span>
          {assignedCount > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full">
              {assignedCount} مسند
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('teacher_auth')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'teacher_auth'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>بيانات الأستاذ ومعلومات الدخول</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('school_season')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'school_season'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Building className="w-4 h-4 text-emerald-600" />
          <span>إعدادات المؤسسة والموسم</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'database'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          <span>قاعدة بيانات Firebase السحابية</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CLASSES MANAGEMENT, ASSIGNMENT, ADD CLASS & IMPORT EXCEL            */}
      {/* ========================================================================= */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          {/* Action Toolbar Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>إسناد أقسام المؤسسة للأستاذ وإدارتها ({classes.length} قسماً مسجلاً)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تحكم في الأقسام التي تدرّسها فعلياً هذا الموسم، أضف أقساماً جديدة، أو استورد قوائم التلاميذ بنقرة واحدة
                </p>
              </div>

              {/* Action Buttons Toolbar: Add, Import, Export, Clear */}
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة قسم جديد</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>استيراد من Excel / الرقمنة</span>
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
                  onClick={() => setShowClearYearModal(true)}
                  className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                  title="الحذف الكلي وتهيئة موسم جديد"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>تهيئة الموسم</span>
                </button>
              </div>
            </div>

            {/* Assignment Rules Banner */}
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-950">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">قاعدة ظهور الأقسام في لوحة التحكم ودفاتر الأستاذ:</p>
                <p className="text-emerald-800 leading-relaxed text-[11px]">
                  الأقسام المفعلة كـ <strong>«مسند إليك»</strong> أدناه ({assignedCount} أقسام) هي فقط التي ستظهر في شريط التنقل العلوي، لوحة القيادة، دفاتر التنقيط، دفاتر المتابعة والغيابات، والدفتر اليومي. الأقسام غير المسندة تظل مسجلة في المؤسسة فقط.
                </p>
              </div>
            </div>

            {/* Filters and Mass Assignment Toggles */}
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
                  المسندة إليك فقط ({assignedCount})
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
                  غير المسندة ({unassignedCount})
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAssignAll}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors shadow-xs"
                >
                  إسناد كافة الأقسام لي
                </button>
                <button
                  type="button"
                  onClick={handleUnassignAll}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
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
                        لا توجد أقسام مسجلة في هذا التصنيف حالياً. اضغط على «إضافة قسم جديد» أو «استيراد من Excel».
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
                      .map((cls) => {
                        const isAssigned = Boolean(cls.is_assigned === true || (cls.is_assigned as any) === 'true');
                        return (
                          <tr
                            key={cls.id}
                            className={`transition-colors ${
                              isAssigned ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                              <span>{cls.name}</span>
                              <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {cls.code}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  cls.grade_level === '3AS'
                                    ? 'bg-purple-100 text-purple-800'
                                    : cls.grade_level === '2AS'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {cls.grade_level}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600">{cls.track}</td>
                            <td className="p-3 text-slate-600 font-mono">{cls.group_name || 'فوج 01'}</td>
                            <td className="p-3 text-center font-bold text-slate-700">
                              {cls.student_count || 0} تلميذاً
                            </td>
                            <td className="p-3 text-center">
                              {/* Assignment Interactive Switch */}
                              <button
                                type="button"
                                onClick={() => handleToggleAssignment(cls.id, isAssigned)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
                                  isAssigned
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                }`}
                              >
                                {isAssigned ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>مسند إليك</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                                    <span>غير مسند</span>
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(cls)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="تعديل بيانات القسم"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setClassToDelete(cls)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="حذف القسم"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TEACHER PROFILE & LOGIN CREDENTIALS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'teacher_auth' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveTeacherAndAuth} className="space-y-6">
            {/* 1. Teacher Professional Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">بيانات الأستاذ المهنية والشخصية</h3>
                    <p className="text-xs text-slate-500">هذه المعلومات تظهر على رأس كافة الوثائق الرسمية والكشوفات المصدرة</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم واللقب:</label>
                  <input
                    type="text"
                    required
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم التأجير / التعريف الوظيفي:</label>
                  <input
                    type="text"
                    value={profileForm.matricule || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, matricule: e.target.value })}
                    placeholder="مثال: 102948"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المادة والتخصص / الرتبة:</label>
                  <input
                    type="text"
                    required
                    value={profileForm.specialty}
                    onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    value={profileForm.phone || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="0550..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 text-left dir-ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني المهني:</label>
                  <input
                    type="email"
                    required
                    value={credentialsForm.email}
                    onChange={(e) => setCredentialsForm({ ...credentialsForm, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 text-left dir-ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المؤسسة التعليمية الحالية:</label>
                  <input
                    type="text"
                    value={profileForm.school_name}
                    onChange={(e) => setProfileForm({ ...profileForm, school_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Login Credentials & Security Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">معلومات الدخول وتغيير كلمة المرور</h3>
                    <p className="text-xs text-slate-500">تحديث بريد الدخول وكلمة المرور المشفرة المحفوظة في قاعدة البيانات</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>حساب نشط ومحمي</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المستخدم / بريد الدخول:</label>
                  <input
                    type="email"
                    required
                    value={credentialsForm.email}
                    onChange={(e) => setCredentialsForm({ ...credentialsForm, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500 text-left dir-ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">كلمة المرور الجديدة (اتركها فارغة إن لم ترغب في التغيير):</label>
                  <input
                    type="password"
                    value={credentialsForm.newPassword}
                    onChange={(e) => setCredentialsForm({ ...credentialsForm, newPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 text-left dir-ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تأكيد كلمة المرور الجديدة:</label>
                  <input
                    type="password"
                    value={credentialsForm.confirmPassword}
                    onChange={(e) => setCredentialsForm({ ...credentialsForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 text-left dir-ltr"
                  />
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-xs transition-colors"
                >
                  حفظ وتحديث بيانات الأستاذ ومعلومات الدخول
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center justify-center gap-2 text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج والعودة لشاشة الدخول</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SCHOOL SETTINGS & ACADEMIC SEASON                                   */}
      {/* ========================================================================= */}
      {activeTab === 'school_season' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSchoolAndSeason} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">إعدادات المؤسسة التعليمية والموسم الدراسي</h3>
                    <p className="text-xs text-slate-500">بيانات الثانوية، المقاطعة التربوية، والموسم الدراسي</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم الثانوية:</label>
                  <input
                    type="text"
                    required
                    value={profileForm.school_name}
                    onChange={(e) => setProfileForm({ ...profileForm, school_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الولاية:</label>
                  <input
                    type="text"
                    required
                    value={profileForm.wilaya}
                    onChange={(e) => setProfileForm({ ...profileForm, wilaya: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">البلدية / الدائرة:</label>
                  <input
                    type="text"
                    required
                    value={profileForm.municipality}
                    onChange={(e) => setProfileForm({ ...profileForm, municipality: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الموسم الدراسي:</label>
                  <input
                    type="text"
                    required
                    value={profileForm.academic_year}
                    onChange={(e) => setProfileForm({ ...profileForm, academic_year: e.target.value })}
                    placeholder="2026 / 2027"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم السيد مدير الثانوية:</label>
                  <input
                    type="text"
                    value={profileForm.director_name || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, director_name: e.target.value })}
                    placeholder="مثال: السيد مدير الثانوية"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم السيد مفتش المادة:</label>
                  <input
                    type="text"
                    value={profileForm.inspector_name || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, inspector_name: e.target.value })}
                    placeholder="مثال: مفتش التربية الوطنية للتربية البدنية"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-xs transition-colors"
                >
                  حفظ إعدادات المؤسسة والموسم
                </button>
              </div>
            </div>
          </form>

          {/* New Academic Season Preparation Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">تهيئة الموسم الدراسي الجديد / الحذف الكلي</h3>
                <p className="text-xs text-slate-500">
                  إعادة ضبط وتجهيز المنصة لبداية موسم دراسي جديد مع إمكانية مسح بيانات التلاميذ القديمة لبدء استيراد جديد ونظيف
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              عند بداية الموسم الدراسي الجديد، يمكنك تفريغ القوائم السابقة والنقاط المسجلة أو إجراء حذف كلي شامل للأقسام والتلاميذ لإعادة استيراد ملفات الإكسل الرسمية المستخرجة من منصة الرقمنة.
            </p>

            <button
              type="button"
              onClick={() => setShowClearYearModal(true)}
              className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>فتح نافذة تهيئة الموسم الجديد والحذف الكلي</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DATABASE & ONLINE PERSISTENCE (FIREBASE FIRESTORE)                  */}
      {/* ========================================================================= */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">قاعدة بيانات Firebase Firestore السحابية</h3>
                  <p className="text-xs text-slate-500">
                    مزامنة حية وفورية متصلة بالسحابة تضمن تطابق بيانات الأقسام والتلاميذ على كل أجهزتك
                  </p>
                </div>
              </div>

              <span
                className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 border ${
                  isFirebaseConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isFirebaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                ></span>
                <span>{isFirebaseConnected ? 'سحابي متصل بنجاح' : 'غير متصل بحساب Google'}</span>
              </span>
            </div>

            {/* Auth & Connection Status Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-700 block">حساب Google المرتبط بالمزامنة:</span>
                  <span className="font-mono text-slate-900 font-bold text-sm">
                    {firebaseUser?.email || 'لم يتم تسجيل الدخول بعد عبر Google'}
                  </span>
                </div>

                {!isFirebaseConnected ? (
                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <CloudCheck className="w-4 h-4" />
                    <span>تسجيل الدخول بحساب Google لربط السحابة</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleForceFirebaseUpload}
                    disabled={isSyncingFirebase}
                    className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSyncingFirebase ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudUpload className="w-4 h-4" />
                    )}
                    <span>{isSyncingFirebase ? 'جاري الرفع إلى Firebase...' : 'رفع ومزامنة كافة البيانات إلى Firebase الآن'}</span>
                  </button>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600 font-medium">
                <div>
                  <span className="font-bold text-slate-800">معرف قاعدة البيانات (Firestore Database ID):</span>
                  <p className="font-mono text-emerald-800 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                    ai-studio-epsdz-2ae8431a-8c0d-482f-b7f8-16818cda88fa
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-800">معرف المشروع السحابي (Project ID):</span>
                  <p className="font-mono text-emerald-800 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                    gen-lang-client-0986403138
                  </p>
                </div>
              </div>

              {/* Console Tip & Direct Link */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>تنبيه هام عند البحث عن البيانات في Firebase Console:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-950 font-medium">
                  مشروعك يستخدم قاعدة بيانات مخصصة باسم <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-emerald-800 font-bold">ai-studio-epsdz-2ae8431a-8c0d-482f-b7f8-16818cda88fa</code>. عند فتح لوحة تحكم Firebase، القائمة المنسدلة في الأعلى تكون افتراضياً على <code className="bg-white px-1 py-0.5 rounded border border-blue-200 font-mono">(default)</code> وهي فارغة! يجب عليك اختيار قاعدة البيانات <strong>ai-studio-epsdz...</strong> من القائمة المنسدلة لتظهر لك كافة المجموعات (classes, students, marks).
                </p>
                <a
                  href="https://console.firebase.google.com/project/gen-lang-client-0986403138/firestore/databases/ai-studio-epsdz-2ae8431a-8c0d-482f-b7f8-16818cda88fa/data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-bold underline text-xs pt-1"
                >
                  <span>اضغط هنا لفتح قاعدة البيانات ai-studio-epsdz مباشرة في Firebase Console ↗</span>
                </a>
              </div>
            </div>

            {/* Current Sync Stats */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-3">حجم البيانات الحالية الجاهزة للمزامنة السحابية:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                  <span className="text-2xl font-black text-emerald-800">{classes.length}</span>
                  <span className="block text-xs font-bold text-emerald-950 mt-1">أقسام تربوية</span>
                </div>
                <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-xl">
                  <span className="text-2xl font-black text-teal-800">{dataRepository.getAllStudents().length}</span>
                  <span className="block text-xs font-bold text-teal-950 mt-1">تلاميذ مسجلين</span>
                </div>
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl">
                  <span className="text-2xl font-black text-blue-800">
                    {classes.filter((c) => c.is_assigned).length}
                  </span>
                  <span className="block text-xs font-bold text-blue-950 mt-1">أقسام مسندة إليك</span>
                </div>
                <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl">
                  <span className="text-2xl font-black text-purple-800">
                    {dataRepository.getLessons().length}
                  </span>
                  <span className="block text-xs font-bold text-purple-950 mt-1">مذكرات وحصص</span>
                </div>
              </div>
            </div>

            {/* Explanatory Note */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                <span>كيف تضمن ظهور نفس البيانات على جميع أجهزتك؟</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                1. تأكد من الضغط على زر <strong>«تسجيل الدخول عبر Google»</strong> باستخدام نفس الحساب على جهاز الحاسوب والهاتف أو التابلت.<br />
                2. عند استيراد أي ملف Excel أو إضافة أقسام وتلاميذ، يتم رفعها وتحديثها فوراً وبشكل تلقائي في السحابة.<br />
                3. يمكنك في أي وقت الضغط على زر <strong>«رفع ومزامنة كافة البيانات إلى Firebase الآن»</strong> لضمان أن كل البيانات المحلية رُفعت إلى السحابة فوراً.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: ADD/EDIT CLASS, CLEAR YEAR, EXCEL IMPORT                          */}
      {/* ========================================================================= */}

      {/* Add / Edit Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-right border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingClassId ? 'تعديل بيانات القسم' : 'إضافة قسم تربوي جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddClassModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم القسم:</label>
                <input
                  type="text"
                  required
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="مثال: 3 علوم تجريبية 1"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رمز القسم (الكود المختصر):</label>
                <input
                  type="text"
                  required
                  value={classForm.code}
                  onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                  placeholder="مثال: 3AS-SC-1"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-left dir-ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المستوى:</label>
                  <select
                    value={classForm.grade_level}
                    onChange={(e) => setClassForm({ ...classForm, grade_level: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="1AS">1 ثانوي (1AS)</option>
                    <option value="2AS">2 ثانوي (2AS)</option>
                    <option value="3AS">3 ثانوي (3AS)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الشعبة:</label>
                  <input
                    type="text"
                    required
                    value={classForm.track}
                    onChange={(e) => setClassForm({ ...classForm, track: e.target.value })}
                    placeholder="مثال: علوم تجريبية"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الفوج:</label>
                  <input
                    type="text"
                    value={classForm.group_name}
                    onChange={(e) => setClassForm({ ...classForm, group_name: e.target.value })}
                    placeholder="مثال: فوج 01"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={classForm.is_assigned}
                      onChange={(e) => setClassForm({ ...classForm, is_assigned: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="font-bold text-emerald-950 text-[11px]">إسناد هذا القسم لي للتدريس</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2 rounded-xl shadow-xs"
                >
                  {editingClassId ? 'حفظ التعديلات' : 'إضافة القسم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Class Modal */}
      {classToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-right border border-slate-100 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">تأكيد حذف القسم</h3>
              <p className="text-xs text-slate-500 mt-1">
                هل أنت متأكد من حذف قسم <strong>«{classToDelete.name}»</strong>؟ سيتم حذف جميع بيانات التلاميذ والنقاط والغيابات التابعة له.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
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
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs"
              >
                نعم، احذف القسم
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
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  clearYearMode === 'all'
                    ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-xs'
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

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  clearYearMode === 'students_only'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
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

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  clearYearMode === 'reset_sample'
                    ? 'bg-blue-50 border-blue-300 text-blue-950 shadow-xs'
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
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-xs transition-colors"
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
            showToast(`تم استيراد ${importedCount} تلميذاً وتوزيعهم عبر ${createdClassesCount} أقسام بنجاح`);
          }}
        />
      )}
    </div>
  );
};
