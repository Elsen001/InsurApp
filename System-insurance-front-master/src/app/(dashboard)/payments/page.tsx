"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { paymentsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, POLICY_TYPE_LABELS, formatCurrency, formatDate } from "@/lib/utils";
import { PRODUCT_LABELS } from "@/lib/products";

// Müqavilə tipi: yeni məhsul, yoxsa köhnə tip
const contractType = (p: any) =>
  p.policy_product_label || PRODUCT_LABELS[p.policy_product] || POLICY_TYPE_LABELS[p.policy_type] || p.policy_type || "—";

// Polis statusu üzrə filtr
const statusOptions = [
  { value: "all", label: "Hamısı" },
  { value: "active", label: "Qüvvədədir" },
  { value: "upcoming", label: "Qüvvəyə minəcək" },
  { value: "expired", label: "Qüvvədən düşüb" },
  { value: "terminated", label: "Xitam verilib" },
  { value: "cancelled", label: "Ləğv olunub" },
];

export default function PaymentsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [payments, setPayments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"payments" | "installments">("payments");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await paymentsApi.getAll();
    setPayments(res.data.payments);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Polis statusuna görə filtr (client-side)
  const filtered = statusFilter === "all" ? payments : payments.filter(p => p.policy_status === statusFilter);

  const handleMarkPaid = async (id: number) => {
    setUpdating(id);
    await paymentsApi.updateStatus(id, "paid", "nağd");
    await load();
    setUpdating(null);
  };

  // S/S = sığorta (ödəniş) sayı; ödənilənlər / ödənilməyənlər / hissəli qalan / cəmi
  const count = filtered.length;
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

  // "Ödənişlər" bölməsi: hissəli olmayan (tək ödənişli) polislər
  const regularPayments = filtered.filter(p => !isInstallment(p));

  // "Hissəli ödənişlər" bölməsi: polis üzrə qruplaşdırılmış
  const installmentGroups = Object.values(
    filtered.filter(isInstallment).reduce((acc: Record<string, any>, p) => {
      const g = (acc[p.policy_id] ||= {
        policy_id: p.policy_id,
        policy_number: p.policy_number,
        start_date: p.policy_start_date,
        type: contractType(p),
        total: 0,   // hissə sayı
        paid: 0,    // ödənilən hissə
        debt: 0,    // hissə borcu
      });
      g.total += 1;
      if (p.status === "paid") g.paid += 1;
      else g.debt += Number(p.amount);
      return acc;
    }, {})
  ) as any[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Ödənişlər</h1>

      {/* Statistika */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground" title="Sığorta sayı">S/S</p>
            <p className="text-2xl font-bold text-slate-800">{count}</p>
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

      {/* Status filtri */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Status</p>
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${statusFilter === s.value ? "bg-primary text-white border-primary" : "border-gray-300 hover:border-gray-400"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bölmə seçimi: Ödənişlər | Hissəli ödənişlər */}
      <div className="flex gap-2">
        {([["payments", "Ödənişlər"], ["installments", "Hissəli ödənişlər"]] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${view === v ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40"}`}
          >
            {l}
            {v === "payments" && regularPayments.length > 0 ? ` (${regularPayments.length})` : ""}
            {v === "installments" && installmentGroups.length > 0 ? ` (${installmentGroups.length})` : ""}
          </button>
        ))}
      </div>

      {/* Cədvəl */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : view === "payments" ? (
            regularPayments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Ödəniş tapılmadı</div>
            ) : (
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
                    {regularPayments.map(p => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* Hissəli ödənişlər — polis üzrə qruplaşdırılmış */
            installmentGroups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Hissəli ödəniş tapılmadı</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold">S/S</th>
                      <th className="text-left px-4 py-3 font-semibold">Müqavilə No</th>
                      <th className="text-left px-4 py-3 font-semibold">Satış tarixi</th>
                      <th className="text-left px-4 py-3 font-semibold">Müqavilə tipi</th>
                      <th className="text-center px-4 py-3 font-semibold">Hissə sayı</th>
                      <th className="text-center px-4 py-3 font-semibold">Ödənilən hissə</th>
                      <th className="text-right px-4 py-3 font-semibold">Hissə borcu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installmentGroups.map((g, i) => (
                      <tr key={g.policy_id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs font-medium">{g.policy_number}</td>
                        <td className="px-4 py-3">{g.start_date ? formatDate(g.start_date) : "—"}</td>
                        <td className="px-4 py-3">{g.type}</td>
                        <td className="px-4 py-3 text-center">{g.total}</td>
                        <td className="px-4 py-3 text-center font-medium text-green-600">{g.paid}</td>
                        <td className={`px-4 py-3 text-right font-medium ${g.debt > 0 ? "text-amber-600" : ""}`}>{formatCurrency(g.debt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
