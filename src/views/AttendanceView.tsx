import React, { useState, useEffect } from 'react';
import { SchoolClass, Student, AttendanceStatus, Profile } from '../types';
import { dataRepository } from '../services/dataService';
import {
  CalendarCheck,
  Check,
  X as CloseIcon,
  Clock,
  PlusCircle,
  FileCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  Printer,
} from 'lucide-react';

interface AttendanceViewProps {
  profile: Profile;
  assignedClasses: SchoolClass[];
  initialClassId?: string;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  profile,
  assignedClasses,
  initialClassId,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || assignedClasses[0]?.id || ''
  );
  const [sessionDate, setSessionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [sessionNumber, setSessionNumber] = useState<number>(4);
  const [activity, setActivity] = useState<string>('ألعاب القوى (سباق السرعة والتحمل)');
  const [sportsField, setSportsField] = useState<string>('مضمار ألعاب القوى');

  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (initialClassId && assignedClasses.some((c) => c.id === initialClassId)) {
      setSelectedClassId(initialClassId);
    } else if (!assignedClasses.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(assignedClasses[0]?.id || '');
    }
  }, [initialClassId, assignedClasses, selectedClassId]);

  useEffect(() => {
    if (!selectedClassId) return;
    const classStudents = dataRepository.getStudentsByClass(selectedClassId);
    setStudents(classStudents);

    // Look up existing session if any
    const existingSessions = dataRepository.getAttendanceSessions(selectedClassId);
    const matchedSession = existingSessions.find(
      (s) => s.session_date === sessionDate && s.session_number === sessionNumber
    );

    const initialMap: Record<string, { status: AttendanceStatus; notes: string }> = {};

    if (matchedSession) {
      const existingRecords = dataRepository.getAttendanceRecords(matchedSession.id);
      setActivity(matchedSession.activity);
      if (matchedSession.sports_field) setSportsField(matchedSession.sports_field);

      classStudents.forEach((st) => {
        const found = existingRecords.find((r) => r.student_id === st.id);
        if (found) {
          initialMap[st.id] = { status: found.status, notes: found.notes || '' };
        } else {
          initialMap[st.id] = {
            status: st.is_exempt ? 'exempt' : 'present',
            notes: st.is_exempt ? (st.medical_reason || 'معفى طبياً') : '',
          };
        }
      });
    } else {
      classStudents.forEach((st) => {
        initialMap[st.id] = {
          status: st.is_exempt ? 'exempt' : 'present',
          notes: st.is_exempt ? (st.medical_reason || 'معفى طبياً') : '',
        };
      });
    }

    setRecords(initialMap);
  }, [selectedClassId, sessionDate, sessionNumber]);

  const updateStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const updateStudentNotes = (studentId: string, notes: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  const markAllPresent = () => {
    setRecords((prev) => {
      const updated = { ...prev };
      students.forEach((st) => {
        if (!st.is_exempt) {
          updated[st.id] = { ...updated[st.id], status: 'present' };
        }
      });
      return updated;
    });
  };

  const handleSaveSession = async () => {
    if (!selectedClassId) return;
    try {
      const recordsToSave = students.map((s) => ({
        student_id: s.id,
        status: records[s.id]?.status || (s.is_exempt ? 'exempt' : 'present'),
        notes: records[s.id]?.notes || '',
      }));

      await dataRepository.saveAttendanceSession(
        {
          class_id: selectedClassId,
          user_id: profile.id,
          session_date: sessionDate,
          session_number: sessionNumber,
          activity,
          sports_field: sportsField,
        },
        recordsToSave
      );

      setStatusMessage({ type: 'success', text: 'تم حفظ سجل الحضور والغيابات للحصة بنجاح!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'خطأ أثناء حفظ الحصة: ' + err.message });
    }
  };

  // Calculations for summary stats (matching screenshot 3)
  const totalCount = students.length;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let exemptCount = 0;
  let excusedCount = 0;

  students.forEach((st) => {
    const s = records[st.id]?.status;
    if (s === 'present') presentCount++;
    else if (s === 'absent') absentCount++;
    else if (s === 'late') lateCount++;
    else if (s === 'exempt') exemptCount++;
    else if (s === 'excused') excusedCount++;
  });

  const attendanceRate =
    totalCount > 0 ? Math.round(((presentCount + lateCount) / (totalCount - exemptCount || 1)) * 100) : 100;

  if (assignedClasses.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <CalendarCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">لا توجد أقسام مسندة إليك بعد</h3>
        <p className="text-xs text-slate-500 mt-1">
          يرجى إسناد أقسامك في إعدادات المؤسسة لتسجيل حضور وغياب الحصص.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Session Controls Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Class Select */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">القسم المسند:</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
            >
              {assignedClasses.map((cls, idx) => (
                <option key={cls.id ? `${cls.id}-${idx}` : idx} value={cls.id}>
                  {cls.name} — {cls.track}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">تاريخ الحصة:</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-right"
            />
          </div>

          {/* Session Number */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">رقم الحصة في التوزيع:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={sessionNumber}
              onChange={(e) => setSessionNumber(parseInt(e.target.value) || 1)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-center"
            />
          </div>

          {/* Activity / Field */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">النشاط الرياضي:</label>
            <input
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="مثال: ألعاب القوى / كرة السلة"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
            />
          </div>
        </div>

        {/* Action button row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={markAllPresent}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
            >
              تحديد الكل حاضر
            </button>
          </div>

          <button
            onClick={handleSaveSession}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الحصة في قاعدة البيانات</span>
          </button>
        </div>

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

      {/* Attendance Table matching screen 3 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3 text-center w-14">الرقم</th>
                <th className="p-3 min-w-[160px]">اللقب والاسم</th>
                <th className="p-3 text-center min-w-[280px]">حالة الحضور</th>
                <th className="p-3 min-w-[180px]">الملاحظة (سبب الغياب / التأخر)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, idx) => {
                const currentStatus = records[student.id]?.status || 'present';
                const currentNote = records[student.id]?.notes || '';

                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-mono font-bold text-slate-500">
                      {student.student_number || idx + 1}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {student.last_name} {student.first_name}
                      {student.is_exempt && (
                        <span className="mr-1.5 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-normal">
                          إعفاء دائم
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        {/* حاضر */}
                        <button
                          onClick={() => updateStudentStatus(student.id, 'present')}
                          title="حاضر"
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-emerald-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>حاضر</span>
                        </button>

                        {/* غائب */}
                        <button
                          onClick={() => updateStudentStatus(student.id, 'absent')}
                          title="غائب"
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-rose-700'
                          }`}
                        >
                          <CloseIcon className="w-3.5 h-3.5" />
                          <span>غائب</span>
                        </button>

                        {/* متأخر */}
                        <button
                          onClick={() => updateStudentStatus(student.id, 'late')}
                          title="متأخر"
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'late'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-slate-600 hover:text-amber-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>متأخر</span>
                        </button>

                        {/* إعفاء طبي */}
                        <button
                          onClick={() => updateStudentStatus(student.id, 'exempt')}
                          title="إعفاء طبي"
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'exempt'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-blue-700'
                          }`}
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>إعفاء</span>
                        </button>

                        {/* مبرر */}
                        <button
                          onClick={() => updateStudentStatus(student.id, 'excused')}
                          title="غياب مبرر"
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'excused'
                              ? 'bg-teal-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-teal-700'
                          }`}
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>مبرر</span>
                        </button>
                      </div>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={currentNote}
                        onChange={(e) => updateStudentNotes(student.id, e.target.value)}
                        placeholder="سبب الغياب أو ملاحظة الأستاذ..."
                        className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Stats Strip (matching screenshot 3) */}
        <div className="bg-slate-900 text-white p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="block text-[11px] text-slate-400">الحاضرون</span>
              <span className="text-xl font-black text-emerald-400 tabular-nums">{presentCount}</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="block text-[11px] text-slate-400">الغياب</span>
              <span className="text-xl font-black text-rose-400 tabular-nums">{absentCount}</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="block text-[11px] text-slate-400">التأخرات</span>
              <span className="text-xl font-black text-amber-400 tabular-nums">{lateCount}</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="block text-[11px] text-slate-400">المعفيين طبياً</span>
              <span className="text-xl font-black text-blue-400 tabular-nums">{exemptCount}</span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-emerald-950 p-2.5 rounded-xl border border-emerald-800">
              <span className="block text-[11px] text-emerald-300">نسبة الحضور</span>
              <span className="text-xl font-black text-white tabular-nums">{attendanceRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
