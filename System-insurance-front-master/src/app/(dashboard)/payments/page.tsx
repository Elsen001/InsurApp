"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { paymentsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, POLICY_TYPE_LABELS, formatCurrency, formatDate } from "@/lib/utils";
import { PRODUCT_LABELS } from "@/lib/products";
import { DateRangeFilter } from "@/components/DateRangeFilter";

// Müqavilə tipi: yeni məhsul, yoxsa köhnə tip
const contractType = (p: any) =>
  p.policy_product_label || PRODUCT_LABELS[p.policy_product] || POLICY_TYPE_LABELS[p.policy_type] || p.policy_type || "—";

export default function PaymentsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [payments, setPayments] = useState<any[]>([]);
  const [view, setView] = useState<"payments" | "installments" | "terminated" | "cancelled">("payments");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await paymentsApi.getAll();
    setPayments(res.data.payments);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Tarix aralığı üzrə filtr (son ödəniş tarixinə — due_date görə, client-side)
  const inRange = (d?: string) => {
    if (!d) return true;
    const day = String(d).slice(0, 10);
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  };
  const filtered = payments.filter(p => inRange(p.due_date));

  const handleMarkPaid = async (id: number) => {
    setUpdating(id);
    await paymentsApi.updateStatus(id, "paid", "nağd");
    await load();
    setUpdating(null);
  };

  // S/S = ödənilməyən müqavilə (polis) sayı; ödənilənlər / ödənilməyənlər / hissəli qalan / cəmi
  const unpaidContracts = new Set(filtered.filter(p => p.status !== "paid").map(p => p.policy_id)).size;
  const paidTotal = filtered.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const unpaidTotal = filtered.filter(p => p.status !== "paid").reduce((s, p) => s + Number(p.amount), 0);
  // Hissəli = eyni polisə birdən çox ödəniş sətri olanlar; "qalan" = onların ödənilməyən hissəsi
  const paymentsPerPolicy: Record<string, number> = {};
  filtered.forEach(p => { paymentsPerPolicy[p.policy_id] = (paymentsPerPolicy[p.policy_id] || 0) + 1; });
  const isInstallment = (p: any) => paymentsPerPolicy[p.policy_id] > 1;
  const installmentRemaining = filtered
    .filter(p => p.status !== "paid" && isInstallment(p))
    .reduce((s, p) => s + Number(p.amount), 0);
  const grandTotal = filtered.reduce((s, p) => s + Number(p.amount), 0);

  // Xitam verilib / Ləğv olunub — polis statusuna görə ayrı bölmələr
  const terminatedPayments = filtered.filter(p => p.policy_status === "terminated");
  const cancelledPayments = filtered.filter(p => p.policy_status === "cancelled");
  // Aktiv (xitam/ləğv olmayan) ödənişlər — Ödənişlər və Hissəli bölmələri üçün
  const isClosed = (p: any) => p.policy_status === "terminated" || p.policy_status === "cancelled";

  // "Ödənişlər" bölməsi: hissəli olmayan (tək ödənişli), xitam/ləğv olmayan polislər
  const regularPayments = filtered.filter(p => !isInstallment(p) && !isClosed(p));

  // "Hissəli ödənişlər" bölməsi: polis üzrə qruplaşdırılmış (xitam/ləğv xaric)
  const installmentGroups = Object.values(
    filtered.filter(p => isInstallment(p) && !isClosed(p)).reduce((acc: Record<string, any>, p) => {
      const g = (acc[p.policy_id] ||= {
        policy_id: p.policy_id,
        policy_number: p.policy_number,
        start_date: p.policy_start_date,
        type: contractType(p),
        premium: 0, // sığorta haqqı (bütün hissələrin cəmi)
        total: 0,   // hissə sayı
        paid: 0,    // ödənilən hissə
        debt: 0,    // hissə borcu
      });
      g.premium += Number(p.amount);
      g.total += 1;
      if (p.status === "paid") g.paid += 1;
      else g.debt += Number(p.amount);
      return acc;
    }, {})
  ) as any[];

  // Düz (flat) ödəniş cədvəli üçün siyahı — seçilmiş bölməyə görə
  const flatList =
    view === "terminated" ? terminatedPayments :
    view === "cancelled" ? cancelledPayments :
    regularPayments;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Ödənişlər</h1>

      {/* Statistika */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Ödənilməyən müqavilə sayı</p>
            <p className="text-2xl font-bold text-slate-800">{unpaidContracts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Ödənilənlər</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(paidTotal)}</p>
          </CardContent>
        </Card>
        <Card className={unpaidTotal > 0 ? "border-amber-300" : ""}>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Ödənilməyənlər</p>
            <p className={`text-2xl font-bold ${unpaidTotal > 0 ? "text-amber-600" : ""}`}>{formatCurrency(unpaidTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Hissəli qalan ödənişlər</p>
            <p className="text-2xl font-bold">{formatCurrency(installmentRemaining)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Cəmi ödənişlər</p>
            <p className="text-2xl font-bold">{formatCurrency(grandTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tarix filtri (son ödəniş tarixinə görə) */}
      <DateRangeFilter from={from} to={to} setFrom={setFrom} setTo={setTo} onApply={(f, t) => { setFrom(f || ""); setTo(t || ""); }} />

      {/* Bölmə seçimi: Ödənilənlər | Hissəli ödənişlər | Xitam verilib | Ləğv olunub */}
      <div className="flex gap-2 flex-wrap">
        {([
          ["payments", "Ödənilənlər", regularPayments.length],
          ["installments", "Hissəli ödənişlər", installmentGroups.length],
          ["terminated", "Xitam verilib", terminatedPayments.length],
          ["cancelled", "Ləğv olunub", cancelledPayments.length],
        ] as const).map(([v, l, n]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${view === v ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40"}`}
          >
            {l}{n > 0 ? ` (${n})` : ""}
          </button>
        ))}
      </div>

      {/* Cədvəl */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : view !== "installments" ? (
            /* Ödənişlər / Xitam verilib / Ləğv olunub — eyni düz cədvəl formatı */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold">Sığorta №</th>
                    <th className="text-left px-4 py-3 font-semibold">Növ</th>
                    <th className="text-left px-4 py-3 font-semibold">Müştəri</th>
                    <th className="text-right px-4 py-3 font-semibold">Məbləğ</th>
                    <th className="text-left px-4 py-3 font-semibold">Son tarix</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    {role === "admin" && <th className="text-left px-4 py-3 font-semibold">Agent</th>}
                    {role === "admin" && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {flatList.length === 0 ? (
                    <tr>
                      <td colSpan={role === "admin" ? 8 : 6} className="text-center py-12 text-muted-foreground">Ödəniş yoxdur</td>
                    </tr>
                  ) : (
                    flatList.map(p => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs font-medium">{p.policy_number}</td>
                        <td className="px-4 py-3">{contractType(p)}</td>
                        <td className="px-4 py-3">{p.customer_name}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.amount)}</td>
                        <td className={`px-4 py-3 ${p.status === "overdue" ? "text-red-600 font-medium" : ""}`}>{formatDate(p.due_date)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[p.status]}`}>
                            {PAYMENT_STATUS_LABELS[p.status]}
                          </span>
                        </td>
                        {role === "admin" && <td className="px-4 py-3 text-muted-foreground text-xs">{p.agent_name}</td>}
                        {role === "admin" && (
                          <td className="px-4 py-3">
                            {p.status !== "paid" && (
                              <Button size="sm" variant="outline" loading={updating === p.id} onClick={() => handleMarkPaid(p.id)}>
                                Ödənildi
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Hissəli ödənişlər — polis üzrə qruplaşdırılmış; başlıqlar boş olsa da qalır */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold">S/S</th>
                    <th className="text-left px-4 py-3 font-semibold">Müqavilə No</th>
                    <th className="text-left px-4 py-3 font-semibold">Satış tarixi</th>
                    <th className="text-left px-4 py-3 font-semibold">Müqavilə tipi</th>
                    <th className="text-right px-4 py-3 font-semibold">Sığorta haqqı</th>
                    <th className="text-center px-4 py-3 font-semibold">Hissə sayı</th>
                    <th className="text-center px-4 py-3 font-semibold">Ödənilən hissə</th>
                    <th className="text-right px-4 py-3 font-semibold">Hissə borcu</th>
                  </tr>
                </thead>
                <tbody>
                  {installmentGroups.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">Hissəli ödəniş yoxdur</td>
                    </tr>
                  ) : (
                    installmentGroups.map((g, i) => (
                      <tr key={g.policy_id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs font-medium">{g.policy_number}</td>
                        <td className="px-4 py-3">{g.start_date ? formatDate(g.start_date) : "—"}</td>
                        <td className="px-4 py-3">{g.type}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(g.premium)}</td>
                        <td className="px-4 py-3 text-center">{g.total}</td>
                        <td className="px-4 py-3 text-center font-medium text-green-600">{g.paid}</td>
                        <td className={`px-4 py-3 text-right font-medium ${g.debt > 0 ? "text-amber-600" : ""}`}>{formatCurrency(g.debt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
