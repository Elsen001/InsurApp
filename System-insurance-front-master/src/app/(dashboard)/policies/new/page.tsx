"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import api, { policiesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, ChevronDown, X } from "lucide-react";
import Link from "next/link";

// ── Sabit tiplər və məlumatlar ────────────────────────────────────────────────

type PolicyType = "auto" | "casco" | "property" | "travel";

const typeLabels: Record<PolicyType, string> = {
  auto: "İcbari avtomobil sığortası",
  casco: "Kasko",
  property: "Əmlak",
  travel: "Səfər",
};

type InsuranceGroup = "icbari" | "könüllü" | "məhsul";

const INSURANCE_GROUPS: Record<InsuranceGroup, { label: string; items: { value: string; label: string }[] }> = {
  icbari: {
    label: "İcbari sığorta növləri",
    items: [
      { value: "avtonəqliyyat", label: "Avtonəqliyyat vasitəsi sahiblərinin mülki məsuliyyətinin icbari sığortası" },
      { value: "daşınmaz_əmlak", label: "Daşınmaz əmlakın icbari sığortası" },
      { value: "dəimmis", label: "Daşınmaz əmlakın istismarı ilə bağlı mülki məsuliyyətin icbari sığortası – DƏİMMİS" },
      { value: "peşə_əmək", label: "İstehsalatda bədbəxt hadisələr və peşə xəstəlikləri nəticəsindən icbari sığorta" },
      { value: "sərnişin", label: "Sərnişinlərin icbari fərdi qəza sığortası" },
      { value: "auditor", label: "Auditorların Peşə Məsuliyyətinin İcbari Sığortası" },
      { value: "yaşıl_kart", label: "Yaşıl Kart" },
    ],
  },
  könüllü: {
    label: "Könüllü növlər",
    items: [
      { value: "kasko", label: "Kasko sığorta" },
      { value: "əmlak", label: "Əmlak Sığortası" },
      { value: "səfər", label: "Səfər sığortası" },
      { value: "yük", label: "Yük sığortası" },
      { value: "tibbi", label: "Tibbi sığorta" },
      { value: "qiymətləndirmə_peşə", label: "Qiymətləndirmə Peşə Məsuliyyətinin Sığortası" },
      { value: "fərdi_qəza", label: "Fərdi qəza sığortası" },
    ],
  },
  məhsul: {
    label: "Sığorta məhsulları",
    items: [],
  },
};

const INSURANCE_COMPANIES = [
  {
    key: "ateşgah",
    label: "Atəşgah sığorta",
    items: [
      { value: "ateşgah_agent_kasko", label: "Agent kasko" },
      { value: "ateşgah_kasko_bolgem", label: "Kasko Bölgəm" },
      { value: "ateşgah_al_paket", label: "Al paket" },
      { value: "ateşgah_avto_plus", label: "Avto+" },
      { value: "ateşgah_avto_extra", label: "Avto Extra" },
      { value: "ateşgah_arxayin_qonsu", label: "Arxayın qonşu" },
      { value: "ateşgah_yuz_yasa_tibbi", label: "Yüz yaşa Tibbi sığorta" },
    ],
  },
  {
    key: "ateşgah_həyat",
    label: "Atəşgah Həyat sığorta",
    items: [
      { value: "ah_heyatin_yigim", label: "Həyatın yığım sığortası" },
      { value: "ah_muddətli_həyat", label: "Müddətli həyat sığortası" },
      { value: "ah_usaqlarin_tehsil", label: "Uşaqların Təhsil Sığortası" },
      { value: "ah_qorunan_gelir", label: "Qorunan Gəlir sığortası" },
      { value: "ah_aile_fondu", label: "Ailə Fondu sığortası" },
    ],
  },
  {
    key: "paşa",
    label: "Paşa sığorta",
    items: [
      { value: "pasha_optimal_kasko", label: "Optimal kasko" },
      { value: "pasha_parkinq_kasko", label: "Parkinq kasko" },
      { value: "pasha_yasil_azerbaycan", label: "Yaşıl Azərbaycan" },
      { value: "pasha_yuvam", label: "Yuvam" },
      { value: "pasha_yaxin_qonsu", label: "Yaxın qonşu" },
      { value: "pasha_evrika", label: "Evrika" },
      { value: "pasha_ev_esyalari", label: "Ev əşyalarının sığortası" },
      { value: "pasha_ecnebi_sefər", label: "Əcnəbilərin səfər sığortası" },
      { value: "pasha_mektebli_tibbi", label: "Məktəbli tibbi sığortası" },
    ],
  },
  {
    key: "paşa_həyat",
    label: "Paşa Həyat sığorta",
    items: [
      { value: "ph_heyatin_yasam", label: "Həyatın yaşam sığortası" },
      { value: "ph_usaqlar_ucun_həyat", label: "Uşaqlar üçün Həyat Sığortası" },
      { value: "ph_həyata_baglam", label: "Həyata bağlan sığortası" },
      { value: "ph_gelirli_həyat", label: "Gəlirli Həyat Sığortası" },
      { value: "ph_100_qat", label: "100 Qat sığorta" },
      { value: "ph_kredit_həyat", label: "Kredit Həyat Sığortası" },
    ],
  },
  {
    key: "xalq",
    label: "Xalq Sığorta",
    items: [
      { value: "xalq_mikro_kasko", label: "Mikro kasko" },
      { value: "xalq_plyus_kasko", label: "Plyus kasko" },
      { value: "xalq_saglam_yasa", label: "Sağlam Yaşa" },
    ],
  },
  {
    key: "meqa",
    label: "Meqa sığorta",
    items: [
      { value: "meqa_mini_kasko", label: "Mini kasko" },
      { value: "meqa_extra_icbari", label: "Extra İcbari" },
    ],
  },
  {
    key: "qala",
    label: "Qala Sığorta",
    items: [
      { value: "qala_serikli_kasko", label: "Şərikli kasko" },
      { value: "qala_qaydali_kasko", label: "Qaydalı kasko" },
      { value: "qala_100", label: "Qala 100" },
      { value: "qala_emin", label: "Əmin Qala bilərsiz" },
      { value: "qala_intizamli", label: "İntizamlı Sürücü" },
      { value: "qala_elite", label: "Qala Elite Club" },
      { value: "qala_evimiz", label: "Evimiz Qalamızdır" },
      { value: "qala_saglam_həyat", label: "Sağlam Həyat" },
    ],
  },
];

const CAR_BRANDS_WITH_MODELS = [
  { id: 1, name: "Acura", models: ["CL", "ILX", "Integra", "Legend", "MDX", "NSX", "RDX", "RL", "RLX", "RSX", "TL", "TLX", "TSX", "ZDX"] },
  { id: 2, name: "Alfa Romeo", models: ["147", "156", "159", "166", "Brera", "Giulia", "Giulietta", "GTV", "MiTo", "Spider", "Stelvio", "Tonale"] },
  { id: 3, name: "Aston Martin", models: ["DB11", "DB9", "DBS", "DBX", "Rapide", "Vantage", "Virage"] },
  { id: 4, name: "Audi", models: ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "e-tron", "Q2", "Q3", "Q4", "Q5", "Q7", "Q8", "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "S3", "S4", "S5", "S6", "S7", "S8", "SQ5", "SQ7", "SQ8", "TT", "TTS"] },
  { id: 5, name: "BMW", models: ["1 Seriya", "2 Seriya", "3 Seriya", "4 Seriya", "5 Seriya", "6 Seriya", "7 Seriya", "8 Seriya", "i3", "i4", "i5", "i7", "iX", "iX3", "M2", "M3", "M4", "M5", "M6", "M8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM", "Z3", "Z4"] },
  { id: 6, name: "Bentley", models: ["Bentayga", "Continental", "Flying Spur", "Mulsanne"] },
  { id: 7, name: "Buick", models: ["Electra", "Encore", "Enclave", "Envision", "LaCrosse", "Regal", "Verano"] },
  { id: 8, name: "BYD", models: ["Atto 3", "Han", "Song", "Tang", "Yuan"] },
  { id: 9, name: "Cadillac", models: ["ATS", "CT4", "CT5", "CT6", "CTS", "DTS", "Escalade", "Lyriq", "SRX", "STS", "XT4", "XT5", "XT6"] },
  { id: 10, name: "Chery", models: ["Arrizo 5", "Arrizo 6", "Arrizo 8", "Tiggo 4", "Tiggo 5X", "Tiggo 7", "Tiggo 8"] },
  { id: 11, name: "Chevrolet", models: ["Aveo", "Blazer", "Camaro", "Captiva", "Colorado", "Corvette", "Cruze", "Equinox", "Express", "Impala", "Lacetti", "Malibu", "Niva", "Orlando", "Silverado", "Sonic", "Spark", "Suburban", "Tahoe", "Tracker", "TrailBlazer", "Traverse", "Trax", "Volt"] },
  { id: 12, name: "Chrysler", models: ["300", "300C", "Crossfire", "Grand Voyager", "Pacifica", "Sebring", "Town & Country", "Voyager"] },
  { id: 13, name: "Citroen", models: ["Berlingo", "C1", "C2", "C3", "C3 Aircross", "C4", "C4 Cactus", "C4 Picasso", "C5", "C5 Aircross", "C5 X", "C6", "DS3", "DS4", "DS5", "Jumpy", "Saxo", "Xsara Picasso"] },
  { id: 14, name: "Cupra", models: ["Ateca", "Born", "Formentor", "Leon"] },
  { id: 15, name: "Daewoo", models: ["Espero", "Gentra", "Lanos", "Matiz", "Nexia", "Nubira", "Sens", "Tacuma"] },
  { id: 16, name: "Daihatsu", models: ["Charade", "Cuore", "Sirion", "Terios"] },
  { id: 17, name: "Dodge", models: ["Caliber", "Challenger", "Charger", "Dart", "Durango", "Grand Caravan", "Journey", "Nitro", "Ram", "Viper"] },
  { id: 18, name: "Ferrari", models: ["458", "488", "F40", "F430", "GTC4Lusso", "LaFerrari", "Portofino", "Roma", "SF90"] },
  { id: 19, name: "Fiat", models: ["124 Spider", "500", "500L", "500X", "Bravo", "Doblo", "Ducato", "Egea", "Linea", "Palio", "Panda", "Punto", "Tipo"] },
  { id: 20, name: "Ford", models: ["Bronco", "C-Max", "EcoSport", "Edge", "Escape", "Expedition", "Explorer", "F-150", "Fiesta", "Focus", "Fusion", "Galaxy", "Kuga", "Maverick", "Mondeo", "Mustang", "Puma", "Ranger", "S-Max", "Territory", "Transit", "Transit Custom"] },
  { id: 21, name: "GAC", models: ["GS3", "GS4", "GS5", "GS8"] },
  { id: 22, name: "GAZ", models: ["21", "24", "31105", "3110", "Gazel", "Volga"] },
  { id: 23, name: "Genesis", models: ["G70", "G80", "G90", "GV70", "GV80"] },
  { id: 24, name: "Great Wall", models: ["Haval F7", "Haval H2", "Haval H6", "Haval H9", "Poer", "Tank 300", "Tank 500", "Wingle"] },
  { id: 25, name: "Honda", models: ["Accord", "Civic", "CR-V", "CR-Z", "e:Ny1", "Element", "FIT", "FR-V", "HR-V", "Insight", "Jazz", "Legend", "Odyssey", "Passport", "Pilot", "Prologue", "Ridgeline", "S2000", "Stream", "ZR-V"] },
  { id: 26, name: "Hummer", models: ["H1", "H2", "H3"] },
  { id: 27, name: "Hyundai", models: ["Accent", "Atos", "Azera", "Creta", "Elantra", "Equus", "Getz", "Grandeur", "i10", "i20", "i30", "i40", "ix20", "ix35", "Ioniq", "Ioniq 5", "Ioniq 6", "Kona", "Lantra", "Matrix", "Nexo", "Palisade", "Santa Cruz", "Santa Fe", "Sonata", "Staria", "Terracan", "Trajet", "Tucson", "Veloster", "Venue"] },
  { id: 28, name: "Infiniti", models: ["EX", "FX", "G", "M", "Q30", "Q50", "Q60", "Q70", "QX30", "QX50", "QX55", "QX60", "QX70", "QX80"] },
  { id: 29, name: "Isuzu", models: ["D-Max", "MU-X", "Trooper"] },
  { id: 30, name: "JAC", models: ["J7", "S3", "S5", "S7", "T8"] },
  { id: 31, name: "Jaguar", models: ["E-Pace", "F-Pace", "F-Type", "I-Pace", "S-Type", "X-Type", "XE", "XF", "XJ"] },
  { id: 32, name: "Jeep", models: ["Cherokee", "Commander", "Compass", "Gladiator", "Grand Cherokee", "Grand Cherokee L", "Patriot", "Renegade", "Wrangler"] },
  { id: 33, name: "Kia", models: ["Cadenza", "Carens", "Carnival", "Cerato", "Ceed", "EV6", "EV9", "K5", "K8", "K9", "Magentis", "Mohave", "Niro", "Optima", "Picanto", "ProCeed", "Rio", "Seltos", "Sorento", "Soul", "Sportage", "Stinger", "Stonic", "Telluride", "Venga", "XCeed"] },
  { id: 34, name: "Lamborghini", models: ["Aventador", "Gallardo", "Huracan", "Murcielago", "Urus"] },
  { id: 35, name: "Lada", models: ["2101", "2102", "2103", "2104", "2105", "2106", "2107", "2108", "2109", "21099", "2110", "2111", "2112", "2115", "Granta", "Kalina", "Largus", "Niva", "Priora", "XRAY"] },
  { id: 36, name: "Land Rover", models: ["Defender", "Discovery", "Discovery Sport", "Freelander", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"] },
  { id: 37, name: "Lexus", models: ["CT", "ES", "GS", "GX", "IS", "LC", "LS", "LX", "NX", "RC", "RX", "RZ", "UX"] },
  { id: 38, name: "Lincoln", models: ["Aviator", "Corsair", "MKC", "MKS", "MKT", "MKX", "MKZ", "Navigator"] },
  { id: 39, name: "Lynk & Co", models: ["01", "02", "05"] },
  { id: 40, name: "Maserati", models: ["Ghibli", "GranTurismo", "Grecale", "Levante", "MC20", "Quattroporte"] },
  { id: 41, name: "Mazda", models: ["2", "3", "5", "6", "626", "CX-3", "CX-30", "CX-5", "CX-60", "CX-7", "CX-8", "CX-9", "MX-5", "MX-30", "RX-8"] },
  { id: 42, name: "McLaren", models: ["540C", "570S", "600LT", "720S", "765LT", "Artura", "GT"] },
  { id: 43, name: "Mercedes-Benz", models: ["A", "AMG GT", "B", "C", "CL", "CLA", "CLK", "CLS", "E", "EQA", "EQB", "EQC", "EQE", "EQS", "G", "GL", "GLA", "GLB", "GLC", "GLE", "GLK", "GLS", "ML", "R", "S", "SL", "SLC", "SLK", "Sprinter", "V", "Viano", "Vito"] },
  { id: 44, name: "Mitsubishi", models: ["ASX", "Colt", "Eclipse", "Eclipse Cross", "Galant", "L200", "Lancer", "Lancer Evolution", "Montero", "Outlander", "Pajero", "Pajero Sport", "Space Star"] },
  { id: 45, name: "MINI", models: ["Clubman", "Cooper", "Countryman", "Hatch", "Paceman"] },
  { id: 46, name: "Nissan", models: ["350Z", "370Z", "Almera", "Altima", "Ariya", "Armada", "Frontier", "GT-R", "Juke", "Kicks", "Leaf", "Maxima", "Micra", "Murano", "Navara", "Note", "Patrol", "Pathfinder", "Primera", "Qashqai", "Quest", "Rogue", "Sentra", "Teana", "Terra", "Tiida", "Titan", "X-Trail", "Xterra"] },
  { id: 47, name: "Opel", models: ["Adam", "Agila", "Antara", "Astra", "Cascada", "Combo", "Corsa", "Crossland", "Grandland", "Insignia", "Meriva", "Mokka", "Omega", "Signum", "Vectra", "Vivaro", "Zafira"] },
  { id: 48, name: "Peugeot", models: ["107", "108", "2008", "208", "301", "307", "308", "3008", "4007", "4008", "407", "408", "5008", "508", "Partner", "RCZ", "Traveller"] },
  { id: 49, name: "Porsche", models: ["718", "911", "Boxster", "Cayenne", "Cayman", "Macan", "Panamera", "Taycan"] },
  { id: 50, name: "Renault", models: ["Arkana", "Austral", "Captur", "Clio", "Duster", "Espace", "Fluence", "Grand Scenic", "Kadjar", "Kangoo", "Koleos", "Laguna", "Logan", "Master", "Megane", "Modus", "Sandero", "Scenic", "Symbol", "Trafic", "Triber", "Zoe"] },
  { id: 51, name: "Rolls-Royce", models: ["Cullinan", "Dawn", "Ghost", "Phantom", "Silver Shadow", "Spectre", "Wraith"] },
  { id: 52, name: "SEAT", models: ["Arona", "Ateca", "Exeo", "Ibiza", "Leon", "Tarraco"] },
  { id: 53, name: "Skoda", models: ["Citigo", "Fabia", "Kamiq", "Karoq", "Kodiaq", "Octavia", "Rapid", "Roomster", "Scala", "Superb", "Yeti"] },
  { id: 54, name: "SsangYong", models: ["Actyon", "Korando", "Musso", "Rexton", "Rodius", "Tivoli", "XLV"] },
  { id: 55, name: "Subaru", models: ["BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Levorg", "Outback", "Solterra", "WRX", "XV"] },
  { id: 56, name: "Suzuki", models: ["Alto", "Baleno", "Grand Vitara", "Ignis", "Jimny", "Kizashi", "Liana", "S-Cross", "SX4", "Swift", "Vitara"] },
  { id: 57, name: "Tesla", models: ["Cybertruck", "Model 3", "Model S", "Model X", "Model Y", "Roadster"] },
  { id: 58, name: "Toyota", models: ["4Runner", "Alphard", "Auris", "Avalon", "Avensis", "Aygo", "Bz4X", "C-HR", "Camry", "Corolla", "Crown", "FJ Cruiser", "Fortuner", "GR86", "GR Supra", "Hiace", "Highlander", "Hilux", "Land Cruiser", "Land Cruiser Prado", "Mark X", "Mirai", "Prius", "RAV4", "Rush", "Sequoia", "Sienna", "Tundra", "Venza", "Vios", "Yaris", "Yaris Cross"] },
  { id: 59, name: "UAZ", models: ["469", "Bukhanka", "Hunter", "Patriot"] },
  { id: 60, name: "VAZ", models: ["2101", "2102", "2103", "2104", "2105", "2106", "2107", "2108", "2109", "21099", "2110", "2111", "2112", "2115"] },
  { id: 61, name: "Volkswagen", models: ["Amarok", "Arteon", "Atlas", "Caddy", "CC", "Crafter", "Golf", "ID.3", "ID.4", "ID.5", "ID.6", "Jetta", "Multivan", "Passat", "Phaeton", "Polo", "Scirocco", "Sharan", "T-Cross", "T-Roc", "Taigo", "Tayron", "Tiguan", "Touareg", "Touran", "Transporter", "Up!"] },
  { id: 62, name: "Volvo", models: ["C30", "C40", "C70", "EX30", "EX90", "S40", "S60", "S80", "S90", "V40", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90"] },
  { id: 63, name: "Zotye", models: ["SR7", "T300", "T600"] },
  { id: 64, name: "ZAZ", models: ["968", "Chance", "Forza", "Lanos", "Sens", "Slavuta", "Tavria"] },
  { id: 65, name: "Geely", models: ["Atlas", "Atlas Pro", "Coolray", "Emgrand", "Tugella", "Cityray"] },
  { id: 66, name: "Haval", models: ["Dargo", "F5", "F7", "F7x", "H2", "H6", "H9", "Jolion"] },
  { id: 67, name: "Changan", models: ["CS35", "CS55", "CS75", "CS85", "Eado", "UNI-T", "UNI-V", "UNI-K"] },
  { id: 68, name: "MG", models: ["3", "5", "6", "HS", "Marvel R", "RX5", "ZS"] },
  { id: 69, name: "Seres", models: ["5", "7"] },
  { id: 70, name: "Exeed", models: ["LX", "TXL", "VX"] },
  { id: 71, name: "Omoda", models: ["C5", "5"] },
];

// ── Reusable searchable dropdown ──────────────────────────────────────────────
function SearchableSelect({
  label, value, onChange, options, placeholder = "Seçin", required, disabled = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string; required?: boolean; disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (v: string) => { onChange(v); setSearch(""); setOpen(false); };
  const handleClear = (e: React.MouseEvent) => { e.stopPropagation(); onChange(""); setSearch(""); };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          className={`h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors
            ${disabled ? "opacity-50 cursor-not-allowed bg-muted" : "hover:border-gray-400 cursor-pointer"}`}
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value || placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {value && !disabled && (
              <span onClick={handleClear} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </span>
            )}
            <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-input rounded-md shadow-lg">
            <div className="p-2 border-b">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Axtar..."
                className="w-full text-sm px-2 py-1 border border-input rounded outline-none focus:border-primary"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0
                ? <div className="px-3 py-2 text-sm text-muted-foreground">Nəticə tapılmadı</div>
                : filtered.map(o => (
                  <div
                    key={o}
                    onClick={() => handleSelect(o)}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors
                      ${value === o ? "bg-primary/10 text-primary font-medium" : ""}`}
                  >
                    {o}
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {required && (
          <input tabIndex={-1} required value={value} onChange={() => { }}
            className="absolute inset-0 opacity-0 pointer-events-none" />
        )}
      </div>
    </div>
  );
}

// ── Brand + Model linked pair ─────────────────────────────────────────────────
function BrandModelSelect({
  brand, model, onBrandChange, onModelChange,
}: {
  brand: string; model: string;
  onBrandChange: (v: string) => void; onModelChange: (v: string) => void;
}) {
  const brandNames = CAR_BRANDS_WITH_MODELS.map(b => b.name);
  const selectedBrand = CAR_BRANDS_WITH_MODELS.find(b => b.name === brand);
  const modelOptions = selectedBrand ? selectedBrand.models : [];

  const handleBrandChange = (v: string) => { onBrandChange(v); onModelChange(""); };

  return (
    <>
      <SearchableSelect label="Avtomobilin markası" value={brand} onChange={handleBrandChange} options={brandNames} placeholder="Marka seçin" />
      <SearchableSelect label="Avtomobilin modeli" value={model} onChange={onModelChange} options={modelOptions} placeholder={brand ? "Model seçin" : "Əvvəlcə marka seçin"} disabled={!brand} />
    </>
  );
}

// ── InfoTooltip ───────────────────────────────────────────────────────────────
function InfoTooltip({ imageSrc, alt }: { imageSrc: string; alt: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center cursor-help ml-1" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="text-blue-500 text-xs font-bold select-none">✶</span>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 shadow-xl rounded-lg overflow-hidden border border-gray-200 bg-white w-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt={alt} className="w-full h-auto object-contain" />
          <p className="text-xs text-center text-gray-500 py-1 px-2">{alt}</p>
        </div>
      )}
    </span>
  );
}

// ── Shared personal info fields ───────────────────────────────────────────────
function PersonalInfoFields({
  details,
  setDetail,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
  showSearch = false,
  onSearch,
  searchLoading = false,
  searchMsg = "",
}: {
  details: Record<string, any>;
  setDetail: (key: string, value: any) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  customerEmail: string;
  setCustomerEmail: (v: string) => void;
  showSearch?: boolean;
  onSearch?: () => void;
  searchLoading?: boolean;
  searchMsg?: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="flex items-center">
          Ş/V Fin kodu *
          <InfoTooltip imageSrc="https://www.kapitalbank.az/assets/static/img/fin_code_old_version.png" alt="FİN kodu nümunəsi" />
        </Label>
        <Input
          value={details.fin || ""}
          onChange={e => setDetail("fin", e.target.value.toUpperCase())}
          placeholder="XXXXXXX"
          className="uppercase"
          required
        />
      </div>
      <div className="space-y-2">
        <Label className="flex items-center">
          Ş/V nömrəsi *
          <InfoTooltip imageSrc="https://tehsil.socar.az/img/nomresi.png" alt="Şəxsiyyət vəsiqəsi nömrəsi nümunəsi" />
        </Label>
        <Input
          value={details.id_card_no || ""}
          onChange={e => setDetail("id_card_no", e.target.value.toUpperCase())}
          placeholder="AAXXXXXXXX"
          className="uppercase"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Doğum tarixi</Label>
        <Input
          type="date"
          value={details.birth_date || ""}
          onChange={e => setDetail("birth_date", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Sürücülük vəsiqəsinin seriya və nömrəsi</Label>
        <Input
          value={details.driving_license || ""}
          onChange={e => setDetail("driving_license", e.target.value.toUpperCase())}
          placeholder="AA000000"
          className="uppercase"
        />
      </div>
      <div className="space-y-2">
        <Label>Mobil nömrə *</Label>
        <Input
          value={customerPhone}
          onChange={e => setCustomerPhone(e.target.value)}
          placeholder="+994 50 XXX XX XX"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={customerEmail}
          onChange={e => setCustomerEmail(e.target.value)}
        />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NewPolicyPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [details, setDetails] = useState<Record<string, any>>({});
  const [previewPrice, setPreviewPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMsg, setSearchMsg] = useState("");

  // Sığorta növü state-ləri
  const [insuranceGroup, setInsuranceGroup] = useState<InsuranceGroup>("icbari");
  const [insuranceSubType, setInsuranceSubType] = useState("");
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [hoveredCompany, setHoveredCompany] = useState<string>("ateşgah");
  const [openTab, setOpenTab] = useState<InsuranceGroup | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tabsRef.current && !tabsRef.current.contains(e.target as Node)) {
        setOpenTab(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const setDetail = (key: string, value: any) => setDetails(d => ({ ...d, [key]: value }));

  const handleFinSearch = async () => {
    const fin = (details.fin || "").trim();
    const idCard = (details.id_card_no || "").trim();
    if (!fin && !idCard) { setSearchMsg("FİN və ya Ş/V nömrəsi daxil edin"); return; }
    setSearchLoading(true);
    setSearchMsg("");
    try {
      const res = await api.get("/api/auth/search-customer", { params: { fin, id_card_no: idCard } });
      if (res.data?.name) {
        setCustomerName(res.data.name || "");
        setCustomerPhone(res.data.phone || "");
        setCustomerEmail(res.data.email || "");
        setSearchMsg("Müştəri tapıldı.");
      } else {
        setSearchMsg("Müştəri tapılmadı.");
      }
    } catch {
      setSearchMsg("Müştəri tapılmadı.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await policiesApi.create({
        insurance_group: insuranceGroup,
        insurance_sub_type: insuranceSubType,
        insurance_company: insuranceCompany,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        start_date: startDate,
        end_date: endDate,
        notes,
        details,
      });
      router.push("/policies");
    } catch (e: any) {
      setError(e.response?.data?.message || "Xəta baş verdi");
      setLoading(false);
    }
  };

  // ── Determine which form to show based on selected insurance sub-type ──────
  const isAvtonəqliyyat = insuranceSubType === "avtonəqliyyat";
  const isDaşınmazEmlak = insuranceSubType === "daşınmaz_əmlak";
  const isDəimmis = insuranceSubType === "dəimmis";
  const isArxayinQonsu = insuranceSubType === "ateşgah_arxayin_qonsu";
  const isPasaOptimal = insuranceSubType === "pasha_optimal_kasko";
  const isKaskoBolgem = insuranceSubType === "ateşgah_kasko_bolgem";
  const isPasaParking = insuranceSubType === "pasha_parkinq_kasko";
  const isPashaYaxinQonsu = insuranceSubType === "pasha_yaxin_qonsu";
  const isPashaYuvam = insuranceSubType === "pasha_yuvam";
  const isYaşılKart = insuranceSubType === "yaşıl_kart";
  const isPashaEvEsyalari = insuranceSubType === "pasha_ev_esyalari";
  const isKasko = insuranceSubType === "kasko" ||
    INSURANCE_COMPANIES.find(c => c.key === "ateşgah")?.items.some(i => i.value === insuranceSubType && i.label.toLowerCase().includes("kasko")) ||
    INSURANCE_COMPANIES.find(c => c.key === "paşa")?.items.some(i => i.value === insuranceSubType && i.label.toLowerCase().includes("kasko")) ||
    INSURANCE_COMPANIES.find(c => c.key === "xalq")?.items.some(i => i.value === insuranceSubType && i.label.toLowerCase().includes("kasko")) ||
    INSURANCE_COMPANIES.find(c => c.key === "meqa")?.items.some(i => i.value === insuranceSubType && i.label.toLowerCase().includes("kasko")) ||
    INSURANCE_COMPANIES.find(c => c.key === "qala")?.items.some(i => i.value === insuranceSubType && i.label.toLowerCase().includes("kasko")) ||
    ["ateşgah_agent_kasko", "ateşgah_kasko_bolgem", "ateşgah_al_paket", "isYaxinQonsu", "ateşgah_avto_plus", "ateşgah_avto_extra",
      "pasha_optimal_kasko", "pasha_parkinq_kasko", "xalq_mikro_kasko", "xalq_plyus_kasko",
      "meqa_mini_kasko", "qala_serikli_kasko", "qala_qaydali_kasko", "qala_100", "qala_emin", "qala_intizamli", "qala_elite"].includes(insuranceSubType);

  const showFormSection = insuranceSubType !== "";


  

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/policies"><Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-slate-900">Yeni Sığorta</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Sığorta növləri Card ── */}
        <Card>
          <CardHeader><CardTitle>Sığorta növləri və məhsulları</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2" ref={tabsRef}>
              {(["icbari", "könüllü", "məhsul"] as InsuranceGroup[]).map(g => (
                <div key={g} className="relative">
                  <div
                    onClick={() => setOpenTab(openTab === g ? null : g)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-1 select-none transition-colors cursor-pointer
                      ${insuranceGroup === g && insuranceSubType
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50"}`}
                  >
                    {INSURANCE_GROUPS[g].label}
                    <ChevronDown size={12} className={`opacity-50 transition-transform ${openTab === g ? "rotate-180" : ""}`} />
                  </div>

                  {openTab === g && g !== "məhsul" && (
                    <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                      {INSURANCE_GROUPS[g].items.map(item => (
                        <div
                          key={item.value}
                          onMouseDown={() => {
                            setInsuranceGroup(g);
                            setInsuranceSubType(item.value);
                            setInsuranceCompany("");
                            setDetails({});
                            setOpenTab(null);
                          }}
                          className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl
                            ${insuranceGroup === g && insuranceSubType === item.value ? "bg-blue-50 text-blue-700" : "text-gray-800"}`}
                        >
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}

                  {openTab === g && g === "məhsul" && (
                    <div
                      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                      style={{ width: 580, display: "flex" }}
                    >
                      {/* Left pane: company list */}
                      <div className="w-48 border-r border-gray-100 py-1 shrink-0">
                        {INSURANCE_COMPANIES.map(company => (
                          <div
                            key={company.key}
                            onMouseEnter={() => setHoveredCompany(company.key)}
                            className={`px-4 py-2.5 text-sm cursor-default flex items-center justify-between
                              ${hoveredCompany === company.key ? "bg-blue-50 text-blue-700" : "text-gray-800 hover:bg-gray-50"}`}
                          >
                            {company.label}
                            <ChevronDown size={12} className="-rotate-90 opacity-40" />
                          </div>
                        ))}
                      </div>
                      {/* Right pane: items for hovered company */}
                      <div className="flex-1 py-1 overflow-y-auto max-h-72">
                        {(INSURANCE_COMPANIES.find(c => c.key === hoveredCompany) ?? INSURANCE_COMPANIES[0]).items.map(item => (
                          <div
                            key={item.value}
                            onMouseDown={() => {
                              setInsuranceGroup("məhsul");
                              setInsuranceSubType(item.value);
                              const co = INSURANCE_COMPANIES.find(c => c.items.some(i => i.value === item.value));
                              setInsuranceCompany(co?.label ?? "");
                              setDetails({});
                              setOpenTab(null);
                            }}
                            className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50
                              ${insuranceSubType === item.value ? "bg-blue-50 text-blue-700" : "text-gray-800"}`}
                          >
                            {item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {insuranceSubType && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                <span className="shrink-0">✓</span>
                {insuranceGroup === "məhsul" && insuranceCompany && (
                  <span className="font-medium">{insuranceCompany} —</span>
                )}
                <span>
                  {insuranceGroup === "məhsul"
                    ? INSURANCE_COMPANIES.flatMap(c => c.items).find(i => i.value === insuranceSubType)?.label
                    : INSURANCE_GROUPS[insuranceGroup as "icbari" | "könüllü"].items.find(i => i.value === insuranceSubType)?.label}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════════════════
            AVTONƏQLIYYAT — İcbari avtomobil sığortası
        ══════════════════════════════════════════════════════════════════════ */}
        {showFormSection && isAvtonəqliyyat && (
          <>
            <Card>
              <CardHeader><CardTitle>Avtomobil məlumatlarını daxil edin</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dövlət qeydiyyat nişanı *</Label>
                  <Input
                    value={details.plate || ""}
                    onChange={e => setDetail("plate", e.target.value.toUpperCase())}
                    placeholder="90AA001"
                    required
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qeydiyyat şəhadətnaməsi nömrəsi *</Label>
                  <Input
                    value={details.reg_cert_no || ""}
                    onChange={e => setDetail("reg_cert_no", e.target.value.toUpperCase())}
                    placeholder="AA000000"
                    required
                    className="uppercase"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Şəxsi məlumatlarınızı daxil edin</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <PersonalInfoFields
                  details={details}
                  setDetail={setDetail}
                  customerPhone={customerPhone}
                  setCustomerPhone={setCustomerPhone}
                  customerEmail={customerEmail}
                  setCustomerEmail={setCustomerEmail}
                />
                <div className="space-y-2">
                  <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    <span className="shrink-0 mt-0.5">⚠</span>
                    <span>FİN kodu və ya Ş/V nömrəsini daxil edərək mövcud müştərini axtara bilərsiniz. Məlumatlar avtomatik doldurulacaq.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" onClick={handleFinSearch} disabled={searchLoading}
                      className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400">
                      {searchLoading ? "Axtarılır..." : "Axtar"}
                    </Button>
                    {searchMsg && (
                      <span className={`text-sm ${searchMsg.includes("tapıldı") && !searchMsg.includes("tapılmadı") ? "text-green-600" : "text-red-500"}`}>
                        {searchMsg}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Sığorta şirkətləri</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {INSURANCE_COMPANIES.map(co => (
                    <button
                      key={co.key}
                      type="button"
                      onClick={() => setDetail("selected_company", co.key)}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left
                        ${details.selected_company === co.key
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}
                    >
                      {co.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            DAŞINMAZ ƏMLAK
        ══════════════════════════════════════════════════════════════════════ */}
        {showFormSection && isDaşınmazEmlak && (
          <Card>
            <CardHeader><CardTitle>Şəxsi məlumatlarınızı daxil edin</CardTitle></CardHeader>
            <CardContent>
              <PersonalInfoFields
                details={details}
                setDetail={setDetail}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerEmail={customerEmail}
                setCustomerEmail={setCustomerEmail}
              />
            </CardContent>
          </Card>
        )}

        {isArxayinQonsu && (
          <div className="space-y-6">

            {/* ── 1. Polisin Əsas Məlumatları ── */}
            <Card>
              <CardHeader>
                <CardTitle>Polisin əsas məlumatları</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Şirkət Polisin nömrəsi</Label>
                  <Input
                    value={details.company_policy_no || ""}
                    onChange={e => setDetail("company_policy_no", e.target.value)}
                    placeholder="Şirkət nömrəsi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sistem Polisin nömrəsi</Label>
                  <Input
                    value={details.system_policy_no || ""}
                    onChange={e => setDetail("system_policy_no", e.target.value)}
                    placeholder="Sistem nömrəsi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Polisin statusu</Label>
                  <SearchableSelect
                    label=""
                    value={details.policy_status || ""}
                    onChange={v => setDetail("policy_status", v)}
                    options={["Aktiv", "Gözləmədə", "Ləğv olunub"]}
                    placeholder="Status seçin"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hazırlanma tarixi</Label>
                  <Input
                    type="date"
                    value={details.issue_date || ""}
                    onChange={e => setDetail("issue_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sığorta müddəti</Label>
                  <Input value="1 il" disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Başlanma tarixi</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bitmə tarixi</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── 2. Əmlak Haqqında Məlumat ── */}
            <Card>
              <CardHeader>
                <CardTitle>Əmlak haqqında məlumat</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Reyestr nömrəsi</Label>
                  <Input
                    value={details.property_register_no || ""}
                    onChange={e => setDetail("property_register_no", e.target.value)}
                    placeholder="Reyestr nömrəsi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qeydiyyat nömrəsi</Label>
                  <Input
                    value={details.property_registration_no || ""}
                    onChange={e => setDetail("property_registration_no", e.target.value)}
                    placeholder="Qeydiyyat nömrəsi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Digər sənəd</Label>
                  <Input
                    value={details.other_document || ""}
                    onChange={e => setDetail("other_document", e.target.value)}
                    placeholder="Digər sənəd məlumatları"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Çıxarışın Seriyası və nömrəsi</Label>
                  <Input
                    value={details.kupcha_no || ""}
                    onChange={e => setDetail("kupcha_no", e.target.value.toUpperCase())}
                    placeholder="AA000000"
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Əmlakın növü</Label>
                  <SearchableSelect
                    label=""
                    value={details.property_type || ""}
                    onChange={v => setDetail("property_type", v)}
                    options={["Mənzil", "Həyət evi / Villa", "Qeyri-yaşayış sahəsi"]}
                    placeholder="Növünü seçin"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ümumi sahə (m²)</Label>
                  <Input
                    type="number"
                    value={details.total_area || ""}
                    onChange={e => setDetail("total_area", e.target.value)}
                    placeholder="Məs: 75"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bazar qiyməti (AZN)</Label>
                  <Input
                    type="number"
                    value={details.market_value || ""}
                    onChange={e => setDetail("market_value", e.target.value)}
                    placeholder="Bazar qiyməti"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ölkə</Label>
                  <Input value="Azərbaycan" disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Poçt indeksi</Label>
                  <Input
                    value={details.property_zip_code || ""}
                    onChange={e => setDetail("property_zip_code", e.target.value)}
                    placeholder="AZ1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bölgə (Şəhər)</Label>
                  <Input
                    value={details.property_region || ""}
                    onChange={e => setDetail("property_region", e.target.value)}
                    placeholder="Bakı, Gəncə və s."
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label>Tam ünvan</Label>
                  <Input
                    value={details.property_full_address || ""}
                    onChange={e => setDetail("property_full_address", e.target.value)}
                    placeholder="Küçə, ev, mənzil məlumatları"
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── 3. Sığortalı (Müştəri Məlumatları) ── */}
            <Card>
              <CardHeader>
                <CardTitle>Sığortalı</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Ş/V Fin kodu *
                      <InfoTooltip imageSrc="https://www.kapitalbank.az/assets/static/img/fin_code_old_version.png" alt="FİN kodu nümunəsi" />
                    </Label>
                    <Input
                      value={details.fin || ""}
                      onChange={e => setDetail("fin", e.target.value.toUpperCase())}
                      placeholder="XXXXXXX"
                      className="uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Ş/V nömrəsi *
                      <InfoTooltip imageSrc="https://tehsil.socar.az/img/nomresi.png" alt="Şəxsiyyət vəsiqəsi nömrəsi" />
                    </Label>
                    <Input
                      value={details.id_card_no || ""}
                      onChange={e => setDetail("id_card_no", e.target.value.toUpperCase())}
                      placeholder="AAXXXXXXXX"
                      className="uppercase"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleFinSearch}
                    disabled={searchLoading}
                    className="w-full"
                  >
                    {searchLoading ? "Axtarılır..." : "Axtar"}
                  </Button>
                </div>

                {searchMsg && <p className="text-sm text-blue-600 font-medium">{searchMsg}</p>}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Adı *</Label>
                    <Input value={customerName} onChange={e => setCustomerName(e.target.value)} required placeholder="Ad" />
                  </div>
                  <div className="space-y-2">
                    <Label>Soyadı *</Label>
                    <Input
                      value={details.customer_surname || ""}
                      onChange={e => setDetail("customer_surname", e.target.value)}
                      required
                      placeholder="Soyad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Atasının adı</Label>
                    <Input
                      value={details.customer_patronymic || ""}
                      onChange={e => setDetail("customer_patronymic", e.target.value)}
                      placeholder="Atasının adı"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Şəxsin növü</Label>
                    <SearchableSelect
                      label=""
                      value={details.customer_type || "Fiziki şəxs"}
                      onChange={v => setDetail("customer_type", v)}
                      options={["Fiziki şəxs", "Hüquqi şəxs"]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Doğum tarixi</Label>
                    <Input
                      type="date"
                      value={details.birth_date || ""}
                      onChange={e => setDetail("birth_date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cinsi</Label>
                    <SearchableSelect
                      label=""
                      value={details.gender || ""}
                      onChange={v => setDetail("gender", v)}
                      options={["Kişi", "Qadın"]}
                      placeholder="Seçin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ölkə</Label>
                    <Input value="Azərbaycan" disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bölgə (Şəhər)</Label>
                    <Input
                      value={details.customer_region || ""}
                      onChange={e => setDetail("customer_region", e.target.value)}
                      placeholder="Bakı"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Poçt indeksi</Label>
                    <Input
                      value={details.customer_zip_code || "AZ1000"}
                      onChange={e => setDetail("customer_zip_code", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ünvan</Label>
                    <Input
                      value={details.customer_address || ""}
                      onChange={e => setDetail("customer_address", e.target.value)}
                      placeholder="Qeydiyyat ünvanı"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobil nömrə *</Label>
                    <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required placeholder="+994" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="example@mail.com" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── 4. Məbləğlər (Risk paketi tənzimlənməsi ilə) ── */}
            <Card>
              <CardHeader>
                <CardTitle>Məbləğlər</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Risk məbləği (Sığorta məbləği / Franşiza / Sığorta haqqı)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: "5,000 / 100 / 15 AZN", sub: 5000, prem: 15 },
                      { label: "10,000 / 100 / 29 AZN", sub: 10000, prem: 29 },
                      { label: "15,000 / 100 / 43 AZN", sub: 15000, prem: 43 },
                      { label: "20,000 / 100 / 57 AZN", sub: 20000, prem: 57 },
                    ].map(p => (
                      <Button
                        key={p.sub}
                        type="button"
                        variant={details.insurance_amount === p.sub ? "default" : "outline"}
                        className="text-xs p-2 h-auto flex flex-col gap-1"
                        onClick={() => {
                          setDetail("insurance_amount", p.sub);
                          setDetail("insurance_premium", p.prem);
                          setDetail("final_premium", p.prem);
                        }}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block">Sığorta məbləği</span>
                    <span className="text-lg font-bold text-slate-800">{formatCurrency(details.insurance_amount || 0)} AZN</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block">Franşiza</span>
                    <span className="text-lg font-bold text-slate-800">{details.insurance_amount ? "100 AZN" : "0 AZN"}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block">Sığorta haqqı</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(details.insurance_premium || 0)} AZN</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Vasitəçilik endirimi %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={details.discount_percent || "0.00"}
                      onChange={e => {
                        const pct = parseFloat(e.target.value) || 0;
                        setDetail("discount_percent", e.target.value);
                        const prem = details.insurance_premium || 0;
                        setDetail("final_premium", Math.max(0, prem - (prem * pct) / 100));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Yekun sığorta haqqı</Label>
                    <Input value={`${details.final_premium || 0} AZN`} disabled className="bg-muted font-semibold text-primary" />
                  </div>
                </div>

                {/* Komissiya Hesablamaları */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-dashed">
                  <div className="space-y-2">
                    <Label>Hesablanmış komissiya %</Label>
                    <Input
                      type="number"
                      value={details.calculated_commission_percent || ""}
                      onChange={e => setDetail("calculated_commission_percent", e.target.value)}
                      placeholder="%"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Komissiya %</Label>
                    <Input
                      type="number"
                      value={details.commission_percent || ""}
                      onChange={e => {
                        const pct = parseFloat(e.target.value) || 0;
                        setDetail("commission_percent", e.target.value);
                        const finPrem = details.final_premium || 0;
                        setDetail("commission_amount", ((finPrem * pct) / 100).toFixed(2));
                      }}
                      placeholder="%"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Komissiya (AZN)</Label>
                    <Input value={`${details.commission_amount || 0} AZN`} disabled className="bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── 5. Vasitəçilər Haqqında Məlumat ── */}
            <Card>
              <CardHeader>
                <CardTitle>Vasitəçilər haqqında məlumat</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sığorta şirkəti</Label>
                  <Input value="Atəşgah Sığorta" disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Vasitəçi tipi</Label>
                  <Input value="Rəsmi Lisenziyalı Agent və ya Broker" disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Satış Kanalı və ya filial</Label>
                  <Input
                    value={details.sales_channel || ""}
                    onChange={e => setDetail("sales_channel", e.target.value)}
                    placeholder="Filial və ya kanal adı"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kurator (Menecer)</Label>
                  <Input
                    value={details.curator_name || ""}
                    onChange={e => setDetail("curator_name", e.target.value)}
                    placeholder="Soyadı, Adı"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Subagent</Label>
                  <Input
                    value={details.subagent_name || ""}
                    onChange={e => setDetail("subagent_name", e.target.value)}
                    placeholder="Soyadı, Adı"
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── 6. Qeydlər və Şərtlər ── */}
            <Card>
              <CardHeader>
                <CardTitle>Qeydlər</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Əlavə qeydləriniz..."
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />

                <div className="flex items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    checked={!!details.terms_accepted}
                    onChange={e => setDetail("terms_accepted", e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="terms" className="text-xs text-muted-foreground leading-normal cursor-pointer select-none">
                    Sığorta qaydaları ilə razıyam və daxil etdiyim məlumatların doğruluğunu təsdiqləyirəm. *
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* ── Əməliyyat Düymələri ── */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setDetails({}); setNotes(""); setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); }}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Təmizlə
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setDetail("action_type", "save")}
              >
                Yadda saxla
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => setDetail("action_type", "issue")}
              >
                Polisi burax
              </Button>
            </div>

          </div>
        )}
        {isPashaYaxinQonsu && (
  <div className="space-y-6">

    {/* ── 1. Polisin Əsas Məlumatları ── */}
    <Card>
      <CardHeader>
        <CardTitle>Polisin əsas məlumatları</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Şirkət Polisin nömrəsi</Label>
          <Input
            value={details.company_policy_no || ""}
            onChange={e => setDetail("company_policy_no", e.target.value)}
            placeholder="Şirkət nömrəsi"
          />
        </div>
        <div className="space-y-2">
          <Label>Sistem Polisin nömrəsi</Label>
          <Input
            value={details.system_policy_no || ""}
            onChange={e => setDetail("system_policy_no", e.target.value)}
            placeholder="Sistem nömrəsi"
          />
        </div>
        <div className="space-y-2">
          <Label>Polisin statusu</Label>
          <SearchableSelect
            label=""
            value={details.policy_status || ""}
            onChange={v => setDetail("policy_status", v)}
            options={["Aktiv", "Gözləmədə", "Ləğv olunub"]}
            placeholder="Status seçin"
          />
        </div>
        <div className="space-y-2">
          <Label>Hazırlanma tarixi</Label>
          <Input
            type="date"
            value={details.issue_date || ""}
            onChange={e => setDetail("issue_date", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Sığorta müddəti</Label>
          <Input value="1 il" disabled className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label>Başlanma tarixi</Label>
          <Input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Bitmə tarixi</Label>
          <Input
            type="date"
            value={endDate}
            disabled
            className="bg-muted"
            required
          />
        </div>
      </CardContent>
    </Card>

    {/* ── 2. Əmlak Haqqında Məlumat ── */}
    <Card>
      <CardHeader>
        <CardTitle>Əmlak haqqında məlumat</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Reyestr nömrəsi</Label>
          <Input
            value={details.property_register_no || ""}
            onChange={e => setDetail("property_register_no", e.target.value)}
            placeholder="Reyestr nömrəsi"
          />
        </div>
        <div className="space-y-2">
          <Label>Qeydiyyat nömrəsi</Label>
          <Input
            value={details.property_registration_no || ""}
            onChange={e => setDetail("property_registration_no", e.target.value)}
            placeholder="Qeydiyyat nömrəsi"
          />
        </div>
        <div className="space-y-2 flex items-end">
          <Button type="button" className="w-full">
            Axtar
          </Button>
        </div>
        <div className="space-y-2">
          <Label>Digər sənəd</Label>
          <Input
            value={details.other_document || ""}
            onChange={e => setDetail("other_document", e.target.value)}
            placeholder="Digər sənəd məlumatları"
          />
        </div>
        <div className="space-y-2">
          <Label>Çıxarışın Seriyası və nömrəsi</Label>
          <Input
            value={details.kupcha_no || ""}
            onChange={e => setDetail("kupcha_no", e.target.value.toUpperCase())}
            placeholder="AA000000"
            className="uppercase"
          />
        </div>
        <div className="space-y-2">
          <Label>Əmlakın növü</Label>
          <Input
            value={details.property_type || ""}
            onChange={e => setDetail("property_type", e.target.value)}
            placeholder="Məs: Mənzil"
          />
        </div>
        <div className="space-y-2">
          <Label>Ümumi sahə (m²)</Label>
          <Input
            type="text"
            value={details.total_area || ""}
            onChange={e => setDetail("total_area", e.target.value)}
            placeholder="Məs: 75"
          />
        </div>
        <div className="space-y-2">
          <Label>Ölkə</Label>
          <Input value="Azərbaycan" disabled className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label>Poçt indeksi</Label>
          <Input
            value={details.property_zip_code || ""}
            onChange={e => setDetail("property_zip_code", e.target.value)}
            placeholder="AZ1000"
          />
        </div>
        <div className="space-y-2">
          <Label>Bölgə (Şəhər)</Label>
          <Input
            value={details.property_region || ""}
            onChange={e => setDetail("property_region", e.target.value)}
            placeholder="Bakı, Gəncə və s."
          />
        </div>
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label>Tam ünvan</Label>
          <Input
            value={details.property_full_address || ""}
            onChange={e => setDetail("property_full_address", e.target.value)}
            placeholder="Küçə, ev, mənzil məlumatları"
          />
        </div>
      </CardContent>
    </Card>

    {/* ── 3. Sığortalı (Müştəri Məlumatları) ── */}
    <Card>
      <CardHeader>
        <CardTitle>Sığortalı</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">Ş/V Fin kodu *</Label>
            <Input
              value={details.fin || ""}
              onChange={e => setDetail("fin", e.target.value.toUpperCase())}
              placeholder="XXXXXXX"
              className="uppercase"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">Ş/V nömrəsi *</Label>
            <Input
              value={details.id_card_no || ""}
              onChange={e => setDetail("id_card_no", e.target.value.toUpperCase())}
              placeholder="AAXXXXXXXX"
              className="uppercase"
              required
            />
          </div>
          <Button
            type="button"
            onClick={handleFinSearch}
            disabled={searchLoading}
            className="w-full"
          >
            {searchLoading ? "Axtarılır..." : "Axtar"}
          </Button>
        </div>

        {searchMsg && <p className="text-sm text-blue-600 font-medium">{searchMsg}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Soyadı *</Label>
            <Input
              value={details.customer_surname || ""}
              onChange={e => setDetail("customer_surname", e.target.value)}
              required
              placeholder="Soyad"
            />
          </div>
          <div className="space-y-2">
            <Label>Adı *</Label>
            <Input 
              value={customerName} 
              onChange={e => setCustomerName(e.target.value)} 
              required 
              placeholder="Ad" 
            />
          </div>
          <div className="space-y-2">
            <Label>Atasının adı ( oğlu , qızı )</Label>
            <Input
              value={details.customer_patronymic || ""}
              onChange={e => setDetail("customer_patronymic", e.target.value)}
              placeholder="Atasının adı"
            />
          </div>
          <div className="space-y-2">
            <Label>Şəxsin növü</Label>
            <Input
              value={details.customer_type || ""}
              onChange={e => setDetail("customer_type", e.target.value)}
              placeholder="Fiziki şəxs"
            />
          </div>
          <div className="space-y-2">
            <Label>Doğum tarixi</Label>
            <Input
              type="date"
              value={details.birth_date || ""}
              onChange={e => setDetail("birth_date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Cinsi</Label>
            <Input
              value={details.gender || ""}
              onChange={e => setDetail("gender", e.target.value)}
              placeholder="Kişi / Qadın"
            />
          </div>
          <div className="space-y-2">
            <Label>Ölkə</Label>
            <Input value="Azərbaycan" disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Bölgə (Şəhər)</Label>
            <Input
              value={details.customer_region || ""}
              onChange={e => setDetail("customer_region", e.target.value)}
              placeholder="Bakı"
            />
          </div>
          <div className="space-y-2">
            <Label>Poçt indeksi</Label>
            <Input
              value={details.customer_zip_code || "AZ1000"}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>Ünvan</Label>
            <Input
              value={details.customer_address || ""}
              onChange={e => setDetail("customer_address", e.target.value)}
              placeholder="Qeydiyyat ünvanı"
            />
          </div>
          <div className="space-y-2">
            <Label>Mobil nömrə *</Label>
            <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required placeholder="+994" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="example@mail.com" />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* ── 4. Məbləğlər (Yaxın Qonşu limitləri: 5000 və 10000) ── */}
    <Card>
      <CardHeader>
        <CardTitle>Məbləğlər</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Paket seçimi (Sığorta məbləği / Franşiza / İllik sığorta haqqı)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "5,000 AZN / Azadolma: 100 AZN / Sığorta haqqı: 15 AZN", sub: 5000, prem: 15 },
              { label: "10,000 AZN / Azadolma: 100 AZN / Sığorta haqqı: 25 AZN", sub: 10000, prem: 25 },
            ].map(p => (
              <Button
                key={p.sub}
                type="button"
                variant={details.insurance_amount === p.sub ? "default" : "outline"}
                className="text-xs p-3 h-auto flex flex-col gap-1 items-start text-left"
                onClick={() => {
                  setDetail("insurance_amount", p.sub);
                  setDetail("insurance_premium", p.prem);
                  setDetail("final_premium", p.prem);
                  setDetail("property_cover", ""); // Cədvəldə bu hissələr boş buraxılıb
                  setDetail("goods_cover", "");
                  setDetail("deductible", 100);
                }}
              >
                <span className="font-bold">{p.sub === 5000 ? "Paket A (5,000 AZN)" : "Paket B (10,000 AZN)"}</span>
                <span className="text-muted-foreground">{p.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Sığorta Riskləri Vizual Göstəricisi (Cədvəldəki yaşıl xanalara əsasən) */}
        {details.insurance_amount && (
          <div className="border rounded-lg overflow-hidden max-w-sm bg-white border-slate-200">
            <div className="bg-yellow-400 font-bold px-3 py-1.5 text-xs text-center uppercase text-slate-900">Sığorta riskləri</div>
            <div className="divide-y divide-slate-100 text-xs">
              {["Yanğın", "Sağlamlığa zərər", "Subasma", "Partlayış"].map((risk) => (
                <div key={risk} className="flex justify-between items-center px-4 py-2">
                  <span className="text-slate-700 font-medium">{risk}</span>
                  <div className="w-8 h-4 bg-[#70ad47] rounded-sm border border-slate-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block">Təminat məbləği</span>
            <span className="text-lg font-bold text-slate-800">{details.insurance_amount || 0} AZN</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block">Azadolma (Franşiza)</span>
            <span className="text-lg font-bold text-slate-800">{details.insurance_amount ? "100 AZN" : "0 AZN"}</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block">Sığorta haqqı (İllik)</span>
            <span className="text-lg font-bold text-primary">{details.insurance_premium || 0} AZN</span>
          </div>
        </div>

        {/* Komissiya və Yekun Hesablamalar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-dashed">
          <div className="space-y-2">
            <Label>Hesablanmış komissiya %</Label>
            <Input
              type="number"
              value={details.calculated_commission_percent || ""}
              onChange={e => setDetail("calculated_commission_percent", e.target.value)}
              placeholder="%"
            />
          </div>
          <div className="space-y-2">
            <Label>Komissiya %</Label>
            <Input
              type="number"
              value={details.commission_percent || ""}
              onChange={e => {
                const pct = parseFloat(e.target.value) || 0;
                setDetail("commission_percent", e.target.value);
                const finPrem = details.final_premium || 0;
                setDetail("commission_amount", ((finPrem * pct) / 100).toFixed(2));
              }}
              placeholder="%"
            />
          </div>
          <div className="space-y-2">
            <Label>Komissiya (AZN)</Label>
            <Input value={`${details.commission_amount || 0} AZN`} disabled className="bg-muted" />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* ── 5. Vasitəçilər Haqqında Məlumat ── */}
    <Card>
      <CardHeader>
        <CardTitle>Vasitəçilər haqqında məlumat</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sığorta şirkəti</Label>
          <Input value="Paşa Sığorta" disabled className="bg-muted font-bold text-slate-900" />
        </div>
        <div className="space-y-2">
          <Label>Vasitəçi tipi</Label>
          <Input value="Rəsmi Lisenziyalı Agent və ya Broker" disabled className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label>Satış Kanalı və ya filial</Label>
          <Input
            value={details.sales_channel || ""}
            onChange={e => setDetail("sales_channel", e.target.value)}
            placeholder="Filial və ya kanal adı"
          />
        </div>
        <div className="space-y-2">
          <Label>Ukrator: Menecer (Soyadı, Adı)</Label>
          <Input
            value={details.curator_name || ""}
            onChange={e => setDetail("curator_name", e.target.value)}
            placeholder="Soyadı, Adı"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Subagent (Soyadı, Adı)</Label>
          <Input
            value={details.subagent_name || ""}
            onChange={e => setDetail("subagent_name", e.target.value)}
            placeholder="Soyadı, Adı"
          />
        </div>
      </CardContent>
    </Card>

    {/* ── 6. Qeydlər və Şərtlər ── */}
    <Card>
      <CardHeader>
        <CardTitle>Qeydlər və Vacib Bildirişlər</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-1 font-medium">
          <p>⚠️ Ev qeyd edilən şəxsə məxsus olmazsa, sığorta ödənişi edilməyəcək.</p>
          <p>⚠️ Qonşunun sağlamlığına dəyən zərər zamanı həmin evdə qeydiyyat tələbi yoxlanılmalıdır.</p>
        </div>

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Əlavə qeydləriniz..."
          className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />

        <div className="flex items-start gap-2 pt-2">
          <input
            type="checkbox"
            id="terms"
            required
            checked={!!details.terms_accepted}
            onChange={e => setDetail("terms_accepted", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="terms" className="text-xs text-muted-foreground leading-normal cursor-pointer select-none">
            Sığorta qaydaları ilə razıyam və daxil etdiyim məlumatların doğruluğunu təsdiqləyirəm. *
          </Label>
        </div>
      </CardContent>
    </Card>

    {/* ── Əməliyyat Düymələri ── */}
    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => { setDetails({}); setNotes(""); setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); }}
        className="border-red-200 text-red-600 hover:bg-red-50"
      >
        Təmizlə
      </Button>
      <Button
        type="submit"
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={() => setDetail("action_type", "save")}
      >
        Yadda saxla
      </Button>
      <Button
        type="submit"
        disabled={loading || !details.terms_accepted}
        className="bg-primary hover:bg-primary/90 text-white"
        onClick={() => setDetail("action_type", "issue")}
      >
        Polisi burax
      </Button>
    </div>

  </div>
)}
        

        {isKaskoBolgem && (
          <div className="space-y-6">

            {/* ── 1. Polisin Əsas Məlumatları ── */}
            <Card>
              <CardHeader>
                <CardTitle>Polisin əsas məlumatları</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Şirkət Polisin nömrəsi</Label>
                  <Input
                    value={details.company_policy_no || ""}
                    onChange={e => setDetail("company_policy_no", e.target.value)}
                    placeholder="Şirkət nömrəsi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sistem Polisin nömrəsi</Label>
                  <Input
                    value={details.system_policy_no || ""}
                    onChange={e => setDetail("system_policy_no", e.target.value)}
                    placeholder="Sistem nömrəsi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Polisin statusu</Label>
                  <SearchableSelect
                    label=""
                    value={details.policy_status || ""}
                    onChange={v => setDetail("policy_status", v)}
                    options={["Aktiv", "Gözləmədə", "Ləğv olunub"]}
                    placeholder="Status seçin"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hazırlanma tarixi</Label>
                  <Input
                    type="date"
                    value={details.issue_date || ""}
                    onChange={e => setDetail("issue_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sığorta müddəti</Label>
                  <Input value="1 il" disabled className="bg-muted" />
                </div>
                <div className="space-y-2 md:col-start-1">
                  <Label>Başlanma tarixi :</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bitmə tarixi:</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── 2. Avtomobil Haqqında Məlumat ── */}
            <Card>
              <CardHeader>
                <CardTitle>Avtomobil haqqında məlumat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Dövlət qeydiyyat nişanı *</Label>
                    <Input
                      value={details.plate_number || ""}
                      onChange={e => setDetail("plate_number", e.target.value.toUpperCase())}
                      placeholder="10-XX-000"
                      className="uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Qeydiyyat şəhadətnaməsi nömrəsi *</Label>
                    <Input
                      value={details.registration_certificate_no || ""}
                      onChange={e => setDetail("registration_certificate_no", e.target.value.toUpperCase())}
                      placeholder="AA000000"
                      className="uppercase"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => {/* Avtomobil axtarış funksiyası */ }}
                    className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300"
                  >
                    Axtar
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <BrandModelSelect
                    brand={details.car_brand || ""}
                    model={details.car_model || ""}
                    onBrandChange={v => setDetail("car_brand", v)}
                    onModelChange={v => setDetail("car_model", v)}
                  />
                  <div className="space-y-2">
                    <Label>Avtomobilin növü:</Label>
                    <SearchableSelect
                      label=""
                      value={details.car_type || ""}
                      onChange={v => setDetail("car_type", v)}
                      options={["Minik", "Yük", "Avtobus", "Mikroavtobus"]}
                      placeholder="Seçin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ban nömrəsi</Label>
                    <Input
                      value={details.body_no || ""}
                      onChange={e => setDetail("body_no", e.target.value.toUpperCase())}
                      placeholder="Ban nömrəsi"
                      className="uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Şassi nömrəsi</Label>
                    <Input
                      value={details.vin_code || ""}
                      onChange={e => setDetail("vin_code", e.target.value.toUpperCase())}
                      placeholder="17 rəqəmli VIN"
                      className="uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mühərrik nömrəsi:</Label>
                    <Input
                      value={details.engine_no || ""}
                      onChange={e => setDetail("engine_no", e.target.value.toUpperCase())}
                      placeholder="Mühərrik nömrəsi"
                      className="uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Qeydiyyat ərazisi:</Label>
                    <Input value="Azərbaycan" disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>İstehsal ili</Label>
                    <Input
                      type="number"
                      value={details.production_year || ""}
                      onChange={e => setDetail("production_year", e.target.value)}
                      placeholder="Məs: 2020"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mühərrik həcmi:</Label>
                    <Input
                      type="number"
                      value={details.engine_volume || "2000"}
                      onChange={e => setDetail("engine_volume", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bazar qiyməti:</Label>
                    <Input
                      type="number"
                      value={details.market_value || ""}
                      onChange={e => setDetail("market_value", e.target.value)}
                      placeholder="AZN"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Avtomobilin submodeli</Label>
                    <Input
                      value={details.car_submodel || ""}
                      onChange={e => setDetail("car_submodel", e.target.value)}
                      placeholder="Submodel variantı"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-1 space-y-2">
                    <Label>Baxışın tarixi və vaxtı</Label>
                    <Input
                      type="datetime-local"
                      value={details.inspection_datetime || ""}
                      onChange={e => setDetail("inspection_datetime", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ekspert</Label>
                    <Input
                      value={details.expert_name || ""}
                      onChange={e => setDetail("expert_name", e.target.value)}
                      placeholder="Ekspertin adı"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── 3. Sığortalı (Müştəri) ── */}
            <Card>
              <CardHeader>
                <CardTitle>Sığortalı</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">Ş/V Fin kodu *</Label>
                    <Input
                      value={details.fin || ""}
                      onChange={e => setDetail("fin", e.target.value.toUpperCase())}
                      placeholder="XXXXXXX"
                      className="uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">Ş/V nömrəsi *</Label>
                    <Input
                      value={details.id_card_no || ""}
                      onChange={e => setDetail("id_card_no", e.target.value.toUpperCase())}
                      placeholder="AAXXXXXXXX"
                      className="uppercase"
                      required
                    />
                  </div>
                  <Button type="button" onClick={handleFinSearch} className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300">
                    Axtar
                  </Button>
                </div>

                {searchMsg && <p className="text-sm text-blue-600 font-medium">{searchMsg}</p>}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Soyadı</Label>
                    <Input value={details.customer_surname || ""} onChange={e => setDetail("customer_surname", e.target.value)} placeholder="Soyad" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ad</Label>
                    <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ad" />
                  </div>
                  <div className="space-y-2">
                    <Label>Atasının adı ( oğlu , qızı )</Label>
                    <Input value={details.customer_patronymic || ""} onChange={e => setDetail("customer_patronymic", e.target.value)} placeholder="Ata adı" />
                  </div>
                  <div className="space-y-2">
                    <Label>Şəxsin növü</Label>
                    <SearchableSelect
                      label=""
                      value={details.customer_type || "Fiziki şəxs"}
                      onChange={v => setDetail("customer_type", v)}
                      options={["Fiziki şəxs", "Hüquqi şəxs"]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Doğum tarixi:</Label>
                    <Input type="date" value={details.birth_date || ""} onChange={e => setDetail("birth_date", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cinsi</Label>
                    <SearchableSelect label="" value={details.gender || ""} onChange={v => setDetail("gender", v)} options={["Kişi", "Qadın"]} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ölka:</Label>
                    <Input value="Azərbaycan" disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bölga ( Şəhər ):</Label>
                    <Input value={details.customer_region || ""} onChange={e => setDetail("customer_region", e.target.value)} placeholder="Şəhər" />
                  </div>
                  <div className="space-y-2">
                    <Label>Poçt indeksi:</Label>
                    <Input value={details.customer_zip_code || "AZ1000"} onChange={e => setDetail("customer_zip_code", e.target.value)} />
                  </div>
                  <div className="col-span-1 md:col-span-1 space-y-2">
                    <Label>Ünvan:</Label>
                    <Input value={details.customer_address || ""} onChange={e => setDetail("customer_address", e.target.value)} placeholder="Tam ünvan" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobil nömrə *</Label>
                    <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required placeholder="+994" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email:</Label>
                    <Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="mail@example.com" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── 4. Məbləğlər (Kasko Bölgəm Paketləri) ── */}
            <Card>
              <CardHeader>
                <CardTitle>Məbləğlər</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Risk məbləği seçimi (Sığorta məbləği / Franşiza / Sığorta haqqı)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { label: "2500 / 100 / 189 AZN", sub: 2500, ded: 100, prem: 189 },
                      { label: "5000 / 100 / 257 AZN", sub: 5000, ded: 100, prem: 257 },
                      { label: "10000 / 200 / 326 AZN", sub: 10000, ded: 200, prem: 326 },
                    ].map(p => (
                      <Button
                        key={p.sub}
                        type="button"
                        variant={details.insurance_amount === p.sub ? "default" : "outline"}
                        className="text-xs p-3 h-auto flex flex-col gap-1 border-slate-300"
                        onClick={() => {
                          setDetail("insurance_amount", p.sub);
                          setDetail("deductible", p.ded);
                          setDetail("insurance_premium", p.prem);
                          setDetail("final_premium", p.prem);
                        }}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block">Sığorta məbləği:</span>
                    <span className="text-base font-bold text-slate-800">{details.insurance_amount || 2500} AZN</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block">Franşiza :</span>
                    <span className="text-base font-bold text-slate-800">{details.deductible || 100} AZN</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block">Sığorta haqqı:</span>
                    <span className="text-base font-bold text-primary">{details.insurance_premium || 189} AZN</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Vasitəçilik endirimi %:</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={details.discount_percent || "0,00"}
                      onChange={e => {
                        const pct = parseFloat(e.target.value.replace(",", ".")) || 0;
                        setDetail("discount_percent", e.target.value);
                        const prem = details.insurance_premium || 189;
                        setDetail("final_premium", (prem - (prem * pct) / 100).toFixed(2));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Yekun sığorta haqqı:</Label>
                    <Input value={`${details.final_premium || 189} AZN`} disabled className="bg-muted font-semibold text-primary" />
                  </div>
                </div>

                {/* Komissiya Seşimi */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-dashed">
                  <div className="space-y-2">
                    <Label>Hesablanmış komissiya % :</Label>
                    <Input type="number" value={details.calculated_commission_percent || "15"} onChange={e => setDetail("calculated_commission_percent", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Komissiya % :</Label>
                    <Input
                      type="number"
                      value={details.commission_percent || "0,00"}
                      onChange={e => {
                        const pct = parseFloat(e.target.value.replace(",", ".")) || 0;
                        setDetail("commission_percent", e.target.value);
                        const finPrem = details.final_premium || 189;
                        setDetail("commission_amount", ((finPrem * pct) / 100).toFixed(2));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Komissiya ( azn ) :</Label>
                    <Input value={`${details.commission_amount || "0,00"} AZN`} disabled className="bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── 5. Qeydlər və Şərtlər ── */}
            <Card>
              <CardHeader>
                <CardTitle>Qeydlər</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    checked={!!details.terms_accepted}
                    onChange={e => setDetail("terms_accepted", e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="terms" className="text-xs text-muted-foreground leading-normal cursor-pointer select-none">
                    Sığorta qaydaları ilə razıyam və daxil etdiyim məlumatların doğruluğunu təsdiqləyirəm.
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* ── Alt Düymələr Paneli ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                onClick={() => setDetail("action_type", "issue_policy")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Polisi burax
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => {/* Al paketi tətbiqi məntiqi */ }}
                  className="bg-slate-500 hover:bg-slate-600 text-white font-medium"
                >
                  Al paketi tətbiq et
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setDetails({}); setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); }}
                  className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Təmizlə
                </Button>
              </div>
            </div>

          </div>
        )}
        {isPashaYuvam && (
  <div className="space-y-6">

    {/* ── 1. Polisin Əsas Məlumatları ── */}
    <Card>
      <CardHeader>
        <CardTitle>Polisin əsas məlumatları</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Şirkət Polisin nömrəsi</Label>
          <Input
            value={details.company_policy_no || ""}
            onChange={e => setDetail("company_policy_no", e.target.value)}
            placeholder="Şirkət nömrəsi"
          />
        </div>
        <div className="space-y-2">
          <Label>Sistem Polisin nömrəsi</Label>
          <Input
            value={details.system_policy_no || ""}
            onChange={e => setDetail("system_policy_no", e.target.value)}
            placeholder="Sistem nömrəsi"
          />
        </div>
        <div className="space-y-2">
          <Label>Polisin statusu</Label>
          <SearchableSelect
            label=""
            value={details.policy_status || ""}
            onChange={v => setDetail("policy_status", v)}
            options={["Aktiv", "Gözləmədə", "Ləğv olunub"]}
            placeholder="Status seçin"
          />
        </div>
        <div className="space-y-2">
          <Label>Hazırlanma tarixi</Label>
          <Input
            type="date"
            value={details.issue_date || ""}
            onChange={e => setDetail("issue_date", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Sığorta müddəti</Label>
          <Input value="1 il" disabled className="bg-muted" />
        </div>
        <div className="space-y-2 md:col-start-1">
          <Label>Başlanma tarixi :</Label>
          <Input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Bitmə tarixi:</Label>
          <Input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            required
          />
        </div>
      </CardContent>
    </Card>

    {/* ── 2. Əmlak Haqqında Məlumat ── */}
    <Card>
      <CardHeader>
        <CardTitle>Əmlak haqqında məlumat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label>Reyestr nömrəsi</Label>
            <Input
              value={details.registry_no || ""}
              onChange={e => setDetail("registry_no", e.target.value)}
              placeholder="Reyestr nömrəsi"
            />
          </div>
          <div className="space-y-2">
            <Label>Qeydiyyat nömrəsi</Label>
            <Input
              value={details.registration_no || ""}
              onChange={e => setDetail("registration_no", e.target.value)}
              placeholder="Qeydiyyat nömrəsi"
            />
          </div>
          <Button
            type="button"
            onClick={() => {/* Əmlak axtarış funksiyası */ }}
            className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300"
          >
            Axtar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Çıxarışın Seriya və nömrəsi</Label>
            <Input
              value={details.extract_serial_no || ""}
              onChange={e => setDetail("extract_serial_no", e.target.value.toUpperCase())}
              placeholder="Seriya və nömrə"
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label>Əmlakin növü</Label>
            <SearchableSelect
              label=""
              value={details.property_type || ""}
              onChange={v => setDetail("property_type", v)}
              options={["Mənzil", "Həyət evi", "Qeyri-yaşayış"]}
              placeholder="Seçin"
            />
          </div>
          <div className="space-y-2">
            <Label>Ümumi sahə (m²)</Label>
            <Input
              type="number"
              value={details.total_area || ""}
              onChange={e => setDetail("total_area", e.target.value)}
              placeholder="m²"
            />
          </div>
          <div className="space-y-2">
            <Label>Ölkə</Label>
            <Input value="Azərbaycan" disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Bölgə (Şəhər)</Label>
            <Input
              value={details.property_region || ""}
              onChange={e => setDetail("property_region", e.target.value)}
              placeholder="Məs: Bakı"
            />
          </div>
          <div className="space-y-2">
            <Label>Poçt indeksi</Label>
            <Input
              value={details.property_zip_code || ""}
              onChange={e => setDetail("property_zip_code", e.target.value)}
              placeholder="Poçt indeksi"
            />
          </div>
          <div className="col-span-1 md:col-span-3 space-y-2">
            <Label>Tam ünvan</Label>
            <Input
              value={details.property_full_address || ""}
              onChange={e => setDetail("property_full_address", e.target.value)}
              placeholder="Küçə, ev, mənzil məlumatları"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* ── 3. Sığortalı (Müştəri) ── */}
    <Card>
      <CardHeader>
        <CardTitle>Sığortalı</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">Ş/V Fin kodu *</Label>
            <Input
              value={details.fin || ""}
              onChange={e => setDetail("fin", e.target.value.toUpperCase())}
              placeholder="XXXXXXX"
              className="uppercase"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">Ş/V nömrəsi *</Label>
            <Input
              value={details.id_card_no || ""}
              onChange={e => setDetail("id_card_no", e.target.value.toUpperCase())}
              placeholder="AAXXXXXXXX"
              className="uppercase"
              required
            />
          </div>
          <Button type="button" onClick={handleFinSearch} className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300">
            Axtar
          </Button>
        </div>

        {searchMsg && <p className="text-sm text-blue-600 font-medium">{searchMsg}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Soyadı</Label>
            <Input value={details.customer_surname || ""} onChange={e => setDetail("customer_surname", e.target.value)} placeholder="Soyad" />
          </div>
          <div className="space-y-2">
            <Label>Ad</Label>
            <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ad" />
          </div>
          <div className="space-y-2">
            <Label>Atasının adı ( oğlu , qızı )</Label>
            <Input value={details.customer_patronymic || ""} onChange={e => setDetail("customer_patronymic", e.target.value)} placeholder="Ata adı" />
          </div>
          <div className="space-y-2">
            <Label>Şəxsin növü</Label>
            <SearchableSelect
              label=""
              value={details.customer_type || "Fiziki şəxs"}
              onChange={v => setDetail("customer_type", v)}
              options={["Fiziki şəxs", "Hüquqi şəxs"]}
            />
          </div>
          <div className="space-y-2">
            <Label>Doğum tarixi:</Label>
            <Input type="date" value={details.birth_date || ""} onChange={e => setDetail("birth_date", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cinsi</Label>
            <SearchableSelect label="" value={details.gender || ""} onChange={v => setDetail("gender", v)} options={["Kişi", "Qadın"]} />
          </div>
          <div className="space-y-2">
            <Label>Ölkə:</Label>
            <Input value="Azərbaycan" disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Bölgə ( Şəhər ):</Label>
            <Input value={details.customer_region || ""} onChange={e => setDetail("customer_region", e.target.value)} placeholder="Şəhər" />
          </div>
          <div className="space-y-2">
            <Label>Poçt indeksi:</Label>
            <Input value={details.customer_zip_code || "AZ1000"} onChange={e => setDetail("customer_zip_code", e.target.value)} />
          </div>
          <div className="col-span-1 md:col-span-1 space-y-2">
            <Label>Ünvan:</Label>
            <Input value={details.customer_address || ""} onChange={e => setDetail("customer_address", e.target.value)} placeholder="Tam ünvan" />
          </div>
          <div className="space-y-2">
            <Label>Mobil nömrə *</Label>
            <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required placeholder="+994" />
          </div>
          <div className="space-y-2">
            <Label>Email:</Label>
            <Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="mail@example.com" />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* ── 4. Məbləğlər və Paket Seçimi ── */}
    <Card>
      <CardHeader>
        <CardTitle>Məbləğlər</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="font-semibold block mb-3">Paket və Təminat məbləği seçimi:</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Üzərlik Paketi */}
            <Button
              type="button"
              variant={details.selected_package === "uzerlik" ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-start gap-1 text-left border-slate-300 w-full"
              onClick={() => {
                setDetail("selected_package", "uzerlik");
                setDetail("insurance_amount", 20000);
                setDetail("property_cover", 16000);
                setDetail("goods_cover", 0);
                setDetail("liability_cover", 4000);
                setDetail("monthly_premium", 4);
                setDetail("annual_premium", 40);
                setDetail("final_premium", 40);
              }}
            >
              <span className="font-bold text-base block">Üzərlik</span>
              <span className="text-xs text-muted-foreground mt-1">Təminat: 20 000 AZN</span>
              <span className="text-xs">Daşınmaz əmlak: 16 000 AZN</span>
              <span className="text-xs">Əşyalar: 0 AZN</span>
              <span className="text-xs">Məsuliyyət: 4 000 AZN</span>
              <span className="font-semibold text-xs text-primary mt-2">İllik: 40 AZN / Aylıq: 4 AZN</span>
            </Button>

            {/* Gözmuncuğu Paketi */}
            <div className="flex flex-col gap-2 border border-slate-200 p-2 rounded-xl bg-slate-50/50">
              <span className="font-bold text-sm px-2 text-slate-700">Gözmuncuğu Paketləri</span>
              {[
                { sub: 20000, prop: 25000, goods: 2500, liab: 2500, m: 4, y: 80 },
                { sub: 50000, prop: 40000, goods: 5000, liab: 5000, m: 12, y: 120 }
              ].map((p, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant={details.selected_package === `gozmuncugu_${p.sub}` ? "default" : "outline"}
                  className="h-auto p-2 text-xs flex flex-col items-start gap-0.5 border-slate-300 w-full"
                  onClick={() => {
                    setDetail("selected_package", `gozmuncugu_${p.sub}`);
                    setDetail("insurance_amount", p.sub);
                    setDetail("property_cover", p.prop);
                    setDetail("goods_cover", p.goods);
                    setDetail("liability_cover", p.liab);
                    setDetail("monthly_premium", p.m);
                    setDetail("annual_premium", p.y);
                    setDetail("final_premium", p.y);
                  }}
                >
                  <span className="font-semibold">Təminat: {p.sub.toLocaleString()} AZN</span>
                  <span className="text-[11px] opacity-80">İllik: {p.y} AZN / Aylıq: {p.m} AZN</span>
                </Button>
              ))}
            </div>

            {/* Nal Paketi */}
            <div className="flex flex-col gap-2 border border-slate-200 p-2 rounded-xl bg-slate-50/50">
              <span className="font-bold text-sm px-2 text-slate-700">Nal Paketləri</span>
              {[
                { sub: 50000, prop: 40000, goods: 5000, liab: 5000, m: 19, y: 190 },
                { sub: 100000, prop: 70000, goods: 10000, liab: 20000, m: 30, y: 300 },
                { sub: 200000, prop: 160000, goods: 15000, liab: 25000, m: 55, y: 550 }
              ].map((p, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant={details.selected_package === `nal_${p.sub}` ? "default" : "outline"}
                  className="h-auto p-2 text-xs flex flex-col items-start gap-0.5 border-slate-300 w-full"
                  onClick={() => {
                    setDetail("selected_package", `nal_${p.sub}`);
                    setDetail("insurance_amount", p.sub);
                    setDetail("property_cover", p.prop);
                    setDetail("goods_cover", p.goods);
                    setDetail("liability_cover", p.liab);
                    setDetail("monthly_premium", p.m);
                    setDetail("annual_premium", p.y);
                    setDetail("final_premium", p.y);
                  }}
                >
                  <span className="font-semibold">Təminat: {p.sub.toLocaleString()} AZN</span>
                  <span className="text-[11px] opacity-80">İllik: {p.y} AZN / Aylıq: {p.m} AZN</span>
                </Button>
              ))}
            </div>

          </div>
        </div>

        {/* Seçilmiş Paket Detalları */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
          <div>
            <span className="text-xs text-muted-foreground block">Daşınmaz əmlak üçün:</span>
            <span className="font-bold text-slate-800">{details.property_cover || 0} AZN</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Əşyalar üçün:</span>
            <span className="font-bold text-slate-800">{details.goods_cover || 0} AZN</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Məsuliyyət riskləri üçün:</span>
            <span className="font-bold text-slate-800">{details.liability_cover || 0} AZN</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Azadolma (Franşiza):</span>
            <span className="font-bold text-amber-600">0 AZN (Şərtə uyğun)</span>
          </div>
        </div>

        {/* Sığorta Riskləri İndikatoru */}
        <div className="space-y-2">
          <Label className="font-semibold text-xs uppercase tracking-wider text-slate-500">Sığorta Riskləri (Təminata daxildir)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-xs text-emerald-800">
            {["Tabii fəlakət", "Kənar şəxsə dəyən zərər", "Subasma", "Yanğın", "Qaz partlayışı", "Kənar şəxsin vurduğu zərər", "Oğurluq", "Yararsız hala düşmə", "Təsadüfi zərərlər"].map((risk, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {risk}
              </div>
            ))}
          </div>
        </div>

        {/* Maliyyə Hesablamaları və Komissiya */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-dashed">
          <div className="space-y-2">
            <Label>Vasitəçilik endirimi %:</Label>
            <Input
              type="number"
              step="0.01"
              value={details.discount_percent || "0.00"}
              onChange={e => {
                const pct = parseFloat(e.target.value) || 0;
                setDetail("discount_percent", e.target.value);
                const annual = details.annual_premium || 0;
                setDetail("final_premium", (annual - (annual * pct) / 100).toFixed(2));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Yekun sığorta haqqı (İllik):</Label>
            <Input value={`${details.final_premium || 0} AZN`} disabled className="bg-muted font-semibold text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* ── 5. Vasitəçilər Haqqında Məlumat ── */}
    <Card>
      <CardHeader>
        <CardTitle>Vasitəçilər haqqında məlumat</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Sığorta şirkəti</Label>
          <Input value="Paşa Sığorta" disabled className="bg-muted font-medium" />
        </div>
        <div className="space-y-2">
          <Label>Rəsmi Lisenziyalı Agent və ya Broker</Label>
          <Input
            value={details.broker_name || ""}
            onChange={e => setDetail("broker_name", e.target.value)}
            placeholder="Agent / Broker adı"
          />
        </div>
        <div className="space-y-2">
          <Label>Satış Kanalı və ya filial</Label>
          <Input
            value={details.sales_channel || ""}
            onChange={e => setDetail("sales_channel", e.target.value)}
            placeholder="Filial adı"
          />
        </div>
        <div className="space-y-2">
          <Label>Ukrator: Menecer - Soyadı , Adı</Label>
          <Input
            value={details.manager_name || ""}
            onChange={e => setDetail("manager_name", e.target.value)}
            placeholder="Menecer adı"
          />
        </div>
        <div className="space-y-2">
          <Label>Subagent: Soyadı Adı</Label>
          <Input
            value={details.subagent_name || ""}
            onChange={e => setDetail("subagent_name", e.target.value)}
            placeholder="Subagent məlumatları"
          />
        </div>
        
        {/* Komissiya alt sahələri */}
        <div className="space-y-2">
          <Label>Hesablanmış komissiya % :</Label>
          <Input 
            type="number" 
            value={details.calculated_commission_percent || ""} 
            onChange={e => setDetail("calculated_commission_percent", e.target.value)} 
            placeholder="?"
          />
        </div>
        <div className="space-y-2">
          <Label>Komissiya % :</Label>
          <Input
            type="number"
            value={details.commission_percent || ""}
            onChange={e => {
              const pct = parseFloat(e.target.value) || 0;
              setDetail("commission_percent", e.target.value);
              const finPrem = details.final_premium || 0;
              setDetail("commission_amount", ((finPrem * pct) / 100).toFixed(2));
            }}
            placeholder="?"
          />
        </div>
        <div className="space-y-2">
          <Label>Komissiya (azn) :</Label>
          <Input value={`${details.commission_amount || "0.00"} AZN`} disabled className="bg-muted" />
        </div>
      </CardContent>
    </Card>

    {/* ── 6. Qeydlər və Şərtlər ── */}
    <Card>
      <CardHeader>
        <CardTitle>Qeydlər</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs border border-amber-200 font-medium">
          ⚠️ Ev qeyd edilən şəxsə məxsus olmazsa, sığorta ödənişi edilməyəcək.
        </div>
        <div className="flex items-start gap-2 pt-2">
          <input
            type="checkbox"
            id="terms"
            required
            checked={!!details.terms_accepted}
            onChange={e => setDetail("terms_accepted", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="terms" className="text-xs text-muted-foreground leading-normal cursor-pointer select-none">
            Sığorta qaydaları ilə razıyam və daxil etdiyim məlumatların doğruluğunu təsdiqləyirəm.
          </Label>
        </div>
      </CardContent>
    </Card>

    {/* ── Alt Düymələr Paneli ── */}
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <Button
        type="button"
        onClick={() => setDetail("action_type", "issue_policy")}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
      >
        Polisi burax
      </Button>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={() => {/* Polisi yarat məntiqi */ }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
        >
          Polisi yarat
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => { setDetails({}); setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); }}
          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        >
          Təmizlə
        </Button>
      </div>
    </div>

  </div>
)}
{/* ŞƏKİL 2: PASHA YAXIN QONŞU PAKETLƏRİ VƏ DƏYİŞKƏNLƏRİ */}
{/* ── PASHA YAXIN QONŞU PAKETLƏRİ VƏ REAL XANALARI ── */}

        {isPasaOptimal && (
          <div className="space-y-6">

            {/* ── 1. Polisin Əsas Məlumatları ── */}
            <Card>
              <CardHeader>
                <CardTitle>Polisin əsas məlumatları</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Şirkət Polisin nömrəsi</Label>
                  <Input
                    value={details.company_policy_no || ""}
                    onChange={e => setDetail("company_policy_no", e.target.value)}
                    placeholder="Şirkət nömrəsi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sistem Polisin nömrəsi</Label>
                  <Input
                    value={details.system_policy_no || ""}
                    onChange={e => setDetail("system_policy_no", e.target.value)}
                    placeholder="Sistem nömrəsi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Polisin statusu</Label>
                  <SearchableSelect
                    label=""
                    value={details.policy_status || ""}
                    onChange={v => setDetail("policy_status", v)}
                    options={["Aktiv", "Gözləmədə", "Ləğv olunub"]}
                    placeholder="Status seçin"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hazırlanma tarixi</Label>
                  <Input type="date" value={details.issue_date || ""} onChange={e => setDetail("issue_date", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sığorta müddəti</Label>
                  <Input value="1 il" disabled className="bg-muted" />
                </div>
                <div className="space-y-2 md:col-start-1">
                  <Label>Başlanma tarixi :</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Bitmə tarixi:</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                </div>
              </CardContent>
            </Card>

            {/* ── 2. Sığortalı (Müştəri Məlumatları) ── Paşa-da Avtomobildən Əvvəl Gəlir */}
            <Card>
              <CardHeader>
                <CardTitle>Sığortalı</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Ş/V Fin kodu *</Label>
                    <Input
                      value={details.fin || ""}
                      onChange={e => setDetail("fin", e.target.value.toUpperCase())}
                      placeholder="XXXXXXX"
                      className="uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ş/V nömrəsi *</Label>
                    <Input
                      value={details.id_card_no || ""}
                      onChange={e => setDetail("id_card_no", e.target.value.toUpperCase())}
                      placeholder="AAXXXXXXXX"
                      className="uppercase"
                      required
                    />
                  </div>
                  <Button type="button" onClick={handleFinSearch} className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300">
                    Axtar
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Soyadı</Label>
                    <Input value={details.customer_surname || ""} onChange={e => setDetail("customer_surname", e.target.value)} placeholder="Soyad" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ad</Label>
                    <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ad" />
                  </div>
                  <div className="space-y-2">
                    <Label>Atasının adı ( oğlu , qızı )</Label>
                    <Input value={details.customer_patronymic || ""} onChange={e => setDetail("customer_patronymic", e.target.value)} placeholder="Ata adı" />
                  </div>
                  <div className="space-y-2">
                    <Label>Şəxsin növü</Label>
                    <SearchableSelect
                      label=""
                      value={details.customer_type || "Fiziki şəxs"}
                      onChange={v => setDetail("customer_type", v)}
                      options={["Fiziki şəxs", "Hüquqi şəxs"]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Doğum tarixi:</Label>
                    <Input type="date" value={details.birth_date || ""} onChange={e => setDetail("birth_date", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cinsi</Label>
                    <SearchableSelect label="" value={details.gender || ""} onChange={v => setDetail("gender", v)} options={["Kişi", "Qadın"]} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ölkə: Azərbaycan</Label>
                    <Input value="Azərbaycan" disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bölge ( Şəhər ):</Label>
                    <Input value={details.customer_region || ""} onChange={e => setDetail("customer_region", e.target.value)} placeholder="Şəhər" />
                  </div>
                  <div className="space-y-2">
                    <Label>Poçt indeksi: AZ1000</Label>
                    <Input value={details.customer_zip_code || "AZ1000"} onChange={e => setDetail("customer_zip_code", e.target.value)} />
                  </div>
                  <div className="col-span-1 md:col-span-1 space-y-2">
                    <Label>Ünvan:</Label>
                    <Input value={details.customer_address || ""} onChange={e => setDetail("customer_address", e.target.value)} placeholder="Ünvan" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobil nömrə *</Label>
                    <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required placeholder="+994" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email:</Label>
                    <Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="mail@example.com" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── 3. Avtomobil Haqqında Məlumat ── */}
            <Card>
              <CardHeader>
                <CardTitle>Avtomobil haqqında məlumat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Dövlət qeydiyyat nişanı *</Label>
                    <Input
                      value={details.plate_number || ""}
                      onChange={e => setDetail("plate_number", e.target.value.toUpperCase())}
                      placeholder="10-XX-000"
                      className="uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Qeydiyyat şəhadətnaməsi nömrəsi *</Label>
                    <Input
                      value={details.registration_certificate_no || ""}
                      onChange={e => setDetail("registration_certificate_no", e.target.value.toUpperCase())}
                      placeholder="AA000000"
                      className="uppercase"
                      required
                    />
                  </div>
                  <Button type="button" className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300">
                    Axtar
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <BrandModelSelect
                    brand={details.car_brand || ""}
                    model={details.car_model || ""}
                    onBrandChange={v => setDetail("car_brand", v)}
                    onModelChange={v => setDetail("car_model", v)}
                  />
                  <div className="space-y-2">
                    <Label>Avtomobilin növü</Label>
                    <SearchableSelect
                      label=""
                      value={details.car_type || ""}
                      onChange={v => setDetail("car_type", v)}
                      options={["Minik", "Yük", "SUV"]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ban nömrəsi</Label>
                    <Input value={details.body_no || ""} onChange={e => setDetail("body_no", e.target.value.toUpperCase())} className="uppercase" />
                  </div>
                  <div className="space-y-2">
                    <Label>Şassi nömrəsi</Label>
                    <Input value={details.vin_code || ""} onChange={e => setDetail("vin_code", e.target.value.toUpperCase())} className="uppercase" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mühərrik nömrəsi</Label>
                    <Input value={details.engine_no || ""} onChange={e => setDetail("engine_no", e.target.value.toUpperCase())} className="uppercase" />
                  </div>
                  <div className="space-y-2">
                    <Label>İstehsal ili:</Label>
                    <Input type="number" value={details.production_year || ""} onChange={e => setDetail("production_year", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>İstifadənin məqsədi:</Label>
                    <SearchableSelect
                      label=""
                      value={details.usage_purpose || "Şəxsi"}
                      onChange={v => setDetail("usage_purpose", v)}
                      options={["Şəxsi", "Taksi", "Biznes / Şirkət"]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mühərrik həcmi və at gücü</Label>
                    <Input value={details.engine_power || "1600 və at gücü"} onChange={e => setDetail("engine_power", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── 4. Məbləğlər (Paşa Optimal Paketləri) ── */}
            <Card>
              <CardHeader>
                <CardTitle>Məbləğlər</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Təminat məbləği:</Label>
                    <SearchableSelect
                      label=""
                      value={details.coverage_amount || ""}
                      onChange={v => setDetail("coverage_amount", v)}
                      options={["5000", "10000", "20000", "30000"]}
                      placeholder="Seçin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sığorta məbləği:</Label>
                    <Input value={details.insurance_amount_range || "25000 - 50000"} onChange={e => setDetail("insurance_amount_range", e.target.value)} placeholder="Məs: 25000 - 50000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Avtomobilin Dəyəri:</Label>
                    <Input type="number" value={details.car_value || ""} onChange={e => setDetail("car_value", e.target.value)} placeholder="AZN" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Qeyri-rəsmi servis təminatı:</Label>
                    <SearchableSelect
                      label=""
                      value={details.non_official_service || ""}
                      onChange={v => setDetail("non_official_service", v)}
                      options={["Daxildir", "Daxil deyil"]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rəsmi servis təminatı:</Label>
                    <SearchableSelect
                      label=""
                      value={details.official_service || ""}
                      onChange={v => setDetail("official_service", v)}
                      options={["Daxildir", "Daxil deyil"]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Franşiza :</Label>
                    <Input value={details.deductible || "100"} onChange={e => setDetail("deductible", e.target.value)} />
                  </div>
                </div>

                {/* Paket Matrisi Oxşarı Düymələr */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-medium text-muted-foreground block">Sürətli Paket Seçimi (Məbləğ / Avto Dəyəri / Q.Servis - R.Servis Haqqı):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "5000 / 25000-50000 / Q-500 və R-550", cov: "5000", q: 500, r: 550 },
                      { label: "10000 / 50000-100000 / Q-900 və R-1000", cov: "10000", q: 900, r: 1000 },
                      { label: "20000 / 100000-200000 / Q-1900 və R-2000", cov: "20000", q: 1900, r: 2000 },
                      { label: "30000 / 200000-300000 / Q-2900 və R-3000", cov: "30000", q: 2900, r: 3000 },
                    ].map(pkg => (
                      <Button
                        key={pkg.cov}
                        type="button"
                        variant={details.coverage_amount === pkg.cov ? "default" : "outline"}
                        className="justify-start h-auto p-2"
                        onClick={() => {
                          setDetail("coverage_amount", pkg.cov);
                          setDetail("calculated_commission_percent", "15");
                        }}
                      >
                        {pkg.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Komissiya və Hesablama */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-dashed">
                  <div className="space-y-2">
                    <Label>Hesablanmış komissiya % :</Label>
                    <Input type="number" value={details.calculated_commission_percent || "15"} onChange={e => setDetail("calculated_commission_percent", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Komissiya % :</Label>
                    <Input type="number" value={details.commission_percent || "0,00"} onChange={e => setDetail("commission_percent", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Komissiya ( azn ) :</Label>
                    <Input value={`${details.commission_amount || "0,00"} AZN`} disabled className="bg-muted" />
                  </div>
                </div>

                {/* Təminat şərtləri info bloku */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
                  <strong className="block text-amber-950 font-semibold">Təminat şərtləri:</strong>
                  <p className="leading-relaxed">
                    Optimal KASKO məhsulu avtonəqliyyat hadisəsi, atılmış və ya düşmüş əşya, üçüncü şəxsin qanunazidd hərəkəti, oğurluq, quldurluq, qaçırma və soyğunçuluq, yanğın və partlayış, heyvanların hərəkəti, təbii fəlakət və bir sıra digər risklərə qarşı avtomobilinizi təminat altına alır. Mahsul həm də müştərilərə rəsmi və ya qeyri-rəsmi servisdə təmir imkanı da təqdim edir.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ── 5. Qeydlər ── */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms_pasha"
                    required
                    checked={!!details.terms_accepted}
                    onChange={e => setDetail("terms_accepted", e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="terms_pasha" className="text-xs text-muted-foreground cursor-pointer select-none">
                    Sığorta qaydaları ilə razıyam və daxil etdiyim məlumatların doğruluğunu təsdiqləyirəm.
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* ── Alt Düymələr ── */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                onClick={() => setDetail("action_type", "issue")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
              >
                Polisi burax
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => {/* Hesablama funksiyası */ }}
                  className="bg-slate-600 hover:bg-slate-700 text-white font-medium px-6"
                >
                  Hesabla
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setDetails({}); setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); }}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Təmizlə
                </Button>
              </div>
            </div>

          </div>
        )}
       {isPasaParking && (
  <div className="space-y-6">

    {/* ── 1. Polisin Əsas Məlumatları ── */}
    <Card>
      <CardHeader>
        <CardTitle>Polis əsas məlumatları</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Şirkət Polisin nömrəsi</Label>
          <Input
            value={details.company_policy_no || ""}
            onChange={e => setDetail("company_policy_no", e.target.value)}
            placeholder="Şirkət nömrəsi"
          />
        </div>
        <div className="space-y-2">
          <Label>Sistem Polisin nömrəsi</Label>
          <Input
            value={details.system_policy_no || ""}
            onChange={e => setDetail("system_policy_no", e.target.value)}
            placeholder="Sistem nömrəsi"
          />
        </div>
        <div className="space-y-2">
          <Label>Polisin statusu</Label>
          <SearchableSelect
            label=""
            value={details.policy_status || ""}
            onChange={v => setDetail("policy_status", v)}
            options={["Aktiv", "Gözləmədə", "Ləğv olunub"]}
            placeholder="Status seçin"
          />
        </div>
        <div className="space-y-2">
          <Label>Hazırlanma tarixi</Label>
          <Input type="date" value={details.issue_date || ""} onChange={e => setDetail("issue_date", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Sığorta müddəti: 1 il</Label>
          <Input value="1 il" disabled className="bg-muted" />
        </div>
        <div className="space-y-2 md:col-start-1">
          <Label>Başlanma tarixi :</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Bitmə tarixi:</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
        </div>
      </CardContent>
    </Card>

    {/* ── 2. Sığortalı ── */}
    <Card>
      <CardHeader>
        <CardTitle>Sığortalı</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label>Ş/V Fin kodu *</Label>
            <Input
              value={details.fin || ""}
              onChange={e => setDetail("fin", e.target.value.toUpperCase())}
              placeholder="XXXXXXX"
              className="uppercase"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Ş/V nömrəsi *</Label>
            <Input
              value={details.id_card_no || ""}
              onChange={e => setDetail("id_card_no", e.target.value.toUpperCase())}
              placeholder="AAXXXXXXXX"
              className="uppercase"
              required
            />
          </div>
          <Button type="button" onClick={handleFinSearch} className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300">
            Axtar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Soyadı</Label>
            <Input value={details.customer_surname || ""} onChange={e => setDetail("customer_surname", e.target.value)} placeholder="Soyad" />
          </div>
          <div className="space-y-2">
            <Label>Ad</Label>
            <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ad" />
          </div>
          <div className="space-y-2">
            <Label>Atasının adı ( oğlu , qızı )</Label>
            <Input value={details.customer_patronymic || ""} onChange={e => setDetail("customer_patronymic", e.target.value)} placeholder="Ata adı" />
          </div>
          <div className="space-y-2">
            <Label>Şəxsin növü</Label>
            <SearchableSelect
              label=""
              value={details.customer_type || "Fiziki şəxs"}
              onChange={v => setDetail("customer_type", v)}
              options={["Fiziki şəxs", "Hüquqi şəxs"]}
            />
          </div>
          <div className="space-y-2">
            <Label>Doğum tarixi:</Label>
            <Input type="date" value={details.birth_date || ""} onChange={e => setDetail("birth_date", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cinsi</Label>
            <SearchableSelect label="" value={details.gender || ""} onChange={v => setDetail("gender", v)} options={["Kişi", "Qadın"]} />
          </div>
          <div className="space-y-2">
            <Label>Ölkə: Azərbaycan</Label>
            <Input value="Azərbaycan" disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Bölgə ( Şəhər ):</Label>
            <Input value={details.customer_region || ""} onChange={e => setDetail("customer_region", e.target.value)} placeholder="Şəhər" />
          </div>
          <div className="space-y-2">
            <Label>Poçt indeksi: AZ1000</Label>
            <Input value={details.customer_zip_code || "AZ1000"} onChange={e => setDetail("customer_zip_code", e.target.value)} />
          </div>
          <div className="col-span-1 md:col-span-1 space-y-2">
            <Label>Ünvan:</Label>
            <Input value={details.customer_address || ""} onChange={e => setDetail("customer_address", e.target.value)} placeholder="Ünvan" />
          </div>
          <div className="space-y-2">
            <Label>Mobil nömrə *</Label>
            <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required placeholder="+994" />
          </div>
          <div className="space-y-2">
            <Label>Email:</Label>
            <Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="mail@example.com" />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* ── 3. Avtomobil Haqqında Məlumat ── */}
    <Card>
      <CardHeader>
        <CardTitle>Avtomobil haqqında məlumat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label>Dövlət qeydiyyat nişanı *</Label>
            <Input
              value={details.plate_number || ""}
              onChange={e => setDetail("plate_number", e.target.value.toUpperCase())}
              placeholder="10-XX-000"
              className="uppercase"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Qeydiyyat şəhadətnaməsi nömrəsi *</Label>
            <Input
              value={details.registration_certificate_no || ""}
              onChange={e => setDetail("registration_certificate_no", e.target.value.toUpperCase())}
              placeholder="AA000000"
              className="uppercase"
              required
            />
          </div>
          <Button type="button" className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300">
            Axtar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Avtomobilin markası</Label>
            <Input value={details.car_brand || ""} onChange={e => setDetail("car_brand", e.target.value)} placeholder="Marka" />
          </div>
          <div className="space-y-2">
            <Label>Avtomobilin modeli</Label>
            <Input value={details.car_model || ""} onChange={e => setDetail("car_model", e.target.value)} placeholder="Model" />
          </div>
          <div className="space-y-2">
            <Label>Avtomobilin növü</Label>
            <SearchableSelect
              label=""
              value={details.car_type || ""}
              onChange={v => setDetail("car_type", v)}
              options={["Minik", "Yük", "SUV"]}
            />
          </div>
          <div className="space-y-2">
            <Label>Ban nömrəsi</Label>
            <Input value={details.body_no || ""} onChange={e => setDetail("body_no", e.target.value.toUpperCase())} className="uppercase" />
          </div>
          <div className="space-y-2">
            <Label>Şassi nömrəsi</Label>
            <Input value={details.vin_code || ""} onChange={e => setDetail("vin_code", e.target.value.toUpperCase())} className="uppercase" />
          </div>
          <div className="space-y-2">
            <Label>Mühərrik nömrəsi</Label>
            <Input value={details.engine_no || ""} onChange={e => setDetail("engine_no", e.target.value.toUpperCase())} className="uppercase" />
          </div>
          <div className="space-y-2">
            <Label>İstehsal İli:</Label>
            <Input type="number" value={details.production_year || ""} onChange={e => setDetail("production_year", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>İstifadənin məqsədi: Şəxsi</Label>
            <Input value="Şəxsi" disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Mühərrik həcmi: 1600 və at gücü</Label>
            <Input value={details.engine_power || "1600 və at gücü"} onChange={e => setDetail("engine_power", e.target.value)} />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* ── 4. Məbləğlər ── */}
    <Card>
      <CardHeader>
        <CardTitle>Məbləğlər</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Təminat məbləği:</Label>
            <SearchableSelect
              label=""
              value={details.coverage_amount || ""}
              onChange={v => setDetail("coverage_amount", v)}
              options={["5000", "10000", "20000"]}
              placeholder="Seçin"
            />
          </div>
          <div className="space-y-2">
            <Label>Sığorta məbləği: 25000 - 50000</Label>
            <Input value="25000 - 50000" disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Avtomobilin Dəyəri:</Label>
            <Input type="number" value={details.car_value || ""} onChange={e => setDetail("car_value", e.target.value)} placeholder="AZN" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Qeyri - rəsmi servis təminatı:</Label>
            <Input value={details.non_official_service || ""} onChange={e => setDetail("non_official_service", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Rəsmi servis təminatı:</Label>
            <Input value={details.official_service || ""} onChange={e => setDetail("official_service", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>FrAnşiza : 100</Label>
            <Input value="100" disabled className="bg-muted" />
          </div>
        </div>

        {/* Paket Seçimləri */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-medium text-muted-foreground block">Paketlər:</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {[
              { label: "5000 / Q və R - 79 azn", cov: "5000", premium: "79" },
              { label: "10000 / Q və R - 99 azn", cov: "10000", premium: "99" },
              { label: "20000 / Q və R - 199 azn", cov: "20000", premium: "199" },
            ].map(pkg => (
              <Button
                key={pkg.cov}
                type="button"
                variant={details.coverage_amount === pkg.cov ? "default" : "outline"}
                className="justify-start h-auto p-2"
                onClick={() => {
                  setDetail("coverage_amount", pkg.cov);
                  setDetail("calculated_commission_percent", "15");
                }}
              >
                {pkg.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Komissiya Bölməsi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-dashed">
          <div className="space-y-2">
            <Label>Hesablanmış komissiya % : 15</Label>
            <Input type="number" value={details.calculated_commission_percent || "15"} onChange={e => setDetail("calculated_commission_percent", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Komissiya % : 0,00</Label>
            <Input type="number" value={details.commission_percent || "0,00"} onChange={e => setDetail("commission_percent", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Komissiya ( azn ) : 0,00</Label>
            <Input value={`${details.commission_amount || "0,00"} AZN`} disabled className="bg-muted" />
          </div>
        </div>

        {/* Təminat şərtləri */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
          <strong className="block text-amber-950 font-semibold">Təminat şərtləri:</strong>
          <p className="leading-relaxed">
            KASKO məhsulu avtonəqliyyat hadisəsi, atılmış və ya düşmüş əşya, üçüncü şəxsin qanunazidd hərəkəti, oğurluq, quldurluq, qaçırma və soyğunçuluq, yanğın və partlayış, heyvanların hərəkəti, təbii fəlakət və bir sıra digər risklərə qarşı avtomobilinizi təminat altına alır. Mahsul həm də müştərilərə rəsmi və ya qeyri-rəsmi servisdə təmir imkanı da təqdim edir.
          </p>
        </div>

        {/* Qeydlər */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 space-y-1">
          <strong className="block text-slate-900 font-semibold">Qeydlər:</strong>
          <p className="leading-relaxed">
            Üçüncü şəxsin qanunazidd hərəkəti təminatı yalnız 199 AZN sığorta haqqı ilə təklif olunan təminata aiddir.
          </p>
        </div>
      </CardContent>
    </Card>

    {/* ── 5. Razılaşma ── */}
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms_pasha_parking"
            required
            checked={!!details.terms_accepted}
            onChange={e => setDetail("terms_accepted", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="terms_pasha_parking" className="text-xs text-muted-foreground cursor-pointer select-none">
            Sığorta qaydaları ilə razıyam və daxil etdiyim məlumatların doğruluğunu təsdiqləyirəm.
          </Label>
        </div>
      </CardContent>
    </Card>

    {/* ── Alt Düymələr ── */}
    <div className="flex items-center justify-between gap-3 pt-2">
      <Button
        type="button"
        onClick={() => setDetail("action_type", "issue")}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
      >
        Polisi burax
      </Button>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={() => { /* Polis yarat funksiyası */ }}
          className="bg-slate-600 hover:bg-slate-700 text-white font-medium px-6"
        >
          Polis yarat
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => { setDetails({}); setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); }}
          className="border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          Təmizlə
        </Button>
      </div>
    </div>

  </div>
)}

        {/* ══════════════════════════════════════════════════════════════════════
            DƏİMMİS
        ══════════════════════════════════════════════════════════════════════ */}
        {showFormSection && isDəimmis && (
          <Card>
            <CardHeader><CardTitle>Şəxsi məlumatlarınızı daxil edin</CardTitle></CardHeader>
            <CardContent>
              <PersonalInfoFields
                details={details}
                setDetail={setDetail}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerEmail={customerEmail}
                setCustomerEmail={setCustomerEmail}
              />
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            YAŞIL KART
        ══════════════════════════════════════════════════════════════════════ */}
        {showFormSection && isYaşılKart && (
          <Card>
            <CardHeader><CardTitle>Şəxsi məlumatlarınızı daxil edin</CardTitle></CardHeader>
            <CardContent>
              <PersonalInfoFields
                details={details}
                setDetail={setDetail}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerEmail={customerEmail}
                setCustomerEmail={setCustomerEmail}
              />
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            KASKO — Könüllü kasko + bütün kasko məhsulları
        ══════════════════════════════════════════════════════════════════════ */}
        {showFormSection && isKasko && (
          <>
            <Card>
              <CardHeader><CardTitle>Polisin əsas məlumatları</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Şirkət Polisin nömrəsi" value={details.policy_number} onChange={v => setDetail("policy_number", v)} />
                <Field label="Sistem Polisin nömrəsi" value={details.system_policy_number} onChange={v => setDetail("system_policy_number", v)} />
                <div className="space-y-2">
                  <Label>Polisin statusu</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={details.policy_status || ""}
                    onChange={e => setDetail("policy_status", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="pending">Buraxıldı</option>
                    <option value="expired">Qüvvədədir</option>
                    <option value="cancelled">Ödəniş gözləyir</option>
                  </select>
                </div>
                <Field label="Hazırlanma tarixi" type="date" value={details.issue_date} onChange={v => setDetail("issue_date", v)} />
                <Field label="Sığorta müddəti" value={details.policy_duration} onChange={v => setDetail("policy_duration", v)} placeholder="1-12 ay" />
                <Field label="Başlanma tarixi" type="date" value={details.start_date_kasko} onChange={v => setDetail("start_date_kasko", v)} />
                <Field label="Bitmə tarixi" type="date" value={details.end_date_kasko} onChange={v => setDetail("end_date_kasko", v)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Avtomobil haqqında məlumat</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dövlət qeydiyyat nişanı *</Label>
                  <Input
                    value={details.plate || ""}
                    onChange={e => setDetail("plate", e.target.value.toUpperCase())}
                    placeholder="90AA001"
                    required
                    className="uppercase flex-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qeydiyyat şəhadətnaməsi nömrəsi *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={details.reg_cert_no || ""}
                      onChange={e => setDetail("reg_cert_no", e.target.value.toUpperCase())}
                      placeholder="AA000000"
                      required
                      className="uppercase flex-1"
                    />
                    <Button type="button" variant="outline" size="sm">Axtar</Button>
                  </div>
                </div>
                <BrandModelSelect
                  brand={details.brand || ""}
                  model={details.model || ""}
                  onBrandChange={v => setDetail("brand", v)}
                  onModelChange={v => setDetail("model", v)}
                />
                <div className="space-y-2">
                  <Label>Avtomobilin növü</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={details.vehicle_type || ""}
                    onChange={e => setDetail("vehicle_type", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="sedan">Sedan</option>
                    <option value="kabrio">Kabrio</option>
                    <option value="van">Van</option>
                    <option value="furqon">Furqon</option>
                    <option value="rodster">Rodster</option>
                    <option value="suv">SUV</option>
                    <option value="hatchback">Hatchback</option>
                    <option value="minivan">Minivan</option>
                    <option value="pickup">Pikap</option>
                    <option value="crossover">Crossover</option>
                    <option value="coupe">Kupe</option>
                    <option value="minik">Minik</option>
                    <option value="yuk">Yük</option>
                    <option value="qosqu">Qoşqu</option>
                    <option value="motosikl">Motosikl</option>
                    <option value="avtobus">Avtobus və Mikroavtobus</option>
                    <option value="elektromobil">Elektromobil</option>
                  </select>
                </div>
                <Field label="Ban nömrəsi" value={details.body_number} onChange={v => setDetail("body_number", v)} placeholder="VIN/Ban nömrəsi" />
                <Field label="Şassi nömrəsi" value={details.chassis_number} onChange={v => setDetail("chassis_number", v)} />
                <Field label="Mühərrik nömrəsi" value={details.engine_number} onChange={v => setDetail("engine_number", v)} />
                <Field label="İstehsal ili" type="number" value={details.year} onChange={v => setDetail("year", v)} placeholder="2020" />
                <div className="space-y-2">
                  <Label>İstifadənin məqsədi</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={details.usage_purpose || ""}
                    onChange={e => setDetail("usage_purpose", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="personal">Şəxsi</option>
                    <option value="commercial">İşgüzar</option>
                    <option value="taxi">Taksi</option>
                    <option value="rental">İcarə</option>
                  </select>
                </div>
                <Field label="Mühərrik (sm³)" value={details.engine_volume} onChange={v => setDetail("engine_volume", v)} placeholder="1600" />
                <Field label="Tonaj" value={details.tonnage} onChange={v => setDetail("tonnage", v)} />
                <Field label="At gücü (hp)" type="number" value={details.horsepower} onChange={v => setDetail("horsepower", v)} />
                <Field label="Yer sayı" type="number" value={details.seat_count} onChange={v => setDetail("seat_count", v)} />
                <Field label="Avtomobilin bazar dəyəri (AZN)" type="number" value={details.car_market_value} onChange={v => setDetail("car_market_value", v)} />
                <Field label="Faktiki qət etdiyi məsafə (km)" type="number" value={details.mileage} onChange={v => setDetail("mileage", v)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Sığortalı</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      Ş/V Fin kodu *
                      <InfoTooltip imageSrc="https://www.kapitalbank.az/assets/static/img/fin_code_old_version.png" alt="FİN kodu nümunəsi" />
                    </Label>
                    <Input
                      value={details.fin || ""}
                      onChange={e => setDetail("fin", e.target.value.toUpperCase())}
                      placeholder="XXXXXXX"
                      className="uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      Ş/V nömrəsi *
                      <InfoTooltip imageSrc="https://tehsil.socar.az/img/nomresi.png" alt="Şəxsiyyət vəsiqəsi nömrəsi nümunəsi" />
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={details.id_card_no || ""}
                        onChange={e => setDetail("id_card_no", e.target.value.toUpperCase())}
                        placeholder="AAXXXXXXXX"
                        className="uppercase flex-1"
                        required
                      />
                      <Button type="button" variant="outline" size="sm" onClick={handleFinSearch} disabled={searchLoading}>
                        {searchLoading ? "..." : "Axtar"}
                      </Button>
                    </div>
                    {searchMsg && (
                      <span className={`text-xs ${searchMsg.includes("tapıldı") && !searchMsg.includes("tapılmadı") ? "text-green-600" : "text-red-500"}`}>
                        {searchMsg}
                      </span>
                    )}
                  </div>
                  <Field label="Sürücülük vəsiqəsinin seriya və nömrəsi" value={details.driving_license} onChange={v => setDetail("driving_license", v)} placeholder="AA000000" />
                  <Field label="Sürücülük stajı (il)" type="number" value={details.driving_experience} onChange={v => setDetail("driving_experience", v)} placeholder="0-5" />
                </div>

                <div className="space-y-2">
                  <Label>Sürücü məlumatı</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={details.driver_info || ""}
                    onChange={e => setDetail("driver_info", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="insured">Sığortalı</option>
                    <option value="all">Bütün sürücülər</option>
                    <option value="selected">Seçilmiş kategoriyalı sürücülər</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Təminatlar</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Sığorta məbləği (AZN)" type="number" value={details.insurance_amount} onChange={v => setDetail("insurance_amount", v)} />
                <Field label="Azadolma (franchise)" value={details.deductible} onChange={v => setDetail("deductible", v)} />
                <div className="space-y-2">
                  <Label>NV-nin təmir servisi</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={details.repair_service || ""}
                    onChange={e => setDetail("repair_service", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="official">Rəsmi servis</option>
                    <option value="any">İstənilən servis</option>
                    <option value="insurer">Sığortaçının seçimi</option>
                  </select>
                </div>
                <Field label="Sığorta tarifi (%)" type="number" step="0.01" value={details.insurance_rate} onChange={v => setDetail("insurance_rate", v)} />
                <Field label="Sığorta haqqı (AZN)" type="number" value={details.premium_amount} onChange={v => setDetail("premium_amount", v)} />
                <Field label="Sığorta agenti" value={details.insurance_agent} onChange={v => setDetail("insurance_agent", v)} />
                <div className="space-y-2">
                  <Label>Ödəniş forması</Label>
                  <div className="flex gap-2">
                    <select
                      className={`h-10 rounded-md border border-input bg-background px-3 py-2 text-sm transition-all
                        ${details.payment_method === "installment" ? "w-1/2" : "w-full"}`}
                      value={details.payment_method || ""}
                      onChange={e => {
                        setDetail("payment_method", e.target.value);
                        if (e.target.value !== "installment") {
                          setDetail("installment_months", "");
                        }
                      }}
                    >
                      <option value="">Seçin</option>
                      <option value="cash">Tam</option>
                      <option value="card">Kart</option>
                      <option value="transfer">Bank köçürməsi</option>
                      <option value="installment">Hissə-hissə</option>
                    </select>
                    {details.payment_method === "installment" && (
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        placeholder="1-12 ay"
                        className="w-1/2"
                        value={details.installment_months || ""}
                        onChange={e => {
                          const value = Number(e.target.value);
                          if (value >= 1 && value <= 12) {
                            setDetail("installment_months", value);
                          } else if (e.target.value === "") {
                            setDetail("installment_months", "");
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Əlavə qeydlər</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Qeydlər</Label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Əlavə məlumat..."
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            PAŞA SİĞORTA — Ev əşyalarının sığortası
        ══════════════════════════════════════════════════════════════════════ */}
        {showFormSection && isPashaEvEsyalari && (
          <>
            {/* Polisin əsas məlumatları */}
            <Card>
              <CardHeader><CardTitle>Polisin əsas məlumatları</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Şirkət Polisin nömrəsi" value={details.policy_number} onChange={v => setDetail("policy_number", v)} />
                <Field label="Sistem Polisin nömrəsi" value={details.system_policy_number} onChange={v => setDetail("system_policy_number", v)} />
                <div className="space-y-2">
                  <Label>Polisin statusu</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={details.policy_status || ""}
                    onChange={e => setDetail("policy_status", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="issued">Buraxıldı</option>
                    <option value="active">Qüvvədədir</option>
                    <option value="pending_payment">Ödəniş gözləyir</option>
                  </select>
                </div>
                <Field label="Hazırlanma tarixi" type="date" value={details.issue_date} onChange={v => setDetail("issue_date", v)} />
                <div className="space-y-2">
                  <Label>Sığorta müddəti</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={details.policy_duration || ""}
                    onChange={e => setDetail("policy_duration", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="1_il">1 il</option>
                  </select>
                </div>
                <Field label="Başlanma tarixi" type="date" value={details.start_date_ev} onChange={v => setDetail("start_date_ev", v)} />
                <Field label="Bitmə tarixi" type="date" value={details.end_date_ev} onChange={v => setDetail("end_date_ev", v)} />
              </CardContent>
            </Card>

            {/* Əmlak haqqında məlumat */}
            <Card>
              <CardHeader><CardTitle>Əmlak haqqında məlumat</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Reyestr nömrəsi" value={details.registry_number} onChange={v => setDetail("registry_number", v)} />
                <div className="space-y-2">
                  <Label>Qeydiyyat nömrəsi</Label>
                  <div className="flex gap-2">
                    <Input
                      value={details.reg_number || ""}
                      onChange={e => setDetail("reg_number", e.target.value.toUpperCase())}
                      className="uppercase flex-1"
                    />
                    <Button type="button" variant="outline" size="sm">Axtar</Button>
                  </div>
                </div>
                <Field label="Digər sənəd" value={details.other_document} onChange={v => setDetail("other_document", v)} />
                <Field label="Çıxarışın seriya və nömrəsi" value={details.extract_serial} onChange={v => setDetail("extract_serial", v)} />
                <div className="space-y-2">
                  <Label>Əmlakın növü</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={details.property_type || ""}
                    onChange={e => setDetail("property_type", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="apartment">Mənzil</option>
                    <option value="house">Ev (fərdi)</option>
                    <option value="office">Ofis</option>
                    <option value="commercial">Kommersiya</option>
                  </select>
                </div>
                <Field label="Ümumi sahə (m²)" type="number" value={details.total_area} onChange={v => setDetail("total_area", v)} />
                <div className="space-y-2">
                  <Label>Ölkə</Label>
                  <Input value="Azərbaycan" readOnly className="bg-muted text-muted-foreground" />
                </div>
                <Field label="Bölgə (Şəhər)" value={details.region_city} onChange={v => setDetail("region_city", v)} />
                <Field label="Poçt indeksi" value={details.postal_code} onChange={v => setDetail("postal_code", v)} />
                <div className="sm:col-span-2 space-y-2">
                  <Label>Tam ünvan</Label>
                  <Input
                    value={details.full_address || ""}
                    onChange={e => setDetail("full_address", e.target.value)}
                    placeholder="Küçə, ev nömrəsi, mənzil..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sığortalı */}
            <Card>
              <CardHeader><CardTitle>Sığortalı</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center">
                    Ş/V Fin kodu *
                    <InfoTooltip imageSrc="https://www.kapitalbank.az/assets/static/img/fin_code_old_version.png" alt="FİN kodu nümunəsi" />
                  </Label>
                  <Input
                    value={details.fin || ""}
                    onChange={e => setDetail("fin", e.target.value.toUpperCase())}
                    placeholder="XXXXXXX"
                    className="uppercase"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center">
                    Ş/V nömrəsi *
                    <InfoTooltip imageSrc="https://tehsil.socar.az/img/nomresi.png" alt="Şəxsiyyət vəsiqəsi nömrəsi nümunəsi" />
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={details.id_card_no || ""}
                      onChange={e => setDetail("id_card_no", e.target.value.toUpperCase())}
                      placeholder="AAXXXXXXXX"
                      className="uppercase flex-1"
                      required
                    />
                    <Button type="button" variant="outline" size="sm" onClick={handleFinSearch} disabled={searchLoading}>
                      {searchLoading ? "..." : "Axtar"}
                    </Button>
                  </div>
                  {searchMsg && (
                    <span className={`text-xs ${searchMsg.includes("tapıldı") && !searchMsg.includes("tapılmadı") ? "text-green-600" : "text-red-500"}`}>
                      {searchMsg}
                    </span>
                  )}
                </div>
                <Field label="Soyadı" value={details.last_name} onChange={v => setDetail("last_name", v)} />
                <Field label="Ad" value={details.first_name} onChange={v => setDetail("first_name", v)} />
                <Field label="Atasının adı (oğlu / qızı)" value={details.patronymic} onChange={v => setDetail("patronymic", v)} />
                <div className="space-y-2">
                  <Label>Şəxsin növü</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={details.person_type || ""}
                    onChange={e => setDetail("person_type", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="individual">Fiziki şəxs</option>
                    <option value="legal">Hüquqi şəxs</option>
                  </select>
                </div>
                <Field label="Doğum tarixi" type="date" value={details.birth_date} onChange={v => setDetail("birth_date", v)} />
                <div className="space-y-2">
                  <Label>Cinsi</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={details.gender || ""}
                    onChange={e => setDetail("gender", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="male">Kişi</option>
                    <option value="female">Qadın</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Ölkə</Label>
                  <Input value="Azərbaycan" readOnly className="bg-muted text-muted-foreground" />
                </div>
                <Field label="Bölgə (Şəhər)" value={details.insured_region} onChange={v => setDetail("insured_region", v)} />
                <Field label="Poçt indeksi" value={details.insured_postal_code} onChange={v => setDetail("insured_postal_code", v)} placeholder="AZ1000" />
                <div className="sm:col-span-2 space-y-2">
                  <Label>Ünvan</Label>
                  <Input
                    value={details.insured_address || ""}
                    onChange={e => setDetail("insured_address", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobil nömrə *</Label>
                  <Input
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="+994 50 XXX XX XX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Məbləğlər — iki paket yan-yana */}
            <Card>
              <CardHeader><CardTitle>Məbləğlər</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Paket 1 */}
                  <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Paket 1</p>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Təminat məbləği (AZN)</Label>
                      <Input
                        type="number"
                        value={details.coverage_amount_1 ?? 10000}
                        onChange={e => setDetail("coverage_amount_1", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Qonşunun daşınmaz əmlakı üçün (AZN)</Label>
                      <Input
                        type="number"
                        value={details.neighbor_property_1 || ""}
                        onChange={e => setDetail("neighbor_property_1", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Qonşunun sağlamlığı üçün (AZN)</Label>
                      <Input
                        type="number"
                        value={details.neighbor_health_1 || ""}
                        onChange={e => setDetail("neighbor_health_1", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Azadolma (AZN)</Label>
                      <Input
                        type="number"
                        value={details.deductible_1 ?? 100}
                        onChange={e => setDetail("deductible_1", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Sığorta haqqı illik (AZN)</Label>
                      <Input
                        type="number"
                        value={details.annual_premium_1 ?? 20}
                        onChange={e => setDetail("annual_premium_1", e.target.value)}
                      />
                    </div>
                    <div className="pt-1">
                      <p className="text-xs font-medium text-gray-600 mb-1">Sığorta riskləri</p>
                      <ul className="text-xs text-gray-500 space-y-0.5 list-disc list-inside">
                        <li>Yanğın</li>
                        <li>Təbii fəlakətlər</li>
                        <li>Su xəttində qəza</li>
                        <li>Nəqliyyat vasitələrinin vurması</li>
                        <li>Digər şəxsin hərəkəti</li>
                      </ul>
                    </div>
                  </div>

                  {/* Paket 2 */}
                  <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Paket 2</p>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Təminat məbləği (AZN)</Label>
                      <Input
                        type="number"
                        value={details.coverage_amount_2 ?? 20000}
                        onChange={e => setDetail("coverage_amount_2", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Qonşunun daşınmaz əmlakı üçün (AZN)</Label>
                      <Input
                        type="number"
                        value={details.neighbor_property_2 || ""}
                        onChange={e => setDetail("neighbor_property_2", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Qonşunun sağlamlığı üçün (AZN)</Label>
                      <Input
                        type="number"
                        value={details.neighbor_health_2 || ""}
                        onChange={e => setDetail("neighbor_health_2", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Azadolma (AZN)</Label>
                      <Input
                        type="number"
                        value={details.deductible_2 ?? 100}
                        onChange={e => setDetail("deductible_2", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Sığorta haqqı illik (AZN)</Label>
                      <Input
                        type="number"
                        value={details.annual_premium_2 ?? 36}
                        onChange={e => setDetail("annual_premium_2", e.target.value)}
                      />
                    </div>
                    <div className="pt-1">
                      <p className="text-xs font-medium text-gray-600 mb-1">Sığorta riskləri</p>
                      <ul className="text-xs text-gray-500 space-y-0.5 list-disc list-inside">
                        <li>Yanğın</li>
                        <li>Təbii fəlakətlər</li>
                        <li>Su xəttində qəza</li>
                        <li>Nəqliyyat vasitələrinin vurması</li>
                        <li>Digər şəxsin hərəkəti</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vasitəçilər haqqında məlumat */}
            <Card>
              <CardHeader><CardTitle>Vasitəçilər haqqında məlumat</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sığorta şirkəti</Label>
                  <Input value="Paşa Sığorta" readOnly className="bg-muted text-muted-foreground" />
                </div>
                <Field label="Rəsmi Lisenziyalı Agent və ya Broker" value={details.licensed_agent} onChange={v => setDetail("licensed_agent", v)} />
                <Field label="Satış Kanalı və ya filial" value={details.sales_channel} onChange={v => setDetail("sales_channel", v)} />
                <Field label="Ukrator: Menecer — Soyadı, Adı" value={details.manager_name} onChange={v => setDetail("manager_name", v)} />
                <Field label="Subagent: Soyadı, Adı" value={details.subagent_name} onChange={v => setDetail("subagent_name", v)} />
                <Field label="Hesablanmış komissiya (%)" type="number" step="0.01" value={details.calculated_commission_pct} onChange={v => setDetail("calculated_commission_pct", v)} />
                <Field label="Komissiya (%)" type="number" step="0.01" value={details.commission_pct} onChange={v => setDetail("commission_pct", v)} />
                <Field label="Komissiya (AZN)" type="number" step="0.01" value={details.commission_azn} onChange={v => setDetail("commission_azn", v)} />
              </CardContent>
            </Card>

            {/* Qeydlər */}
            <Card>
              <CardHeader><CardTitle>Qeydlər</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm font-medium text-gray-700">Hansı əşyalar zədələnərsə, ödəniş həyata keçirilmir:</p>
                <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
                  <li>Kompüterlər, notebook, mobil telefonlar və s. tipli elektron cihazlar</li>
                  <li>Qızıl-zinyət əşyaları, pul, çeklər, veksellər və digər qiymətli kağızlar</li>
                  <li>Antik mebel əşyaları, rəsm tabloları və s. tipli digər dəyərli əşyalar</li>
                  <li>Sığortalanmış predmetlərin öz-özünə alışması, qıcqırması, çürüməsi, tədricən xarab olma, daxili çatışmazlıqlar, gizli və istehsalat qüsurlar, həşəratların və parazitlərin vurduğu ziyan, ətraf mühitin çirkləndirilməsi, təbii köhnəlmə, atmosferin rütubətli və ya quru olması, temperatur və ya rütubət dəyişikliyi, çəkinin itirilməsi, paslanma, çürümə, aşınma, rəngdə, quruluşda və iydə baş verən dəyişiklik və ya digər təbii xüsusiyyətləri</li>
                  <li>Mexaniki xarab olmalar, düzgün istifadə etməmə və digər buna oxşar hallar</li>
                  <li>Sığorta müqaviləsi bağlandığı zaman sığorta obyektində mövcud olan qüsurlar, zədələr, itkilər</li>
                </ul>
                <div className="space-y-2">
                  <Label>Əlavə qeydlər</Label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Əlavə məlumat..."
                  />
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms_accept"
                    checked={!!details.terms_accepted}
                    onChange={e => setDetail("terms_accepted", e.target.checked)}
                    className="mt-0.5 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="terms_accept" className="text-sm text-gray-700 cursor-pointer leading-snug">
                    Sığorta qaydaları ilə razıyam və daxil etdiyim məlumatların doğruluğunu təsdiqləyirəm.
                  </label>
                </div>
              </CardContent>
            </Card>
          </>
        )}



        {/* ── Other sub-types — generic personal info form, no Axtar, no notes */}
        {showFormSection && !isAvtonəqliyyat && !isDaşınmazEmlak && !isDəimmis && !isYaşılKart && !isKasko && !isPashaEvEsyalari && (
          <Card>
            <CardHeader>
              <CardTitle>Şəxsi məlumatlarınızı daxil edin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PersonalInfoFields
                details={details}
                setDetail={setDetail}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerEmail={customerEmail}
                setCustomerEmail={setCustomerEmail}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Başlama tarixi</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bitmə tarixi</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Actions ── */}
        {showFormSection && (
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            {previewPrice !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-blue-900 font-semibold">
                Təxmini premium: {formatCurrency(previewPrice)}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>
        )}

        {showFormSection && (
          <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            <span className="shrink-0 mt-0.5">ℹ</span>
            <span>İrəli düyməsini sıxmaqla, siz bizə gedişatınızı yadda saxlamağa və məlumatlarınızın təhlükəsizliyini təmin etməyə kömək edirsiniz.</span>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/policies">
            <Button type="button" variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400">
              Əvvələ qayıt
            </Button>
          </Link>
          {showFormSection && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDetails({});
                  setCustomerName("");
                  setCustomerPhone("");
                  setCustomerEmail("");
                  setStartDate("");
                  setEndDate("");
                  setNotes("");
                  setPreviewPrice(null);
                  setError("");
                  setSearchMsg("");
                }}
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                Təmizlə
              </Button>
              {isPashaEvEsyalari && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/5"
                >
                  Polisi burax
                </Button>
              )}
              <Button type="submit" disabled={loading}
                className="bg-primary text-white hover:bg-primary/90 disabled:opacity-60">
                {loading ? "Göndərilir..." : isPashaEvEsyalari ? "Polisi yarat" : "İrəli"}
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Field helper ──────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, required, type = "text", placeholder, step,
}: {
  label: string; value: any; onChange: (v: string) => void; required?: boolean;
  type?: string; placeholder?: string; step?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value || ""}
        onChange={(e: any) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        step={step}
      />
    </div>
  );
}