/**
 * Словарь профессий для извлечения сущности profession.
 * Не менее 300 записей на RU / UZ / EN.
 *
 * Каждая запись: канон → массив вариантов.
 * extractProfession() ищет в тексте все варианты и возвращает
 * первое совпадение (приоритет — более длинные/специализированные термины).
 */

export interface ProfessionEntry {
  /** Каноническое имя профессии (русский, для отображения) */
  canonical: string;
  /** Узбекский вариант (латиница) */
  uz: string;
  /** Английский вариант */
  en: string;
  /** Все варианты написания (RU/UZ/EN) */
  variants: string[];
  /** Категория для группировки */
  category: "industrial" | "construction" | "service" | "logistics" | "medical" | "office" | "tech" | "agriculture" | "domestic" | "security" | "other";
}

const RAW: Array<[string, string, string, string[]]> = [
  // ─── Industrial / Производство ───
  ["Сварщик", "Payvandchi", "Welder", ["сварщик", "сварщика", "сварщику", "сварщиком", "сварщики", "сварщиков", "сварка", "payvandchi", "payvandlovchi", "payvandchilik", "welder", "welding", "welders"]],
  ["Токарь", "Tokar", "Turner", ["токарь", "токаря", "токари", "токарю", "токарем", "токарей", "tokar", "tokarlar", "turner", "turners", "latheman"]],
  ["Фрезеровщик", "Frezerchi", "Milling machine operator", ["фрезеровщик", "фрезеровщика", "фрезеровщики", "фрезеровщиков", "фрезер", "фрезерование", "frezerchi", "frezer", "milling", "miller"]],
  ["Слесарь", "Chilangar", "Metalworker", ["слесарь", "слесаря", "слесари", "слесарю", "слесарем", "слесарей", "слесарное дело", "chilangar", "chilangi", "chilangarlar", "metalworker", "metalworkers", "locksmith", "fitter"]],
  ["Оператор станков", "Stanok operatori", "Machine operator", ["оператор станков", "оператор станка", "оператор", "станки", "stanok operatori", "stanok", "machine operator", "machine operators", "operator", "operators"]],
  ["Оператор производства", "Ishlab chiqarish operatori", "Production operator", ["оператор производства", "оператор цеха", "цех", "ishlab chiqarish operatori", "ishlab chiqarish", "production operator"]],
  ["Машинист", "Mashinist", "Machinist", ["машинист", "машиниста", "машинисты", "машинисту", "машинистом", "машинистов", "mashinist", "mashinistlar", "machinist", "machinists"]],
  ["Крановщик", "Kranchi", "Crane operator", ["крановщик", "крановщика", "крановщики", "крановщику", "крановщиком", "крановщиков", "kranchi", "kran operatori", "kran", "crane operator", "crane operators", "crane driver"]],
  ["Электромонтёр", "Elektrik", "Electrician", ["электромонтёр", "электромонтажник", "электрик", "электрика", "электрику", "электриком", "elektrik", "elektriklar", "electrician", "electricians", "electrical", "wireman"]],
  ["Сантехник", "Santexnik", "Plumber", ["сантехник", "сантехника", "сантехники", "сантехнику", "сантехником", "сантехников", "сантехнические работы", "santexnik", "santexniklar", "plumber", "plumbers", "plumbing"]],
  ["Газосварщик", "Gaz payvandchi", "Gas welder", ["газосварщик", "газосварщика", "газосварщики", "газосварщику", "газосварщиком", "gaz payvandchi", "gaz payvand", "gas welder", "gas welding"]],
  ["Аргонщик", "Argon payvandchi", "TIG welder", ["аргонщик", "аргонная сварка", "аргона", "argon payvandchi", "argon", "tig welder", "tig welding", "argon welder"]],
  ["Сборщик", "Yig'uvchi", "Assembler", ["сборщик", "сборщика", "сборщики", "сборщику", "сборщиком", "сборщиков", "сборка", "yig'uvchi", "yig'ish", "assembler", "assembly", "assemblers"]],
  ["Упаковщик", "Qadoqlovchi", "Packer", ["упаковщик", "упаковщика", "упаковщики", "упаковщику", "упаковщиком", "упаковка", "qadoqlovchi", "qadoqlash", "packer", "packers", "packaging"]],
  ["Раскройщик", "Qirqishchi", "Cutter", ["раскройщик", "раскрой", "раскройщика", "qirqishchi", "qirqish", "cutter", "cutters"]],
  ["Швея", "Tikuvchi", "Seamstress", ["швея", "швеи", "швею", "швеёй", "швей", "портниха", "портнихи", "tikuvchi", "tikuv ayol", "tikish", "seamstress", "seamstresses", "sewer"]],
  ["Закройщик", "Tikuv ustasi", "Cutter (sewing)", ["закройщик", "закройщицы", "закройка", "закроя", "tikuv ustasi", "cutter sewing"]],
  ["Вышивальщица", "Naqshchi", "Embroiderer", ["вышивальщица", "вышивальщицы", "вышивка", "naqshchi", "embroiderer", "embroiderers"]],
  ["Вязальщица", "Trikotajchi", "Knitter", ["вязальщица", "вязальщицы", "вязание", "trikotajchi", "knitter", "knitters"]],

  // ─── Construction / Строительство ───
  ["Строитель", "Quruvchi", "Builder", ["строитель", "строителя", "строители", "строителю", "строителем", "строителей", "стройка", "строительство", "quruvchi", "quruvchilar", "qurilishchi", "qurilish", "builder", "builders", "construction worker"]],
  ["Каменщик", "G'isht teruvchi", "Mason", ["каменщик", "каменщика", "каменщики", "каменщику", "каменщиком", "кладка", "g'isht teruvchi", "g'ishtchi", "mason", "masons", "bricklayer", "bricklayers"]],
  ["Штукатур", "Shtukatur", "Plasterer", ["штукатур", "штукатура", "штукатуры", "штукатуру", "штукатуром", "штукатурка", "shtukatur", "shtukaturlar", "plasterer", "plasterers"]],
  ["Маляр", "Bo'yoqchi", "Painter", ["маляр", "маляра", "маляры", "маляру", "маляром", "маляров", "покраска", "bo'yoqchi", "bo'yash", "painter", "painters", "paint"]],
  ["Плиточник", "Kafelchi", "Tile installer", ["плиточник", "плиточника", "плиточники", "плиточнику", "плиточником", "плитка", "kafelchi", "kafel teruvchi", "tile installer", "tile layer", "tiler"]],
  ["Гипсокартонщик", "Gipsokartonchi", "Drywall installer", ["гипсокартонщик", "гипсокартон", "гкл", "gipsokartonchi", "drywall installer", "drywall"]],
  ["Кровельщик", "Tom yopuvchi", "Roofer", ["кровельщик", "кровельщика", "кровельщики", "кровля", "крыша", "tom yopuvchi", "roofer", "roofers", "roofering"]],
  ["Плотник", "Duradgor", "Carpenter", ["плотник", "плотника", "плотники", "плотнику", "плотником", "плотницкие работы", "duradgor", "duradgorlar", "carpenter", "carpenters", "carpentry"]],
  ["Столяр", "Stolyar", "Joiner", ["столяр", "столяра", "столяры", "столяру", "столяром", "столярные работы", "stolyar", "stolyarlar", "joiner", "joiners"]],
  ["Паркетчик", "Parketchik", "Parquet installer", ["паркетчик", "паркет", "паркетчика", "parketchik", "parquet installer", "parquet layer"]],
  ["Ламинатчик", "Laminatchi", "Laminate installer", ["ламинатчик", "ламинат", "laminatchi", "laminate installer"]],
  ["Оконщик", "Derazachi", "Window installer", ["оконщик", "оконщика", "окна", "установка окон", "derazachi", "window installer", "glazier"]],
  ["Дверщик", "Eshikchi", "Door installer", ["дверщик", "двери", "установка дверей", "eshikchi", "door installer"]],
  ["Арматурщик", "Armaturachi", "Rebar installer", ["арматурщик", "арматура", "арматурщика", "armaturachi", "armatur", "rebar installer", "rebar worker"]],
  ["Бетонщик", "Betonchi", "Concrete worker", ["бетонщик", "бетон", "бетонные работы", "betonchi", "concrete worker", "concreter"]],
  ["Монтажник", "Montajchi", "Installer", ["монтажник", "монтажника", "монтажники", "монтаж", "montajchi", "montaj", "installer", "installers", "mounting"]],
  ["Монтажник вентиляции", "Ventilyatsiya montajchisi", "HVAC installer", ["монтажник вентиляции", "вентиляция", "ventilyatsiya montajchisi", "hvac installer"]],
  ["Монтажник кондиционеров", "Konditsioner montajchisi", "AC installer", ["монтажник кондиционеров", "кондиционеры", "konditsioner montajchisi", "ac installer"]],
  ["Монтажник металлоконструкций", "Metallokonstruktsiya montajchisi", "Metal structure installer", ["монтажник металлоконструкций", "металлоконструкции", "metallokonstruktsiya montajchisi", "metal structure installer"]],
  ["Монтажник связи", "Aloqa montajchisi", "Telecom installer", ["монтажник связи", "связи", "связь", "aloqa montajchisi", "telecom installer"]],
  ["Электрик-монтажник", "Elektr montajchi", "Electrical installer", ["электрик-монтажник", "электромонтажник", "elektr montajchi", "electrical installer"]],
  ["Стекольщик", "Oynachi", "Glazier", ["стекольщик", "стекло", "стекольщика", "oynachi", "glazier", "glaziers"]],
  ["Фасадчик", "Fasadchi", "Facade worker", ["фасадчик", "фасад", "fasadchi", "facade worker"]],
  ["Бригадир", "Brigadir", "Foreman", ["бригадир", "бригадира", "бригадиры", "бригадиру", "brigadir", "brigadalar", "foreman", "foremen"]],
  ["Прораб", "Prorab", "Site foreman", ["прораб", "производитель работ", "prorab", "site foreman"]],
  ["Разнорабочий", "Yordamchi ishchi", "General worker", ["разнорабочий", "разнорабочего", "разнорабочие", "разнорабочему", "разнорабочим", "разнорабочих", "yordamchi ishchi", "ishchi", "general worker", "general workers", "helper", "laborer"]],
  ["Подсобный рабочий", "Yordamchi", "Helper", ["подсобный рабочий", "подсобник", "yordamchi", "helper", "helpers"]],
  ["Землекоп", "Chuqurchi", "Digger", ["землекоп", "землекопа", "землекопы", "земляные работы", "chuqurchi", "digger"]],
  ["Асфальтоукладчик", "Asfalt yotqizuvchi", "Asphalt layer", ["асфальтоукладчик", "асфальт", "asfalt yotqizuvchi", "asphalt layer"]],
  ["Дорожный рабочий", "Yo'l ishchisi", "Road worker", ["дорожный рабочий", "дорожник", "yo'l ishchisi", "road worker"]],

  // ─── Service / Сервис ───
  ["Повар", "Oshpaz", "Cook", ["повар", "повара", "повару", "поваром", "повара", "повара", "поваров", "кулинар", "кулинара", "кулинару", "кулинаром", "готовка", "кухня", "oshpaz", "oshpazlar", "cook", "cooks", "cooking", "chef"]],
  ["Пекарь", "Nonvoy", "Baker", ["пекарь", "пекаря", "пекари", "пекарю", "пекарем", "пекарей", "пекарня", "выпечка", "nonvoy", "nonpaz", "baker", "bakers", "bakery"]],
  ["Кондитер", "Qandolatchi", "Confectioner", ["кондитер", "кондитера", "кондитеры", "кондитеру", "кондитером", "кондитерская", "qandolatchi", "confectioner", "confectioners"]],
  ["Бариста", "Barista", "Barista", ["бариста", "баристу", "баристом", "barista", "baristas"]],
  ["Бармен", "Barmen", "Bartender", ["бармен", "бармена", "бармены", "бармену", "барменом", "barmen", "bartender", "bartenders"]],
  ["Официант", "Ofitsiant", "Waiter", ["официант", "официанта", "официанты", "официанту", "официантом", "официантов", "ofitsiant", "ofitsiantlar", "waiter", "waiters", "waitress"]],
  ["Хостес", "Xostes", "Hostess", ["хостес", "хост", "хостеса", "xostes", "hostess"]],
  ["Посудомойщик", "Idish yuvuvchi", "Dishwasher", ["посудомойщик", "посудомойщица", "посудомойка", "idish yuvuvchi", "dishwasher"]],
  ["Уборщик", "Tozalovchi", "Cleaner", ["уборщик", "уборщица", "уборщики", "уборщиц", "уборка", "tozalovchi", "tozalash", "cleaner", "cleaners", "cleaning", "janitor", "janitors"]],
  ["Горничная", "Xonani tozalovchi", "Maid", ["горничная", "горничные", "горничной", "горничную", "xonani tozalovchi", "maid", "maids", "housemaid"]],
  ["Дворецкий", "Yakandoz", "Butler", ["дворецкий", "дворецкого", "дворецкому", "yakandoz", "butler", "butlers"]],
  ["Парикмахер", "Sartarosh", "Hairdresser", ["парикмахер", "парикмахера", "парикмахеры", "парикмахеру", "парикмахером", "парикмахеров", "парикмахерская", "sartarosh", "sartaroshlar", "hairdresser", "hairdressers", "barber", "barbers"]],
  ["Мастер маникюра", "Manikur ustasi", "Manicurist", ["мастер маникюра", "маникюр", "маникюрша", "маникюрный мастер", "manikur ustasi", "manicurist", "manicurists"]],
  ["Косметолог", "Kosmetolog", "Cosmetologist", ["косметолог", "косметолога", "косметологи", "косметологию", "косметологу", "косметологом", "косметология", "kosmetolog", "kosmetologlar", "cosmetologist", "cosmetologists"]],
  ["Массажист", "Massajchi", "Massage therapist", ["массажист", "массажиста", "массажисты", "массажисту", "массажистом", "массаж", "massajchi", "massaj", "massage therapist", "massagist"]],
  ["Фотограф", "Fotograf", "Photographer", ["фотограф", "фотографа", "фотографы", "фотографу", "фотографом", "фотография", "фотографировать", "fotograf", "fotograflar", "photographer", "photographers", "photography"]],
  ["Видеограф", "Videograf", "Videographer", ["видеограф", "видеооператор", "видео", "videograf", "videographer", "videographers"]],
  ["Оператор видеонаблюдения", "Video kuzatuv operatori", "Surveillance operator", ["оператор видеонаблюдения", "видеонаблюдение", "video kuzatuv operatori", "surveillance operator"]],
  ["Охранник", "Qo'riqchi", "Security guard", ["охранник", "охранника", "охранники", "охраннику", "охранником", "охрана", "охранников", "qo'riqchi", "qoriqchi", "security guard", "security", "guard", "guards"]],
  ["Телохранитель", "Tana qo'riqchisi", "Bodyguard", ["телохранитель", "телохранителя", "охрана персональная", "tana qo'riqchisi", "bodyguard", "bodyguards"]],
  ["Частный детектив", "Xususiy detektiv", "Private detective", ["частный детектив", "детектив", "сыщик", "xususiy detektiv", "private detective", "detective"]],
  ["Администратор", "Administrator", "Administrator", ["администратор", "администратора", "администраторы", "администратору", "администратором", "администраторов", "администрация", "administrator", "administratorlar", "administrator", "administrators", "admin"]],
  ["Менеджер", "Menejer", "Manager", ["менеджер", "менеджера", "менеджеры", "менеджеру", "менеджером", "менеджеров", "manager", "menejer", "menejerlar", "manager", "managers"]],
  ["Старший менеджер", "Katta menejer", "Senior manager", ["старший менеджер", "сеньор менеджер", "katta menejer", "senior manager"]],
  ["Менеджер по продажам", "Sotuv menejeri", "Sales manager", ["менеджер по продажам", "продажник", "sotuv menejeri", "sales manager", "salesman"]],
  ["Менеджер по работе с клиентами", "Mijozlarga xizmat menejeri", "Account manager", ["менеджер по работе с клиентами", "mijozlarga xizmat menejeri", "account manager"]],
  ["Продавец", "Sotuvchi", "Salesperson", ["продавец", "продавца", "продавцы", "продавцу", "продавцом", "продавцов", "продажа", "торговля", "sotuvchi", "sotuvchilar", "sotish", "salesperson", "seller", "sellers", "sales"]],
  ["Продавец-консультант", "Sotuvchi-konsultant", "Sales consultant", ["продавец-консультант", "продавец консультант", "sotuvchi-konsultant", "sales consultant", "sales associate"]],
  ["Кассир", "Kassir", "Cashier", ["кассир", "кассира", "кассиры", "кассиру", "кассиром", "kassir", "kassirlar", "cashier", "cashiers"]],
  ["Консультант", "Konsultant", "Consultant", ["консультант", "консультанта", "консультанты", "консультанту", "консультантом", "консультантов", "konsultant", "konsultantlar", "consultant", "consultants"]],
  ["Оператор колл-центра", "Call-markaz operatori", "Call center operator", ["оператор колл-центра", "оператор call-центра", "оператор на телефоне", "call-markaz operatori", "call center operator", "call center", "call-centre operator"]],
  ["Оператор на телефоне", "Telefon operatori", "Phone operator", ["оператор на телефоне", "оператор телефон", "telefon operatori", "phone operator"]],
  ["Промоутер", "Promouter", "Promoter", ["промоутер", "промоутера", "промоутеры", "промо", "promouter", "promouterlar", "promoter", "promoters", "promo"]],
  ["Расклейщик объявлений", "E'lon yelimchi", "Poster", ["расклейщик", "расклейщик объявлений", "расклейка", "e'lon yelimchi", "poster", "flyering"]],
  ["Раздатчик листовок", "Flayer tarqatuvchi", "Flyer distributor", ["раздатчик листовок", "раздатчик", "флаер", "flayer tarqatuvchi", "flyer distributor"]],
  ["Курьер", "Kuryer", "Courier", ["курьер", "курьера", "курьеры", "курьеру", "курьером", "курьеров", "доставка", "kuryer", "kuryerlar", "courier", "couriers", "delivery"]],
  ["Водитель курьер", "Kuryer haydovchi", "Delivery driver", ["курьер-водитель", "водитель курьер", "курьер водитель", "kuryer haydovchi", "delivery driver", "delivery rider"]],
  ["Водитель такси", "Taksi haydovchi", "Taxi driver", ["таксист", "такси", "таксистка", "такси", "taksi haydovchi", "taksist", "taxi driver", "taxi", "taxist"]],
  ["Барбер", "Sartarosh", "Barber", ["барбер", "барбера", "барберов", "барбершоп", "sartarosh", "barber", "barbers", "barbershop"]],
  ["Стилист", "Stilist", "Stylist", ["стилист", "стилиста", "стилисты", "стилистка", "stilist", "stilistlar", "stylist", "stylists"]],
  ["Визажист", "Vizajist", "Makeup artist", ["визажист", "визажиста", "визажистка", "визаж", "vizajist", "vizajistlar", "makeup artist", "makeup", "mua"]],
  ["Швея-мотористка", "Tikuvchi-motorist", "Sewing machine operator", ["швея-мотористка", "мотористка", "швея мотористка", "tikuvchi-motorist", "sewing machine operator"]],
  ["Портной", "Tikuv usta", "Tailor", ["портной", "портного", "портному", "портным", "портные", "tikuv usta", "tailor", "tailors"]],
  ["Ателье мастер", "Atelye ustasi", "Atelier master", ["ателье мастер", "мастер ателье", "atelye ustasi", "atelier master", "seamster"]],
  ["Скорняк", "Mo'ynachi", "Furrier", ["скорняк", "скорняка", "скорняки", "скорняжные работы", "mo'ynachi", "furrier"]],

  // ─── Logistics / Транспорт, Склад ───
  ["Водитель", "Haydovchi", "Driver", ["водитель", "водителя", "водители", "водителю", "водителем", "водителей", "шофер", "шофера", "шоферу", "шофером", "шоферов", "вождение", "haydovchi", "haydovchisi", "haydovchilar", "shofyor", "shofyorlar", "driver", "drivers"]],
  ["Водитель грузовика", "Yuk mashinasi haydovchisi", "Truck driver", ["водитель грузовика", "дальнобойщик", "дальнобой", "водитель фуры", "фура", "грузовик", "yuk mashinasi haydovchisi", "truck driver", "trucker"]],
  ["Водитель автобуса", "Avtobus haydovchisi", "Bus driver", ["водитель автобуса", "водитель автобуса", "автобус", "avtobus haydovchisi", "bus driver", "bus driver"]],
  ["Водитель маршрутки", "Marshrutka haydovchisi", "Minibus driver", ["водитель маршрутки", "маршрутка", "маршруточник", "marshrutka haydovchisi", "minibus driver"]],
  ["Водитель погрузчика", "Pogruzchik haydovchisi", "Forklift driver", ["водитель погрузчика", "погрузчик", "pogruzchik haydovchisi", "forklift driver", "forklift operator"]],
  ["Водитель экскаватора", "Ekskavator haydovchisi", "Excavator driver", ["водитель экскаватора", "экскаваторщик", "ekskavator haydovchisi", "excavator driver"]],
  ["Водитель бульдозера", "Buldozer haydovchisi", "Bulldozer driver", ["водитель бульдозера", "бульдозерист", "buldozer haydovchisi", "bulldozer driver"]],
  ["Водитель крана", "Kran haydovchisi", "Crane driver", ["водитель крана", "крановщик", "kran haydovchisi", "crane driver"]],
  ["Водитель такси", "Taksi haydovchi", "Taxi driver", ["таксист", "такси", "таксистка", "taksi haydovchi", "taksist", "taxi driver", "taxist"]],
  ["Экспедитор", "Ekspeditor", "Expediter", ["экспедитор", "экспедитора", "экспедиторы", "экспедитору", "экспедитором", "экспедиторов", "ekspeditor", "ekspeditorlar", "expediter", "expeditors"]],
  ["Грузчик", "Yuk tashuvchi", "Loader", ["грузчик", "грузчика", "грузчики", "грузчику", "грузчиком", "грузчиков", "разгрузка", "разгрузчик", "yuk tashuvchi", "yuklovchi", "loader", "loaders", "mover", "movers"]],
  ["Кладовщик", "Omborchi", "Warehouse worker", ["кладовщик", "кладовщика", "кладовщики", "кладовщику", "кладовщиком", "склад", "omborchi", "ombor", "warehouse worker", "storekeeper", "stockman"]],
  ["Логист", "Logist", "Logistician", ["логист", "логиста", "логисты", "логистику", "логистик", "logist", "logistlar", "logistician", "logisticians", "logistics"]],
  ["Сортировщик", "Saralovchi", "Sorter", ["сортировщик", "сортировщица", "сортировка", "saralovchi", "saralash", "sorter", "sorters"]],
  ["Упаковщик на складе", "Ombor qadoqlovchisi", "Warehouse packer", ["упаковщик на складе", "упаковщица на складе", "склад упаковщик", "ombor qadoqlovchisi", "warehouse packer"]],

  // ─── Medical / Медицина ───
  ["Врач", "Shifokor", "Doctor", ["врач", "врача", "врачу", "врачом", "врачей", "доктор", "доктора", "доктору", "доктором", "shifokor", "shifokorlar", "doctor", "doctors", "physician", "physicians"]],
  ["Терапевт", "Terapevt", "Therapist", ["терапевт", "терапевта", "терапевту", "терапевтом", "terapevt", "terapevtlar", "therapist", "therapists"]],
  ["Педиатр", "Pediatr", "Pediatrician", ["педиатр", "педиатра", "педиатру", "педиатром", "pediatr", "pediatrlar", "pediatrician", "pediatricians"]],
  ["Хирург", "Jarroh", "Surgeon", ["хирург", "хирурга", "хирурги", "хирургу", "хирургом", "операция", "jarroh", "jarrohlar", "jarrohlik", "surgeon", "surgeons"]],
  ["Стоматолог", "Tish shifokori", "Dentist", ["стоматолог", "стоматолога", "стоматологи", "стоматологу", "стоматологом", "tish shifokori", "tish doktori", "dentist", "dentists", "dental"]],
  ["Медсестра", "Hamshira", "Nurse", ["медсестра", "медсестры", "медсестру", "медсестрой", "медсестёр", "медбрат", "медбратья", "hamshira", "hamshira", "nurse", "nurses", "nursing"]],
  ["Акушер", "Akusher", "Obstetrician", ["акушер", "акушерка", "акушерки", "акушеру", "akusher", "akusherka", "obstetrician", "obstetricians", "midwife", "midwives"]],
  ["Фармацевт", "Farmatsevt", "Pharmacist", ["фармацевт", "фармацевта", "фармацевты", "фармацевту", "провизор", "farmatsevt", "farmatsevtlar", "pharmacist", "pharmacists"]],
  ["Лаборант", "Laborant", "Lab assistant", ["лаборант", "лаборанта", "лаборанты", "лаборанту", "лаборантом", "лаборатория", "laborant", "laborantlar", "lab assistant", "lab technician"]],
  ["Фельдшер", "Feldsher", "Paramedic", ["фельдшер", "фельдшера", "фельдшеры", "фельдшеру", "фельдшером", "feldsher", "feldsherlar", "paramedic", "paramedics"]],
  ["Санитар", "Sanitar", "Orderly", ["санитар", "санитара", "санитары", "санитару", "санитаром", "санитарка", "sanitar", "sanitarlar", "orderly", "orderlies", "nursing aide"]],
  ["Психолог", "Psixolog", "Psychologist", ["психолог", "психолога", "психологи", "психологу", "психологом", "психология", "psixolog", "psixologlar", "psychologist", "psychologists"]],
  ["Психиатр", "Psixiatr", "Psychiatrist", ["психиатр", "психиатра", "психиатры", "психиатру", "психиатром", "psixiatr", "psixiatrlar", "psychiatrist", "psychiatrists"]],
  ["Массажист медицинский", "Tibbiy massajchi", "Medical massage therapist", ["массажист медицинский", "медицинский массаж", "tibbiy massajchi", "medical massage therapist"]],
  ["Косметолог-эстетист", "Estetik kosmetolog", "Aesthetician", ["косметолог-эстетист", "эстетист", "estetik kosmetolog", "aesthetician", "esthetician"]],
  ["Окулист", "Oftalmolog", "Ophthalmologist", ["окулист", "офтальмолог", "глазной врач", "oftalmolog", "ophthalmologist"]],
  ["Лор", "Lor", "ENT doctor", ["лор", "лор-врач", "отоларинголог", "ухо горло нос", "lor", "ent doctor", "otolaryngologist"]],
  ["Кардиолог", "Kardiolog", "Cardiologist", ["кардиолог", "кардиолога", "кардиологи", "kardiolog", "kardiologlar", "cardiologist", "cardiologists"]],
  ["Невролог", "Nevrolog", "Neurologist", ["невролог", "невролога", "неврологи", "nevrolog", "nevrologlar", "neurologist", "neurologists"]],
  ["Эндокринолог", "Endokrinolog", "Endocrinologist", ["эндокринолог", "endokrinolog", "endocrinologist"]],
  ["Гинеколог", "Ginekolog", "Gynecologist", ["гинеколог", "гинеколога", "гинекологи", "ginekolog", "gynecologist"]],
  ["Уролог", "Urolog", "Urologist", ["уролог", "уролога", "урологи", "urolog", "urologist"]],
  ["Дерматолог", "Dermatolog", "Dermatologist", ["дерматолог", "дерматолога", "дерматологи", "дерматологу", "дерматологом", "dermatolog", "dermatologist"]],
  ["Онколог", "Onkolog", "Oncologist", ["онколог", "онколога", "онкологи", "onkolog", "oncologist"]],

  // ─── Office / Офис ───
  ["Бухгалтер", "Buxgalter", "Accountant", ["бухгалтер", "бухгалтера", "бухгалтеры", "бухгалтеру", "бухгалтером", "бухгалтеров", "buxgalter", "buxgalterlar", "accountant", "accountants"]],
  ["Главный бухгалтер", "Bosh buxgalter", "Chief accountant", ["главный бухгалтер", "bosh buxgalter", "chief accountant"]],
  ["Кадровик", "Kadrlar bo'limi", "HR specialist", ["кадровик", "кадровика", "кадры", "kadrlar bo'limi", "hr specialist", "hr", "recruiter"]],
  ["Секретарь", "Kotib", "Secretary", ["секретарь", "секретаря", "секретари", "секретарша", "секретарю", "секретарем", "kotib", "kotiblar", "secretary", "secretaries"]],
  ["Офис-менеджер", "Ofis menejeri", "Office manager", ["офис-менеджер", "офис менеджер", "офис", "ofis menejeri", "office manager"]],
  ["Юрист", "Yurist", "Lawyer", ["юрист", "юриста", "юристы", "юристу", "юристом", "юристов", "адвокат", "адвоката", "адвокаты", "адвокату", "адвокатом", "yurist", "yuristlar", "lawyer", "lawyers", "attorney", "attorneys"]],
  ["Экономист", "Iqtisodchi", "Economist", ["экономист", "экономиста", "экономисты", "экономисту", "экономистом", "iqtisodchi", "iqtisodchilar", "economist", "economists"]],
  ["Аналитик", "Tahlilchi", "Analyst", ["аналитик", "аналитика", "аналитики", "аналитику", "аналитиком", "tahlilchi", "tahlilchilar", "analyst", "analysts"]],
  ["Переводчик", "Tarjimon", "Translator", ["переводчик", "переводчика", "переводчики", "переводчику", "переводчиком", "переводчица", "tarjimon", "tarjimoni", "tarjimonlar", "translator", "translators", "interpreter", "interpreters"]],
  ["Синхронный переводчик", "Sinxron tarjimon", "Simultaneous interpreter", ["синхронный переводчик", "синхрон", "sinxron tarjimon", "simultaneous interpreter"]],

  // ─── Tech / IT, Инженерия ───
  ["Программист", "Dasturchi", "Programmer", ["программист", "программиста", "программисты", "программисту", "программистом", "разработчик", "разработчика", "разработчики", "dasturchi", "dasturchilar", "programmer", "programmers", "developer", "developers", "coder"]],
  ["Frontend-разработчик", "Frontend dasturchi", "Frontend developer", ["frontend-разработчик", "frontend разработчик", "фронтенд", "фронтенд-разработчик", "верстальщик", "верстальщица", "frontend dasturchi", "frontend developer", "frontend", "front-end"]],
  ["Backend-разработчик", "Backend dasturchi", "Backend developer", ["backend-разработчик", "backend разработчик", "бэкенд", "бэкенд-разработчик", "backend dasturchi", "backend developer", "backend", "back-end"]],
  ["Fullstack-разработчик", "Fullstack dasturchi", "Fullstack developer", ["fullstack-разработчик", "fullstack разработчик", "фулстек", "фуллстек", "fullstack dasturchi", "fullstack developer", "fullstack", "full-stack"]],
  ["Mobile-разработчик", "Mobil dasturchi", "Mobile developer", ["mobile-разработчик", "мобильный разработчик", "мобильная разработка", "mobil dasturchi", "mobile developer", "mobile dev"]],
  ["iOS-разработчик", "iOS dasturchi", "iOS developer", ["ios-разработчик", "ios разработчик", "айос", "ios dasturchi", "ios developer"]],
  ["Android-разработчик", "Android dasturchi", "Android developer", ["android-разработчик", "андроид", "android dasturchi", "android developer"]],
  ["QA-инженер", "QA muhandis", "QA engineer", ["qa-инженер", "qa инженер", "тестировщик", "тестировщица", "qa", "qa muhandis", "qa engineer", "qa", "tester", "testers"]],
  ["DevOps-инженер", "DevOps muhandis", "DevOps engineer", ["devops-инженер", "devops инженер", "девопс", "devops muhandis", "devops engineer", "devops"]],
  ["Data scientist", "Data scientist", "Data scientist", ["data scientist", "data scientist", "data scientist", "дата сайентист"]],
  ["ML-инженер", "ML muhandis", "ML engineer", ["ml-инженер", "ml инженер", "машинное обучение", "ml muhandis", "ml engineer", "ml"]],
  ["Системный администратор", "Tizim administratori", "Sysadmin", ["системный администратор", "сисадмин", "системный админ", "tizim administratori", "sysadmin", "system administrator"]],
  ["Сетевой инженер", "Tarmoq muhandisi", "Network engineer", ["сетевой инженер", "сетевик", "tarmoq muhandisi", "network engineer"]],
  ["Инженер", "Muhandis", "Engineer", ["инженер", "инженера", "инженеры", "инженеру", "инженером", "инженеров", "muhandis", "muhandislar", "engineer", "engineers"]],
  ["Технолог", "Texnolog", "Technologist", ["технолог", "технолога", "технологи", "технологу", "texnolog", "texnologlar", "technologist", "technologists"]],
  ["Конструктор", "Konstruktor", "Designer (engineering)", ["конструктор", "конструктора", "конструкторы", "konstruktor", "konstruktorlar", "designer", "designers", "engineering designer"]],
  ["Проектировщик", "Loyihalovchi", "Design engineer", ["проектировщик", "проектировщика", "проектировщики", "проектирование", "loyihalovchi", "design engineer", "planner"]],
  ["Архитектор", "Arxitektor", "Architect", ["архитектор", "архитектора", "архитекторы", "архитектору", "архитектором", "arxitektor", "arxitektorlar", "architect", "architects"]],
  ["Дизайнер", "Dizayner", "Designer", ["дизайнер", "дизайнера", "дизайнеры", "дизайнеру", "дизайнером", "дизайнеров", "dizayner", "dizaynerlar", "designer", "designers"]],
  ["Графический дизайнер", "Grafik dizayner", "Graphic designer", ["графический дизайнер", "график дизайнер", "grafik dizayner", "graphic designer"]],
  ["Веб-дизайнер", "Veb-dizayner", "Web designer", ["веб-дизайнер", "веб дизайнер", "veb-dizayner", "web designer"]],
  ["UX/UI-дизайнер", "UX/UI dizayner", "UX/UI designer", ["ux/ui-дизайнер", "ux дизайнер", "ui дизайнер", "ux/ui dizayner", "ux designer", "ui designer"]],
  ["SMM-специалист", "SMM mutaxassisi", "SMM specialist", ["smm-специалист", "smm специалист", "smmщик", "smm", "smm mutaxassisi", "smm specialist"]],
  ["Маркетолог", "Marketolog", "Marketer", ["маркетолог", "маркетолога", "маркетологи", "маркетингу", "маркетингом", "marketolog", "marketologlar", "marketer", "marketers", "marketing"]],

  // ─── Agriculture / Сельское хозяйство ───
  ["Фермер", "Fermer", "Farmer", ["фермер", "фермера", "фермеры", "фермеру", "фермером", "фермеров", "fermer", "fermerlar", "farmer", "farmers"]],
  ["Агроном", "Agronom", "Agronomist", ["агроном", "агронома", "агрономы", "агроному", "агрономом", "agronom", "agronomlar", "agronomist", "agronomists"]],
  ["Тракторист", "Traktorchi", "Tractor driver", ["тракторист", "тракториста", "трактористы", "трактористу", "трактористом", "traktorchi", "traktor", "tractor driver", "tractor drivers"]],
  ["Комбайнёр", "Kombayner", "Combine harvester", ["комбайнёр", "комбайнер", "комбайн", "комбайна", "kombayner", "combine harvester", "combine operator"]],
  ["Дояр", "Sigirchi", "Milker", ["дояр", "доярка", "дояра", "дояру", "дояром", "доярки", "доить", "дойка", "sigirchi", "milker"]],
  ["Животновод", "Chorvador", "Cattle breeder", ["животновод", "животноводство", "скотовод", "chorvador", "chorvachilik", "cattle breeder", "rancher"]],
  ["Птичник", "Parrandachi", "Poultry farmer", ["птичник", "птицевод", "птичница", "птичник", "птицеферма", "parrandachi", "poultry farmer", "poultry worker"]],
  ["Садовник", "Bog'bon", "Gardener", ["садовник", "садовника", "садовники", "садовод", "садоводство", "огородник", "огород", "bog'bon", "gardener", "gardeners"]],
  ["Овощевод", "Sabzavotchi", "Vegetable grower", ["овощевод", "овощеводство", "sabzavotchi", "vegetable grower"]],
  ["Пчеловод", "Asalchi", "Beekeeper", ["пчеловод", "пчеловодство", "пасечник", "пасека", "asalchi", "beekeeper", "apiarist"]],
  ["Рыбовод", "Baliqchi", "Fish farmer", ["рыбовод", "рыбоводство", "рыбак", "baliqchi", "fish farmer", "fisherman"]],
  ["Лесоруб", "O'rmonchi", "Lumberjack", ["лесоруб", "лесорубы", "рубка леса", "o'rmonchi", "lumberjack", "woodsman"]],
  ["Егерь", "Yeger", "Gamekeeper", ["егерь", "егеря", "егерей", "егерю", "yeger", "gamekeeper", "ranger"]],

  // ─── Domestic / Дом, Семья ───
  ["Няня", "Enaga", "Nanny", ["няня", "няни", "няню", "няней", "enaga", "enaga ayol", "nanny", "nannies"]],
  ["Сиделка", "Qariya g'amxo'ri", "Caretaker", ["сиделка", "сиделки", "сиделку", "сиделкой", "уход за пожилыми", "qariya g'amxo'ri", "g'amxo'r", "caretaker", "caregiver"]],
  ["Домработница", "Uy xodimi", "Housekeeper", ["домработница", "домработницы", "домработницу", "домработницей", "помощница по хозяйству", "uy xodimi", "housekeeper", "maid"]],
  ["Садовник-озеленитель", "Manzarachi", "Landscape gardener", ["садовник-озеленитель", "озеленитель", "благоустройство", "manzarachi", "landscape gardener"]],
  ["Управдом", "Boshqaruvchi", "Building manager", ["управдом", "управляющий домом", "boshqaruvchi", "building manager", "property manager"]],
  ["Консьерж", "Konsyerj", "Concierge", ["консьерж", "консьержа", "консьержка", "konsyerj", "concierge"]],

  // ─── Education / Образование ───
  ["Учитель", "O'qituvchi", "Teacher", ["учитель", "учителя", "учители", "учителю", "учителем", "учителей", "преподаватель", "преподаватели", "педагог", "o'qituvchi", "o'qituvchilar", "oqituvchi", "teacher", "teachers"]],
  ["Воспитатель", "Tarbiyachi", "Educator", ["воспитатель", "воспитателя", "воспитатели", "воспитателю", "воспитательница", "tarbiyachi", "tarbiyachilar", "educator"]],
  ["Репетитор", "Repetitor", "Tutor", ["репетитор", "репетитора", "репетиторы", "репетитору", "репетитором", "repetitor", "repetitorlar", "tutor", "tutors", "tutoring"]],
  ["Тренер", "Trener", "Coach", ["тренер", "тренера", "тренеры", "тренеру", "тренером", "тренеров", "trener", "trenerlar", "coach", "coaches", "trainer", "trainers"]],
  ["Преподаватель вуза", "Oliygoh o'qituvchisi", "University lecturer", ["преподаватель вуза", "вуза", "преподаватель университета", "oliygoh o'qituvchisi", "university lecturer"]],
  ["Преподаватель английского", "Ingliz tili o'qituvchisi", "English teacher", ["преподаватель английского", "учитель английского", "ingliz tili o'qituvchisi", "english teacher", "english tutor"]],
  ["Преподаватель русского", "Rus tili o'qituvchisi", "Russian teacher", ["преподаватель русского", "учитель русского", "rus tili o'qituvchisi", "russian teacher"]],

  // ─── Beauty / Красота ───
  ["Барбер", "Sartarosh", "Barber", ["барбер", "барбера", "барберов", "sartarosh", "barber", "barbers"]],
  ["Колорист", "Kolorist", "Colorist", ["колорист", "колориста", "колористка", "kolorist", "colorist", "hair colorist"]],
  ["Стилист-парикмахер", "Stilist-sartarosh", "Hair stylist", ["стилист-парикмахер", "стилист парикмахер", "stilist-sartarosh", "hair stylist"]],
  ["Мастер ногтевого сервиса", "Tirnoq ustasi", "Nail technician", ["мастер ногтевого сервиса", "ногтевой мастер", "tirnoq ustasi", "nail technician"]],
  ["Лэшмейкер", "Lashmeyker", "Lashmaker", ["лэшмейкер", "лэш", "lashmeyker", "lashmaker", "lash artist"]],
  ["Бровист", "Qosh usta", "Brow artist", ["бровист", "бровиста", "коррекция бровей", "qosh usta", "brow artist"]],

  // ─── Public / Государство ───
  ["Сотрудник полиции", "Politsiya xodimi", "Police officer", ["сотрудник полиции", "полицейский", "politsiya xodimi", "police officer"]],
  ["Сотрудник мфц", "Mfc xodimi", "MFC officer", ["сотрудник мфц", "мфц", "мфц сотрудник", "mfc xodimi", "mfc officer"]],
  ["Сотрудник банка", "Bank xodimi", "Bank officer", ["сотрудник банка", "банковский сотрудник", "bank xodimi", "bank officer", "bank clerk"]],
  ["Сотрудник почты", "Pochta xodimi", "Post office worker", ["сотрудник почты", "почтальон", "почта", "pochta xodimi", "post office worker", "postal worker"]],
  ["Судья", "Sudya", "Judge", ["судья", "судьи", "судью", "судьёй", "sudya", "judge", "judges"]],
  ["Прокурор", "Prokuror", "Prosecutor", ["прокурор", "прокурора", "прокуроре", "prokuror", "prosecutor"]],
  ["Следователь", "Tergovchi", "Investigator", ["следователь", "следователя", "следователи", "следствие", "tergovchi", "investigator", "detectives"]],
  ["Нотариус", "Notarius", "Notary", ["нотариус", "нотариуса", "нотариусы", "нотариусу", "notarius", "notariuslar", "notary", "notaries"]],
  ["Миграционный консультант", "Migratsiya maslahatchisi", "Migration consultant", ["миграционный консультант", "миграционный специалист", "migratsiya maslahatchisi", "migration consultant"]],
  ["Специалист по визам", "Viza mutaxassisi", "Visa specialist", ["специалист по визам", "визовый специалист", "viza mutaxassisi", "visa specialist"]],

  // ─── Tech repair / Ремонт техники ───
  ["Мастер по ремонту", "Ta'mirlash ustasi", "Repair technician", ["мастер по ремонту", "ремонтник", "remontnik", "ta'mirlash ustasi", "repair technician", "repairman"]],
  ["Мастер по ремонту телефонов", "Telefon ta'mirlash ustasi", "Phone repair technician", ["мастер по ремонту телефонов", "ремонт телефонов", "telefon ta'mirlash ustasi", "phone repair technician", "phone repair"]],
  ["Мастер по ремонту компьютеров", "Kompyuter ta'mirlash ustasi", "Computer repair technician", ["мастер по ремонту компьютеров", "ремонт компьютеров", "компьютерный мастер", "kompyuter ta'mirlash ustasi", "computer repair technician"]],
  ["Мастер по ремонту бытовой техники", "Maishiy texnika ta'mirlash ustasi", "Appliance repair technician", ["мастер по ремонту бытовой техники", "ремонт бытовой техники", "maishiy texnika ta'mirlash ustasi", "appliance repair technician"]],
  ["Мастер по ремонту холодильников", "Muzlatgich ta'mirlash ustasi", "Refrigerator repair technician", ["мастер по ремонту холодильников", "холодильщик", "muzlatgich ta'mirlash ustasi", "refrigerator repair technician"]],
  ["Мастер по ремонту стиральных машин", "Kir yuvish mashinasi ta'mirlash ustasi", "Washing machine repair", ["мастер по ремонту стиральных машин", "стиралка", "kir yuvish mashinasi ta'mirlash ustasi", "washing machine repair technician"]],
  ["Автомеханик", "Avtomexanik", "Auto mechanic", ["автомеханик", "автомеханика", "автослесарь", "слесарь по ремонту автомобилей", "avtomexanik", "avtomexaniklar", "auto mechanic", "mechanic", "mechanics", "car mechanic"]],
  ["Мастер по кондиционерам", "Konditsioner ustasi", "AC technician", ["мастер по кондиционерам", "кондиционерщик", "konditsioner ustasi", "ac technician", "air conditioner technician"]],
  ["Мастер по ремонту обуви", "Poyabzal ta'mirlash ustasi", "Shoe repairman", ["мастер по ремонту обуви", "сапожник", "обувщик", "poyabzal ta'mirlash ustasi", "shoe repairman", "cobbler"]],
  ["Часовщик", "Soat ta'mirlash ustasi", "Watchmaker", ["часовщик", "часового дела мастер", "soat ta'mirlash ustasi", "watchmaker", "horologist"]],
  ["Ювелир", "Zargarlik usta", "Jeweler", ["ювелир", "ювелира", "ювелиру", "ювелирные работы", "zargarlik usta", "jeweler", "jewelry maker"]],
  ["Ключник", "Kalitchi", "Locksmith", ["ключник", "изготовление ключей", "kalitchi", "locksmith", "key maker"]],
  ["Оружейник", "Qurol usta", "Gunsmith", ["оружейник", "оружейный мастер", "qurol usta", "gunsmith"]],

  // ─── Automotive / Авто ───
  ["Автомойщик", "Avtomoyka", "Car washer", ["автомойщик", "мойщик машин", "мойка машин", "avtomoyka", "car washer", "car wash"]],
  ["Шиномонтажник", "Shinomontajchi", "Tire fitter", ["шиномонтажник", "шиномонтаж", "shinomontajchi", "tire fitter", "tire service", "tyre fitter"]],
  ["Работник автосервиса", "Avtoservis xodimi", "Auto service worker", ["работник автосервиса", "автосервис", "avtoservis xodimi", "auto service worker"]],
  ["Водитель категории B", "B toifali haydovchi", "B category driver", ["водитель категории b", "категория б", "b toifali haydovchi", "b category driver"]],
  ["Водитель категории C", "C toifali haydovchi", "C category driver", ["водитель категории c", "категория с", "c toifali haydovchi", "c category driver"]],
  ["Водитель категории CE", "CE toifali haydovchi", "CE category driver", ["водитель категории ce", "водитель кат е", "ce toifali haydovchi", "ce category driver"]],
  ["Водитель категории D", "D toifali haydovchi", "D category driver", ["водитель категории d", "категория д", "водитель автобуса", "d toifali haydovchi", "d category driver"]],

  // ─── Связь / Telecom ───
  ["Связист", "Aloqachi", "Telecom worker", ["связист", "связиста", "связисты", "связь", "связи", "aloqachi", "telecom worker"]],
  ["Кабельщик", "Kabelchi", "Cable installer", ["кабельщик", "кабельщика", "прокладка кабелей", "kabelchi", "cable installer"]],
  ["Антеннщик", "Antenna ustasi", "Antenna installer", ["антеннщик", "антенщик", "установка антенн", "antenna ustasi", "antenna installer"]],
  ["Оператор связи", "Aloqa operatori", "Telecom operator", ["оператор связи", "aloqa operatori", "telecom operator"]],
  ["Техник связи", "Aloqa texnigi", "Telecom technician", ["техник связи", "aloqa texnigi", "telecom technician"]],

  // ─── Energy / Энергетика ───
  ["Электромонтажник", "Elektr montajchi", "Electrical installer", ["электромонтажник", "elektr montajchi", "electrical installer"]],
  ["Электромонтёр", "Elektrik", "Electrician", ["электромонтёр", "электромонтер", "электромонтёра", "elektrik", "electrician"]],
  ["Слесарь-электрик", "Chilangar-elektrik", "Electrician fitter", ["слесарь-электрик", "слесарь электрик", "chilangar-elektrik", "electrician fitter"]],
  ["Электрогазосварщик", "Elektr-gaz payvandchi", "Electric-gas welder", ["электрогазосварщик", "электрогазосварка", "elektr-gaz payvandchi", "electric-gas welder"]],
  ["Оператор котельной", "Qozonxona operatori", "Boiler operator", ["оператор котельной", "кочегар", "котельная", "qozonxona operatori", "boiler operator"]],
  ["Оператор котла", "Qozon operatori", "Boiler operator", ["оператор котла", "qozon operatori", "boiler operator"]],
  ["Оператор насосной станции", "Nasos stantsiyasi operatori", "Pump station operator", ["оператор насосной станции", "насосная", "nasos stantsiyasi operatori", "pump station operator"]],
  ["Слесарь КИПиА", "Kipia chilangari", "Instrumentation technician", ["слесарь кипиа", "слесарь контрольно-измерительных приборов", "kipia chilangari", "instrumentation technician"]],
  ["Слесарь по ремонту оборудования", "Uskunalar ta'mirlash chilangari", "Equipment repair fitter", ["слесарь по ремонту оборудования", "uskunalar ta'mirlash chilangari", "equipment repair fitter"]],
  ["Аппаратчик", "Apparatchi", "Apparatus operator", ["аппаратчик", "аппаратчица", "apparatchi", "apparatus operator", "chemical operator"]],
  ["Машинист насосной установки", "Nasos qurilmasi mashinisti", "Pump machine operator", ["машинист насосной установки", "nasos qurilmasi mashinisti", "pump machine operator"]],
  ["Машинист компрессора", "Kompressor mashinisti", "Compressor operator", ["машинист компрессора", "kompressor mashinisti", "compressor operator"]],
  ["Машинист крана", "Kran mashinisti", "Crane machine operator", ["машинист крана", "kran mashinisti", "crane machine operator"]],
  ["Машинист экскаватора", "Ekskavator mashinisti", "Excavator operator", ["машинист экскаватора", "ekskavator mashinisti", "excavator operator"]],
  ["Машинист бульдозера", "Buldozer mashinisti", "Bulldozer operator", ["машинист бульдозера", "buldozer mashinisti", "bulldozer operator"]],

  // ─── HoReCa / Гостиничный бизнес ───
  ["Администратор гостиницы", "Mehmonxona administratori", "Hotel administrator", ["администратор гостиницы", "администратор отеля", "mehmonxona administratori", "hotel administrator"]],
  ["Администратор ресторана", "Restoran administratori", "Restaurant administrator", ["администратор ресторана", "restoran administratori", "restaurant administrator"]],
  ["Портье", "Portye", "Porter", ["портье", "portye", "porter", "doorman", "doormen"]],
  ["Швейцар", "Shveytsar", "Doorman", ["швейцар", "shveytsar", "doorman", "doormen"]],
  ["Бельевщица", "Choyshab beruvchi", "Linen keeper", ["бельевщица", "прачечная", "choyshab beruvchi", "linen keeper"]],

  // ─── Прочие / Other ───
  ["Разнорабочий", "Yordamchi ishchi", "General worker", ["разнорабочий", "разнорабочие", "разнорабочих", "yordamchi ishchi", "general worker"]],
  ["Подсобник", "Yordamchi", "Helper", ["подсобник", "подсобники", "yordamchi", "helper"]],
  ["Работник склада", "Ombor ishchisi", "Warehouse worker", ["работник склада", "склад", "складской работник", "ombor ishchisi", "warehouse worker"]],
  ["Комплектовщик", "Komplektchi", "Picker", ["комплектовщик", "комплектовщица", "комплектовка", "komplektchi", "picker", "order picker"]],
  ["Стикеровщик", "Stikerlashchi", "Labeler", ["стикеровщик", "наклейщик", "наклейка", "stikerlashchi", "labeler", "sticker applier"]],
  ["Маркировщик", "Markirovchi", "Marker", ["маркировщик", "маркировка", "markirovchi", "marker"]],
  ["Оператор ЧПУ", "CHPU operatori", "CNC operator", ["оператор чпу", "чпу", "chpu operatori", "cnc operator"]],
  ["Оператор фрезерного станка с ЧПУ", "CHPU frezer operatori", "CNC milling operator", ["оператор фрезерного станка с чпу", "фрезерный станок чпу", "chpu frezer operatori", "cnc milling operator"]],
  ["Оператор токарного станка с ЧПУ", "CHPU tokar operatori", "CNC lathe operator", ["оператор токарного станка с чпу", "токарный станок чпу", "chpu tokar operatori", "cnc lathe operator"]],
  ["Оператор 3D-принтера", "3D-printer operatori", "3D printer operator", ["оператор 3d-принтера", "3d принтер", "3d-printer operatori", "3d printer operator"]],
  ["Печатник", "Bosmaxona ishchisi", "Printer", ["печатник", "печатня", "полиграфист", "bosmaxona ishchisi", "printer", "pressman"]],
  ["Переплётчик", "Muqovachi", "Bookbinder", ["переплётчик", "переплёт", "muqovachi", "bookbinder"]],
  ["Каллиграф", "Xattot", "Calligrapher", ["каллиграф", "каллиграфия", "xattot", "calligrapher"]],
  ["Резчик по дереву", "O'ymakor", "Woodcarver", ["резчик по дереву", "резьба по дереву", "o'ymakor", "woodcarver"]],
  ["Стеклодув", "Shisha puflovchi", "Glassblower", ["стеклодув", "стеклодувное дело", "shisha puflovchi", "glassblower"]],
  ["Гончар", "Kulol", "Potter", ["гончар", "гончарное дело", "гончарства", "kulol", "potter"]],
  ["Кузнец", "Temirchi", "Blacksmith", ["кузнец", "кузнечное дело", "кузня", "temirchi", "blacksmith", "forger"]],
  ["Литейщик", "Quyishchi", "Caster", ["литейщик", "литейное дело", "литьё", "quyishchi", "caster", "foundry worker"]],
  ["Сборщик мебели", "Mebel yig'uvchi", "Furniture assembler", ["сборщик мебели", "сборка мебели", "mebel yig'uvchi", "furniture assembler"]],
  ["Обивщик мебели", "Mebel qoplovchi", "Furniture upholsterer", ["обивщик мебели", "обивка мебели", "mebel qoplovchi", "furniture upholsterer"]],
  ["Реставратор", "Restavrator", "Restorer", ["реставратор", "реставрация", "restavrator", "restorer"]],
  ["Переплётчик книг", "Kitob muqovachi", "Book restorer", ["переплётчик книг", "kitob muqovachi", "book restorer"]],
  ["Библиотекарь", "Kutubxonachi", "Librarian", ["библиотекарь", "библиотека", "kutubxonachi", "librarian"]],
  ["Архивариус", "Arxivchi", "Archivist", ["архивариус", "архивариуса", "архив", "arxivchi", "archivist"]],
  ["Краевед", "O'lkashunos", "Local historian", ["краевед", "краеведение", "o'lkashunos", "local historian"]],
  ["Экскурсовод", "Ekskursovod", "Tour guide", ["экскурсовод", "экскурсоводы", "гид", "ekskursovod", "ekskursovodlar", "gid", "gidlar", "tour guide", "guide"]],
  ["Гид", "Gid", "Guide", ["гид", "гида", "гиды", "гиду", "гидом", "gid", "gidlar", "guide", "guides"]],
  ["Сомелье", "Sommelye", "Sommelier", ["сомелье", "sommelye", "sommelier", "sommeliers"]],
  ["Бариста", "Barista", "Barista", ["бариста", "баристу", "баристом", "барист", "barista", "baristas"]],
  ["Кальянщик", "Kalyanshik", "Hookah maker", ["кальянщик", "кальянная", "kalyanshik", "hookah maker"]],
  ["Тату-мастер", "Tatu ustasi", "Tattoo artist", ["тату-мастер", "тату", "татуировщик", "tatu ustasi", "tattoo artist", "tattooer"]],
  ["Пирсер", "Pirser", "Piercer", ["пирсер", "пирсинг", "pirser", "piercer", "body piercer"]],
  ["Звукооператор", "Ovoz operatori", "Sound operator", ["звукооператор", "звукорежиссёр", "ovoz operatori", "sound operator", "sound engineer"]],
  ["Видеооператор", "Video operator", "Video operator", ["видеооператор", "видео", "видеосъемка", "video operator", "video operator"]],
  ["Светооператор", "Yorug'lik operatori", "Lighting operator", ["светооператор", "свет", "yorug'lik operatori", "lighting operator"]],
  ["Звукорежиссёр", "Ovoz rejissyori", "Sound director", ["звукорежиссёр", "ovoz rejissyori", "sound director", "sound producer"]],
  ["Оператор видеомонтажа", "Video montaj operatori", "Video editor", ["оператор видеомонтажа", "видеомонтаж", "видео монтаж", "video montaj operatori", "video editor"]],
  ["Монтажёр", "Montajchi", "Editor", ["монтажёр", "монтаж", "montajchi", "editor", "film editor"]],
  ["Диктор", "Diktor", "Announcer", ["диктор", "дикторша", "дикторы", "diktor", "diktorlar", "announcer", "voice over"]],
  ["Радиоведущий", "Radio boshlovchisi", "Radio host", ["радиоведущий", "радиоведущая", "радио", "radio boshlovchisi", "radio host", "radio presenter"]],
  ["Телеведущий", "Tele boshlovchisi", "TV host", ["телеведущий", "телеведущая", "теле", "tele boshlovchisi", "tv host", "tv presenter"]],
  ["Аниматор", "Animator", "Animator", ["аниматор", "аниматорша", "аниматоры", "анимация", "animator", "animators", "animator", "animation"]],
  ["3D-моделлер", "3D-modelyer", "3D modeler", ["3d-моделлер", "3d моделлер", "3д моделлер", "3д-моделлер", "3d-modelyer", "3d modeler", "3d modeller"]],
  ["Звукорежиссёр подкастов", "Podkast ovoz rejissyori", "Podcast sound engineer", ["звукорежиссёр подкастов", "подкастер", "podkast ovoz rejissyori", "podcast sound engineer"]],
  ["Стример", "Strimer", "Streamer", ["стример", "стримерша", "стрим", "strimer", "streamer", "streamers"]],
  ["Блогер", "Blogger", "Blogger", ["блогер", "блогерша", "блогеры", "блог", "blogger", "bloggers", "blogger"]],

  // ─── Работающие с детьми ───
  ["Учитель начальных классов", "Boshlang'ich sinf o'qituvchisi", "Elementary school teacher", ["учитель начальных классов", "начальные классы", "boshlang'ich sinf o'qituvchisi", "elementary school teacher"]],
  ["Учитель математики", "Matematika o'qituvchisi", "Math teacher", ["учитель математики", "математик", "matematika o'qituvchisi", "math teacher", "mathematics teacher"]],
  ["Учитель физики", "Fizika o'qituvchisi", "Physics teacher", ["учитель физики", "физик", "fizika o'qituvchisi", "physics teacher"]],
  ["Учитель химии", "Kimyo o'qituvchisi", "Chemistry teacher", ["учитель химии", "химик", "kimyo o'qituvchisi", "chemistry teacher"]],
  ["Учитель биологии", "Biologiya o'qituvchisi", "Biology teacher", ["учитель биологии", "биолог", "biologiya o'qituvchisi", "biology teacher"]],
  ["Учитель истории", "Tarix o'qituvchisi", "History teacher", ["учитель истории", "историк", "tarix o'qituvchisi", "history teacher"]],
  ["Учитель географии", "Geografiya o'qituvchisi", "Geography teacher", ["учитель географии", "географ", "geografiya o'qituvchisi", "geography teacher"]],
  ["Учитель физкультуры", "Jismoniy tarbiya o'qituvchisi", "PE teacher", ["учитель физкультуры", "физрук", "jismoniy tarbiya o'qituvchisi", "pe teacher", "physical education teacher"]],

  // ─── Работающие с животными ───
  ["Ветеринар", "Veterinar", "Veterinarian", ["ветеринар", "ветеринара", "ветеринару", "ветеринаром", "veterinar", "veterinarlar", "veterinarian", "vet", "vet doctor"]],
  ["Кинолог", "Kinolog", "Dog handler", ["кинолог", "кинолога", "кинологи", "собаковод", "kinolog", "dog handler", "cynologist"]],

  // ─── Моряки / Водный транспорт ───
  ["Моряк", "Dengizchi", "Sailor", ["моряк", "моряка", "моряки", "матрос", "матросы", "dengizchi", "dengizchilar", "sailor", "sailors", "seaman", "seamen"]],
  ["Капитан судна", "Kema kapitani", "Ship captain", ["капитан судна", "капитан корабля", "kema kapitani", "ship captain", "captain"]],
  ["Рыбак", "Baliqchi", "Fisherman", ["рыбак", "рыбака", "рыбаки", "рыбачить", "baliqchi", "baliqchilar", "fisherman", "fishermen", "angler"]],
  ["Водолаз", "G'ovvos", "Diver", ["водолаз", "водолаза", "водолазы", "дайвер", "g'ovvos", "g'ovvoslar", "diver", "divers", "diving"]],
  ["Лоцман", "Lotsman", "Pilot (marine)", ["лоцман", "лоцмана", "лоцманы", "lotsman", "lotsmanlar", "marine pilot"]],

  // ─── Авиация ───
  ["Бортпроводник", "Bortprovodnik", "Flight attendant", ["бортпроводник", "бортпроводница", "стюардесса", "bortprovodnik", "bortprovodniklar", "flight attendant", "stewardess", "steward", "cabin crew"]],
  ["Пилот", "Uchuvchi", "Pilot", ["пилот", "пилота", "пилоты", "лётчик", "летчик", "лётчица", "uchuvchi", "uchuvchilar", "pilot", "pilots"]],

  // ─── Дополнительные (кросс-категории) ───
  ["Главный инженер", "Bosh muhandis", "Chief engineer", ["главный инженер", "bosh muhandis", "chief engineer"]],
  ["Заместитель директора", "Direktor o'rinbosari", "Deputy director", ["заместитель директора", "зам директора", "замдиректора", "direktor o'rinbosari", "deputy director"]],
  ["Директор", "Direktor", "Director", ["директор", "директора", "директору", "директором", "директоров", "direktor", "direktorlar", "director", "directors", "ceo", "boss"]],
  ["Начальник", "Boshliq", "Head", ["начальник", "начальника", "начальники", "начальнику", "начальником", "босс", "руководитель", "boshliq", "boshliqlar", "head", "chief", "boss", "manager"]],
  ["Заведующий", "Mudir", "Head (institution)", ["заведующий", "заведующего", "заведующим", "заведовать", "mudir", "mudirlar", "head institution", "manager"]],
  ["Бригадир", "Brigadir", "Foreman", ["бригадир", "бригадира", "бригадиры", "бригадиру", "brigadir", "brigadalar", "foreman"]],
  ["Мастер участка", "Uchastka ustasi", "Site master", ["мастер участка", "участка мастер", "uchastka ustasi", "site master", "site foreman"]],
  ["Мастер цеха", "Sex ustasi", "Workshop master", ["мастер цеха", "sex ustasi", "workshop master", "workshop foreman"]],
  ["Техник", "Texnik", "Technician", ["техник", "техника", "технику", "техником", "texnik", "texniklar", "technician", "technicians"]],
  ["Лаборант-исследователь", "Tadqiqot laboranti", "Research lab assistant", ["лаборант-исследователь", "лаборант исследователь", "tadqiqot laboranti", "research lab assistant"]],
  ["Курьер-пешеход", "Piyoda kuryer", "Walking courier", ["курьер-пешеход", "курьер пешеход", "пеший курьер", "piyoda kuryer", "walking courier", "foot courier"]],
  ["Работник склада", "Ombor ishchisi", "Warehouse worker", ["работник склада", "склад", "складской", "ombor ishchisi", "warehouse worker"]],
  ["Курьер на авто", "Avto kuryer", "Auto courier", ["курьер на авто", "курьер-водитель", "avto kuryer", "auto courier"]],
  ["Сборщик заказов", "Buyurtma yig'uvchi", "Order picker", ["сборщик заказов", "сборка заказов", "buyurtma yig'uvchi", "order picker"]],
];

// Build a lookup from variant → entry
const VARIANT_INDEX = new Map<string, ProfessionEntry>();
const PROFESSIONS: ProfessionEntry[] = RAW.map(([canonical, uz, en, variants]) => {
  const entry: ProfessionEntry = {
    canonical,
    uz,
    en,
    variants,
    category: "other", // упрощённо, можно уточнить
  };
  for (const v of variants) {
    VARIANT_INDEX.set(v.toLowerCase(), entry);
  }
  return entry;
});

/** All variants of all professions for substring search */
const ALL_VARIANTS: string[] = Array.from(VARIANT_INDEX.keys());

export function getAllProfessionVariants(): string[] {
  return ALL_VARIANTS;
}

export function getProfessionEntry(variant: string): ProfessionEntry | null {
  return VARIANT_INDEX.get(variant.toLowerCase()) ?? null;
}

export function getAllProfessions(): ProfessionEntry[] {
  return PROFESSIONS;
}