"use client";

export const organizationAliases: Record<string, string> = {
  епрс: "Ермаковское Предприятие по ремонту скважин",
  ерс: "Ермаковское Предприятие по ремонту скважин",
  прс: "Предприятие по ремонту скважин",
  мфц: "Многофункциональный центр",
  мвд: "Министерство внутренних дел",
  увм: "Управление по вопросам миграции",
  крс: "Капитальный ремонт скважин",
  гб: "Городская больница",
  окб: "Областная клиническая больница",
};

/**
 * Replaces known acronyms and abbreviations in a query string with their full official names.
 * Handles case-insensitivity (ЕПРС, епрс, Епрс).
 */
export function expandOrganizationQuery(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return "";

  let expanded = trimmed;

  for (const [alias, fullName] of Object.entries(organizationAliases)) {
    // Regex matches alias as a standalone word (case insensitive, supporting Cyrillic)
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