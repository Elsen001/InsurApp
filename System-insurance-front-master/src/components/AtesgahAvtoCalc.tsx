"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";
import {
  VEHICLE_CATEGORIES,
  VEHICLE_TYPES,
  DIGER_TYPES,
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

export function AtesgahAvtoCalc({ onPick }: Props) {
  const [person, setPerson] = useState<PersonType>("fiziki");
  const [vehicleType, setVehicleType] = useState<VehicleType | "">(""); // ilk başda heç biri
  const [category, setCategory] = useState<VehicleCategory>("diger");
  const [electric, setElectric] = useState(false);
  const [cc, setCc] = useState("");
  const [digerType, setDigerType] = useState<string>("agir_texnika");

  const [dqn, setDqn] = useState("");
  const [regionCat, setRegionCat] = useState<string>(REGION_CATEGORIES[0].key);
  const [regionPremium, setRegionPremium] = useState("");

  const result = vehicleType
    ? calcAtesgahAvto({ person, vehicleType, category, cc: cc ? Number(cc) : null, electric, digerType })
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

      {/* ── MİNİK — mühərrik həcmi əsaslı (açılır) ── */}
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

          {!electric && (
            <div className="space-y-2 max-w-xs">
              <Label>Mühərrik həcmi (sm³)</Label>
              <Input type="number" min="0" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="məs. 2200" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ResultBox label="Sığorta haqqı" value={result?.ok && result.premium != null ? `${result.premium} AZN` : "—"} />
            <ResultBox label="Komissiya faizi" value={result?.ok && result.commissionPercent != null ? `${result.commissionPercent}%` : (result?.ok ? "yoxdur" : "—")} accent />
            <ResultBox label="Komissiya (AZN)" value={result?.ok && result.premium != null ? `${(((result.premium) * (result.commissionPercent ?? 0)) / 100).toFixed(2)} AZN` : "—"} />
          </div>
          {result && !result.ok && result.message && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">{result.message}</p>}
          {result?.ok && result.message && <p className="text-xs text-slate-500">{result.message}</p>}
          {onPick && result?.ok && result.commissionPercent != null && (
            <button type="button" onClick={() => onPick(result.commissionPercent as number)} className="text-sm font-medium text-primary border border-primary/40 rounded-lg px-4 py-2 hover:bg-primary/5 transition-colors">
              Bu komissiya faizini bonus kimi götür ({result.commissionPercent}%)
            </button>
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

function ResultBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${accent ? "border-primary/30 bg-primary/5" : "border-slate-200 bg-slate-50"}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${accent ? "text-primary" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}
