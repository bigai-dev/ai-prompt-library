import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";
import crypto from "crypto";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter out admin users — only show regular users
  const adminEmails = (process.env.ADMIN_EMAIL_ALLOWLIST || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());

  const users = (data.users || []).filter(
    (u) => !adminEmails.includes(u.email?.toLowerCase() ?? "")
  );

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email } = body as { name: string; email: string };

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  const password = crypto.randomBytes(16).toString("base64url");
  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name.trim(),
      must_reset_password: true,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Send welcome email
  try {
    await sendWelcomeEmail({ name: name.trim(), email: email.trim(), password });
  } catch (emailError) {
    // User created but email failed — return the password so admin can share manually
    return NextResponse.json(
      {
        user: data.user,
        password,
        warning: "User created but welcome email failed to send. Share the password manually.",
      },
      { status: 201 }
    );
  }

  return NextResponse.json({ user: data.user, password }, { status: 201 });
}
