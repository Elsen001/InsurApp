"use client";
import { useEffect, useState } from "react";
import { reportsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { PRODUCT_GROUPS, PRODUCT_LABELS } from "@/lib/products";
import { formatCurrency, downloadBlob } from "@/lib/utils";
import { FileSpreadsheet, FileText, ChevronRight, ArrowLeft, Building2, User } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const typeLabels: Record<string, string> = { auto: "Avtomobil", casco: "Kasko", property: "Əmlak", travel: "Səfər" };

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [drilldown, setDrilldown] = useState<any[]>([]); // məhsul→filial→satıcı sətirləri
  const [drill, setDrill] = useState<{ product: string | null; filial: string | null }>({ product: null, filial: null });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = (f = from, t = to) => {
    setLoading(true);
    setDrill({ product: null, filial: null });
    const filters = { from: f || undefined, to: t || undefined };
    Promise.all([
      reportsApi.getSummary(filters).then(res => setSummary(res.data.summary)),
      reportsApi.getProductDrilldown(filters).then(res => setDrilldown(res.data.rows)).catch(() => setDrilldown([])),
    ]).finally(() => setLoading(false));
  };

  const prodLabelFor = (key: string) =>
    PRODUCT_LABELS[key] || drilldown.find(r => r.product === key)?.product_label || key;

  // Seçilmiş məhsul üçün filiallar (birləşdirilmiş)
  const filialRows = () => {
    const map: Record<string, { filial: string; count: number; total: number }> = {};
    drilldown.filter(r => r.product === drill.product).forEach(r => {
      const k = r.filial || "Filial təyin edilməyib";
      if (!map[k]) map[k] = { filial: k, count: 0, total: 0 };
      map[k].count += Number(r.count);
      map[k].total += Number(r.total);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  };

  // Seçilmiş məhsul + filial üçün satıcılar
  const agentRows = () =>
    drilldown
      .filter(r => r.product === drill.product && (r.filial || "Filial təyin edilməyib") === drill.filial)
      .map(r => ({ name: r.agent_name, role: r.agent_role, count: Number(r.count), total: Number(r.total) }))
      .sort((a, b) => b.total - a.total);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async (format: "excel" | "pdf") => {
    setExporting(format);
    try {
      const filters = { from: from || undefined, to: to || undefined };
      const res = format === "excel" ? await reportsApi.exportExcel(filters) : await reportsApi.exportPDF(filters);
      const ext = format === "excel" ? "xlsx" : "pdf";
      downloadBlob(res.data, `sigorta-hesabat-${Date.now()}.${ext}`);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  const agentChartData = summary?.agent_stats?.map((a: any) => ({
    name: a.name.split(" ")[0],
    premium: Number(a.total_premium || 0),
    komisiya: Number(a.total_commission || 0),
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Hesabatlar</h1>
        <div className="flex gap-2">
          <Button variant="outline" loading={exporting === "excel"} onClick={() => handleExport("excel")}>
            <FileSpreadsheet size={16} className="mr-2" />Excel
          </Button>
          <Button variant="outline" loading={exporting === "pdf"} onClick={() => handleExport("pdf")}>
            <FileText size={16} className="mr-2" />PDF
          </Button>
        </div>
      </div>

      {/* Tarix filtri */}
      <DateRangeFilter from={from} to={to} setFrom={setFrom} setTo={setTo} onApply={(f, t) => load(f, t)} />

      {loading ? (
        <div className="flex justify-center py-24"><div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : summary && (
        <>
          {/* KPI */}
          <div className="grid gap-4 md:grid-cols-4">
            <KpiCard label="Ümumi sığorta" value={summary.total_policies} />
            <KpiCard label="Ümumi premium" value={formatCurrency(summary.total_premium || 0)} />
            <KpiCard label="Ümumi komissiya" value={formatCurrency(summary.total_commissions || 0)} />
            <KpiCard label="Ödənilmiş komissiya" value={formatCurrency(summary.paid_commissions || 0)} green />
          </div>

          {/* Sığorta məhsulları üzrə bölgü — tam kataloq (məhsul yoxdursa da görünür) */}
          <Card>
            <CardHeader><CardTitle>Sığorta növləri və məhsulları üzrə bölgü</CardTitle></CardHeader>
            <CardContent>
              {(() => {
                const stats: Record<string, { count: number; total: number }> = {};
                (summary.policies_by_product || []).forEach((r: any) => {
                  stats[r.product] = { count: Number(r.count) || 0, total: Number(r.total) || 0 };
                });
                return (
                  <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 font-semibold">Məhsul</th>
                          <th className="py-2 text-right font-semibold">Sığorta sayı</th>
                          <th className="py-2 text-right font-semibold">Ümumi məbləğ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PRODUCT_GROUPS.map(g => (
                          <>
                            <tr key={g.key} className="bg-slate-50">
                              <td colSpan={3} className="py-1.5 px-1 text-xs font-semibold text-primary uppercase tracking-wide">{g.label}</td>
                            </tr>
                            {g.items.map(it => {
                              const s = stats[it.value];
                              const has = s && s.count > 0;
                              return (
                                <tr
                                  key={it.value}
                                  onClick={() => has && setDrill({ product: it.value, filial: null })}
                                  className={`border-b ${has ? "hover:bg-primary/5 cursor-pointer" : "text-slate-400"} ${drill.product === it.value ? "bg-primary/10" : ""}`}
                                  title={has ? "Filiallar üzrə bax" : undefined}
                                >
                                  <td className="py-1.5 pl-3">
                                    <span className="inline-flex items-center gap-1">
                                      {has && <ChevronRight size={13} className="text-primary" />}
                                      {it.label}
                                    </span>
                                  </td>
                                  <td className="py-1.5 text-right">{s?.count || 0}</td>
                                  <td className="py-1.5 text-right font-medium">{formatCurrency(s?.total || 0)}</td>
                                </tr>
                              );
                            })}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Drill-down: Məhsul → Filial → Satıcı */}
          {drill.product && (
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-sm flex-wrap">
                  <button onClick={() => setDrill({ product: null, filial: null })} className="text-muted-foreground hover:text-primary flex items-center gap-1">
                    <ArrowLeft size={14} /> Bağla
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => setDrill({ product: drill.product, filial: null })}
                    className={`font-semibold ${drill.filial ? "text-primary hover:underline" : "text-slate-800"}`}
                  >
                    {prodLabelFor(drill.product)}
                  </button>
                  {drill.filial && (
                    <>
                      <ChevronRight size={14} className="text-slate-400" />
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Building2 size={14} className="text-primary" /> {drill.filial}
                      </span>
                    </>
                  )}
                </div>
                <CardTitle className="text-base pt-1">
                  {drill.filial ? "Bu filialda satıcılar" : "Bu məhsulu satan filiallar"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Level 1: filiallar */}
                {!drill.filial ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 font-semibold">Filial / nümayəndəlik</th>
                        <th className="py-2 text-right font-semibold">Sığorta sayı</th>
                        <th className="py-2 text-right font-semibold">Ümumi məbləğ</th>
                        <th className="py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filialRows().length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Məlumat yoxdur</td></tr>
                      ) : filialRows().map(f => (
                        <tr
                          key={f.filial}
                          onClick={() => setDrill({ product: drill.product, filial: f.filial })}
                          className="border-b hover:bg-primary/5 cursor-pointer"
                          title="Satıcılara bax"
                        >
                          <td className="py-2 flex items-center gap-1.5"><Building2 size={14} className="text-primary" />{f.filial}</td>
                          <td className="py-2 text-right">{f.count}</td>
                          <td className="py-2 text-right font-medium">{formatCurrency(f.total)}</td>
                          <td className="py-2 text-right"><ChevronRight size={14} className="text-primary" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  /* Level 2: satıcılar */
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 font-semibold">Satıcı</th>
                        <th className="py-2 text-right font-semibold">Sığorta sayı</th>
                        <th className="py-2 text-right font-semibold">Ümumi məbləğ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentRows().length === 0 ? (
                        <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">Məlumat yoxdur</td></tr>
                      ) : agentRows().map((a, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="py-2 flex items-center gap-1.5">
                            <User size={14} className="text-slate-400" />
                            <span className="text-xs text-primary font-medium">{a.role === "subagent" ? "Subagent" : "Agent"}</span>
                            <span>-</span>{a.name}
                          </td>
                          <td className="py-2 text-right">{a.count}</td>
                          <td className="py-2 text-right font-medium">{formatCurrency(a.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Agent performansı qrafik */}
          {agentChartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Agent Performansı — Premium (AZN)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={agentChartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: any) => [formatCurrency(v)]} />
                    <Bar dataKey="premium" name="Premium" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="komisiya" name="Komissiya" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Agent cədvəli */}
          <Card>
            <CardHeader><CardTitle>Agent Hesabatı</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-semibold">Agent</th>
                    <th className="text-right py-2 font-semibold">Sığorta sayı</th>
                    <th className="text-right py-2 font-semibold">Ümumi premium</th>
                    <th className="text-right py-2 font-semibold">Komissiya</th>
                    <th className="text-right py-2 font-semibold">Faiz</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.agent_stats?.map((a: any) => (
                    <tr key={a.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{a.name}</td>
                      <td className="py-2 text-right">{a.policy_count}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(a.total_premium || 0)}</td>
                      <td className="py-2 text-right">{formatCurrency(a.total_commission || 0)}</td>
                      <td className="py-2 text-right">{a.commission_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, green }: { label: string; value: string | number; green?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold mt-1 ${green ? "text-green-600" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
