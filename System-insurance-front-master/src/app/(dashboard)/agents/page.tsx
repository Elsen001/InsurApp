"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, policiesApi, reportsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency, POLICY_TYPE_LABELS } from "@/lib/utils";
import { Plus, X, ChevronDown, ChevronRight, FileText, FileSpreadsheet } from "lucide-react";

const policyTypes = [
  { value: "all", label: "Bütün növlər" },
  { value: "auto", label: "Avtomobil (MTPL)" },
  { value: "casco", label: "Kasko" },
  { value: "property", label: "Əmlak" },
  { value: "travel", label: "Səfər" },
];

// İcbari və Könüllü şirkət seçimləri
const ICBARI_COMPANIES = ["Atəşgah", "Paşa", "Mega", "Qala", "Xalq"];
const KONULLU_COMPANIES = ["Atəşgah", "Paşa", "Mega", "Qala", "Xalq", "Atəşgah Həyat", "Qala Həyat", "Paşa Həyat"];

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<any[]>([]);
  const [allPolicies, setAllPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", address: "", vezife: "", filial: "", role: "agent", parent_agent_id: "", icbari: [] as string[], konullu: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);

  const [loadError, setLoadError] = useState("");

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [agentsRes, policiesRes] = await Promise.all([
        authApi.getAgents(),
        policiesApi.getAll(),
      ]);
      setAgents(agentsRes.data.agents);
      setAllPolicies(policiesRes.data.policies);
    } catch (err: any) {
      setLoadError(err?.response?.data?.message || "Məlumatları yükləmək mümkün olmadı. Server işləyirmi?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Hər agent üçün filtrlənmiş sığortaları hesabla
  const getAgentPolicies = (agentId: number) => {
    let policies = allPolicies.filter((p: any) => p.agent_id === agentId);
    if (typeFilter !== "all") policies = policies.filter((p: any) => p.type === typeFilter);
    return policies;
  };

  // Növ üzrə breakdown
  const getTypeSummary = (agentId: number) => {
    const policies = allPolicies.filter((p: any) => p.agent_id === agentId);
    const summary: Record<string, { count: number; total: number }> = {};
    policies.forEach((p: any) => {
      if (!summary[p.type]) summary[p.type] = { count: 0, total: 0 };
      summary[p.type].count++;
      summary[p.type].total += Number(p.premium_amount);
    });
    return summary;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const companies = { icbari: form.icbari, konullu: form.konullu };
      const profile = {
        address: form.address || undefined,
        vezife: form.vezife || undefined,
        filial: form.filial || undefined,
      };
      if (form.role === "subagent") {
        if (!form.parent_agent_id) throw { response: { data: { message: "Subagent üçün valideyn agent seçin" } } };
        await authApi.createSubagent({
          name: form.name,
          email: form.email,
          password: form.password,
          parent_agent_id: Number(form.parent_agent_id),
          companies,
          ...profile,
        });
      } else {
        await authApi.createAgent({
          name: form.name,
          email: form.email,
          password: form.password,
          companies,
          ...profile,
        });
      }
      setShowForm(false);
      setForm({ name: "", email: "", password: "", address: "", vezife: "", filial: "", role: "agent", parent_agent_id: "", icbari: [], konullu: [] });
      // Yaratdıqdan sonra Bonuslar səhifəsinə keç
      router.push("/bonuses");
    } catch (err: any) {
      setError(err.response?.data?.message || "Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (agent: any) => {
    await authApi.updateAgent(agent.id, { is_active: !agent.is_active });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Agentlər</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X size={16} className="mr-2" />Bağla</> : <><Plus size={16} className="mr-2" />Yeni Agent</>}
        </Button>
      </div>

      {loadError && (
        <div className="flex items-center justify-between gap-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          <span>{loadError}</span>
          <Button size="sm" variant="outline" onClick={load}>Yenidən cəhd et</Button>
        </div>
      )}

      {/* Yeni agent / subagent forması */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle>{form.role === "subagent" ? "Yeni Subagent Yarat" : "Yeni Agent Yarat"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                {/* SOL — input bloku */}
                <div className="flex-1 space-y-4">
                  {/* Rol seçimi */}
                  <div className="space-y-2">
                    <Label>Növ *</Label>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                      <button type="button" onClick={() => setForm(f => ({ ...f, role: "agent", parent_agent_id: "" }))}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${form.role === "agent" ? "bg-primary text-white shadow" : "text-slate-600"}`}>
                        Agent
                      </button>
                      <button type="button" onClick={() => setForm(f => ({ ...f, role: "subagent" }))}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${form.role === "subagent" ? "bg-primary text-white shadow" : "text-slate-600"}`}>
                        Subagent
                      </button>
                    </div>
                  </div>

                  {form.role === "subagent" && (
                    <div className="space-y-2">
                      <Label>Valideyn agent *</Label>
                      <select
                        value={form.parent_agent_id}
                        onChange={e => setForm(f => ({ ...f, parent_agent_id: e.target.value }))}
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">— Agent seçin —</option>
                        {agents.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">Subagent seçilmiş agentin altında çalışacaq.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Ad Soyad *</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Ünvan</Label>
                    <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Ünvan" />
                  </div>
                  <div className="space-y-2">
                    <Label>Vəzifə</Label>
                    <Input value={form.vezife} onChange={e => setForm(f => ({ ...f, vezife: e.target.value }))} placeholder="Vəzifəni yazın" />
                  </div>
                  <div className="space-y-2">
                    <Label>Filial və ya nümayəndəlik</Label>
                    <Input value={form.filial} onChange={e => setForm(f => ({ ...f, filial: e.target.value }))} placeholder="Filial və ya nümayəndəlik" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Şifrə *</Label>
                    <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
                  </div>
                </div>

                {/* SAĞ — sığorta növləri seçimləri */}
                <div className="flex-1 flex flex-col sm:flex-row gap-4">
                  {/* İcbari */}
                  <div className="flex-1 space-y-2">
                    <Label>İcbari sığorta növləri</Label>
                    <div className="flex flex-col gap-1.5">
                      {ICBARI_COMPANIES.map(c => {
                        const on = form.icbari.includes(c);
                        return (
                          <label key={c} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${on ? "bg-primary/5 border-primary text-primary" : "border-slate-200 hover:border-primary/40"}`}>
                            <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={on}
                              onChange={() => setForm(f => ({ ...f, icbari: on ? f.icbari.filter(x => x !== c) : [...f.icbari, c] }))} />
                            {c}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Könüllü */}
                  <div className="flex-1 space-y-2">
                    <Label>Könüllü sığorta növləri</Label>
                    <div className="flex flex-col gap-1.5">
                      {KONULLU_COMPANIES.map(c => {
                        const on = form.konullu.includes(c);
                        return (
                          <label key={c} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${on ? "bg-primary/5 border-primary text-primary" : "border-slate-200 hover:border-primary/40"}`}>
                            <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={on}
                              onChange={() => setForm(f => ({ ...f, konullu: on ? f.konullu.filter(x => x !== c) : [...f.konullu, c] }))} />
                            {c}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>}
              <Button type="submit" loading={saving}>{form.role === "subagent" ? "Subagent yarat" : "Agent yarat"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sığorta növü filtri */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Sığorta növünə görə filtr:</span>
            {policyTypes.map(t => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(t.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  typeFilter === t.value
                    ? "bg-primary text-white border-primary"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agentlər siyahısı */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <div className="space-y-3">
          {agents.map(agent => {
            const agentPolicies = getAgentPolicies(agent.id);
            const typeSummary = getTypeSummary(agent.id);
            const isExpanded = expandedAgent === agent.id;
            const totalPremium = agentPolicies.reduce((s: number, p: any) => s + Number(p.premium_amount), 0);

            return (
              <Card key={agent.id}>
                <CardContent className="p-0">
                  {/* Agent başlığı */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                      {agent.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{agent.name}</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${agent.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                          {agent.is_active ? "Aktiv" : "Deaktiv"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{agent.email}</p>
                      {(agent.vezife || agent.filial) && (
                        <p className="text-xs text-slate-500">
                          {agent.vezife}
                          {agent.vezife && agent.filial ? " · " : ""}
                          {agent.filial}
                        </p>
                      )}
                    </div>

                    {/* Növ üzrə mini badge-lər */}
                    <div className="hidden md:flex gap-2 flex-wrap">
                      {Object.entries(typeSummary).map(([type, data]: any) => (
                        <span
                          key={type}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                            typeFilter === type || typeFilter === "all"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-gray-50 text-gray-400 border-gray-200 opacity-50"
                          }`}
                        >
                          {POLICY_TYPE_LABELS[type]}: {data.count}
                        </span>
                      ))}
                    </div>

                    <div className="text-right ml-4">
                      <p className="font-semibold text-sm">{agentPolicies.length} sığorta</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(totalPremium)}</p>
                      <p className="text-xs text-muted-foreground">Komissiya: {agent.commission_rate}%</p>
                      {agent.subagents && agent.subagents.length > 0 && (
                        <p className="text-xs text-indigo-600 font-medium">{agent.subagents.length} subagent</p>
                      )}
                    </div>

                    <button className="ml-2 text-muted-foreground">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </div>

                  {/* Genişlənmiş sığorta cədvəli */}
                  {isExpanded && (
                    <div className="border-t">
                      {/* Subagentlər */}
                      {agent.subagents && agent.subagents.length > 0 && (
                        <div className="px-4 py-3 border-b bg-indigo-50/40">
                          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-2">
                            Subagentlər ({agent.subagents.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {agent.subagents.map((s: any) => (
                              <div key={s.id} className="flex items-center gap-2 bg-white border border-indigo-200 rounded-lg px-3 py-1.5">
                                <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">
                                  {s.name.charAt(0)}
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium">{s.name}</span>
                                  <span className="text-xs text-muted-foreground ml-1.5">{s.email}</span>
                                  {(s.vezife || s.filial) && (
                                    <span className="text-xs text-slate-500 ml-1.5">
                                      · {s.vezife}{s.vezife && s.filial ? " · " : ""}{s.filial}
                                    </span>
                                  )}
                                </div>
                                <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                  {s.is_active ? "Aktiv" : "Deaktiv"}
                                </span>
                                <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]"
                                  onClick={(e) => { e.stopPropagation(); handleToggleActive(s); }}>
                                  {s.is_active ? "Deaktiv" : "Aktiv"}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Növ üzrə xülasə */}
                      <div className="px-4 py-3 bg-gray-50 flex gap-4 flex-wrap border-b">
                        {Object.entries(typeSummary).map(([type, data]: any) => (
                          <div key={type} className="text-sm">
                            <span className="font-medium">{POLICY_TYPE_LABELS[type]}:</span>{" "}
                            <span>{data.count} sığorta</span>{" "}
                            <span className="text-muted-foreground">({formatCurrency(data.total)})</span>
                          </div>
                        ))}
                        {Object.keys(typeSummary).length === 0 && (
                          <span className="text-sm text-muted-foreground">Hələ sığorta yoxdur</span>
                        )}
                      </div>

                      {agentPolicies.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          {typeFilter !== "all"
                            ? `Bu agent üçün "${policyTypes.find(t => t.value === typeFilter)?.label}" növündə sığorta tapılmadı`
                            : "Bu agentin sığortası yoxdur"}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left px-4 py-2 font-semibold">Sığorta №</th>
                                <th className="text-left px-4 py-2 font-semibold">Növ</th>
                                <th className="text-left px-4 py-2 font-semibold">Müştəri</th>
                                <th className="text-right px-4 py-2 font-semibold">Məbləğ</th>
                                <th className="text-left px-4 py-2 font-semibold">Tarix</th>
                                <th className="text-left px-4 py-2 font-semibold">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {agentPolicies.map((p: any) => (
                                <tr key={p.id} className="border-b hover:bg-gray-50">
                                  <td className="px-4 py-2 font-mono text-xs">{p.policy_number}</td>
                                  <td className="px-4 py-2">{POLICY_TYPE_LABELS[p.type]}</td>
                                  <td className="px-4 py-2">{p.customer_name}</td>
                                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(p.premium_amount)}</td>
                                  <td className="px-4 py-2 text-xs text-muted-foreground">{formatDate(p.start_date)}</td>
                                  <td className="px-4 py-2">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                      p.status === "active" ? "bg-green-100 text-green-800" :
                                      p.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"
                                    }`}>
                                      {p.status === "active" ? "Aktiv" : p.status === "cancelled" ? "Ləğv" : "Bitmiş"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="px-4 py-3 flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const res = await reportsApi.exportAgentPDF(agent.id);
                            const url = window.URL.createObjectURL(new Blob([res.data]));
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `agent-${agent.name}-hesabat.pdf`;
                            a.click();
                            window.URL.revokeObjectURL(url);
                          }}
                        >
                          <FileText size={14} className="mr-1" />PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const res = await reportsApi.exportAgentExcel(agent.id);
                            const url = window.URL.createObjectURL(new Blob([res.data]));
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `agent-${agent.name}-hesabat.xlsx`;
                            a.click();
                            window.URL.revokeObjectURL(url);
                          }}
                        >
                          <FileSpreadsheet size={14} className="mr-1" />Excel
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleToggleActive(agent)}>
                          {agent.is_active ? "Deaktiv et" : "Aktiv et"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
