"use client";
import { Input } from "@/components/ui/input";
import { CalendarRange, Check, X } from "lucide-react";

type Props = {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  onApply: (from?: string, to?: string) => void;
};

const fmt = (d: Date) => d.toISOString().slice(0, 10);

export function DateRangeFilter({ from, to, setFrom, setTo, onApply }: Props) {
  const today = new Date();

  const presets: { label: string; from: string; to: string }[] = [
    { label: "Bu gün", from: fmt(today), to: fmt(today) },
    {
      label: "Son 7 gün",
      from: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)),
      to: fmt(today),
    },
    {
      label: "Bu ay",
      from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
      to: fmt(today),
    },
    {
      label: "Bu il",
      from: fmt(new Date(today.getFullYear(), 0, 1)),
      to: fmt(today),
    },
  ];

  const applyPreset = (f: string, t: string) => {
    setFrom(f);
    setTo(t);
    onApply(f, t);
  };

  const clearAll = () => {
    setFrom("");
    setTo("");
    onApply("", "");
  };

  const activePreset = presets.find((p) => p.from === from && p.to === to)?.label;
  const hasRange = Boolean(from || to);

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm overflow-hidden">
      {/* Başlıq zolağı */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white/60">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
            <CalendarRange size={17} />
          </span>
          <span className="font-semibold text-slate-800">Tarix aralığı</span>
          {hasRange && (
            <span className="ml-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {from || "…"} — {to || "…"}
            </span>
          )}
        </div>
        {hasRange && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 transition-colors"
          >
            <X size={13} /> Təmizlə
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Sürətli seçimlər */}
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const active = activePreset === p.label;
            return (
              <button
                key={p.label}
                onClick={() => applyPreset(p.from, p.to)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Xüsusi aralıq */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Başlanğıc</label>
            <Input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="w-44 bg-white"
            />
          </div>
          <span className="pb-2.5 text-slate-400">→</span>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Son</label>
            <Input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="w-44 bg-white"
            />
          </div>
          <button
            onClick={() => onApply(from, to)}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Check size={15} /> Tətbiq et
          </button>
        </div>
      </div>
    </div>
  );
}
