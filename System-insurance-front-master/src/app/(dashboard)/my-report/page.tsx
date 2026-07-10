"use client";
import { useEffect, useState } from "react";
import { reportsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { formatDate, formatCurrency, POLICY_TYPE_LABELS } from "@/lib/utils";
import { BarChart3, FileText, FileSpreadsheet } from "lucide-react";

export default function MyReportPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = (f = from, t = to) => {
    setLoading(true);
    reportsApi.getMy({ from: f || undefined, to: t || undefined })
      .then(res => setReport(res.data.report))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const download = async (kind: "pdf" | "excel") => {
    const res = kind === "pdf" ? await reportsApi.exportMyPDF() : await reportsApi.exportMyExcel();
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `hesabatim.${kind === "pdf" ? "pdf" : "xlsx"}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  const policies = report?.policies || [];
  const byType = report?.by_type || [];
  const totalPremium = policies.reduce((s: number, p: any) => s + Number(p.premium_amount), 0);
  const totalCommission = (report?.commissions || []).reduce((s: number, c: any) => s + Number(c.amount), 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><BarChart3 size={22} /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Hesabatım</h1>
            <p className="text-sm text-muted-foreground">{report?.agent?.name} — öz satış hesabatınız</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => download("pdf")}><FileText size={14} className="mr-1" />PDF</Button>
          <Button variant="outline" size="sm" onClick={() => download("excel")}><FileSpreadsheet size={14} className="mr-1" />Excel</Button>
        </div>
      </div>

      {/* Tarix filtri */}
      <DateRangeFilter from={from} to={to} setFrom={setFrom} setTo={setTo} onApply={(f, t) => load(f, t)} />

      {/* Xülasə kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Sığorta sayı</p>
          <p className="text-2xl font-bold text-slate-900">{policies.length}</p>
        </CardContent></Card>
        <Card><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Ümumi premium</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalPremium)}</p>
        </CardContent></Card>
        <Card><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Komissiya</p>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalCommission)}</p>
        </CardContent></Card>
      </div>

      {/* Növ üzrə */}
      {byType.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Növ üzrə</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {byType.map((t: any) => (
              <div key={t.type} className="text-sm">
                <span className="font-medium">{POLICY_TYPE_LABELS[t.type] || t.type}:</span>{" "}
                <span>{t.count} sığorta</span>{" "}
                <span className="text-muted-foreground">({formatCurrency(t.total || 0)})</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sığortalar */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Sığortalarım</CardTitle></CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Hələ sığortanız yoxdur</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">Sığorta №</th>
                    <th className="px-3 py-2 font-semibold">Növ</th>
                    <th className="px-3 py-2 font-semibold">Müştəri</th>
                    <th className="px-3 py-2 font-semibold text-right">Məbləğ</th>
                    <th className="px-3 py-2 font-semibold">Tarix</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((p: any) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs">{p.policy_number}</td>
                      <td className="px-3 py-2">{POLICY_TYPE_LABELS[p.type] || p.type}</td>
                      <td className="px-3 py-2">{p.customer_name}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(p.premium_amount)}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(p.start_date)}</td>
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
