import React, { useState } from 'react';
import { SportsEquipment, Profile } from '../types';
import { dataRepository } from '../services/dataService';
import { Dumbbell, Plus, Trash2, Edit, Save, CheckCircle2 } from 'lucide-react';

export const EquipmentView: React.FC<{ profile: Profile }> = ({ profile }) => {
  const [equipment, setEquipment] = useState<SportsEquipment[]>(dataRepository.getEquipment());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    item_name: '',
    category: 'كرات',
    total_quantity: 10,
    operational_quantity: 10,
    damaged_quantity: 0,
    notes: '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item_name.trim()) return;

    await dataRepository.saveEquipment(
      {
        ...form,
        user_id: profile.id,
      },
      editingId || undefined
    );

    setEquipment(dataRepository.getEquipment());
    setShowAddModal(false);
    setEditingId(null);
    setForm({
      item_name: '',
      category: 'كرات',
      total_quantity: 10,
      operational_quantity: 10,
      damaged_quantity: 0,
      notes: '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا العتاد من الجرد؟')) return;
    await dataRepository.deleteEquipment(id);
    setEquipment(dataRepository.getEquipment());
  };

  return (
    <div className="space-y-6 pb-12 text-right">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">سجل جرد العتاد والوسائل الرياضية</h2>
            <p className="text-xs text-slate-500">
              متابعة عتاد الثانوية، الكرات، أجهزة القياس ومعدات السلامة
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingId(null);
            setForm({
              item_name: '',
              category: 'كرات',
              total_quantity: 10,
              operational_quantity: 10,
              damaged_quantity: 0,
              notes: '',
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عتاد جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3">اسم العتاد</th>
                <th className="p-3">الصنف</th>
                <th className="p-3 text-center">الكمية الإجمالية</th>
                <th className="p-3 text-center">الصالحة للاستعمال</th>
                <th className="p-3 text-center">المتضررة / التالفة</th>
                <th className="p-3">الموقع والملاحظات</th>
                <th className="p-3 text-center w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipment.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{item.item_name}</td>
                  <td className="p-3 text-slate-600 font-semibold">{item.category}</td>
                  <td className="p-3 text-center font-mono font-bold">{item.total_quantity}</td>
                  <td className="p-3 text-center font-mono font-bold text-emerald-700">
                    {item.operational_quantity}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-rose-700">
                    {item.damaged_quantity}
                  </td>
                  <td className="p-3 text-slate-500">{item.notes || '—'}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setForm({
                            item_name: item.item_name,
                            category: item.category,
                            total_quantity: item.total_quantity,
                            operational_quantity: item.operational_quantity,
                            damaged_quantity: item.damaged_quantity,
                            notes: item.notes || '',
                          });
                          setShowAddModal(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-teal-700 rounded-lg hover:bg-teal-50"
                        title="تعديل"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-right border border-slate-100 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              {editingId ? 'تعديل بيانات العتاد' : 'إضافة عتاد رياضي جديد'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم العتاد أو الوسيلة:</label>
                <input
                  type="text"
                  required
                  value={form.item_name}
                  onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                  placeholder="مثال: كرات يد قياس 2"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الصنف:</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="كرات">كرات (يد، سلة، طائرة، قدم)</option>
                  <option value="ألعاب قوى">ألعاب قوى (جلات، حواجز، منصات)</option>
                  <option value="عتاد بيداغوجي">عتاد بيداغوجي (أقماع، صدريات، أطواق)</option>
                  <option value="أجهزة قياس">أجهزة قياس (ميقاتي، شريط قياس)</option>
                  <option value="إسعافات ووقاية">إسعافات ووقاية</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الإجمالي:</label>
                  <input
                    type="number"
                    min="0"
                    value={form.total_quantity}
                    onChange={(e) => setForm({ ...form, total_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">صالحة:</label>
                  <input
                    type="number"
                    min="0"
                    value={form.operational_quantity}
                    onChange={(e) => setForm({ ...form, operational_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تالفة:</label>
                  <input
                    type="number"
                    min="0"
                    value={form.damaged_quantity}
                    onChange={(e) => setForm({ ...form, damaged_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الملاحظات ومكان التخزين:</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="مخزن التربية البدنية، الرف رقم 2..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
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
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2 rounded-xl"
                >
                  {editingId ? 'حفظ التعديلات' : 'إضافة الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
