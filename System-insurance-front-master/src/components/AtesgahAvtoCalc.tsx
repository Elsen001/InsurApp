"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";
import {
  VEHICLE_CATEGORIES,
  VEHICLE_TYPES,
  DIGER_TYPES,
  ENGINE_BANDS,
  QADAGAN_VEHICLES,
  minikPremium,
  minikElektroPremium,
  calcAtesgahAvto,
  calcRegionCommission,
  regionIsBaki,
  REGION_CATEGORIES,
  type PersonType,
  type VehicleType,
  type VehicleCategory,
  type RegionKey,
} from "@/lib/atesgah-avto";

type Props = {
  onPick?: (percent: number) => void;
};

// Faiz: yalnız 0–99 (2 rəqəm, mənfi yox, 100+ yox)
const clampPct = (v: string) => v.replace(/[^\d]/g, "").slice(0, 2);

export function AtesgahAvtoCalc({ onPick }: Props) {
  const [person, setPerson] = useState<PersonType>("fiziki");
  const [vehicleType, setVehicleType] = useState<VehicleType | "">(""); // ilk başda heç biri
  const [category, setCategory] = useState<VehicleCategory>("diger");
  const [electric, setElectric] = useState(false);
  const [digerType, setDigerType] = useState<string>("agir_texnika");
  const [bandPercents, setBandPercents] = useState<Record<string, string>>({}); // mühərrik bandı → faiz
  const [qadaganActive, setQadaganActive] = useState<Record<number, boolean>>({}); // qadağan NV → aktiv/deaktiv

  const [dqn, setDqn] = useState("");
  const [regionCat, setRegionCat] = useState<string>(REGION_CATEGORIES[0].key);
  const [regionPremium, setRegionPremium] = useState("");

  // Yalnız Digər/Yük üçün ümumi nəticə (Minik artıq band-band cədvəldir)
  const result = vehicleType && vehicleType !== "minik"
    ? calcAtesgahAvto({ person, vehicleType, category, cc: null, electric, digerType })
    : null;

  const regionKey: RegionKey = dqn ? (regionIsBaki(dqn) ? "baki" : "region") : "region";
  const regionRes = calcRegionCommission({ region: regionKey, category: regionCat, enteredPremium: Number(regionPremium) || 0 });

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
      active ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40"
    }`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-slate-700">
        <Calculator size={17} className="text-primary" />
        <span className="font-semibold">Atəşgah avto — sığorta haqqı və komissiya cədvəli</span>
      </div>

      {/* Şəxs tipi */}
      <div className="space-y-2">
        <Label>Şəxs tipi</Label>
        <div className="flex gap-2">
          <button type="button" className={chip(person === "fiziki")} onClick={() => setPerson("fiziki")}>Fiziki şəxs</button>
          <button type="button" className={chip(person === "huquqi")} onClick={() => setPerson("huquqi")}>Hüquqi şəxs</button>
        </div>
      </div>

      {/* Nəqliyyat növü — Minik / Yük / Digər (əvvəldən seçilməyib) */}
      <div className="space-y-2">
        <Label>Nəqliyyat növü</Label>
        <div className="flex gap-2">
          {VEHICLE_TYPES.map((t) => (
            <button key={t.value} type="button" className={chip(vehicleType === t.value)} onClick={() => setVehicleType(t.value)}>
              {t.label}
            </button>
          ))}
        </div>
        {!vehicleType && <p className="text-xs text-muted-foreground">Hesablama üçün nəqliyyat növünü seçin.</p>}
      </div>

      {/* ── MİNİK — hər band üçün sığorta haqqı + faiz input ── */}
      {vehicleType === "minik" && (
        <div className="space-y-4 border-l-2 border-primary/30 pl-4">
          <div className="space-y-2">
            <Label>Avtomobil kateqoriyası</Label>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_CATEGORIES.map((c) => (
                <button key={c.value} type="button" className={chip(!electric && category === c.value)} onClick={() => { setElectric(false); setCategory(c.value); }}>
                  {c.label}
                </button>
              ))}
              <button type="button" className={chip(electric)} onClick={() => setElectric(true)}>⚡ Elektromobil</button>
            </div>
          </div>

          {/* Band cədvəli: Mühərrik | Sığorta haqqı | Faiz input | götür */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-2 pb-1 text-xs font-semibold text-muted-foreground border-b">
              <span className="flex-1">Mühərrik</span>
              <span className="w-24 text-right">Sığorta haqqı</span>
              <span className="w-24 text-center">Faiz (%)</span>
            </div>
            {(electric ? [{ key: "elektro", label: "Elektromobil" }] : ENGINE_BANDS.map((b) => ({ key: b.key, label: b.label }))).map((b) => {
              const premium = electric ? minikElektroPremium(category) : minikPremium(category, b.key);
              const pctVal = bandPercents[b.key] ?? "0";
              const disabled = premium == null; // bu kateqoriyada tarif yoxdur (məs. VAZ/LADA yuxarı bandlar)
              return (
                <div key={b.key} className={`flex items-center gap-3 rounded-md px-2 py-1 ${disabled ? "opacity-40" : "hover:bg-slate-50"}`}>
                  <span className="flex-1 text-sm text-slate-700">{b.label}</span>
                  <span className="w-24 text-right text-sm font-medium text-slate-800">{premium != null ? `${premium} AZN` : "—"}</span>
                  <div className="relative w-24">
                    <Input
                      type="text" inputMode="numeric" maxLength={2}
                      value={pctVal}
                      disabled={disabled}
                      onChange={(e) => setBandPercents((p) => ({ ...p, [b.key]: clampPct(e.target.value) }))}
                      className="pr-6 text-right h-8"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">Hər band üçün sığorta haqqı göstərilir; faizi özünüz yazın.</p>

          {/* Qadağan edilmiş NV — marka/model aktiv/deaktiv siyahısı */}
          {category === "qadagan" && !electric && (
            <div className="space-y-2">
              <Label>Qadağan edilmiş NV ({QADAGAN_VEHICLES.length}) — aktiv / deaktiv</Label>
              <div className="max-h-[360px] overflow-y-auto border border-slate-200 rounded-lg divide-y">
                {QADAGAN_VEHICLES.map((v, i) => {
                  const active = qadaganActive[i] ?? true;
                  return (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50">
                      <span className="w-5 text-xs text-muted-foreground shrink-0">{i + 1}</span>
                      <span className="flex-1 text-sm min-w-0 truncate">
                        <b className="text-slate-800">{v.brand}</b> <span className="text-slate-500">{v.model}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setQadaganActive((p) => ({ ...p, [i]: !(p[i] ?? true) }))}
                        className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition ${active ? "bg-slate-100 text-emerald-700" : "bg-slate-100 text-red-600"}`}
                      >
                        {active ? "Aktiv" : "Deaktiv"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── YÜK — tonaj əsaslı (açılır) ── */}
      {vehicleType === "yuk" && (
        <div className="space-y-2 border-l-2 border-primary/30 pl-4">
          <p className="text-sm text-slate-600">Yük — <b>tonaj əsaslıdır</b>. Tariflər hələ daxil edilməyib (default).</p>
        </div>
      )}

      {/* ── DİGƏR — nəqliyyat növləri (açılır) ── */}
      {vehicleType === "diger" && (
        <div className="space-y-3 border-l-2 border-primary/30 pl-4">
          <Label>Nəqliyyat növü</Label>
          <div className="flex flex-wrap gap-2">
            {DIGER_TYPES.map((t) => (
              <button key={t.value} type="button" className={chip(digerType === t.value)} onClick={() => setDigerType(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
            <span className="text-slate-500">Sığorta haqqı: <b className="text-slate-800">tonaj (default)</b></span>
            <span className="ml-auto font-bold text-emerald-700 text-base">Komissiya: {result?.commissionPercent ?? 0}%</span>
            {onPick && result?.commissionPercent != null && (
              <button type="button" onClick={() => onPick(result.commissionPercent as number)} className="text-xs font-medium text-primary underline">bonus kimi götür</button>
            )}
          </div>
        </div>
      )}

      {/* ── Region üzrə komissiya ── */}
      <div className="pt-4 border-t border-dashed space-y-3">
        <Label className="font-semibold">Region üzrə komissiya (limit əsaslı)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Qeydiyyat DQN kodu</Label>
            <Input value={dqn} onChange={(e) => setDqn(e.target.value)} placeholder="məs. 90" />
            <p className="text-[11px] text-muted-foreground">Region: <b>{regionKey === "baki" ? "Bakı qrupu" : "Regionlar"}</b></p>
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
            <span className="text-slate-500">Limit: <b className="text-slate-800">{regionRes.limit}</b></span>
            <span className="text-slate-500">{(Number(regionPremium) || 0) <= regionRes.limit ? "Limitdən aşağı" : "Limitdən yuxarı"}</span>
            <span className="ml-auto font-bold text-emerald-700 text-base">Komissiya: {regionRes.commissionPercent}%</span>
            {onPick && (
              <button type="button" onClick={() => onPick(regionRes.commissionPercent)} className="text-xs font-medium text-primary underline">bonus kimi götür</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
