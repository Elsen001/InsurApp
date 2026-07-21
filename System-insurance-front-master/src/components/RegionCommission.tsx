"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BAKI_DISTRICTS,
  BAKI_DQN_CODES,
  REGION_CATEGORIES,
  REGION_LIMITS,
  type RegionKey,
} from "@/lib/atesgah-avto";

// Region üzrə komissiya — həm Atəşgah, həm Paşa bölmələrində istifadə olunur.
// Limitlər sabitdir; komissiya faizləri admin tərəfindən MANUEL yazılır (default boş, placeholder 0).
type Props = {
  onPick?: (percent: number) => void;
};

// Faiz: yalnız 0–99 (2 rəqəm, mənfi yox, 100+ yox)
const clampPct = (v: string) => v.replace(/[^\d]/g, "").slice(0, 2);

const TABLES: { key: RegionKey; title: string }[] = [
  { key: "region", title: "Regionlar" },
  { key: "baki", title: "Bakı" },
];

export function RegionCommission({ onPick }: Props) {
  const [pcts, setPcts] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setPcts((p) => ({ ...p, [k]: clampPct(v) }));

  const cell = (region: RegionKey, cat: string, side: "below" | "above") => {
    const k = `${region}_${cat}_${side}`;
    const val = pcts[k] ?? "";
    return (
      <div className="flex items-center justify-center gap-1.5">
        <div className="relative w-16">
          <Input
            type="text" inputMode="numeric" maxLength={2}
            value={val}
            placeholder="0"
            onChange={(e) => set(k, e.target.value)}
            className="pr-5 text-right h-8"
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
        </div>
        {onPick && val !== "" && (
          <button type="button" onClick={() => onPick(Number(val) || 0)} className="text-[10px] font-medium text-primary underline shrink-0">
            götür
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="pt-4 border-t border-dashed space-y-3">
      <Label className="font-semibold">Region üzrə komissiya (manuel)</Label>

      {/* Qayda izahı */}
      <div className="text-[11px] text-slate-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 leading-relaxed">
        <b>Qayda:</b> DQN kodu <b>və</b> sürücünün qeydiyyatı — hər ikisi siyahıda olmalıdır.
        Hər hansı biri üst-üstə düşməsə → <b>Region</b> sayılır.
        <br />1. DQN fərqli nömrə olsa → sürücünün qeydiyyatından asılı olmayaraq Region.
        <br />2. Sürücünün qeydiyyatı fərqli rayon olsa → DQN-dən asılı olmayaraq Region.
      </div>

      {/* Bakı qrupu — istinad */}
      <div className="text-[11px] text-slate-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 leading-relaxed">
        <b>Bakı qrupu</b> — DQN kodları: <b>{BAKI_DQN_CODES.join(", ")}</b>
        <br />Qeydiyyat: {BAKI_DISTRICTS.join(", ")}.
        <br />Bunlardan kənar hallar <b>Regionlar</b> cədvəlinə aiddir.
      </div>

      {TABLES.map((t) => (
        <div key={t.key} className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-yellow-100 text-slate-800 font-semibold text-center py-1.5 text-sm border-b border-slate-200">
            {t.title}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-muted-foreground">
                  <th className="text-left px-3 py-1.5 font-semibold">Kateqoriya</th>
                  <th className="text-right px-3 py-1.5 font-semibold">Limit sığorta haqqı</th>
                  <th className="text-center px-3 py-1.5 font-semibold">Limitdən aşağı komisyon</th>
                  <th className="text-center px-3 py-1.5 font-semibold">Limitdən yuxarı komisyon</th>
                </tr>
              </thead>
              <tbody>
                {REGION_CATEGORIES.map((c) => (
                  <tr key={c.key} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-1.5 font-medium text-slate-700">{c.label}</td>
                    <td className="px-3 py-1.5 text-right font-medium text-slate-800">{REGION_LIMITS[t.key][c.key]}</td>
                    <td className="px-3 py-1.5">{cell(t.key, c.key, "below")}</td>
                    <td className="px-3 py-1.5">{cell(t.key, c.key, "above")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground">Komissiya faizlərini hər xana üçün özünüz yazın (default boş, placeholder 0).</p>
    </div>
  );
}
