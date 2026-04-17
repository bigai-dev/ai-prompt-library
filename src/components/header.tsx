import { createClient } from "@/lib/supabase/server";
import { HeaderClient } from "./header-client";

// Async Server Component — pre-fetches module visibility so the first paint
// already has the correct nav links (no flash of now-hidden Courses link etc).
export async function Header() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["library_enabled", "courses_enabled", "diagnostic_enabled"]);

  const settings: Record<string, string> = {};
  (data || []).forEach((r) => {
    settings[r.key] = r.value;
  });

  return (
    <HeaderClient
      libraryEnabled={settings.library_enabled !== "false"}
      coursesEnabled={settings.courses_enabled !== "false"}
      diagnosticEnabled={settings.diagnostic_enabled !== "false"}
    />
  );
}
