import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const anon_id = body.anon_id || "";

  // Increment copy counter
  await supabase.rpc("increment_counter", {
    row_id: id,
    column_name: "times_copied",
  });

  // Log event
  await supabase.from("prompt_events").insert({
    prompt_id: id,
    event_type: "copy",
    anon_id,
  });

  return NextResponse.json({ success: true });
}
