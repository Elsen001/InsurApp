// Sığorta məhsullarının paylaşılan siyahısı (bonus təyini və s. üçün)
// policies/new səhifəsindəki kataloqla eyni dəyərlər.

export type ProductItem = { value: string; label: string };
export type ProductGroup = { key: string; label: string; items: ProductItem[] };

export const PRODUCT_GROUPS: ProductGroup[] = [
  {
    key: "icbari",
    label: "İcbari sığorta növləri",
    items: [
      { value: "avtonəqliyyat", label: "Avtonəqliyyat vasitəsi sahiblərinin mülki məsuliyyətinin icbari sığortası" },
      { value: "daşınmaz_əmlak", label: "Daşınmaz əmlakın icbari sığortası" },
      { value: "dəimmis", label: "Daşınmaz əmlakın istismarı ilə bağlı mülki məsuliyyət – DƏİMMİS" },
      { value: "peşə_əmək", label: "İstehsalatda bədbəxt hadisələr və peşə xəstəlikləri icbari sığortası" },
      { value: "sərnişin", label: "Sərnişinlərin icbari fərdi qəza sığortası" },
      { value: "auditor", label: "Auditorların Peşə Məsuliyyətinin İcbari Sığortası" },
      { value: "yaşıl_kart", label: "Yaşıl Kart" },
    ],
  },
  {
    key: "könüllü",
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

// Düz siyahı və value→label lüğəti
export const ALL_PRODUCTS: ProductItem[] = PRODUCT_GROUPS.flatMap((g) => g.items);

export const PRODUCT_LABELS: Record<string, string> = Object.fromEntries(
  ALL_PRODUCTS.map((p) => [p.value, p.label])
);
