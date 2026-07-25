export interface KnowledgeEntry {
  id: string;
  category: "migration" | "documents" | "jobs" | "tickets" | "maps" | "general";
  keywords: string[];
  title: string;
  content: string;
  actionHint?: string;
  link?: string;
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: "patent_rules",
    category: "migration",
    keywords: ["патент", "оплата патента", "чек патента", "срок патента", "налог патент"],
    title: "Правила оплаты и продления патента",
    content: "Патент на работу нужно оплачивать заранее (за 2-3 дня до даты чека). Просрочка хотя бы на 1 день приводит к аннулированию патента. Обязательно сохраняйте все бумажные и электронные чеки!",
    actionHint: "Календарь патента",
    link: "/tracker",
  },
  {
    id: "rule_90_180",
    category: "migration",
    keywords: ["90 180", "правило 90", "срок пребывания", "без визы", "дни пребывания"],
    title: "Правило пребывания 90/180",
    content: "Иностранные граждане без патента/РВП/ВНЖ могут находиться в РФ не более 90 дней в течение каждого периода 180 дней. Калькулятор VAQTA AI поможет рассчитать остаток разрешенных дней.",
    actionHint: "Рассчитать дни",
    link: "/tracker",
  },
  {
    id: "labor_contract",
    category: "documents",
    keywords: ["договор", "трудовой договор", "аудит договора", "штрафы", "удержания"],
    title: "Проверка трудового договора AI",
    content: "Трудовой договор должен содержать размер оклада, график работы, адрес и обязанности. Работодатель не имеет права изымать паспорт или оригиналы документов!",
    actionHint: "Проверить договор",
    link: "/contract-audit",
  },
  {
    id: "ocr_translation",
    category: "documents",
    keywords: ["перевод", "скан", "фото", "паспорт перевод", "перевести документ"],
    title: "Умный OCR перевод документов",
    content: "Загрузите фото паспорта, патента или справки в сканер VAQTA AI. Система автоматически распознает текст и переведет его на узбекский, таджикский, кыргызский или русский язык.",
    actionHint: "Открыть сканер",
    link: "/scanner",
  },
  {
    id: "employer_check",
    category: "jobs",
    keywords: ["работодатель", "проверка компании", "инн", "огрн", "мошенники"],
    title: "Безопасность и проверка компаний",
    content: "Перед устроительством на работу всегда проверяйте ИНН организации. Не платите деньги за 'гарантию трудоустройства' — это признак мошенничества.",
    actionHint: "Поиск вакансий",
    link: "/jobs-test",
  },
  {
    id: "tickets_info",
    category: "tickets",
    keywords: ["билет", "жд билет", "авиабилет", "поезд", "самолет", "рейс", "как доехать в ташкент"],
    title: "Покупка билетов онлайн",
    content: "VAQTA AI помогает искать ЖД и авиабилеты между Россией и Узбекистаном/ЦА через официальные сервисы: Яндекс Путешествия, Tutu.ru и Aviasales.",
    actionHint: "Поиск билетов",
  },
];

export function queryKnowledgeBase(query: string): KnowledgeEntry | null {
  const low = query.toLowerCase();
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.keywords.some((kw) => low.includes(kw))) {
      return entry;
    }
  }
  return null;
}