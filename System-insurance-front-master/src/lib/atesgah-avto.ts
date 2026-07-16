// Atəşgah — İcbari avtonəqliyyat: sığorta haqqı və komissiya cədvəlləri
// Mənbə: "Atesgah - bonus.pdf" + əlavə göndərilən cədvəllər

export type PersonType = "fiziki" | "huquqi";
export type VehicleType = "minik" | "yuk" | "diger"; // Minik / Yük / Digər
export type VehicleCategory = "diger" | "vaz_lada" | "qadagan";

export const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: "minik", label: "Minik" },
  { value: "yuk", label: "Yük" },
  { value: "diger", label: "Digər" },
];

// Mühərrik həcmi bandları (sm³). "elektro" ayrıca.
export const ENGINE_BANDS = [
  { key: "0-1500", label: "0–1500 sm³", min: 0, max: 1500 },
  { key: "1501-2000", label: "1501–2000 sm³", min: 1501, max: 2000 },
  { key: "2001-2500", label: "2001–2500 sm³", min: 2001, max: 2500 },
  { key: "2501-3000", label: "2501–3000 sm³", min: 2501, max: 3000 },
  { key: "3001-3500", label: "3001–3500 sm³", min: 3001, max: 3500 },
  { key: "3501-4000", label: "3501–4000 sm³", min: 3501, max: 4000 },
  { key: "4001-4500", label: "4001–4500 sm³", min: 4001, max: 4500 },
  { key: "4501-5000", label: "4501–5000 sm³", min: 4501, max: 5000 },
  { key: "5000+", label: "5000< sm³", min: 5001, max: Infinity },
] as const;

export const VEHICLE_CATEGORIES: { value: VehicleCategory; label: string }[] = [
  { value: "diger", label: "Digər markalar" },
  { value: "vaz_lada", label: "VAZ / LADA" },
  { value: "qadagan", label: "Qadağan edilmiş NV" },
];

// ── MİNİK — Fiziki şəxslər: kateqoriya × band → { p: sığorta haqqı, k: komissiya % } ──
type Row = { p: number; k: number };
// Qeyd: komissiya faizləri (k) hələlik 0 — admin özü təyin edəcək. Sığorta haqları (p) saxlanır.
const FIZIKI_MINIK: Record<VehicleCategory, Record<string, Row>> = {
  diger: {
    "0-1500": { p: 80, k: 0 },
    "1501-2000": { p: 84, k: 0 },
    "2001-2500": { p: 99, k: 0 },
    "2501-3000": { p: 100, k: 0 },
    "3001-3500": { p: 90, k: 0 },
    "3501-4000": { p: 90, k: 0 },
    "4001-4500": { p: 95, k: 0 },
    "4501-5000": { p: 95, k: 0 },
    "5000+": { p: 95, k: 0 },
    elektro: { p: 115, k: 0 },
  },
  qadagan: {
    "0-1500": { p: 90, k: 0 },
    "1501-2000": { p: 95, k: 0 },
    "2001-2500": { p: 100, k: 0 },
    "2501-3000": { p: 100, k: 0 },
    "3001-3500": { p: 100, k: 0 },
    "3501-4000": { p: 100, k: 0 },
    "4001-4500": { p: 100, k: 0 },
    "4501-5000": { p: 100, k: 0 },
    "5000+": { p: 100, k: 0 },
    elektro: { p: 120, k: 0 },
  },
  vaz_lada: {
    // PDF-də yalnız 0–2000 sm³ verilib
    "0-1500": { p: 67, k: 0 },
    "1501-2000": { p: 67, k: 0 },
  },
};

// MİNİK — Hüquqi şəxslər: band → maksimum komissiya faizi (hələlik 0)
const HUQUQI_MINIK_MAX: Record<string, number | null> = {
  "0-1500": 0,
  "1501-2000": 0,
  "2001-2500": 0,
  "2501-3000": 0,
  "3001-3500": 0,
  "3501-4000": 0,
  "4001-4500": 0,
  "4501-5000": 0,
  "5000+": 0,
  elektro: 0,
};

// ── DİGƏR nəqliyyat növləri (həm Fiziki, həm Hüquqi) → komissiya % ──
// Sığorta haqqı tonaj/digər əsaslıdır — hələlik default.
export const DIGER_TYPES: { value: string; label: string; k: number }[] = [
  { value: "agir_texnika", label: "Ağır texnika", k: 5 },
  { value: "avtobus", label: "Avtobus", k: 0 },
  { value: "motosikl", label: "Motosikl", k: 0 },
  { value: "serhed", label: "Sərhəd", k: 0 },
  { value: "qosqu", label: "Qoşqu", k: 5 },
  { value: "diger", label: "Digər", k: 5 }, // default — sonra dəyişiləcək
];

// Qadağan edilmiş NV — marka + model siyahısı
export const QADAGAN_VEHICLES: { brand: string; model: string }[] = [
  { brand: "Honda", model: "Civic" },
  { brand: "Honda", model: "CITY" },
  { brand: "Honda", model: "İnsight" },
  { brand: "KİA", model: "RİO" },
  { brand: "KİA", model: "CEED" },
  { brand: "NISSAN", model: "JUKE" },
  { brand: "NISSAN", model: "SENTRA" },
  { brand: "NISSAN", model: "Note" },
  { brand: "NISSAN", model: "Sunny" },
  { brand: "NISSAN", model: "Micra" },
  { brand: "VOLKSWAGEN", model: "JETTA" },
  { brand: "MERCEDES BENZ", model: "VİTO 230" },
  { brand: "MERCEDES BENZ", model: "Sprinter" },
  { brand: "SKODA", model: "Rapid" },
  { brand: "SKODA", model: "Fabia" },
  { brand: "SKODA", model: "KODIAQ" },
  { brand: "SKODA", model: "Superb" },
  { brand: "Toyota", model: "Prius" },
  { brand: "Toyota", model: "Yaris" },
  { brand: "Chevrolet", model: "bütün modellər" },
  { brand: "Opel", model: "bütün modellər" },
  { brand: "RENAULT", model: "bütün modellər" },
  { brand: "Khazar", model: "bütün modellər" },
  { brand: "AzSamand", model: "bütün modellər" },
  { brand: "İSUZU", model: "bütün modellər" },
  { brand: "Daewoo", model: "bütün modellər" },
  { brand: "RAVON", model: "bütün modellər" },
  { brand: "SAIPA", model: "bütün modellər" },
  { brand: "NAZLİFAN", model: "bütün modellər" },
  { brand: "TOFAŞ", model: "bütün modellər" },
  { brand: "BYD", model: "bütün modellər" },
  { brand: "Dong Feng", model: "bütün modellər" },
  { brand: "Geely", model: "bütün modellər" },
  { brand: "KAYİ", model: "bütün modellər" },
];

// YÜK sətirləri — faizlər admin tərəfindən yazılır (default 0)
export const YUK_ROWS: { id: string; label: string; note?: string }[] = [
  { id: "y_elektro", label: "Elektromobil", note: "Tesla, Zeekr, Chevrolet, Dazun, DongFeng, Toyota, MG — QADAĞA" },
  { id: "y_0_3500", label: "0–3500 kg", note: "Mercedes, Chevrolet, Dacia, Ford Tranzit — QADAĞA" },
  { id: "y_3501_7000", label: "3501–7000 kq", note: "ÜMUMİ QADAĞA" },
  { id: "y_7000", label: "7000 kg-dan yuxarı" },
  { id: "y_qosqu", label: "Qoşqu", note: "Dartıcısız QADAĞA" },
  { id: "y_agir", label: "Ağır, Xüsusi təyinatlı" },
];

export function bandForCc(cc: number): string | null {
  const b = ENGINE_BANDS.find((x) => cc >= x.min && cc <= x.max);
  return b ? b.key : null;
}

// Minik — kateqoriya + band üzrə sığorta haqqı (yoxdursa null)
export function minikPremium(category: VehicleCategory, bandKey: string): number | null {
  return FIZIKI_MINIK[category]?.[bandKey]?.p ?? null;
}

// Elektromobil premium-u
export function minikElektroPremium(category: VehicleCategory): number | null {
  return FIZIKI_MINIK[category]?.["elektro"]?.p ?? null;
}

export type AvtoCalcResult = {
  ok: boolean;
  premium: number | null;
  commissionPercent: number | null;
  band: string | null;
  message?: string;
};

export function calcAtesgahAvto(params: {
  person: PersonType;
  vehicleType: VehicleType;
  category: VehicleCategory;
  cc: number | null;
  electric: boolean;
  digerType?: string;
}): AvtoCalcResult {
  const { person, vehicleType, category, cc, electric, digerType } = params;

  // YÜK — tonaj əsaslı (hələlik tarif daxil edilməyib)
  if (vehicleType === "yuk") {
    return {
      ok: true,
      premium: null,
      commissionPercent: null,
      band: null,
      message: "Yük — tonaj əsaslıdır (tariflər hələ daxil edilməyib)",
    };
  }

  // DİGƏR — nəqliyyat növünə görə komissiya
  if (vehicleType === "diger") {
    const t = DIGER_TYPES.find((x) => x.value === digerType);
    if (!t) {
      return { ok: false, premium: null, commissionPercent: null, band: null, message: "Nəqliyyat növünü seçin" };
    }
    return {
      ok: true,
      premium: null, // tonaj/digər əsaslı — hələlik default
      commissionPercent: t.k,
      band: null,
      message: "Sığorta haqqı tonaj/digər əsaslıdır (hələlik default)",
    };
  }

  // MİNİK — mühərrik həcmi əsaslı
  const band = electric ? "elektro" : cc != null ? bandForCc(cc) : null;
  if (!band) {
    return { ok: false, premium: null, commissionPercent: null, band: null, message: "Mühərrik həcmini daxil edin" };
  }
  const row = FIZIKI_MINIK[category]?.[band];
  if (!row) {
    return {
      ok: false,
      premium: null,
      commissionPercent: null,
      band,
      message: "Bu kateqoriya üçün bu həcmdə tarif yoxdur (məs. VAZ/LADA yalnız 0–2000 sm³)",
    };
  }
  if (person === "huquqi") {
    const maxKom = HUQUQI_MINIK_MAX[band] ?? null;
    return {
      ok: true,
      premium: row.p,
      commissionPercent: maxKom,
      band,
      message: maxKom == null ? "Hüquqi şəxs üçün bu banda komissiya nəzərdə tutulmayıb" : undefined,
    };
  }
  return { ok: true, premium: row.p, commissionPercent: row.k, band };
}

// ── Region üzrə (limit əsaslı) komissiya ───────────────────────────────
export const BAKI_DQN_CODES = ["01", "10", "50", "77", "88", "90", "99"];

export type RegionKey = "baki" | "region";
export const REGION_CATEGORIES = [
  { key: "0-3500", label: "0–3500" },
  { key: "3501-7000", label: "3501–7000" },
  { key: ">7001", label: "> 7001" },
] as const;

const REGION_PRICING: Record<RegionKey, Record<string, { limit: number; below: number; above: number }>> = {
  region: {
    "0-3500": { limit: 135, below: 5, above: 10 },
    "3501-7000": { limit: 215, below: 3, above: 8 },
    ">7001": { limit: 165, below: 10, above: 12 },
  },
  baki: {
    "0-3500": { limit: 165, below: 4, above: 8 },
    "3501-7000": { limit: 240, below: 3, above: 6 },
    ">7001": { limit: 200, below: 8, above: 10 },
  },
};

// Sığorta məbləği → SH (sığorta haqqı) cədvəli
export const SIGORTA_MEBLEGI_SH: { amount: number; sh: number }[] = [
  { amount: 5000, sh: 19 },
];

// Sürücünün qeydiyyatı — "Bakı" qrupuna aid rayonlar
export const BAKI_DISTRICTS = [
  "Bakı", "Sumqayıt", "Abşeron", "Ağdam", "Fizuli", "Qubadlı", "Zəngilan", "Cəbrayıl",
  "Laçın", "Kəlbəcər", "Şuşa", "Xankəndi", "Ağdərə", "Xocalı", "Xocavənd",
];
export const DIGER_DISTRICT = "DİGƏR";

export function regionIsBaki(dqnCode: string): boolean {
  return BAKI_DQN_CODES.includes((dqnCode || "").trim());
}

export function districtIsBaki(district: string): boolean {
  return BAKI_DISTRICTS.includes((district || "").trim());
}

// QAYDA: DQN kodu VƏ sürücünün qeydiyyatı — hər ikisi siyahıda olmalıdır.
// Hər hansı biri uyğun gəlməsə → Region sayılır.
export function resolveRegion(dqnCode: string, driverDistrict: string): RegionKey {
  return regionIsBaki(dqnCode) && districtIsBaki(driverDistrict) ? "baki" : "region";
}

export function calcRegionCommission(params: {
  region: RegionKey;
  category: string;
  enteredPremium: number;
}): { limit: number; commissionPercent: number } | null {
  const row = REGION_PRICING[params.region]?.[params.category];
  if (!row) return null;
  const commissionPercent = params.enteredPremium <= row.limit ? row.below : row.above;
  return { limit: row.limit, commissionPercent };
}
