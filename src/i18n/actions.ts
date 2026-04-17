"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales, LOCALE_COOKIE, type Locale } from "./routing";

export async function setLocale(locale: Locale) {
  if (!(locales as readonly string[]).includes(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  // Revalidate all routes so server-rendered content updates
  revalidatePath("/", "layout");
}
