"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { policiesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  POLICY_TYPE_LABELS, STATUS_LABELS, PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS, POLICY_STATUS_COLORS, formatCurrency, formatDate, formatDateTime
} from "@/lib/utils";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";

export default function PolicyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    policiesApi.getOne(Number(id)).then(res => setPolicy(res.data.policy)).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm("Bu sığortanı ləğv etmək istəyirsiniz?")) return;
    await policiesApi.update(Number(id), { status: "cancelled" });
    router.push("/policies");
  };

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!policy) return <div className="text-center py-24 text-muted-foreground">Sığorta tapılmadı</div>;

  const d = policy.details || {};

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/policies"><Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{policy.policy_number}</h1>
          <p className="text-muted-foreground text-sm">{POLICY_TYPE_LABELS[policy.type]}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${POLICY_STATUS_COLORS[policy.status]}`}>
            {STATUS_LABELS[policy.status]}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Müştəri Məlumatları</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Ad Soyad" value={policy.customer_name} />
            <Row label="Telefon" value={policy.customer_phone} />
            <Row label="Email" value={policy.customer_email} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sığorta Məlumatları</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Məbləğ" value={formatCurrency(policy.premium_amount)} bold />
            <Row label="Komissiya" value={formatCurrency(policy.commission_amount)} />
            <Row label="Başlama" value={formatDate(policy.start_date)} />
            <Row label="Bitmə" value={formatDate(policy.end_date)} />
            <Row label="Əlavə edilmə" value={policy.created_at ? formatDateTime(policy.created_at) : "—"} />
            <Row label="Agent" value={policy.agent_name} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ödəniş Statusu</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {policy.payment ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[policy.payment.status]}`}>
                    {PAYMENT_STATUS_LABELS[policy.payment.status]}
                  </span>
                </div>
                <Row label="Məbləğ" value={formatCurrency(policy.payment.amount)} />
                <Row label="Son ödəniş tarixi" value={formatDate(policy.payment.due_date)} />
                {policy.payment.paid_at && <Row label="Ödənildi" value={formatDate(policy.payment.paid_at)} />}
              </>
            ) : <p className="text-muted-foreground">Ödəniş məlumatı yoxdur</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sığorta Detalları</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(d).map(([k, v]) => (
              <Row key={k} label={k} value={String(v)} />
            ))}
          </CardContent>
        </Card>
      </div>

      {policy.notes && (
        <Card>
          <CardHeader><CardTitle>Qeydlər</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{policy.notes}</p></CardContent>
        </Card>
      )}

      {role === "admin" && policy.status === "active" && (
        <Button variant="destructive" onClick={handleCancel}>
          <Trash2 size={16} className="mr-2" />Sığortanı ləğv et
        </Button>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-bold" : ""}>{value || "—"}</span>
    </div>
  );
}
