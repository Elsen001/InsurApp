"use client";
import { useEffect, useState } from "react";
import { reportsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, downloadBlob } from "@/lib/utils";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const typeLabels: Record<string, string> = { auto: "Avtomobil", casco: "Kasko", property: "Əmlak", travel: "Səfər" };

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  useEffect(() => {
    reportsApi.getSummary().then(res => setSummary(res.data.summary)).finally(() => setLoading(false));
  }, []);

  const handleExport = async (format: "excel" | "pdf") => {
    setExporting(format);
    try {
      const res = format === "excel" ? await reportsApi.exportExcel() : await reportsApi.exportPDF();
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

          {/* Növlərə görə bölgü */}
          <Card>
            <CardHeader><CardTitle>Sığorta Növləri üzrə Bölgü</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm mb-6">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-semibold">Növ</th>
                      <th className="text-right py-2 font-semibold">Sığorta sayı</th>
                      <th className="text-right py-2 font-semibold">Ümumi məbləğ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.policies_by_type?.map((t: any) => (
                      <tr key={t.type} className="border-b hover:bg-gray-50">
                        <td className="py-2">{typeLabels[t.type] || t.type}</td>
                        <td className="py-2 text-right">{t.count}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(t.total || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

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
