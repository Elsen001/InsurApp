"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Building2, ChevronDown } from "lucide-react";
import { PASHA_ROWS, PASHA_BRANDS } from "@/lib/pasha-avto";

type Props = {
  onPick?: (percent: number) => void;
};

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
  const [selectedId, setSelectedId] = useState<string>("");
  const [showBrands, setShowBrands] = useState(false);

  let rows = vehicleType ? PASHA_ROWS.filter((r) => GROUP_MAP[vehicleType].includes(r.group)) : [];
  // "Digər" içində Əmlak sətirləri şəxs tipinə görə filtrlənir (Yaşıl kart hər zaman)
  if (vehicleType === "diger") {
    rows = rows.filter((r) => (r.group !== "Əmlak" ? true : person === "fiziki" ? r.id === "e_fiziki" : r.id === "e_huquqi"));
  }
  const selected = rows.find((r) => r.id === selectedId);

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
      active ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40"
    }`;
  const komColor = (v: number) => (v === 0 ? "text-red-600" : "text-emerald-700");

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
            <button key={t.value} type="button" className={chip(vehicleType === t.value)} onClick={() => { setVehicleType(t.value); setSelectedId(""); }}>
              {t.label}
            </button>
          ))}
        </div>
        {!vehicleType && <p className="text-xs text-muted-foreground">Hesablama üçün nəqliyyat növünü seçin.</p>}
      </div>

      {/* Sətirlər (açılır) */}
      {vehicleType && (
        <div className="space-y-2 border-l-2 border-primary/30 pl-4">
          <Label>Uyğun sətri seçin</Label>
          <div className="space-y-2">
            {rows.map((r) => {
              const active = selectedId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${active ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/40"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-800">{r.label}</span>
                    <span className={`text-lg font-bold ${komColor(r.commission)}`}>{r.commission}%</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                    {r.dqn && <span>📍 {r.dqn}</span>}
                    {r.year && <span>📅 {r.year}</span>}
                  </div>
                  {r.note && <p className={`text-xs mt-1 ${r.note.includes("QADAĞA") ? "text-red-600" : "text-slate-500"}`}>{r.note}</p>}
                </button>
              );
            })}
          </div>

          {/* Nəticə + bonus götür */}
          {selected && (
            <div className="flex flex-wrap items-center gap-4 text-sm bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mt-2">
              <span className="text-slate-600">{selected.group} · {selected.label}</span>
              <span className={`ml-auto font-bold text-base ${komColor(selected.commission)}`}>Komissiya: {selected.commission}%</span>
              {onPick && (
                <button type="button" onClick={() => onPick(selected.commission)} className="text-sm font-medium text-primary border border-primary/40 rounded-lg px-4 py-1.5 hover:bg-primary/5 transition-colors">
                  bonus kimi götür ({selected.commission}%)
                </button>
              )}
            </div>
          )}
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
