"use client";
import { useEffect, useState } from "react";
import { pricingRulesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, X, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

const POLICY_TYPES = [
  { value: "all", label: "Bütün növlər" },
  { value: "auto", label: "Avtomobil (MTPL)" },
  { value: "casco", label: "Kasko" },
  { value: "property", label: "Əmlak" },
  { value: "travel", label: "Səfər" },
];

const CONDITION_FIELDS: Record<string, { label: string; hint: string }[]> = {
  auto: [
    { label: "İstehsal ili", hint: "year" },
    { label: "Motor həcmi (L)", hint: "engine_volume" },
  ],
  casco: [
    { label: "İstehsal ili", hint: "year" },
    { label: "Avtomobilin dəyəri (AZN)", hint: "car_value" },
    { label: "Sürücü sayı", hint: "driver_count" },
  ],
  property: [
    { label: "Sahə (m²)", hint: "area" },
    { label: "Əmlak dəyəri (AZN)", hint: "property_value" },
  ],
  travel: [
    { label: "Şəxs sayı", hint: "persons_count" },
  ],
  all: [],
};

const OPERATORS = [
  { value: "gt", label: "Böyükdür ( > )" },
  { value: "gte", label: "Böyük və ya bərabərdir ( ≥ )" },
  { value: "lt", label: "Kiçikdir ( < )" },
  { value: "lte", label: "Kiçik və ya bərabərdir ( ≤ )" },
  { value: "eq", label: "Bərabərdir ( = )" },
];

const emptyForm = {
  name: "",
  description: "",
  policy_type: "auto",
  condition_field: "",
  condition_operator: "",
  condition_value: "",
  bonus_percent: "",
  effective_from: "",
};

export default function PricingRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    pricingRulesApi.getAll().then(res => setRules(res.data.rules)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const setF = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  };

  const openEdit = (rule: any) => {
    setEditingId(rule.id);
    setForm({
      name: rule.name || "",
      description: rule.description || "",
      policy_type: rule.policy_type || "auto",
      condition_field: rule.condition_field || "",
      condition_operator: rule.condition_operator || "",
      condition_value: rule.condition_value != null ? String(rule.condition_value) : "",
      bonus_percent: rule.bonus_percent != null ? String(rule.bonus_percent) : "",
      effective_from: rule.effective_from ? rule.effective_from.slice(0, 16) : "",
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      description: form.description || undefined,
      policy_type: form.policy_type,
      condition_field: form.condition_field || null,
      condition_operator: form.condition_operator || null,
      condition_value: form.condition_value !== "" ? Number(form.condition_value) : null,
      bonus_percent: Number(form.bonus_percent),
      effective_from: form.effective_from || null,
    };
    try {
      if (editingId) {
        await pricingRulesApi.update(editingId, payload);
      } else {
        await pricingRulesApi.create(payload);
      }
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule: any) => {
    await pricingRulesApi.update(rule.id, { is_active: !rule.is_active });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu qaydanı silmək istəyirsiniz?")) return;
    await pricingRulesApi.delete(id);
    load();
  };

  const conditionFields = CONDITION_FIELDS[form.policy_type] || [];
  const hasCondition = form.condition_field !== "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bonus/Endirim Qaydaları</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sığorta növü, avtomobil ili və ya motora görə optional qiymət düzəlişləri
          </p>
        </div>
        <Button onClick={openCreate}><Plus size={16} className="mr-2" />Yeni Qayda</Button>
      </div>

      {/* Forma */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>{editingId ? "Qaydanı Düzəlt" : "Yeni Qayda Yarat"}</CardTitle>
            <CardDescription>
              Şərt sahələri optionaldır. Şərtsiz qayda həmişə tətbiq olunur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Qayda adı *</Label>
                  <Input value={form.name} onChange={e => setF("name", e.target.value)} required placeholder="məs: Köhnə avtomobil artımı" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Açıqlama</Label>
                  <Input value={form.description} onChange={e => setF("description", e.target.value)} placeholder="İstəyə bağlı izah" />
                </div>

                <div className="space-y-2">
                  <Label>Sığorta növü *</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.policy_type}
                    onChange={e => { setF("policy_type", e.target.value); setF("condition_field", ""); }}
                    required
                  >
                    {POLICY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Bonus/Endirim faizi (%) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.bonus_percent}
                    onChange={e => setF("bonus_percent", e.target.value)}
                    required
                    placeholder="məs: 15 (artım) və ya -10 (endirim)"
                  />
                  <p className="text-xs text-muted-foreground">Müsbət = artım, Mənfi = endirim</p>
                </div>

                <div className="space-y-2">
                  <Label>Qüvvəyə minmə tarixi</Label>
                  <Input
                    type="datetime-local"
                    value={form.effective_from}
                    onChange={e => setF("effective_from", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Boş buraxılsa, dərhal tətbiq olunur. Tarix təyin edilsə, yalnız həmin tarixdən sonra yaradılan sığortalara təsir edir.</p>
                </div>
              </div>

              {/* Şərt bölməsi — Optional */}
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                <p className="text-sm font-medium text-slate-700">Şərt (Optional)</p>
                <p className="text-xs text-muted-foreground">Şərt qoyulmasa, qayda həmişə tətbiq olunur.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Sahə</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.condition_field}
                      onChange={e => setF("condition_field", e.target.value)}
                    >
                      <option value="">— Şərtsiz —</option>
                      {conditionFields.map(f => (
                        <option key={f.hint} value={f.hint}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Operator</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.condition_operator}
                      onChange={e => setF("condition_operator", e.target.value)}
                      disabled={!hasCondition}
                    >
                      <option value="">Seçin</option>
                      {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Dəyər</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.condition_value}
                      onChange={e => setF("condition_value", e.target.value)}
                      disabled={!hasCondition}
                      placeholder="məs: 2015 (il) və ya 2.0 (motor)"
                    />
                  </div>
                </div>

                {/* Şərt nümunəsi */}
                {hasCondition && form.condition_operator && form.condition_value && (
                  <div className="text-sm bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-blue-800">
                    <strong>Tətbiq şərti:</strong>{" "}
                    {conditionFields.find(f => f.hint === form.condition_field)?.label}{" "}
                    {OPERATORS.find(o => o.value === form.condition_operator)?.label}{" "}
                    {form.condition_value}
                    {" → "}
                    <strong>{Number(form.bonus_percent) >= 0 ? "+" : ""}{form.bonus_percent}% bonus</strong>
                  </div>
                )}
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>}

              <div className="flex gap-3">
                <Button type="submit" loading={saving}>{editingId ? "Yadda saxla" : "Yarat"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Ləğv et</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Qaydalar siyahısı */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            Hələ qayda yaradılmayıb. "Yeni Qayda" düyməsini basın.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <Card key={rule.id} className={!rule.is_active ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{rule.name}</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        POLICY_TYPES.find(t => t.value === rule.policy_type)
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {POLICY_TYPES.find(t => t.value === rule.policy_type)?.label}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        Number(rule.bonus_percent) >= 0
                          ? "bg-orange-100 text-orange-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {Number(rule.bonus_percent) >= 0 ? "+" : ""}{rule.bonus_percent}% bonus
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        rule.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {rule.is_active ? "Aktiv" : "Deaktiv"}
                      </span>
                    </div>

                    {rule.description && (
                      <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                    )}

                    {rule.condition_field && (
                      <p className="text-sm mt-1">
                        <span className="text-muted-foreground">Şərt: </span>
                        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                          {rule.condition_field} {rule.condition_operator} {rule.condition_value}
                        </span>
                      </p>
                    )}
                    {!rule.condition_field && (
                      <p className="text-xs text-muted-foreground mt-1">Şərtsiz — həmişə tətbiq olunur</p>
                    )}
                    {rule.effective_from && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Qüvvəyə minmə: {new Date(rule.effective_from).toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggle(rule)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-muted-foreground hover:text-primary"
                      title={rule.is_active ? "Deaktiv et" : "Aktiv et"}
                    >
                      {rule.is_active ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} />}
                    </button>
                    <button
                      onClick={() => openEdit(rule)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-muted-foreground hover:text-primary"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
