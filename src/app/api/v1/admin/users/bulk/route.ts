import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";
import crypto from "crypto";

interface BulkRow {
  name: string;
  email: string;
  password?: string;
}

interface RowResult {
  index: number;
  name: string;
  email: string;
  status:
    | "created_auto"
    | "created_manual"
    | "created_email_failed"
    | "skipped_duplicate"
    | "failed";
  password?: string; // only returned for auto-generated so admin can share manually if email fails
  error?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const rows = body.rows as BulkRow[] | undefined;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: "rows[] is required and must be non-empty" },
      { status: 400 }
    );
  }

  if (rows.length > 500) {
    return NextResponse.json(
      { error: "Max 500 rows per import" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const results: RowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row.name?.trim() || "";
    const email = row.email?.trim().toLowerCase() || "";
    const manualPassword = row.password?.trim() || "";

    // Validate
    if (!name || !email) {
      results.push({
        index: i,
        name,
        email,
        status: "failed",
        error: "Name and email are required",
      });
      continue;
    }

    if (!EMAIL_REGEX.test(email)) {
      results.push({
        index: i,
        name,
        email,
        status: "failed",
        error: "Invalid email format",
      });
      continue;
    }

    const isManual = manualPassword.length > 0;
    if (isManual && manualPassword.length < 8) {
      results.push({
        index: i,
        name,
        email,
        status: "failed",
        error: "Password must be at least 8 characters",
      });
      continue;
    }

    const password = isManual
      ? manualPassword
      : crypto.randomBytes(16).toString("base64url");

    // Create user — if email exists, Supabase throws
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        must_reset_password: !isManual,
      },
    });

    if (error) {
      const isDuplicate =
        error.message.toLowerCase().includes("already") ||
        error.message.toLowerCase().includes("exists") ||
        error.message.toLowerCase().includes("registered");
      results.push({
        index: i,
        name,
        email,
        status: isDuplicate ? "skipped_duplicate" : "failed",
        error: error.message,
      });
      continue;
    }

    // Manual mode: no email, success immediately
    if (isManual) {
      results.push({
        index: i,
        name,
        email,
        status: "created_manual",
      });
      continue;
    }

    // Auto mode: send welcome email with the generated password
    try {
      await sendWelcomeEmail({ name, email, password });
      results.push({
        index: i,
        name,
        email,
        status: "created_auto",
        password, // include so admin can copy for backup
      });
    } catch {
      results.push({
        index: i,
        name,
        email,
        status: "created_email_failed",
        password,
        error: "User created but welcome email failed — share password manually",
      });
    }
  }

  // Summary
  const summary = {
    total: rows.length,
    created: results.filter((r) =>
      ["created_auto", "created_manual", "created_email_failed"].includes(r.status)
    ).length,
    skipped: results.filter((r) => r.status === "skipped_duplicate").length,
    failed: results.filter((r) => r.status === "failed").length,
    emailFailed: results.filter((r) => r.status === "created_email_failed").length,
  };

  return NextResponse.json({ summary, results });
}
