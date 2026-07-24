/**
 * Нормализует номер телефона, оставляя только последние 10 цифр.
 * Пример: "+7 (912) 991-93-70" -> "9129919370"
 */
export function normalizePhone(phone: string): string {
  if (!phone) return "";
  // Удаляем все нецифровые символы
  const digits = phone.replace(/\D/g, "");
  // Возвращаем последние 10 цифр
  return digits.slice(-10);
}