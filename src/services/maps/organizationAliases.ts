"use client";

export const organizationAliases: Record<string, string> = {
  епрс: "Ермаковское Предприятие по ремонту скважин",
  ерс: "Ермаковское Предприятие по ремонту скважин",
  ермако: "Ермаковское Предприятие по ремонту скважин",
  прс: "Предприятие по ремонту скважин",
  мфц: "Многофункциональный центр",
  мвд: "Министерство внутренних дел",
  увм: "Управление по вопросам миграции",
  крс: "Капитальный ремонт скважин",
  гб: "Городская больница",
  окб: "Областная клиническая больница",
};

/**
 * Returns a list of alternative names for a given abbreviation or query.
 */
export function getOrganizationAlternatives(query: string, city: string | null): string[] {
  const low = query.toLowerCase();
  const citySuffix = city ? ` ${city}` : "";
  const alts: string[] = [];

  // Handle specific ЕПРС / ПРС logic
  if (low.includes("епрс") || low.includes("ермако")) {
    alts.push(`ЕПРС${citySuffix}`);
    alts.push(`ЕРМАКО${citySuffix}`);
    alts.push(`Ермаковское ПРС${citySuffix}`);
    alts.push(`Ермаковское Предприятие по ремонту скважин${citySuffix}`);
    alts.push(`Предприятие по ремонту скважин${citySuffix}`);
    alts.push(`ремонт скважин${citySuffix}`);
  } else if (low.includes("прс")) {
    alts.push(`ПРС${citySuffix}`);
    alts.push(`Предприятие по ремонту скважин${citySuffix}`);
    alts.push(`ремонт скважин${citySuffix}`);
  }

  // Add the original query as a fallback if not already in list
  if (!alts.some(a => a.toLowerCase() === low)) {
    alts.push(query);
  }

  return [...new Set(alts)]; // Return unique values
}

/**
 * Replaces known acronyms and abbreviations in a query string with their full official names.
 */
export function expandOrganizationQuery(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return "";

  let expanded = trimmed;

  for (const [alias, fullName] of Object.entries(organizationAliases)) {
    const regex = new RegExp(`(?:^|\\s|\\b|(?<=[^a-zа-яё0-9]))${alias}(?=\\s|\\b|(?=[^a-zа-яё0-9])|$)`, "gi");
    if (regex.test(expanded)) {
      expanded = expanded.replace(regex, (match) => {
        const isLeadingSpace = /^\s/.test(match);
        return (isLeadingSpace ? " " : "") + fullName;
      });
    }
  }

  return expanded;
}