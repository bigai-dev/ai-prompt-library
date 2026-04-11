import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Get existing user
  const { data: userData, error: getUserError } =
    await supabase.auth.admin.getUserById(id);

  if (getUserError || !userData.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Generate new password and reset the flag
  const password = crypto.randomBytes(16).toString("base64url");

  const { error: updateError } = await supabase.auth.admin.updateUserById(id, {
    password,
    user_metadata: { must_reset_password: true },
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const name = userData.user.user_metadata?.full_name || "User";
  const email = userData.user.email!;

  try {
    await sendWelcomeEmail({ name, email, password });
  } catch {
    return NextResponse.json(
      { password, warning: "Password reset but email failed. Share manually." },
      { status: 200 }
    );
  }

  return NextResponse.json({ success: true, password });
}
