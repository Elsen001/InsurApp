"use client";
import { useEffect, useState } from "react";
import { authApi, bonusesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRODUCT_GROUPS, PRODUCT_LABELS } from "@/lib/products";
import { Plus, X, Trash2, Gift } from "lucide-react";

export default function BonusesPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ user_id: "", product: "", percent: "", note: "" });

  const load = async () => {
    setLoading(true);
    const [staffRes, bonusesRes] = await Promise.all([authApi.getStaff(), bonusesApi.getAll()]);
    setStaff(staffRes.data.staff);
    setBonuses(bonusesRes.data.bonuses);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.user_id || !form.product) { setError("İstifadəçi və məhsul seçin"); return; }
    setSaving(true);
    try {
      await bonusesApi.create({
        user_id: Number(form.user_id),
        product: form.product,
        product_label: PRODUCT_LABELS[form.product] || form.product,
        percent: Number(form.percent) || 0,
        note: form.note || undefined,
      });
      setForm({ user_id: "", product: "", percent: "", note: "" });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await bonusesApi.delete(id);
    load();
  };

  const agents = staff.filter(s => s.role === "agent");
  const subagents = staff.filter(s => s.role === "subagent");

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Gift size={22} /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bonuslar</h1>
          <p className="text-sm text-muted-foreground">Sığorta məhsuluna görə agent və subagentlərə bonus faizi təyin edin (premiumun %-i)</p>
        </div>
      </div>

      {/* Yeni bonus forması */}
      <Card className="border-primary/30">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus size={18} />Bonus təyin et</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* İşçi seçimi */}
            <div className="space-y-2">
              <Label>Agent / Subagent *</Label>
              <select
                value={form.user_id}
                onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Seçin —</option>
                {agents.length > 0 && (
                  <optgroup label="Agentlər">
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name} — {a.email}</option>)}
                  </optgroup>
                )}
                {subagents.length > 0 && (
                  <optgroup label="Subagentlər">
                    {subagents.map(s => <option key={s.id} value={s.id}>{s.name} — {s.email} (subagent)</option>)}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Məhsul seçimi */}
            <div className="space-y-2">
              <Label>Sığorta məhsulu *</Label>
              <select
                value={form.product}
                onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Məhsul seçin —</option>
                {PRODUCT_GROUPS.map(g => (
                  <optgroup key={g.key} label={g.label}>
                    {g.items.map(it => <option key={it.value} value={it.value}>{it.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Bonus faizi (%) *</Label>
              <Input type="number" min="0" max="100" step="0.01" value={form.percent}
                onChange={e => setForm(f => ({ ...f, percent: e.target.value }))} required placeholder="məs. 5" />
              <p className="text-xs text-muted-foreground">Satılan sığortanın premiumundan tutulacaq faiz.</p>
            </div>

            <div className="space-y-2">
              <Label>Qeyd</Label>
              <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="İxtiyari" />
            </div>

            {error && <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>}
            <div className="md:col-span-2">
              <Button type="submit" loading={saving}>Bonusu yadda saxla</Button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground mt-3">
            Eyni istifadəçi + məhsul üçün təkrar təyin etsəniz, mövcud bonus yenilənir. Misal: Yuvam üçün 5% → agent Yuvam satdıqda premiumun 5%-i onun bonusudur.
          </p>
        </CardContent>
      </Card>

      {/* Mövcud bonuslar */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Təyin olunmuş bonuslar</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin h-7 w-7 rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : bonuses.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Hələ bonus təyin olunmayıb</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">İşçi</th>
                    <th className="px-3 py-2 font-semibold">Növ</th>
                    <th className="px-3 py-2 font-semibold">Məhsul</th>
                    <th className="px-3 py-2 font-semibold text-right">Bonus faizi</th>
                    <th className="px-3 py-2 font-semibold">Qeyd</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {bonuses.map(b => (
                    <tr key={b.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{b.user_name}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${b.user_role === "subagent" ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"}`}>
                          {b.user_role === "subagent" ? "Subagent" : "Agent"}
                        </span>
                      </td>
                      <td className="px-3 py-2">{b.product_label}</td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-700">{Number(b.percent).toFixed(2)}%</td>
                      <td className="px-3 py-2 text-muted-foreground">{b.note || "—"}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => handleDelete(b.id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
