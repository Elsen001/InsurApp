"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ChevronDown } from "lucide-react";
import { PASHA_ROWS, PASHA_BRANDS } from "@/lib/pasha-avto";

type Props = {
  onPick?: (percent: number) => void;
};

// Faiz: yalnız 0–99 (2 rəqəm, mənfi yox, 100+ yox)
const clampPct = (v: string) => v.replace(/[^\d]/g, "").slice(0, 2);

type Person = "fiziki" | "huquqi";
type VType = "" | "minik" | "yuk" | "diger";

const V_TYPES: { value: Exclude<VType, "">; label: string }[] = [
  { value: "minik", label: "Minik" },
  { value: "yuk", label: "Yük" },
  { value: "diger", label: "Digər" },
];

const GROUP_MAP: Record<Exclude<VType, "">, string[]> = {
  minik: ["MİNİK"],
  yuk: ["YÜK"],
  diger: ["Əmlak", "Yaşıl kart"],
};

export function PashaBonusCalc({ onPick }: Props) {
  const [person, setPerson] = useState<Person>("fiziki");
  const [vehicleType, setVehicleType] = useState<VType>("");
  const [rowPercents, setRowPercents] = useState<Record<string, string>>({}); // sətir → faiz
  const [showBrands, setShowBrands] = useState(false);

  let rows = vehicleType ? PASHA_ROWS.filter((r) => GROUP_MAP[vehicleType].includes(r.group)) : [];
  // "Digər" içində Əmlak sətirləri şəxs tipinə görə filtrlənir (Yaşıl kart hər zaman)
  if (vehicleType === "diger") {
    rows = rows.filter((r) => (r.group !== "Əmlak" ? true : person === "fiziki" ? r.id === "e_fiziki" : r.id === "e_huquqi"));
  }

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
      active ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40"
    }`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-slate-700">
        <Building2 size={17} className="text-primary" />
        <span className="font-semibold">Paşa Sığorta — bonus/komissiya cədvəli</span>
      </div>

      {/* Şəxs tipi */}
      <div className="space-y-2">
        <Label>Şəxs tipi</Label>
        <div className="flex gap-2">
          <button type="button" className={chip(person === "fiziki")} onClick={() => setPerson("fiziki")}>Fiziki şəxs</button>
          <button type="button" className={chip(person === "huquqi")} onClick={() => setPerson("huquqi")}>Hüquqi şəxs</button>
        </div>
      </div>

      {/* Nəqliyyat növü */}
      <div className="space-y-2">
        <Label>Nəqliyyat növü</Label>
        <div className="flex gap-2">
          {V_TYPES.map((t) => (
            <button key={t.value} type="button" className={chip(vehicleType === t.value)} onClick={() => { setVehicleType(t.value); }}>
              {t.label}
            </button>
          ))}
        </div>
        {!vehicleType && <p className="text-xs text-muted-foreground">Hesablama üçün nəqliyyat növünü seçin.</p>}
      </div>

      {/* Sətirlər (açılır) */}
      {vehicleType && (
        <div className="space-y-2 border-l-2 border-primary/30 pl-4">
          {/* Cədvəl: Sətir | Faiz (%) — Atəşgahdakı ilə eyni format */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-2 pb-1 text-xs font-semibold text-muted-foreground border-b">
              <span className="flex-1">{vehicleType === "minik" ? "Mühərrik" : "Sətir"}</span>
              <span className="w-24 text-right">Sığorta haqqı</span>
              <span className="w-24 text-center">Faiz (%)</span>
            </div>
            {rows.map((r) => {
              const pctVal = rowPercents[r.id] ?? "";
              return (
                <div key={r.id} className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50">
                  <span className="flex-1 min-w-0">
                    <span className="text-sm text-slate-800 font-medium">{r.label}</span>
                    <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      {r.dqn && <span>📍 {r.dqn}</span>}
                      {r.year && <span>📅 {r.year}</span>}
                    </span>
                    {r.note && (
                      <span className={`block text-[11px] ${r.note.includes("QADAĞA") ? "text-red-600" : "text-slate-500"}`}>{r.note}</span>
                    )}
                  </span>
                  <span className="w-24 text-right text-sm font-medium text-slate-800 shrink-0">
                    {r.premium != null ? `${r.premium} AZN` : "—"}
                  </span>
                  <div className="relative w-24 shrink-0">
                    <Input
                      type="text" inputMode="numeric" maxLength={2}
                      value={pctVal}
                      placeholder="0"
                      onChange={(e) => setRowPercents((p) => ({ ...p, [r.id]: clampPct(e.target.value) }))}
                      className="pr-6 text-right h-8"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">Faizi hər sətir üçün özünüz yazın.</p>
        </div>
      )}

      {/* Marka istinadı */}
      <div className="border-t border-dashed pt-3">
        <button type="button" onClick={() => setShowBrands((s) => !s)} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary">
          <ChevronDown size={15} className={`transition-transform ${showBrands ? "rotate-180" : ""}`} />
          Marka istinadı (kateqoriyaya görə)
        </button>
        {showBrands && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {PASHA_BRANDS.map((b) => (
              <div key={b.category} className="border border-slate-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-primary mb-1">{b.category}</p>
                <p className="text-xs text-slate-600">{b.brands.join(", ")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
