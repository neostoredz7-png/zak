import React, { useState } from 'react';
import { SchoolClass, Lesson, Profile } from '../types';
import { dataRepository } from '../services/dataService';
import {
  BookOpen,
  Plus,
  Save,
  Printer,
  Copy,
  Trash2,
  Clock,
  Target,
  Sparkles,
  Dumbbell,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface DailyLessonViewProps {
  profile: Profile;
  assignedClasses: SchoolClass[];
}

export const DailyLessonView: React.FC<DailyLessonViewProps> = ({ profile, assignedClasses }) => {
  const [lessons, setLessons] = useState<Lesson[]>(dataRepository.getLessons());
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    lessons[0]?.id || ''
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form state
  const selectedLesson = lessons.find((l) => l.id === selectedLessonId) || lessons[0];
  const [formData, setFormData] = useState<Partial<Lesson>>(selectedLesson || {});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLessonId(lesson.id);
    setFormData(lesson);
    setIsEditing(false);
  };

  const handleNewLesson = () => {
    const nextNumber = lessons.length > 0 ? Math.max(...lessons.map((l) => l.lesson_number)) + 1 : 1;
    const fresh: Partial<Lesson> = {
      lesson_number: nextNumber,
      lesson_date: new Date().toISOString().split('T')[0],
      class_id: assignedClasses[0]?.id || '',
      activity: 'ألعاب القوى (سباق السرعة)',
      sports_field: 'مضمار ألعاب القوى بالثانوية',
      target_competence: 'تحسين التوافق الحركي والسرعة الانتقالية في الجري السريع.',
      learning_objective: 'الانطلاق من الجثو والوصول إلى أقصى سرعة ممكنة خلال المسافة المحددة.',
      warmup_desc: 'إحماء عام: جري خفيف 5 دقائق + إحماء مفصلي للرقبة، الكتفين، الحوض والركبتين + جري ارتدادي.',
      warmup_duration: 15,
      main_desc: 'الموقف 1: وضعية الانطلاق من المنطلق المنخفض والتركيز على دفع القدمين بقوة.\nالموقف 2: تسارع على مسافة 30 متراً في خط مستقيم.\nالموقف 3: سباق تنافسي 50 متراً وتسجيل الأزمنة الفردية.',
      main_duration: 60,
      cooldown_desc: 'مشي بطيء واسترجاع هوائي، إطالات عضلية هادئة لعضلات الساق والفخذ الخلفية.',
      cooldown_duration: 15,
      equipment: 'صافرة، ميقاتي يدوي، منصات انطلاق (Starting Blocks)، أقماع.',
      success_criteria: 'الخروج بزاوية 45 درجة، ثبات الخطوات وعدم الالتفات أثناء الجري.',
      teacher_notes: 'حضور منضبط وتفاعل ممتاز من التلاميذ في سباق السرعة.',
    };
    setFormData(fresh);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.activity) return;
    try {
      const saved = await dataRepository.saveLesson(
        formData as Omit<Lesson, 'id'>,
        isEditing && selectedLessonId ? selectedLessonId : undefined
      );
      const updatedList = dataRepository.getLessons();
      setLessons(updatedList);
      setSelectedLessonId(saved.id);
      setFormData(saved);
      setIsEditing(false);
      setStatusMessage('تم حفظ جذاذة الحصة بنجاح!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert('خطأ أثناء الحفظ: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه الجذاذة من الدفتر اليومي؟')) return;
    await dataRepository.deleteLesson(id);
    const updated = dataRepository.getLessons();
    setLessons(updated);
    if (updated.length > 0) {
      setSelectedLessonId(updated[0].id);
      setFormData(updated[0]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentClass = assignedClasses.find((c) => c.id === formData.class_id);

  return (
    <div className="space-y-6 pb-12">
      {/* Action Header Ribbon (no-print) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">الدفتر اليومي وجذاذات الحصص</h2>
            <p className="text-xs text-slate-500">تحضير وإعداد الحصص البيداغوجية لمادة التربية البدنية</p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleNewLesson}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إعداد حصة جديدة</span>
          </button>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              <span>تعديل الجذاذة</span>
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الجذاذة</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الجذاذة</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2 no-print">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Layout: Lessons Selector Drawer + Detailed Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Drawer / Lesson Archive (no-print) */}
        <div className="lg:col-span-1 space-y-3 no-print">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
              <span>أرشيف الحصص</span>
              <span className="text-[11px] text-slate-400 font-mono">{lessons.length} حصة</span>
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {lessons.map((lsn) => (
                <div
                  key={lsn.id}
                  onClick={() => handleSelectLesson(lsn)}
                  className={`p-3 rounded-xl border text-right cursor-pointer transition-all ${
                    selectedLessonId === lsn.id
                      ? 'bg-blue-50/80 border-blue-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-blue-800 font-mono">
                      الحصة {String(lsn.lesson_number).padStart(3, '0')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">{lsn.lesson_date}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">{lsn.activity}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{lsn.learning_objective}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right / Center: The Daily Lesson Sheet (matching screen 4 in image.png) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 text-right">
            {/* Sheet Official Banner (matches screen 4 header) */}
            <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white font-mono font-black text-xl px-3 py-1.5 rounded-lg">
                  {String(formData.lesson_number || 1).padStart(3, '0')}
                </div>
                <div>
                  <h3 className="text-sm font-bold">الدفتر اليومي — جذاذة تحضير الحصة</h3>
                  <p className="text-xs text-slate-300">
                    أستاذ المادة: {profile.full_name} · {profile.school_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                  <span className="text-slate-400 ml-1">التاريخ:</span>
                  <span>{formData.lesson_date}</span>
                </div>
                <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                  <span className="text-slate-400 ml-1">القسم:</span>
                  <span>{currentClass?.name || '3 ع ت 03'}</span>
                </div>
              </div>
            </div>

            {/* Editable or View Details Grid */}
            {isEditing ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">القسم:</label>
                    <select
                      value={formData.class_id || ''}
                      onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    >
                      {assignedClasses.map((c, idx) => (
                        <option key={c.id ? `${c.id}-${idx}` : idx} value={c.id}>
                          {c.name} ({c.track})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">النشاط الرياضي:</label>
                    <input
                      type="text"
                      value={formData.activity || ''}
                      onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الميدان / الملعب:</label>
                    <input
                      type="text"
                      value={formData.sports_field || ''}
                      onChange={(e) => setFormData({ ...formData, sports_field: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الكفاءة المستهدفة:</label>
                  <textarea
                    rows={2}
                    value={formData.target_competence || ''}
                    onChange={(e) => setFormData({ ...formData, target_competence: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الهدف التعلمي:</label>
                  <textarea
                    rows={2}
                    value={formData.learning_objective || ''}
                    onChange={(e) => setFormData({ ...formData, learning_objective: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                {/* The 3 Phases */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <span className="font-bold text-emerald-800">1. مرحلة الإحماء (15 د)</span>
                    <textarea
                      rows={3}
                      value={formData.warmup_desc || ''}
                      onChange={(e) => setFormData({ ...formData, warmup_desc: e.target.value })}
                      placeholder="وصف الإحماء العام والخاص..."
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                    <span className="font-bold text-blue-800">2. الجزء الرئيسي (60 د)</span>
                    <textarea
                      rows={3}
                      value={formData.main_desc || ''}
                      onChange={(e) => setFormData({ ...formData, main_desc: e.target.value })}
                      placeholder="المواقف والورشات التعليمية..."
                      className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <span className="font-bold text-amber-800">3. العودة إلى الهدوء (15 د)</span>
                    <textarea
                      rows={3}
                      value={formData.cooldown_desc || ''}
                      onChange={(e) => setFormData({ ...formData, cooldown_desc: e.target.value })}
                      placeholder="الاسترجاع والإطالة..."
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الوسائل والمعدات:</label>
                    <input
                      type="text"
                      value={formData.equipment || ''}
                      onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">معايير ومؤشرات النجاح:</label>
                    <input
                      type="text"
                      value={formData.success_criteria || ''}
                      onChange={(e) => setFormData({ ...formData, success_criteria: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ملاحظات الأستاذ بعد الحصة:</label>
                  <textarea
                    rows={2}
                    value={formData.teacher_notes || ''}
                    onChange={(e) => setFormData({ ...formData, teacher_notes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            ) : (
              /* View Mode exactly as in screenshot 4 */
              <div className="space-y-6">
                {/* Meta block */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">النشاط: </span>
                    <span className="font-bold text-slate-900">{formData.activity}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">الميدان: </span>
                    <span className="font-bold text-slate-900">{formData.sports_field || 'مضمار ألعاب القوى'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">القسم: </span>
                    <span className="font-bold text-slate-900">{currentClass?.name || '3 ع ت 03'}</span>
                  </div>
                </div>

                {/* Target Competence & Objective */}
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
                      <Target className="w-4 h-4" />
                      <span>الكفاءة المستهدفة:</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {formData.target_competence}
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span>الهدف التعلمي:</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {formData.learning_objective}
                    </p>
                  </div>
                </div>

                {/* The 3 Phases */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-3">مراحل الحصة البيداغوجية:</h4>
                  <div className="space-y-3">
                    {/* 1. الإحماء */}
                    <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-4">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                            1
                          </span>
                          <span>مرحلة الإحماء</span>
                        </div>
                        <span className="bg-emerald-100 px-2 py-0.5 rounded text-[11px] font-mono">
                          15 دقيقة
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pr-8">
                        {formData.warmup_desc}
                      </p>
                    </div>

                    {/* 2. الجزء الرئيسي */}
                    <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-4">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-800 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                            2
                          </span>
                          <span>الجزء الرئيسي (الوضعيات التعلمية)</span>
                        </div>
                        <span className="bg-blue-100 px-2 py-0.5 rounded text-[11px] font-mono">
                          60 دقيقة
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pr-8">
                        {formData.main_desc}
                      </p>
                    </div>

                    {/* 3. العودة للهدوء */}
                    <div className="border border-amber-200 bg-amber-50/30 rounded-xl p-4">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-800 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">
                            3
                          </span>
                          <span>مرحلة العودة إلى الهدوء</span>
                        </div>
                        <span className="bg-amber-100 px-2 py-0.5 rounded text-[11px] font-mono">
                          15 دقيقة
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pr-8">
                        {formData.cooldown_desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Equipment & Success criteria */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-800 block mb-1">الوسائل والمعدات:</span>
                    <span className="text-slate-600">{formData.equipment || 'صافرة، ميقاتي، أقماع'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-800 block mb-1">معايير ومؤشرات النجاح:</span>
                    <span className="text-slate-600">{formData.success_criteria || 'تحقيق التكنيك الصحيح والسرعة'}</span>
                  </div>
                </div>

                {/* Session Attendance quick stats */}
                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-around text-center text-xs">
                  <div>
                    <span className="block text-slate-400 text-[11px]">عدد الحاضرين</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">32</span>
                  </div>
                  <div className="h-8 w-px bg-slate-700"></div>
                  <div>
                    <span className="block text-slate-400 text-[11px]">عدد الغائبين</span>
                    <span className="text-lg font-black text-rose-400 font-mono">5</span>
                  </div>
                  <div className="h-8 w-px bg-slate-700"></div>
                  <div>
                    <span className="block text-slate-400 text-[11px]">عدد المعفيين</span>
                    <span className="text-lg font-black text-blue-400 font-mono">1</span>
                  </div>
                </div>

                {/* Teacher Notes */}
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs">
                  <span className="font-bold text-emerald-900 block mb-1">ملاحظات الأستاذ بعد الحصة:</span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {formData.teacher_notes || 'أظهرت مجموعة من التلاميذ تحسناً ملحوظاً في التكنيك والانضباط.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
