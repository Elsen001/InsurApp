"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calcRegionCommission,
  resolveRegion,
  regionIsBaki,
  districtIsBaki,
  BAKI_DISTRICTS,
  DIGER_DISTRICT,
  REGION_CATEGORIES,
  SIGORTA_MEBLEGI_SH,
  type RegionKey,
} from "@/lib/atesgah-avto";

// Region üzrə komissiya (limit əsaslı) — həm Atəşgah, həm Paşa bölmələrində istifadə olunur.
// Qayda: DQN kodu VƏ sürücünün qeydiyyatı — hər ikisi siyahıda olmalıdır, yoxsa Region.
type Props = {
  onPick?: (percent: number) => void;
};

export function RegionCommission({ onPick }: Props) {
  const [dqn, setDqn] = useState("");
  const [driverDistrict, setDriverDistrict] = useState<string>(BAKI_DISTRICTS[0]);
  const [regionCat, setRegionCat] = useState<string>(REGION_CATEGORIES[0].key);
  const [regionPremium, setRegionPremium] = useState("");

  const regionKey: RegionKey = resolveRegion(dqn, driverDistrict);
  const dqnOk = regionIsBaki(dqn);
  const distOk = districtIsBaki(driverDistrict);
  const regionRes = calcRegionCommission({ region: regionKey, category: regionCat, enteredPremium: Number(regionPremium) || 0 });

  return (
    <div className="pt-4 border-t border-dashed space-y-3">
      <Label className="font-semibold">Region üzrə komissiya (limit əsaslı)</Label>

      {/* Qayda izahı */}
      <div className="text-[11px] text-slate-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 leading-relaxed">
        <b>Qayda:</b> DQN kodu <b>və</b> sürücünün qeydiyyatı — hər ikisi siyahıda olmalıdır.
        Hər hansı biri üst-üstə düşməsə → <b>Region</b> sayılır.
        <br />1. DQN fərqli nömrə olsa → sürücünün qeydiyyatından asılı olmayaraq Region.
        <br />2. Sürücünün qeydiyyatı fərqli rayon olsa → DQN-dən asılı olmayaraq Region.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Qeydiyyat DQN kodu</Label>
          <Input value={dqn} onChange={(e) => setDqn(e.target.value)} placeholder="məs. 90" />
          <p className={`text-[11px] ${dqnOk ? "text-emerald-600" : "text-red-600"}`}>
            {dqnOk ? "✓ siyahıda" : "✗ siyahıda deyil"}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Sürücünün qeydiyyatı</Label>
          <select
            value={driverDistrict}
            onChange={(e) => setDriverDistrict(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {BAKI_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            <option value={DIGER_DISTRICT}>{DIGER_DISTRICT} (digər rayonlar)</option>
          </select>
          <p className={`text-[11px] ${distOk ? "text-emerald-600" : "text-red-600"}`}>
            {distOk ? "✓ siyahıda" : "✗ siyahıda deyil"}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Kateqoriya</Label>
          <select value={regionCat} onChange={(e) => setRegionCat(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {REGION_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Sığorta haqqı (yazılan)</Label>
          <Input type="number" value={regionPremium} onChange={(e) => setRegionPremium(e.target.value)} placeholder="0" />
        </div>
      </div>

      {regionRes && (
        <div className="flex flex-wrap items-center gap-4 text-sm bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${regionKey === "baki" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
            {regionKey === "baki" ? "Bakı qrupu" : "Regionlar"}
          </span>
          <span className="text-slate-500">Limit: <b className="text-slate-800">{regionRes.limit}</b></span>
          <span className="text-slate-500">{(Number(regionPremium) || 0) <= regionRes.limit ? "Limitdən aşağı" : "Limitdən yuxarı"}</span>
          <span className="ml-auto font-bold text-emerald-700 text-base">Komissiya: {regionRes.commissionPercent}%</span>
          {onPick && (
            <button type="button" onClick={() => onPick(regionRes.commissionPercent)} className="text-xs font-medium text-primary underline">bonus kimi götür</button>
          )}
        </div>
      )}

      {/* Sığorta məbləği → SH */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium">Sığorta məbləği → SH:</span>
        {SIGORTA_MEBLEGI_SH.map((r) => (
          <span key={r.amount} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            {r.amount.toLocaleString()} → <b>{r.sh}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
