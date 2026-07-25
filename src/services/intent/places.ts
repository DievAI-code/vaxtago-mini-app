/**
 * Словарь POI-категорий (places of interest) и организаций.
 * Используется extractPlace() для извлечения entity.category.
 *
 * POI: аптека, больница, мечеть, банк, МФЦ, МВД и т.д.
 * ORG: Сбербанк, ВТБ, Газпромбанк, Магнит, Пятёрочка, Озон, Wildberries, Яндекс и др.
 */

export type PlaceCategory =
  | "pharmacy"
  | "hospital"
  | "clinic"
  | "cafe"
  | "restaurant"
  | "canteen"
  | "store"
  | "market"
  | "mosque"
  | "church"
  | "synagogue"
  | "bank"
  | "mfc"
  | "mvd"
  | "migration_center"
  | "post_office"
  | "notary"
  | "lawyer_office"
  | "station"
  | "airport"
  | "bus_station"
  | "metro"
  | "taxi"
  | "parking"
  | "gas_station"
  | "car_wash"
  | "car_service"
  | "hotel"
  | "hostel"
  | "dormitory"
  | "school"
  | "kindergarten"
  | "university"
  | "library"
  | "museum"
  | "theater"
  | "cinema"
  | "park"
  | "gym"
  | "stadium"
  | "swimming_pool"
  | "beauty_salon"
  | "barbershop"
  | "laundry"
  | "repair_shop"
  | "pharmacy_24h"
  | "ambulance"
  | "fire_station"
  | "police"
  | "embassy"
  | "consulate"
  | "insurance"
  | "tax_office"
  | "court"
  | "prison"
  | "factory"
  | "warehouse"
  | "construction_site"
  | "farm"
  | "military"
  | "border_crossing"
  | "bus_stop"
  | "taxi_stand"
  | "auto_market"
  | "animal_clinic"
  | "veterinary"
  | "pharmacy_chain"
  | "atm"
  | "currency_exchange"
  | "bus_depot"
  | "train_station"
  | "subway_station"
  | "transport_hub"
  | "ferry_terminal"
  | "bus_terminal"
  | "toll_booth"
  | "rest_area"
  | "weigh_station"
  | "auto_repair"
  | "tire_service"
  | "auto_parts"
  | "car_rental"
  | "car_wash_manual"
  | "other";

/** Категория → массив вариантов (RU/UZ/EN) */
export const PLACE_KEYWORDS: Record<PlaceCategory, string[]> = {
  pharmacy: ["аптека", "аптеку", "аптеки", "аптечный", "аптечная", "apteka", "aptekani", "aptekalar", "pharmacy", "pharmacies", "drugstore", "drug store", "chemist"],
  hospital: ["больница", "больницу", "больницы", "больничный", "kasalxona", "kasalxonani", "kasalxonalar", "shifoxona", "shifoxonani", "hospital", "hospitals"],
  clinic: ["поликлиника", "поликлинику", "поликлиники", "клиника", "клинику", "klinika", "poliklinika", "clinic", "clinics", "polyclinic"],
  cafe: ["кафе", "кафешка", "кафешечка", "kafe", "kafelar", "cafe", "cafes", "coffee shop", "coffeehouse"],
  restaurant: ["ресторан", "ресторана", "рестораны", "ресторанчик", "restoran", "restoranlar", "restaurant", "restaurants", "diner"],
  canteen: ["столовая", "столовой", "столовку", "stolovaya", "stolovani", "stolovayalar", "canteen", "canteens", "cafeteria"],
  store: ["магазин", "магазина", "магазины", "магазинчик", "лавка", "лавку", "magazin", "magazinlar", "do'kon", "dokon", "store", "stores", "shop", "shops", "market"],
  market: ["рынок", "рынка", "рынки", "базар", "базара", "базары", "bazar", "bozor", "bozori", "bozorlar", "market", "markets", "bazaar", "bazaars"],
  mosque: ["мечеть", "мечети", "мечетьы", "masjid", "masjidlar", "mosque", "mosques"],
  church: ["церковь", "церкви", "церкву", "храм", "храма", "храмы", "cherkov", "church", "churches", "temple"],
  synagogue: ["синагога", "синагоги", "синагогу", "sinagoga", "synagogue", "synagogues"],
  bank: ["банк", "банка", "банку", "банки", "банкомат", "bank", "banklar", "bankomat", "bank", "banks", "atm"],
  mfc: ["мфц", "мфц", "многофункциональный центр", "мфц", "mfc", "mfc", "mygov", "my gov", "multifunctional center"],
  mvd: ["мвд", "мвд", "увд", "овд", "полиция", "управление внутренних дел", "mvd", "mvd", "police", "police department"],
  migration_center: ["миграционный центр", "миграционка", "миграционный центр", "миграционной службы", "миграционка", "migratsiya markazi", "migration center", "migration service"],
  post_office: ["почта", "почту", "почты", "почта россии", "почтамт", "pochta", "pochta rossii", "post office", "post", "postal"],
  notary: ["нотариус", "нотариуса", "нотариусы", "нотариальная контора", "notarius", "notariuslar", "notary", "notary office"],
  lawyer_office: ["юридическая консультация", "юридические услуги", "юридическая фирма", "адвокатская контора", "yuridik maslahatxona", "law office", "law firm", "legal services"],
  station: ["вокзал", "вокзала", "вокзалы", "ж/д вокзал", "железнодорожный вокзал", "станция", "станции", "vokzal", "vokzal", "temir yo'l vokzali", "station", "train station", "railway station"],
  airport: ["аэропорт", "аэропорта", "аэропорты", "aeroport", "aeroport", "airport", "airports"],
  bus_station: ["автовокзал", "автостанция", "автостанцию", "автостанции", "avtovokzal", "avtostansiya", "bus station", "bus terminal", "coach station"],
  metro: ["метро", "метро", "станция метро", "metro", "metro stansiyasi", "metro", "subway", "underground", "metro station"],
  taxi: ["такси", "такси", "таксопарк", "taksi", "taksi", "taxi", "taxi stand", "taxi rank"],
  parking: ["парковка", "парковки", "стоянка", "стоянки", "parkovka", "avtoturargoh", "parking", "parking lot", "car park"],
  gas_station: ["азс", "заправка", "автозаправка", "бензоколонка", "azs", "yoqilg'i quyish stantsiyasi", "gas station", "petrol station", "fuel station"],
  car_wash: ["автомойка", "мойка", "мойка машин", "автомойку", "avtomoyka", "mashina yuvish", "car wash", "carwash", "wash"],
  car_service: ["автосервис", "сто", "станция техобслуживания", "автосервиса", "sto", "технический осмотр", "avtoservis", "ta'mirlash ustaxonasi", "car service", "auto service", "garage"],
  hotel: ["отель", "отеля", "отели", "гостиница", "гостиницы", "гостиницу", "mehmonxona", "mehmonxona", "otel", "hotel", "hotels", "inn"],
  hostel: ["хостел", "хостела", "хостелы", "hostel", "hostellar", "hostel", "hostels"],
  dormitory: ["общежитие", "общежития", "общага", "общагу", "yotoqxona", "yotoqxona", "dormitory", "dorms", "dorm"],
  school: ["школа", "школы", "школу", "школьный", "maktab", "maktab", "school", "schools", "lyceum", "gymnasium"],
  kindergarten: ["детский сад", "детский садик", "садик", "детсад", "bolalar bog'chasi", "bog'cha", "kindergarten", "daycare", "preschool"],
  university: ["университет", "университета", "вуз", "институт", "университеты", "oliygoh", "universitet", "institut", "university", "universities", "college"],
  library: ["библиотека", "библиотеки", "библиотеку", "kutubxona", "kutubxona", "library", "libraries"],
  museum: ["музей", "музея", "музеи", "muzey", "muzey", "museum", "museums", "gallery"],
  theater: ["театр", "театра", "театры", "teatr", "teatr", "theater", "theatre", "theaters", "theatres"],
  cinema: ["кинотеатр", "кино", "кинотеатры", "кинотеатра", "kinoteatr", "kino", "cinema", "cinemas", "movie theater", "movie theatre"],
  park: ["парк", "парка", "парки", "сквер", "бульвар", "bog'", "park", "park", "parks", "garden"],
  gym: ["спортзал", "тренажерный зал", "фитнес", "фитнес-клуб", "спортзалы", "sportzal", "fitnes", "gym", "gyms", "fitness", "fitness club"],
  stadium: ["стадион", "стадиона", "стадионы", "stadion", "stadion", "stadium", "stadiums", "arena"],
  swimming_pool: ["бассейн", "бассейна", "бассейны", "бассейн", "bassеyn", "suzish havzasi", "swimming pool", "pool", "pools"],
  beauty_salon: ["салон красоты", "бьюти салон", "салон", "go'zallik saloni", "beauty salon", "beauty", "salon"],
  barbershop: ["барбершоп", "барбер", "парикмахерская", "sartaroshxona", "barbershop", "barber", "barbershop"],
  laundry: ["прачечная", "прачка", "прачечная самообслуживания", "kir yuvish", "laundry", "laundromat", "washateria"],
  repair_shop: ["ремонтная мастерская", "ремонт обуви", "ремонт одежды", "ремонт техники", "ta'mirlash ustaxonasi", "repair shop", "shoe repair"],
  pharmacy_24h: ["аптека 24", "круглосуточная аптека", "24 apteka", "24-hour pharmacy", "24/7 pharmacy"],
  ambulance: ["скорая", "скорая помощь", "скорая медицинская", "тез yordam", "tez yordam mashinasi", "ambulance", "emergency", "paramedic"],
  fire_station: ["пожарная", "пожарная часть", "пожарные", "olov o'chirish", "yong'in o'chirish", "fire station", "fire department"],
  police: ["полиция", "полицию", "полиции", "полицейский участок", "полицейское управление", "politsiya", "politsiya", "police", "police station"],
  embassy: ["посольство", "посольства", "посольств", "elchixona", "elchixonasi", "embassy", "embassies"],
  consulate: ["консульство", "консульства", "konsullik", "konsulligi", "consulate", "consulates"],
  insurance: ["страховая", "страховая компания", "страховка", "страхование", "sug'urta", "sug'urta kompaniyasi", "insurance", "insurance company"],
  tax_office: ["налоговая", "налоговая инспекция", "инспекция фнс", "солиқ", "soliq inspeksiyasi", "tax office", "tax inspectorate", "irs"],
  court: ["суд", "суда", "суды", "судебный участок", "sud", "sud", "court", "courts", "tribunal"],
  prison: ["тюрьма", "тюрьмы", "тюрьму", "qamoqxona", "qamoqxona", "prison", "jail", "penitentiary"],
  factory: ["завод", "завода", "заводы", "фабрика", "фабрики", "фабрику", "zavod", "fabrika", "fabrikalar", "factory", "plant", "manufacturing"],
  warehouse: ["склад", "склада", "склады", "складской комплекс", "ombor", "omborxona", "warehouse", "warehouse complex"],
  construction_site: ["стройка", "стройплощадка", "строительная площадка", "qurilish maydonchasi", "construction site", "building site"],
  farm: ["ферма", "фермы", "ферму", "хозяйство", "fermа", "fermer xo'jaligi", "farm", "ranch"],
  military: ["военкомат", "военкомат", "воинская часть", "военный", "военная часть", "harbiy qism", "harbiy komissariat", "military", "military office", "draft board"],
  border_crossing: ["погранпункт", "граница", "погранпереход", "пограничный пункт", "chegara punkti", "chegara", "border crossing", "border checkpoint"],
  bus_stop: ["автобусная остановка", "остановка", "остановка автобуса", "avtobus bekati", "bekat", "bus stop", "bus station", "stop"],
  taxi_stand: ["стоянка такси", "taxi bekati", "taxi stand", "taxi rank", "taxi stand"],
  auto_market: ["авторынок", "авторынок", "avto bozor", "auto market", "car market"],
  animal_clinic: ["ветеринарная клиника", "ветклиника", "ветлечебница", "veterinar klinikasi", "animal clinic", "vet clinic"],
  veterinary: ["ветеринар", "ветеринара", "ветеринарный", "veterinar", "veterinar", "veterinary", "vet"],
  pharmacy_chain: ["аптека 36,6", "36,6", "аптека ру", "36.6", "36.6 pharmacy"],
  atm: ["банкомат", "банкомата", "банкоматы", "bankomat", "atm", "cash machine"],
  currency_exchange: ["обмен валют", "обменник", "пункт обмена валют", "valyuta ayirboshlash", "currency exchange", "exchange office"],
  bus_depot: ["автобаза", "автопарк", "avtobaza", "bus depot", "bus base"],
  train_station: ["ж/д станция", "железнодорожная станция", "поезд", "поезда", "temir yo'l stantsiyasi", "poezd", "train station", "railway station"],
  subway_station: ["станция метро", "метро", "metro bekati", "metro station", "subway station", "underground station"],
  transport_hub: ["транспортный узел", "транспортный хаб", "transport tuguni", "transport hub"],
  ferry_terminal: ["паромный терминал", "паром", "parom terminali", "ferry terminal", "ferry"],
  bus_terminal: ["автовокзал", "автостанция", "автобусный терминал", "avtobus terminali", "bus terminal"],
  toll_booth: ["пункт оплаты", "пункт взимания платы", "tol пункт", "to'lov punkti", "toll booth", "toll plaza"],
  rest_area: ["зона отдыха", "место отдыха", "парковка для отдыха", "dam olish zonasi", "rest area", "rest stop"],
  weigh_station: ["весовой контроль", "весовая", "весовой пункт", "vazn punkti", "weigh station", "weighbridge"],
  auto_repair: ["авторемонт", "ремонт автомобиля", "ремонт авто", "avto ta'mirlash", "auto repair", "car repair"],
  tire_service: ["шиномонтаж", "шиномонтаж", "shinomontaj", "tire service", "tyre fitting", "tire shop"],
  auto_parts: ["автозапчасти", "магазин автозапчастей", "запчасти", "avto ehtiyot qismlar", "auto parts", "car parts"],
  car_rental: ["прокат авто", "прокат машин", "аренда авто", "ijara avtomobil", "car rental", "rent a car"],
  car_wash_manual: ["ручная мойка", "ручная автомойка", "qo'lda yuvish", "manual car wash", "hand car wash"],
  other: [],
};

// Канонические отображаемые названия
export const PLACE_DISPLAY: Record<PlaceCategory, { ru: string; uz: string; en: string }> = {
  pharmacy: { ru: "аптека", uz: "apteka", en: "pharmacy" },
  hospital: { ru: "больница", uz: "kasalxona", en: "hospital" },
  clinic: { ru: "поликлиника", uz: "poliklinika", en: "clinic" },
  cafe: { ru: "кафе", uz: "kafe", en: "cafe" },
  restaurant: { ru: "ресторан", uz: "restoran", en: "restaurant" },
  canteen: { ru: "столовая", uz: "stolovaya", en: "canteen" },
  store: { ru: "магазин", uz: "magazin", en: "store" },
  market: { ru: "рынок", uz: "bozor", en: "market" },
  mosque: { ru: "мечеть", uz: "masjid", en: "mosque" },
  church: { ru: "церковь", uz: "cherkov", en: "church" },
  synagogue: { ru: "синагога", uz: "sinagoga", en: "synagogue" },
  bank: { ru: "банк", uz: "bank", en: "bank" },
  mfc: { ru: "МФЦ", uz: "MFC", en: "MFC" },
  mvd: { ru: "МВД", uz: "MVD", en: "police station" },
  migration_center: { ru: "миграционный центр", uz: "migratsiya markazi", en: "migration center" },
  post_office: { ru: "почта", uz: "pochta", en: "post office" },
  notary: { ru: "нотариус", uz: "notarius", en: "notary" },
  lawyer_office: { ru: "юридическая консультация", uz: "yuridik maslahatxona", en: "law office" },
  station: { ru: "вокзал", uz: "vokzal", en: "station" },
  airport: { ru: "аэропорт", uz: "aeroport", en: "airport" },
  bus_station: { ru: "автовокзал", uz: "avtovokzal", en: "bus station" },
  metro: { ru: "метро", uz: "metro", en: "metro" },
  taxi: { ru: "такси", uz: "taksi", en: "taxi" },
  parking: { ru: "парковка", uz: "avtoturargoh", en: "parking" },
  gas_station: { ru: "АЗС", uz: "AZS", en: "gas station" },
  car_wash: { ru: "автомойка", uz: "avtomoyka", en: "car wash" },
  car_service: { ru: "автосервис", uz: "avtoservis", en: "car service" },
  hotel: { ru: "отель", uz: "mehmonxona", en: "hotel" },
  hostel: { ru: "хостел", uz: "hostel", en: "hostel" },
  dormitory: { ru: "общежитие", uz: "yotoqxona", en: "dormitory" },
  school: { ru: "школа", uz: "maktab", en: "school" },
  kindergarten: { ru: "детский сад", uz: "bog'cha", en: "kindergarten" },
  university: { ru: "университет", uz: "universitet", en: "university" },
  library: { ru: "библиотека", uz: "kutubxona", en: "library" },
  museum: { ru: "музей", uz: "muzey", en: "museum" },
  theater: { ru: "театр", uz: "teatr", en: "theater" },
  cinema: { ru: "кинотеатр", uz: "kinoteatr", en: "cinema" },
  park: { ru: "парк", uz: "bog'", en: "park" },
  gym: { ru: "спортзал", uz: "sportzal", en: "gym" },
  stadium: { ru: "стадион", uz: "stadion", en: "stadium" },
  swimming_pool: { ru: "бассейн", uz: "bassеyn", en: "pool" },
  beauty_salon: { ru: "салон красоты", uz: "go'zallik saloni", en: "beauty salon" },
  barbershop: { ru: "барбершоп", uz: "sartaroshxona", en: "barbershop" },
  laundry: { ru: "прачечная", uz: "kir yuvish", en: "laundry" },
  repair_shop: { ru: "ремонтная мастерская", uz: "ta'mirlash ustaxonasi", en: "repair shop" },
  pharmacy_24h: { ru: "круглосуточная аптека", uz: "24 soat apteka", en: "24h pharmacy" },
  ambulance: { ru: "скорая помощь", uz: "tez yordam", en: "ambulance" },
  fire_station: { ru: "пожарная", uz: "yong'in o'chirish", en: "fire station" },
  police: { ru: "полиция", uz: "politsiya", en: "police" },
  embassy: { ru: "посольство", uz: "elchixona", en: "embassy" },
  consulate: { ru: "консульство", uz: "konsullik", en: "consulate" },
  insurance: { ru: "страховая", uz: "sug'urta", en: "insurance" },
  tax_office: { ru: "налоговая", uz: "soliq inspeksiyasi", en: "tax office" },
  court: { ru: "суд", uz: "sud", en: "court" },
  prison: { ru: "тюрьма", uz: "qamoqxona", en: "prison" },
  factory: { ru: "завод", uz: "zavod", en: "factory" },
  warehouse: { ru: "склад", uz: "ombor", en: "warehouse" },
  construction_site: { ru: "стройка", uz: "qurilish", en: "construction site" },
  farm: { ru: "ферма", uz: "ferma", en: "farm" },
  military: { ru: "военкомат", uz: "harbiy komissariat", en: "military office" },
  border_crossing: { ru: "граница", uz: "chegara", en: "border" },
  bus_stop: { ru: "остановка", uz: "bekat", en: "bus stop" },
  taxi_stand: { ru: "стоянка такси", uz: "taksi bekati", en: "taxi stand" },
  auto_market: { ru: "авторынок", uz: "avto bozor", en: "auto market" },
  animal_clinic: { ru: "ветклиника", uz: "veterinar klinikasi", en: "animal clinic" },
  veterinary: { ru: "ветеринар", uz: "veterinar", en: "veterinary" },
  pharmacy_chain: { ru: "аптека 36,6", uz: "36.6 apteka", en: "36.6 pharmacy" },
  atm: { ru: "банкомат", uz: "bankomat", en: "ATM" },
  currency_exchange: { ru: "обмен валют", uz: "valyuta ayirboshlash", en: "currency exchange" },
  bus_depot: { ru: "автобаза", uz: "avtobaza", en: "bus depot" },
  train_station: { ru: "ж/д вокзал", uz: "temir yo'l vokzali", en: "train station" },
  subway_station: { ru: "станция метро", uz: "metro bekati", en: "subway station" },
  transport_hub: { ru: "транспортный хаб", uz: "transport tuguni", en: "transport hub" },
  ferry_terminal: { ru: "паромный терминал", uz: "parom terminali", en: "ferry terminal" },
  bus_terminal: { ru: "автобусный терминал", uz: "avtobus terminali", en: "bus terminal" },
  toll_booth: { ru: "пункт оплаты", uz: "to'lov punkti", en: "toll booth" },
  rest_area: { ru: "зона отдыха", uz: "dam olish zonasi", en: "rest area" },
  weigh_station: { ru: "весовая", uz: "vazn punkti", en: "weigh station" },
  auto_repair: { ru: "авторемонт", uz: "avto ta'mirlash", en: "auto repair" },
  tire_service: { ru: "шиномонтаж", uz: "shinomontaj", en: "tire service" },
  auto_parts: { ru: "автозапчасти", uz: "avto ehtiyot qismlar", en: "auto parts" },
  car_rental: { ru: "прокат авто", uz: "ijara avtomobil", en: "car rental" },
  car_wash_manual: { ru: "ручная автомойка", uz: "qo'lda yuvish", en: "manual car wash" },
  other: { ru: "место", uz: "joy", en: "place" },
};

// ────────────────────────────────────────────────────────────────────
// Словарь организаций
// ────────────────────────────────────────────────────────────────────
export const ORG_KEYWORDS: Record<string, string[]> = {
  "Сбербанк": ["сбербанк", "сбер", "сбербанк онлайн", "sberbank", "sber"],
  "Сбер": ["сбер", "sber"],
  "ВТБ": ["втб", "втб банк", "vtabank", "vtb", "v tb"],
  "Альфа-Банк": ["альфа банк", "альфа-банк", "альфа", "alfabank", "alpha bank", "alfa bank", "alfa"],
  "Тинькофф": ["тинькофф", "тинькофф банк", "т-банк", "т банк", "tinkoff", "t bank", "t-bank", "tbank"],
  "Т-Банк": ["т-банк", "т банк", "t bank", "t-bank", "tbank"],
  "Газпромбанк": ["газпромбанк", "газпром", "gazprombank", "gazprom"],
  "Россельхозбанк": ["россельхозбанк", "рсхб", "rosselkhazbank", "rshb"],
  "Райффайзенбанк": ["райффайзен", "райффайзенбанк", "raiffeisen", "raiffeisenbank"],
  "МТС Банк": ["мтс банк", "мтс", "mts bank", "mts"],
  "Совкомбанк": ["совкомбанк", "совком", "sovcombank", "sovcom"],
  "Хоум Кредит": ["хоум кредит", "хоум кредит банк", "home credit", "homecredit"],
  "Почта Банк": ["почта банк", "pochta bank"],
  "Уралсиб": ["уралсиб", "uralsib"],
  "Промсвязьбанк": ["промсвязьбанк", "псб", "promsvyazbank", "psb"],
  "Росбанк": ["росбанк", "rosbank"],
  "Открытие": ["открытие", "открытие банк", "открытие fc", "open bank", "openbank"],
  "Ситибанк": ["ситибанк", "сити", "citibank", "citi"],
  "УБРиР": ["убрир", "убрир банк", "ubrir"],
  "МФЦ": ["мфц", "многофункциональный центр", "mfc", "mygov"],
  "МВД": ["мвд", "увд", "управление внутренних дел", "mvd"],
  "ПФР": ["пфр", "пенсионный фонд", "pension fund"],
  "ФНС": ["фнс", "налоговая", "инспекция", "фнс инспекция", "irs"],
  "ФСС": ["фсс", "соцстрах", "социальное страхование", "fss"],
  "СФР": ["сфр", "социальный фонд россии", "social fund"],
  "Росреестр": ["росреестр", "rosreestr", "реестр"],
  "Ростехнадзор": ["ростехнадзор", "gostehnadzor"],
  "Роспотребнадзор": ["роспотребнадзор", "потребнадзор", "rpn"],
  "Почта России": ["почта россии", "почта рф", "russian post", "pochta rossii", "почта"],
  "Ozon": ["озон", "ozon", "ozon.ru"],
  "Wildberries": ["wildberries", "wb", "вайлдберриз", "вайлдберрис", "wb.ru"],
  "Яндекс": ["яндекс", "yandex", "ya.ru", "yandex.ru"],
  "Яндекс Маркет": ["яндекс маркет", "yandex market"],
  "Яндекс Еда": ["яндекс еда", "yandex eda", "яндекс eda"],
  "Яндекс Такси": ["яндекс такси", "yandex taxi", "яндекс go", "yandex go"],
  "Яндекс Лавка": ["яндекс лавка", "yandex lavka"],
  "Магнит": ["магнит", "магнит косметик", "magnit", "magnit cosmetic"],
  "Пятёрочка": ["пятёрочка", "пятерочка", "5ka", "pyaterochka", "5ka"],
  "Лента": ["лента", "lenta", "lenta.ru"],
  "Fix Price": ["fix price", "фикс прайс", "фикс-прайс", "fixprice"],
  "Ашан": ["ашан", "auchan", "auchan россия"],
  "Перекрёсток": ["перекрёсток", "перекресток", "perekrestok"],
  "ВкусВилл": ["вкусвилл", "вкус вилл", "vkusvill"],
  "СберМаркет": ["сбермаркет", "sbermarket", "delivery club", "deliveryclub"],
  "Купер": ["купер", "kuper", "купер ex sbermarket"],
  "Самокат": ["самокат", "samokat"],
  "Вкусно и точка": ["вкусно и точка", "вкусно — и точка", "vkusno i tochka", "бывшая макдональдс", "бывший макдак"],
  "KFC": ["kfc", "кфс", "k f c"],
  "Burger King": ["burger king", "бургер кинг", "bk"],
  "Макдоналдс": ["макдоналдс", "макдак", "mcdonalds", "mcd"],
  "Subway": ["subway", "сабвей", "subvей"],
  "Dodo Pizza": ["додо пицца", "dodo pizza", "dodo"],
  "Папа Джонс": ["папа джонс", "papa johns"],
  "СДЭК": ["сдэк", "cdek", "сдэк-маркет"],
  "Boxberry": ["boxberry", "боксберри"],
  "DPD": ["dpd"],
  "Пони Экспресс": ["пони экспресс", "pony express", "ponyexpress"],
  "СДП": ["сдп"],
  "Деловые Линии": ["деловые линии", "бизнес линии", "dellin", "business lines"],
  "ПЭК": ["пэк", "pek", "первая экспедиционная компания"],
  "Энергия": ["энергия", "energiya"],
  "DHL": ["dhl"],
  "FedEx": ["fedex", "fed ex"],
  "UPS": ["ups"],
  "Yandex Go": ["yandex go", "яндекс go"],
  "Ситимобил": ["ситимобил", "citymobil", "city mobile"],
  "Такси Максим": ["такси максим", "maxim", "такси максим", "taxi maxim"],
  "Везёт": ["везёт", "vezet", "vezyot"],
  "Uber": ["uber", "убер"],
  "Bla Bla Car": ["бла бла кар", "blablacar", "bla bla car"],
  "Мегафон": ["мегафон", "megafon"],
  "МТС": ["мтс", "mts"],
  "Билайн": ["билайн", "beeline"],
  "Теле2": ["теле2", "tele2", "tele 2"],
  "Yota": ["yota", "йота"],
  "Ростелеком": ["ростелеком", "rostelecom"],
  "МТС Деньги": ["мтс деньги", "mts money"],
  "СберМобайл": ["сбермобайл", "sbermobile"],
  "Тинькофф Мобайл": ["тинькофф мобайл", "tinkoff mobile"],
  "Билайн ТВ": ["билайн тв", "beeline tv"],
  "Кинопоиск": ["кинопоиск", "kinopoisk", "yandex kinopoisk"],
  "OKKO": ["окко", "okko"],
  "IVI": ["ivi"],
  "Netflix": ["netflix", "нетфликс"],
  "Амедиатека": ["амедиатека", "amediateka"],
  "Premier": ["premier", "премьер", "premier one"],
  "HeadHunter": ["headhunter", "хедхантер", "hh", "hh.ru"],
  "SuperJob": ["superjob", "super job", "суперджоб"],
  "Работа.ру": ["работа.ру", "rabota.ru", "rabota"],
  "Avito": ["авито", "avito", "avito.ru"],
  "Юла": ["юла", "youla", "yula"],
  "ЦИАН": ["циан", "cian"],
  "ДомКлик": ["домклик", "domclick", "дом клик"],
  "ПИК": ["пик", "pik", "pik group"],
  "Самолёт": ["самолёт", "samolet", "samolet group"],
  "Самолет Плюс": ["самолет плюс", "samolet plus"],
  "Яндекс Недвижимость": ["яндекс недвижимость", "yandex realty"],
  "Авиакомпания Аэрофлот": ["аэрофлот", "aeroflot"],
  "Авиакомпания S7": ["s7 airlines", "s7", "s7 airlines"],
  "Авиакомпания Уральские авиалинии": ["уральские авиалинии", "ural airlines", "urala"],
  "Авиакомпания Победа": ["победа", "pobeda", "pobeda airlines"],
  "Авиакомпания Utair": ["utair", "ютэйр", "ютейр"],
  "Авиакомпания Россия": ["авиакомпания россия", "rossiya airlines"],
  "Узбекские авиалинии": ["узбекские авиалинии", "uzbekistan airways", "uza", "ha"],
  "РЖД": ["ржд", "российские железные дороги", "russian railways", "rzd"],
  "Аэроэкспресс": ["аэроэкспресс", "aeroexpress"],
  "СДЭК Маркет": ["сдэк маркет", "cdek market"],
  "Ozon Fresh": ["ozon fresh", "озон fresh", "озон фреш"],
  "Ozon Bank": ["ozon bank", "озон bank"],
};

/**
 * Находит категорию POI в тексте.
 * Возвращает { category, display, raw } или null.
 */
export function findPlaceInText(lowText: string): { category: PlaceCategory; display: { ru: string; uz: string; en: string }; raw: string } | null {
  // Сортируем по длине ключевого слова — длинные первыми ("круглосуточная аптека" раньше "аптека")
  const entries: Array<{ category: PlaceCategory; keyword: string }> = [];
  for (const [category, keywords] of Object.entries(PLACE_KEYWORDS) as [PlaceCategory, string[]][]) {
    for (const kw of keywords) {
      if (kw) entries.push({ category, keyword: kw });
    }
  }
  entries.sort((a, b) => b.keyword.length - a.keyword.length);

  for (const { category, keyword } of entries) {
    if (!keyword) continue;
    const re = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(lowText)) {
      return {
        category,
        display: PLACE_DISPLAY[category],
        raw: keyword,
      };
    }
  }
  return null;
}

/**
 * Находит организацию в тексте.
 * Возвращает { name, raw } или null.
 */
export function findOrgInText(lowText: string): { name: string; raw: string } | null {
  const entries: Array<{ name: string; keyword: string }> = [];
  for (const [name, keywords] of Object.entries(ORG_KEYWORDS)) {
    for (const kw of keywords) {
      if (kw) entries.push({ name, keyword: kw });
    }
  }
  entries.sort((a, b) => b.keyword.length - a.keyword.length);

  for (const { name, keyword } of entries) {
    const re = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(lowText)) {
      return { name, raw: keyword };
    }
  }
  return null;
}