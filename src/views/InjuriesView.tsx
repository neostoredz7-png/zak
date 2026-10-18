import React, { useState } from 'react';
import { StudentInjury, SchoolClass, Profile } from '../types';
import { dataRepository } from '../services/dataService';
import { ShieldAlert, Plus, Printer, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface InjuriesViewProps {
  profile: Profile;
  assignedClasses: SchoolClass[];
}

export const InjuriesView: React.FC<InjuriesViewProps> = ({ profile, assignedClasses }) => {
  const [injuries, setInjuries] = useState<StudentInjury[]>(dataRepository.getInjuries());
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    student_name: '',
    class_id: assignedClasses[0]?.id || '',
    incident_date: new Date().toISOString().split('T')[0],
    incident_time: '10:00',
    activity: 'كرة السلة',
    injury_nature: '',
    first_aid_administered: '',
    evacuated_to_hospital: false,
    notes: '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_name.trim() || !form.injury_nature.trim()) return;

    await dataRepository.saveInjury({
      ...form,
      user_id: profile.id,
    });

    setInjuries(dataRepository.getInjuries());
    setShowAddModal(false);
    setForm({
      student_name: '',
      class_id: assignedClasses[0]?.id || '',
      incident_date: new Date().toISOString().split('T')[0],
      incident_time: '10:00',
      activity: 'كرة السلة',
      injury_nature: '',
      first_aid_administered: '',
      evacuated_to_hospital: false,
      notes: '',
    });
  };

  return (
    <div className="space-y-6 pb-12 text-right">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">سجل الحوادث والإصابات الرياضية</h2>
            <p className="text-xs text-slate-500">
              توثيق الحوادث المدرسية والإسعافات الأولية لحماية التلميذ والأستاذ قانونياً
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل حادث جديد</span>
        </button>
      </div>

      <div className="space-y-3">
        {injuries.map((inj) => (
          <div
            key={inj.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-red-300 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{inj.student_name}</span>
                <span className="text-xs bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded font-bold">
                  {inj.activity}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                <span>التاريخ: {inj.incident_date}</span>
                <span>التوقيت: {inj.incident_time}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">طبيعة الإصابة:</span>
                <p className="text-slate-700">{inj.injury_nature}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">الإسعافات والتدابير المتخذة:</span>
                <p className="text-slate-700">{inj.first_aid_administered || 'إسعافات أولية موضعية'}</p>
                {inj.evacuated_to_hospital && (
                  <span className="mt-1 inline-block text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    تم الإجلاء إلى المستشفى
                  </span>
                )}
              </div>
            </div>

            {inj.notes && (
              <p className="text-[11px] text-slate-500 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                {inj.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-right border border-slate-100 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-3">تسجيل حادث / إصابة رياضية</h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم ولقب التلميذ المصاب:</label>
                <input
                  type="text"
                  required
                  value={form.student_name}
                  onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                  placeholder="مثال: نورهان قاسمي"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الحادث:</label>
                  <input
                    type="date"
                    value={form.incident_date}
                    onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">توقيت الحادث:</label>
                  <input
                    type="time"
                    value={form.incident_time}
                    onChange={(e) => setForm({ ...form, incident_time: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">النشاط الرياضي أثناء الحادث:</label>
                <input
                  type="text"
                  required
                  value={form.activity}
                  onChange={(e) => setForm({ ...form, activity: e.target.value })}
                  placeholder="كرة السلة، العدو السريع..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">طبيعة وموقع الإصابة:</label>
                <textarea
                  rows={2}
                  required
                  value={form.injury_nature}
                  onChange={(e) => setForm({ ...form, injury_nature: e.target.value })}
                  placeholder="التواء كاحل، كدمة، جرح..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الإسعافات الأولية المقدمة:</label>
                <textarea
                  rows={2}
                  value={form.first_aid_administered}
                  onChange={(e) => setForm({ ...form, first_aid_administered: e.target.value })}
                  placeholder="وضع كمادات ثلج، رباط ضاغط، نقل للممرضة..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="evac_chk"
                  checked={form.evacuated_to_hospital}
                  onChange={(e) => setForm({ ...form, evacuated_to_hospital: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <label htmlFor="evac_chk" className="font-bold text-red-800">
                  تم نقل التلميذ إلى المستشفى أو المركز الصحي
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl"
                >
                  تسجيل الحادث
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
