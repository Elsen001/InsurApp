"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { authApi, bonusesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRODUCT_GROUPS, PRODUCT_LABELS, ALL_PRODUCTS } from "@/lib/products";
import { AtesgahAvtoCalc } from "@/components/AtesgahAvtoCalc";
import { PashaBonusCalc } from "@/components/PashaBonusCalc";
import { Plus, Trash2, Gift, Percent, Car, Building2, Search, ChevronDown } from "lucide-react";

// Faiz: yalnız 0–99 (2 rəqəm, mənfi yox, 100+ yox)
const clampPct = (v: string) => v.replace(/[^\d]/g, "").slice(0, 2);

export default function BonusesPage() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role;
  const isAdmin = role === "admin";

  const [staff, setStaff] = useState<any[]>([]);
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [percents, setPercents] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"simple" | "atesgah" | "pasha">("simple");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bonusSearch, setBonusSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

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
    if (selectedIds.length === 0) { setError("Ən azı bir agent və ya subagent seçin"); return; }
    // Bütün məhsullar default 0 — yalnız 0-dan böyük olanlar üçün bonus yaranır
    const entries = ALL_PRODUCTS
      .map(p => [p.value, percents[p.value] ?? "0"] as [string, string])
      .filter(([, v]) => Number(v) > 0);
    if (entries.length === 0) { setError("Ən azı bir məhsula 0-dan böyük bonus faizi yazın"); return; }

    setSaving(true);
    try {
      const calls: Promise<any>[] = [];
      for (const uid of selectedIds) {
        for (const [product, pct] of entries) {
          calls.push(bonusesApi.create({
            user_id: uid,
            product,
            product_label: PRODUCT_LABELS[product] || product,
            percent: Number(pct) || 0,
            note: note || undefined,
          }));
        }
      }
      await Promise.all(calls);
      setPercents({});
      setNote("");
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
                setPercents(p => ({ ...p, "avtonəqliyyat": String(pct) }));
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
                setPercents(p => ({ ...p, "avtonəqliyyat": String(pct) }));
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

            {/* Məhsullar üzrə bonus faizi — alt-alta siyahı */}
            <div className="space-y-2 md:col-span-2">
              <Label>Sığorta məhsulları üzrə bonus faizi (%)</Label>
              <div className="space-y-3 max-h-[240px] overflow-y-auto border border-slate-200 rounded-lg p-3">
                {PRODUCT_GROUPS.map(g => (
                  <div key={g.key} className="space-y-0.5">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide bg-slate-50 px-2 py-1 rounded">{g.label}</p>
                    {g.items.map(it => {
                      const val = percents[it.value] ?? "0";
                      const filled = Number(val) > 0;
                      return (
                        <div key={it.value} className={`flex items-center gap-3 rounded-md px-2 py-1 ${filled ? "bg-primary/5" : "hover:bg-slate-50"}`}>
                          <span className="flex-1 text-sm text-slate-700">{it.label}</span>
                          <div className="relative w-20 shrink-0">
                            <Input
                              type="text" inputMode="numeric" maxLength={2}
                              value={val}
                              onChange={e => setPercents(p => ({ ...p, [it.value]: clampPct(e.target.value) }))}
                              className="pr-6 text-right h-8"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Yalnız faiz yazdığınız məhsullar üçün bonus təyin olunur.</p>
            </div>

            {/* Qeyd */}
            <div className="space-y-2 md:col-span-2">
              <Label>Qeyd (bütün seçilənlərə)</Label>
              <Input value={note} onChange={e => setNote(e.target.value)} placeholder="İxtiyari" />
            </div>

            {error && <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>}
            <div className="md:col-span-2">
              <Button type="submit" loading={saving}>Bonusu yadda saxla</Button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground mt-3">
            Faiz yazdığınız hər məhsul üçün seçilmiş agent/subagentlərə bonus yaranır. Eyni istifadəçi + məhsul təkrar təyin edilsə, mövcud bonus yenilənir.
          </p>
        </CardContent>
      </Card>

      {/* Mövcud bonuslar */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">Agent və bonus siyahısı</CardTitle>
            {/* Axtarış */}
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={bonusSearch}
                onChange={e => setBonusSearch(e.target.value)}
                placeholder="Ad, Agent və məhsul axtar..."
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin h-7 w-7 rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : (agents.length + subagents.length) === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Agent və ya subagent yoxdur</p>
          ) : (() => {
            const q = bonusSearch.trim().toLowerCase();
            const roleLabel = (r: string) => (r === "subagent" ? "subagent" : "agent");
            // Hər agent/subagent bir dəfə; bonusları içində
            const staffAll = [...agents, ...subagents];
            const withBonuses = staffAll.map(u => ({ user: u, list: bonuses.filter(b => b.user_id === u.id) }));
            const filtered = q
              ? withBonuses.filter(({ user, list }) =>
                  user.name.toLowerCase().includes(q) ||
                  roleLabel(user.role).includes(q) ||
                  list.some(b => (b.product_label || "").toLowerCase().includes(q)))
              : withBonuses;
            if (filtered.length === 0) {
              return <p className="text-center py-8 text-muted-foreground text-sm">"{bonusSearch}" üzrə nəticə tapılmadı</p>;
            }
            return (
              <>
                {/* 5 sətir görünür, çoxaldıqda scroll */}
                <div className="overflow-auto max-h-[320px] rounded-lg border border-slate-200 divide-y">
                  {filtered.map(({ user, list }) => {
                    const expanded = q ? true : expandedUser === user.id;
                    return (
                      <div key={user.id}>
                        {/* Agent sətri (tək line) */}
                        <button
                          type="button"
                          onClick={() => setExpandedUser(prev => (prev === user.id ? null : user.id))}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left"
                        >
                          <span className="flex-1 min-w-0">
                            <span className="font-medium text-slate-800 block truncate">{user.name}</span>
                            {(user.vezife || user.filial) && (
                              <span className="text-xs text-muted-foreground block truncate">
                                {user.vezife}{user.vezife && user.filial ? " · " : ""}{user.filial}
                              </span>
                            )}
                          </span>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${user.role === "subagent" ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"}`}>
                            {user.role === "subagent" ? "Subagent" : "Agent"}
                          </span>
                          <span className="text-xs text-muted-foreground w-16 text-right">{list.length} bonus</span>
                          <ChevronDown size={16} className={`text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
                        </button>

                        {/* Bonuslar (alt-alta) */}
                        {expanded && (
                          <div className="bg-slate-50/60 px-3 pb-2 pt-1">
                            {list.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic pl-3 py-1">Bonus təyin olunmayıb</p>
                            ) : (
                              <div className="space-y-1">
                                {list.map(b => (
                                  <div key={b.id} className="flex items-center gap-3 pl-3 pr-1 py-1.5 rounded-md bg-white border border-slate-100">
                                    <span className="flex-1 text-sm text-slate-700 truncate">{b.product_label}</span>
                                    {b.note && <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[120px]">{b.note}</span>}
                                    <span className="font-semibold text-emerald-700 text-sm w-16 text-right">{Number(b.percent).toFixed(2)}%</span>
                                    <button onClick={() => handleDelete(b.id)} className="text-red-500 hover:text-red-700 p-1 shrink-0">
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{staffAll.length} agent/subagent · {bonuses.length} bonus{q ? ` · "${bonusSearch}" üzrə ${filtered.length} nəticə` : ""}</p>
              </>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
