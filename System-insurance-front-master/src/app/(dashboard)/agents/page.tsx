"use client";
import { useEffect, useState } from "react";
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

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [allPolicies, setAllPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", commission_rate: "10" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const [agentsRes, policiesRes] = await Promise.all([
      authApi.getAgents(),
      policiesApi.getAll(),
    ]);
    setAgents(agentsRes.data.agents);
    setAllPolicies(policiesRes.data.policies);
    setLoading(false);
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
      await authApi.createAgent({ ...form, commission_rate: Number(form.commission_rate) });
      setShowForm(false);
      setForm({ name: "", email: "", password: "", commission_rate: "10" });
      load();
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

      {/* Yeni agent forması */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle>Yeni Agent Yarat</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ad Soyad *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Şifrə *</Label>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>Komissiya faizi (%) *</Label>
                <Input type="number" min="0" max="100" step="0.5" value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: e.target.value }))} required />
              </div>
              {error && <div className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>}
              <div className="sm:col-span-2">
                <Button type="submit" loading={saving}>Agent yarat</Button>
              </div>
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
                    </div>

                    <button className="ml-2 text-muted-foreground">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </div>

                  {/* Genişlənmiş sığorta cədvəli */}
                  {isExpanded && (
                    <div className="border-t">
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
