/**
 * Barrel-экспорт Intent Engine.
 * Импортируйте из "@/services/intent" вместо вложенных путей.
 */

export {
  recognizeIntent,
  hasIntentKeyword,
  getSupportedIntents,
  type IntentResult,
  type IntentAction,
  type IntentType,
  type RecognizeOptions,
} from "./intentEngine";

export { normalizeInput, detectLanguage, extractAllEntities, type ExtractedEntities } from "./entityExtractor";
export { INTENT_RULES, type IntentRule } from "./intentDictionary";
export { buildReply } from "./responseDictionary";

export { PLACE_KEYWORDS, PLACE_DISPLAY, ORG_KEYWORDS, findPlaceInText, findOrgInText, type PlaceCategory } from "./places";
export { getCityEntry, getAllCities, getAllProfessionVariants, getProfessionEntry, CITIES_BY_COUNTRY, type CityEntry, type Country } from "./cities";
export { getAllProfessions, type ProfessionEntry } from "./professions";
export { SYNONYMS } from "./synonyms";