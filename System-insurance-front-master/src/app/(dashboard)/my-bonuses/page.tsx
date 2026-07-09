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

  const total = bonuses.reduce((s, b) => s + Number(b.amount), 0);

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

      {!loading && bonuses.length > 0 && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="py-4 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-800">Ümumi bonus (məhsul üzrə cəmi)</span>
            <span className="text-2xl font-bold text-emerald-700">{total.toFixed(2)} AZN</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Məhsula görə bonuslarım</CardTitle></CardHeader>
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
                    {b.note && <p className="text-xs text-muted-foreground">{b.note}</p>}
                  </div>
                  <span className="text-lg font-bold text-emerald-700">{Number(b.amount).toFixed(2)} AZN</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
