"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { policiesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  POLICY_TYPE_LABELS, STATUS_LABELS, PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS, POLICY_STATUS_COLORS, formatCurrency, formatDate, formatDateTime
} from "@/lib/utils";
import { Plus, Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PRODUCT_GROUPS, PRODUCT_LABELS } from "@/lib/products";

// Polisin məhsulu (yeni) və ya köhnə tipi
const prodKey = (p: any) => p.product || p.type;
const prodLabel = (p: any) =>
  p.product_label || PRODUCT_LABELS[p.product] || POLICY_TYPE_LABELS[p.type] || p.type || "—";

export default function PoliciesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [policies, setPolicies] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    policiesApi.getAll().then(res => {
      setPolicies(res.data.policies);
      setFiltered(res.data.policies);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let data = policies;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(p =>
        p.policy_number.toLowerCase().includes(q) ||
        p.customer_name.toLowerCase().includes(q) ||
        (p.agent_name || "").toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") data = data.filter(p => prodKey(p) === typeFilter);
    setFiltered(data);
  }, [search, typeFilter, policies]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Sığorta növləri və məhsulları</h1>
        <Link href="/policies/new">
          <Button><Plus size={16} className="mr-2" />Yeni Sığorta</Button>
        </Link>
      </div>

      {/* Filtrlər */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Sığorta nömrəsi, müştəri adı axtar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="h-10 min-w-[260px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Bütün məhsullar</option>
              {PRODUCT_GROUPS.map(g => (
                <optgroup key={g.key} label={g.label}>
                  {g.items.map(it => <option key={it.value} value={it.value}>{it.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Cədvəl */}
      <Card>
        <CardHeader>
          <CardTitle>Cəmi: {filtered.length} sığorta</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Sığorta tapılmadı</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold">Sığorta №</th>
                    <th className="text-left px-4 py-3 font-semibold">Məhsul</th>
                    <th className="text-left px-4 py-3 font-semibold">Müştəri</th>
                    <th className="text-right px-4 py-3 font-semibold">Məbləğ</th>
                    <th className="text-left px-4 py-3 font-semibold">Tarix</th>
                    <th className="text-left px-4 py-3 font-semibold">Əlavə edilmə</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Ödəniş</th>
                    {role === "admin" && <th className="text-left px-4 py-3 font-semibold">Agent</th>}
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{p.policy_number}</td>
                      <td className="px-4 py-3">{prodLabel(p)}</td>
                      <td className="px-4 py-3">{p.customer_name}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.premium_amount)}</td>
                      <td className="px-4 py-3 text-xs">{formatDate(p.start_date)} — {formatDate(p.end_date)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.created_at ? formatDateTime(p.created_at) : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${POLICY_STATUS_COLORS[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.payment_status && (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[p.payment_status]}`}>
                            {PAYMENT_STATUS_LABELS[p.payment_status]}
                          </span>
                        )}
                      </td>
                      {role === "admin" && <td className="px-4 py-3 text-muted-foreground text-xs">{p.agent_name}</td>}
                      <td className="px-4 py-3">
                        <Link href={`/policies/${p.id}`}>
                          <Button variant="ghost" size="icon"><Eye size={16} /></Button>
                        </Link>
                      </td>
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
