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
  const { name, email, password: manualPassword, mode } = body as {
    name: string;
    email: string;
    password?: string;
    mode?: "auto" | "manual";
  };

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  const isManual = mode === "manual" && manualPassword;

  if (isManual && manualPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const password = isManual
    ? manualPassword
    : crypto.randomBytes(16).toString("base64url");

  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name.trim(),
      must_reset_password: !isManual,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Manual mode: no email, no password in response (admin already knows it)
  if (isManual) {
    return NextResponse.json(
      { user: data.user, mode: "manual" },
      { status: 201 }
    );
  }

  // Auto mode: send welcome email with generated password
  try {
    await sendWelcomeEmail({ name: name.trim(), email: email.trim(), password });
  } catch (emailError) {
    return NextResponse.json(
      {
        user: data.user,
        password,
        mode: "auto",
        warning: "User created but welcome email failed to send. Share the password manually.",
      },
      { status: 201 }
    );
  }

  return NextResponse.json(
    { user: data.user, password, mode: "auto" },
    { status: 201 }
  );
}
