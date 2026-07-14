// Paşa Sığorta — bonus/komissiya cədvəli (göndərilən Excel əsasında)

export type PashaGroup = "MİNİK" | "YÜK" | "Əmlak" | "Yaşıl kart";

export type PashaRow = {
  id: string;
  group: PashaGroup;
  label: string;        // mühərrik həcmi / çəki / növ
  dqn?: string;         // region / DQN şərti
  year?: string;        // buraxılış ili şərti
  note?: string;        // xüsusi qeyd / markalar / QADAĞA
  commission: number;   // komissiya %
};

export const PASHA_ROWS: PashaRow[] = [
  // ── MİNİK ── (komissiyalar hələlik 0 — admin özü təyin edəcək)
  { id: "m_0_1500_a", group: "MİNİK", label: "0–1500 sm³", year: "2022-dən", note: "Honda, Nissan, KİA, Chevrolet, Toyota, Changan, BYD, FİAT — QADAĞA", commission: 0 },
  { id: "m_0_1500_b", group: "MİNİK", label: "0–1500 sm³", note: "Yalnız Sovet avtomobilləri yazılır", commission: 0 },
  { id: "m_1501_reg", group: "MİNİK", label: "1501–2000 sm³", dqn: "Region", year: "2002-dən aşağı", note: "Yalnız Sovet avtomobilləri yazılır", commission: 0 },
  { id: "m_1501_bak", group: "MİNİK", label: "1501–2000 sm³", dqn: "Abşeron, Bakı, Sumqayıt, Gəncə", year: "2020-dən", note: "Chevrolet, Ford, GreatWall, Jetour, Lada, Renault, VGV, Honda, BMW, Faw, Khazar, Jeep, Kia, Volkswagen — QADAĞA", commission: 0 },
  { id: "m_2001_reg", group: "MİNİK", label: "2001–2500 sm³", dqn: "Region", year: "2002-dən", note: "Toyota, QAZ — QADAĞA", commission: 0 },
  { id: "m_2001_bak", group: "MİNİK", label: "2001–2500 sm³", dqn: "Abşeron, Bakı, Sumqayıt, Gəncə", year: "2017-dən", note: "Toyota, QAZ — QADAĞA", commission: 0 },
  { id: "m_2501_bak", group: "MİNİK", label: "2501–3000 sm³", dqn: "Abşeron, Bakı, Sumqayıt, Gəncə", year: "2020-dən", note: "Audi, BMW, Ford, Hyundai, Land Rover, Porshe", commission: 0 },
  { id: "m_2501_reg", group: "MİNİK", label: "2501–3000 sm³", dqn: "Region", note: "ÜMUMİ QADAĞA", commission: 0 },
  { id: "m_3001", group: "MİNİK", label: "3001–3500 sm³", commission: 0 },
  { id: "m_3501", group: "MİNİK", label: ">3501 sm³", commission: 0 },

  // ── YÜK ──
  { id: "y_elektro", group: "YÜK", label: "Elektromobil", note: "Tesla, Zeekr, Chevrolet, Dazun, DongFeng, Toyota, MG — QADAĞA", commission: 5 },
  { id: "y_0_3500", group: "YÜK", label: "0–3500 kg", note: "Mercedes, Chevrolet, Dacia, Ford Tranzit — QADAĞA", commission: 5 },
  { id: "y_3501_7000", group: "YÜK", label: "3501–7000 kq", note: "ÜMUMİ QADAĞA", commission: 0 },
  { id: "y_7000", group: "YÜK", label: "7000 kg-dan yuxarı", commission: 10 },
  { id: "y_qosqu", group: "YÜK", label: "Qoşqu", note: "Dartıcısız QADAĞA", commission: 5 },
  { id: "y_agir", group: "YÜK", label: "Ağır, Xüsusi təyinatlı", commission: 5 },

  // ── Əmlak ──
  { id: "e_fiziki", group: "Əmlak", label: "İcbari Fiziki şəxslər", commission: 5 },
  { id: "e_huquqi", group: "Əmlak", label: "İcbari Hüquqi şəxslər", commission: 5 },

  // ── Yaşıl kart ──
  { id: "yk", group: "Yaşıl kart", label: "Könüllü", commission: 5 },
];

export const PASHA_GROUPS: PashaGroup[] = ["MİNİK", "YÜK", "Əmlak", "Yaşıl kart"];

// Marka istinadı — kateqoriyaya görə (H–M sütunları)
export const PASHA_BRANDS: { category: string; brands: string[] }[] = [
  { category: "0–1500", brands: ["BYD", "Changan", "Chevrolet", "FIAT", "Honda", "KIA", "Nissan", "Toyota"] },
  { category: "1501–2000", brands: ["BMW", "Chevrolet", "FAW", "Ford", "GreatWall", "Honda", "Jeep", "Jetour", "Khazar", "Kia", "Lada", "Renault", "VGV", "Volkswagen"] },
  { category: "2001–2500", brands: ["Toyota", "QAZ"] },
  { category: "2501–3000", brands: ["Audi", "BMW", "Ford", "Hyundai", "Land Rover", "Porshe"] },
  { category: "Elektromobil", brands: ["Tesla", "Zeekr", "Chevrolet", "Dazun", "DongFeng", "Toyota", "MG"] },
  { category: "YÜK 0–3500 kq", brands: ["Mercedes", "Chevrolet", "Dacia", "Ford Tranzit"] },
];
