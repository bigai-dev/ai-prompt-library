import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { password } = (await request.json()) as { password: string };

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: userData, error: getUserError } =
    await supabase.auth.admin.getUserById(id);

  if (getUserError || !userData.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(id, {
    password,
    user_metadata: {
      ...userData.user.user_metadata,
      must_reset_password: false,
    },
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
