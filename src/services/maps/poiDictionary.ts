export const POI_DICTIONARY: Record<string, Record<string, string>> = {
  "цирк": { "тюмень": "Тюменский государственный цирк" },
  "цирка": { "тюмень": "Тюменский государственный цирк" },
  "жд вокзал": { "тюмень": "Железнодорожный вокзал Тюмень" },
  "жд вокзала": { "тюмень": "Железнодорожный вокзал Тюмень" },
  "вокзал": { "тюмень": "Железнодорожный вокзал Тюмень" },
  "вокзала": { "тюмень": "Железнодорожный вокзал Тюмень" },
};

export function resolvePOI(name: string, city?: string): string {
  if (!name) return name;
  const lowerName = name.toLowerCase().trim();
  if (city) {
    const lowerCity = city.toLowerCase().trim();
    if (POI_DICTIONARY[lowerName]?.[lowerCity]) {
      return POI_DICTIONARY[lowerName][lowerCity];
    }
  }
  return name;
}