import type { Locale } from "./routing";

/**
 * Pick the locale-appropriate field from a DB record that has _zh / _en variants.
 *
 * @example
 *   localizedField(prompt, "title", "zh") // returns prompt.title_zh
 *   localizedField(category, "name", "en") // returns category.name_en
 *
 * Falls back to the other language's value if the preferred one is empty.
 */
export function localizedField(
  item: unknown,
  base: string,
  locale: Locale
): string {
  if (!item || typeof item !== "object") return "";
  const record = item as Record<string, unknown>;
  const primary = (record[`${base}_${locale}`] as string | null | undefined) ?? "";
  if (primary) return primary;
  const fallbackLocale = locale === "zh" ? "en" : "zh";
  const fallback = (record[`${base}_${fallbackLocale}`] as string | null | undefined) ?? "";
  return fallback;
}

/**
 * Pick body / body_en pair (used for prompt_body vs prompt_body_en).
 * The Chinese body is on the unsuffixed field, English is on _en.
 */
export function localizedBody(
  item: { prompt_body?: string | null; prompt_body_en?: string | null } | null | undefined,
  locale: Locale
): string {
  if (!item) return "";
  if (locale === "en") {
    return item.prompt_body_en || item.prompt_body || "";
  }
  return item.prompt_body || item.prompt_body_en || "";
}

/**
 * Same pattern as localizedBody but for prompt_variables default_value / default_value_en.
 */
export function localizedDefaultValue(
  item: { default_value?: string | null; default_value_en?: string | null } | null | undefined,
  locale: Locale
): string {
  if (!item) return "";
  if (locale === "en") {
    return item.default_value_en || item.default_value || "";
  }
  return item.default_value || item.default_value_en || "";
}
