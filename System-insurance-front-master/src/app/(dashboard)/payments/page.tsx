"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { paymentsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, POLICY_TYPE_LABELS, formatCurrency, formatDate } from "@/lib/utils";

// Polis statusu üzrə filtr
const statusOptions = [
  { value: "all", label: "Hamısı" },
  { value: "active", label: "Qüvvədədir" },
  { value: "expired", label: "Qüvvədən düşüb" },
  { value: "cancelled", label: "Ləğv olunub" },
];

export default function PaymentsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [payments, setPayments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
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

  // Ödənilmiş = sığorta ödənişləri; ödənilməmiş = debitor (borc); hisseli ödənişlər (məbləğ)
  const paidTotal = filtered.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const debitorTotal = filtered.filter(p => p.status !== "paid").reduce((s, p) => s + Number(p.amount), 0);
  const installmentTotal = filtered.filter(p => p.is_installment).reduce((s, p) => s + Number(p.amount), 0);
  const grandTotal = filtered.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Ödənişlər</h1>

      {/* Statistika */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Sığorta ödənişləri</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(paidTotal)}</p>
          </CardContent>
        </Card>
        <Card className={debitorTotal > 0 ? "border-amber-300" : ""}>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Debitor</p>
            <p className={`text-2xl font-bold ${debitorTotal > 0 ? "text-amber-600" : ""}`}>{formatCurrency(debitorTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Hisseli ödənişlər</p>
            <p className="text-2xl font-bold">{formatCurrency(installmentTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Cəmi</p>
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

      {/* Cədvəl */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : filtered.length === 0 ? (
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
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{p.policy_number}</td>
                      <td className="px-4 py-3">{POLICY_TYPE_LABELS[p.policy_type] || p.policy_type}</td>
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
                            <Button
                              size="sm"
                              variant="outline"
                              loading={updating === p.id}
                              onClick={() => handleMarkPaid(p.id)}
                            >
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
