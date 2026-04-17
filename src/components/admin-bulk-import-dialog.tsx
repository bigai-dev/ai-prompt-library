"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Download,
  ArrowLeft,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { parseCSV } from "@/lib/csv-parse";

interface ParsedRow {
  name: string;
  email: string;
  password: string;
  valid: boolean;
  errors: string[];
  include: boolean;
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
  password?: string;
  error?: string;
}

type Step = "upload" | "preview" | "result";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function BulkImportDialog({ open, onOpenChange, onComplete }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<RowResult[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setFileName("");
    setRows([]);
    setResults([]);
    setCopiedIdx(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }

    const text = await file.text();
    const parsed = parseCSV(text);

    if (parsed.length === 0) {
      toast.error("CSV is empty or has no data rows");
      return;
    }

    // Validate headers
    const first = parsed[0];
    if (!("name" in first) || !("email" in first)) {
      toast.error("CSV must have 'name' and 'email' columns");
      return;
    }

    // Validate rows + check for duplicates in file
    const seenEmails = new Set<string>();
    const validated: ParsedRow[] = parsed.map((r) => {
      const name = (r.name || "").trim();
      const email = (r.email || "").trim().toLowerCase();
      const password = (r.password || "").trim();
      const errors: string[] = [];

      if (!name) errors.push("Name required");
      if (!email) errors.push("Email required");
      else if (!EMAIL_REGEX.test(email)) errors.push("Invalid email");
      else if (seenEmails.has(email)) errors.push("Duplicate in file");
      else seenEmails.add(email);

      if (password && password.length < 8)
        errors.push("Password < 8 chars");

      return {
        name,
        email,
        password,
        valid: errors.length === 0,
        errors,
        include: errors.length === 0,
      };
    });

    setFileName(file.name);
    setRows(validated);
    setStep("preview");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const toggleInclude = (index: number) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, include: !r.include } : r))
    );
  };

  const downloadTemplate = () => {
    const csv = "name,email,password\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const toImport = rows.filter((r) => r.include && r.valid);
    if (toImport.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: toImport.map((r) => ({
            name: r.name,
            email: r.email,
            password: r.password || undefined,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Import failed");
        return;
      }

      setResults(data.results);
      setStep("result");
      onComplete();

      const { created, failed, skipped } = data.summary;
      if (failed === 0 && skipped === 0) {
        toast.success(`${created} users created`);
      } else {
        toast.warning(
          `${created} created · ${skipped} skipped · ${failed} failed`
        );
      }
    } catch {
      toast.error("Import failed");
    } finally {
      setSubmitting(false);
    }
  };

  const copyPassword = (password: string, idx: number) => {
    navigator.clipboard.writeText(password);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const validCount = rows.filter((r) => r.valid).length;
  const includedCount = rows.filter((r) => r.include && r.valid).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Import Users</DialogTitle>
        </DialogHeader>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Upload a CSV with <code className="rounded bg-secondary px-1">name</code>,{" "}
              <code className="rounded bg-secondary px-1">email</code>, and optional{" "}
              <code className="rounded bg-secondary px-1">password</code> columns.
              Rows without passwords get an auto-generated one via welcome email.
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center transition-colors hover:border-yellow-300 hover:bg-yellow-50"
            >
              <Upload className="h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium">
                Drop your CSV here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports .csv files up to 500 rows
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>

            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-sm font-medium text-yellow-700 hover:text-yellow-800"
            >
              <Download className="h-4 w-4" />
              Download CSV template
            </button>

            <div className="rounded-lg bg-slate-50 p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">CSV format:</p>
              <pre className="font-mono">
                name,email,password{"\n"}
                Tan Wei Ming,weiming@example.com,{"\n"}
                Lim Ah Kong,ahkong@example.com,SecurePass2026
              </pre>
            </div>
          </div>
        )}

        {/* ── Step 2: Preview ── */}
        {step === "preview" && (
          <div className="flex flex-1 flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{fileName}</span>
                <span className="text-muted-foreground">
                  · {rows.length} rows · {validCount} valid
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16 text-right">Include</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i} className={!r.valid ? "bg-red-50/50" : ""}>
                      <TableCell className="text-xs text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell className="font-medium">{r.name || "—"}</TableCell>
                      <TableCell className="text-sm">{r.email || "—"}</TableCell>
                      <TableCell>
                        {r.password ? (
                          <Badge variant="secondary" className="bg-slate-100">
                            Manual
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                            Auto
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.valid ? (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                            Ready
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            {r.errors.join(", ")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <input
                          type="checkbox"
                          checked={r.include}
                          disabled={!r.valid}
                          onChange={() => toggleInclude(i)}
                          className="h-4 w-4"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {includedCount} user{includedCount !== 1 ? "s" : ""} will be
                created
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={reset}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={submitting || includedCount === 0}
                >
                  {submitting
                    ? "Importing..."
                    : `Import ${includedCount} user${includedCount !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Result ── */}
        {step === "result" && (
          <div className="flex flex-1 flex-col gap-4 overflow-hidden">
            <div className="flex-1 overflow-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Password</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.index + 1}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium">{r.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </TableCell>
                      <TableCell>
                        {r.status === "created_auto" && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            ✓ Created + email sent
                          </Badge>
                        )}
                        {r.status === "created_manual" && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            ✓ Created
                          </Badge>
                        )}
                        {r.status === "created_email_failed" && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                            ⚠ Email failed
                          </Badge>
                        )}
                        {r.status === "skipped_duplicate" && (
                          <Badge variant="outline">
                            — Already exists
                          </Badge>
                        )}
                        {r.status === "failed" && (
                          <div className="text-xs text-red-600">
                            ✗ {r.error}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.password && (
                          <div className="flex items-center gap-1">
                            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">
                              {r.password}
                            </code>
                            <button
                              onClick={() => copyPassword(r.password!, i)}
                              className="rounded p-1 hover:bg-secondary"
                              title="Copy password"
                            >
                              {copiedIdx === i ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
