"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { authApi, bonusesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRODUCT_GROUPS, PRODUCT_LABELS } from "@/lib/products";
import { AtesgahAvtoCalc } from "@/components/AtesgahAvtoCalc";
import { PashaBonusCalc } from "@/components/PashaBonusCalc";
import { Plus, Trash2, Gift, Percent, Car, Building2 } from "lucide-react";

export default function BonusesPage() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role;
  const isAdmin = role === "admin";

  const [staff, setStaff] = useState<any[]>([]);
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ product: "", percent: "", note: "" });
  const [mode, setMode] = useState<"simple" | "atesgah" | "pasha">("simple");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [staffRes, bonusesRes] = await Promise.all([authApi.getStaff(), bonusesApi.getAll()]);
      setStaff(staffRes.data.staff);
      setBonuses(bonusesRes.data.bonuses);
    } catch (err) {
      // icazə yoxdursa (agent/subagent) sakit keç
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) load(); else if (role) setLoading(false); }, [isAdmin, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.product) { setError("Məhsul seçin"); return; }
    if (selectedIds.length === 0) { setError("Ən azı bir agent və ya subagent seçin"); return; }

    setSaving(true);
    try {
      await Promise.all(selectedIds.map(uid => bonusesApi.create({
        user_id: uid,
        product: form.product,
        product_label: PRODUCT_LABELS[form.product] || form.product,
        percent: Number(form.percent) || 0,
        note: form.note || undefined,
      })));
      setForm({ product: "", percent: "", note: "" });
      setSelectedIds([]);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  };

  const toggleId = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const allChecked = (list: any[]) => list.length > 0 && list.every(u => selectedIds.includes(u.id));

  const toggleAll = (list: any[]) => {
    const ids = list.map(u => u.id);
    setSelectedIds(prev => allChecked(list) ? prev.filter(x => !ids.includes(x)) : Array.from(new Set([...prev, ...ids])));
  };

  const handleDelete = async (id: number) => {
    await bonusesApi.delete(id);
    load();
  };

  const agents = staff.filter(s => s.role === "agent");
  const subagents = staff.filter(s => s.role === "subagent");

  // Yalnız admin
  if (status === "loading" || !role) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="inline-flex p-3 bg-red-50 rounded-full text-red-500 mb-3"><Gift size={28} /></div>
        <h1 className="text-xl font-bold text-slate-900">Bu səhifə yalnız admin üçündür</h1>
        <p className="text-sm text-muted-foreground mt-1">Öz bonuslarınızı görmək üçün "Bonuslarım" bölməsinə keçin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Gift size={22} /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bonuslar</h1>
          <p className="text-sm text-muted-foreground">Sığorta məhsuluna görə agent və subagentlərə bonus faizi təyin edin (premiumun %-i)</p>
        </div>
      </div>

      {/* Bonus növü seçimi */}
      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMode("simple")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${mode === "simple" ? "bg-white text-primary shadow-sm" : "text-slate-600"}`}
        >
          <Percent size={15} /> Sadə faiz
        </button>
        <button
          type="button"
          onClick={() => setMode("atesgah")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${mode === "atesgah" ? "bg-white text-primary shadow-sm" : "text-slate-600"}`}
        >
          <Car size={15} /> Atəşgah avto cədvəli
        </button>
        <button
          type="button"
          onClick={() => setMode("pasha")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${mode === "pasha" ? "bg-white text-primary shadow-sm" : "text-slate-600"}`}
        >
          <Building2 size={15} /> Paşa Sığorta cədvəli
        </button>
      </div>

      {/* Atəşgah avto tarif cədvəli — seçim */}
      {mode === "atesgah" && (
        <Card className="border-primary/30">
          <CardContent className="pt-5">
            <AtesgahAvtoCalc
              onPick={(pct) => {
                setForm(f => ({ ...f, percent: String(pct), product: f.product || "avtonəqliyyat" }));
                setMode("simple");
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Paşa Sığorta cədvəli — seçim */}
      {mode === "pasha" && (
        <Card className="border-primary/30">
          <CardContent className="pt-5">
            <PashaBonusCalc
              onPick={(pct) => {
                setForm(f => ({ ...f, percent: String(pct), product: f.product || "avtonəqliyyat" }));
                setMode("simple");
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Yeni bonus forması */}
      <Card className="border-primary/30">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus size={18} />Bonus təyin et</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kimə təyin olunsun — checkbox seçimi */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Kimə təyin olunsun? * <span className="text-xs text-muted-foreground font-normal">(bir və ya bir neçəsini seçin)</span></Label>
                <span className="text-xs font-medium text-primary">{selectedIds.length} seçilib</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Agentlər */}
                <div className="border border-slate-200 rounded-lg p-3">
                  <label className="flex items-center gap-2 font-semibold text-sm pb-2 mb-2 border-b cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={allChecked(agents)} onChange={() => toggleAll(agents)} />
                    Bütün agentlər ({agents.length})
                  </label>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {agents.map(a => (
                      <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                        <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={selectedIds.includes(a.id)} onChange={() => toggleId(a.id)} />
                        <span className="font-medium">{a.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{a.email}</span>
                      </label>
                    ))}
                    {agents.length === 0 && <p className="text-xs text-muted-foreground">Agent yoxdur</p>}
                  </div>
                </div>

                {/* Subagentlər */}
                <div className="border border-slate-200 rounded-lg p-3">
                  <label className="flex items-center gap-2 font-semibold text-sm pb-2 mb-2 border-b cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={allChecked(subagents)} onChange={() => toggleAll(subagents)} />
                    Bütün subagentlər ({subagents.length})
                  </label>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {subagents.map(s => (
                      <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                        <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={selectedIds.includes(s.id)} onChange={() => toggleId(s.id)} />
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{s.email}</span>
                      </label>
                    ))}
                    {subagents.length === 0 && <p className="text-xs text-muted-foreground">Subagent yoxdur</p>}
                  </div>
                </div>
              </div>
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
