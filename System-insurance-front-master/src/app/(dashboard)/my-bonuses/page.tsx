"use client";
import { useEffect, useState } from "react";
import { bonusesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Lock } from "lucide-react";

export default function MyBonusesPage() {
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bonusesApi.getMine()
      .then(res => setBonuses(res.data.bonuses))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Gift size={22} /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bonuslarım</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Lock size={12} /> Yalnız baxış — bonuslar admin tərəfindən təyin olunur
          </p>
        </div>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3 text-sm text-blue-800">
          Bonus faizdir: hər məhsulu satdıqda, sığortanın <b>premium məbləğinin</b> göstərilən faizi sizin bonusunuz olur.
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Məhsula görə bonus faizlərim</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin h-7 w-7 rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : bonuses.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Sizə hələ bonus təyin olunmayıb</p>
          ) : (
            <div className="space-y-2">
              {bonuses.map(b => (
                <div key={b.id} className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-800">{b.product_label}</p>
                    <p className="text-xs text-muted-foreground">{b.note || "Premiumun faizi"}</p>
                  </div>
                  <span className="text-2xl font-bold text-emerald-700">{Number(b.percent).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
