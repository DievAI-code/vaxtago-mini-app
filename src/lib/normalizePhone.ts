/**
 * Нормализует номер телефона, удаляя все нецифровые символы.
 * Пример: "+7 (913) 883-06-59" -> "79138830659"
 * Пример: "8 (913) 883-06-59" -> "89138830659"
 */
export function normalizePhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}