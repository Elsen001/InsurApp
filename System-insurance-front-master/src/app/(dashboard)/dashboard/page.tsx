"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportsApi, paymentsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { FileText, TrendingUp, CreditCard, AlertCircle, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#1e3a5f", "#3b82f6", "#10b981", "#f59e0b"];

const typeLabels: Record<string, string> = { auto: "Avtomobil", casco: "Kasko", property: "Əmlak", travel: "Səfər" };

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [summary, setSummary] = useState<any>(null);
  const [paymentStats, setPaymentStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (role === "admin") {
          const [sumRes, payRes] = await Promise.all([reportsApi.getSummary(), paymentsApi.getStats()]);
          setSummary(sumRes.data.summary);
          setPaymentStats(payRes.data.stats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (role) load();
  }, [role]);

  if (role === "agent") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          Xoş gəldiniz, {session?.user?.name}
        </h1>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Sığortalar</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Sol menyudan "Sığortalar" bölməsinə keçin</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Ödənişlər</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Öz ödəniş statuslarınızı izləyin</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" /></div>;

  const overdueCount = paymentStats.find((p: any) => p.status === "overdue")?.count || 0;
  const paidTotal = paymentStats.find((p: any) => p.status === "paid")?.total || 0;
  const pendingTotal = paymentStats.find((p: any) => p.status === "pending")?.total || 0;

  const chartData = summary?.policies_by_type?.map((t: any) => ({
    name: typeLabels[t.type] || t.type,
    sayi: Number(t.count),
    meblег: Number(t.total),
  })) || [];

  const pieData = summary?.policies_by_type?.map((t: any) => ({
    name: typeLabels[t.type] || t.type,
    value: Number(t.count),
  })) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">İdarə Paneli</h1>

      {/* KPI kartlar */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<FileText size={20} />} title="Ümumi Sığorta" value={summary?.total_policies || 0} color="blue" />
        <StatCard icon={<TrendingUp size={20} />} title="Ümumi Premium" value={formatCurrency(summary?.total_premium || 0)} color="green" />
        <StatCard icon={<Users size={20} />} title="Ödənilmiş Komissiya" value={formatCurrency(summary?.paid_commissions || 0)} color="purple" />
        <StatCard icon={<AlertCircle size={20} />} title="Gecikmiş Ödəniş" value={overdueCount} color="red" urgent={overdueCount > 0} />
      </div>

      {/* Qrafiklər */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Növlərə Görə Sığortalar</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => [v, "Sığorta sayı"]} />
                <Bar dataKey="sayi" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sığorta Paylanması</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Agent performansı */}
      {summary?.agent_stats?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Agent Performansı</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                  {summary.agent_stats.map((a: any) => (
                    <tr key={a.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{a.name}</td>
                      <td className="text-right py-2">{a.policy_count}</td>
                      <td className="text-right py-2">{formatCurrency(a.total_premium || 0)}</td>
                      <td className="text-right py-2">{formatCurrency(a.total_commission || 0)}</td>
                      <td className="text-right py-2">{a.commission_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, color, urgent }: any) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <Card className={urgent ? "border-red-300" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
