"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Mail,
  Copy,
  Check,
  Eye,
  EyeOff,
  Upload,
} from "lucide-react";
import { FilterPills } from "@/components/admin-filters";
import { BulkImportDialog } from "@/components/admin-bulk-import-dialog";
import { toast } from "sonner";

interface AuthUser {
  id: string;
  email?: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
    must_reset_password?: boolean;
  };
}

export function AdminUserList({ users }: { users: AuthUser[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultPassword, setResultPassword] = useState("");
  const [resultEmail, setResultEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add user form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [passwordMode, setPasswordMode] = useState<"auto" | "manual">("auto");
  const [manualPassword, setManualPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resultMode, setResultMode] = useState<"auto" | "manual">("auto");

  const query = filter.toLowerCase();
  const filtered = users.filter((u) => {
    const matchesSearch =
      (u.user_metadata?.full_name || "").toLowerCase().includes(query) ||
      (u.email || "").toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "needs_reset" && u.user_metadata?.must_reset_password) ||
      (statusFilter === "active" && !u.user_metadata?.must_reset_password);
    return matchesSearch && matchesStatus;
  });

  const activeCount = users.filter((u) => !u.user_metadata?.must_reset_password).length;
  const resetCount = users.filter((u) => u.user_metadata?.must_reset_password).length;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    if (passwordMode === "manual") {
      if (manualPassword.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      if (manualPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: Record<string, string> = {
        name: name.trim(),
        email: email.trim(),
        mode: passwordMode,
      };
      if (passwordMode === "manual") {
        payload.password = manualPassword;
      }

      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create user");
        return;
      }

      if (data.warning) {
        toast.warning(data.warning);
      } else if (data.mode === "manual") {
        toast.success("User created with custom password");
      } else {
        toast.success("User created and welcome email sent");
      }

      // Show result dialog
      setResultMode(data.mode || "auto");
      setResultPassword(data.password || "");
      setResultEmail(email.trim());
      setAddOpen(false);
      setResultOpen(true);
      setName("");
      setEmail("");
      setPasswordMode("auto");
      setManualPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      router.refresh();
    } catch {
      toast.error("Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (id: string) => {
    const res = await fetch(`/api/v1/admin/users/${id}/resend`, {
      method: "POST",
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to resend");
      return;
    }

    if (data.warning) {
      toast.warning(data.warning);
    } else {
      toast.success("Welcome email resent with new password");
    }

    if (data.password) {
      setResultPassword(data.password);
      setResultEmail("");
      setResultOpen(true);
    }

    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const res = await fetch(`/api/v1/admin/users/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to delete user");
      return;
    }

    toast.success("User deleted");
    router.refresh();
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(resultPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setBulkOpen(true)}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <BulkImportDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onComplete={() => router.refresh()}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <FilterPills
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All", count: users.length },
            { value: "active", label: "Active", count: activeCount },
            { value: "needs_reset", label: "Needs Reset", count: resetCount },
          ]}
        />
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  {filter ? "No users match your search" : "No users yet"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.user_metadata?.full_name || "—"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.user_metadata?.must_reset_password ? (
                      <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                        Needs Reset
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon-sm",
                        })}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleResend(user.id)}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(user.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => {
        setAddOpen(open);
        if (!open) {
          setPasswordMode("auto");
          setManualPassword("");
          setConfirmPassword("");
          setShowPassword(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tan Wei Ming"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. weiming@company.com"
                required
              />
            </div>

            {/* Password mode toggle */}
            <div className="space-y-3">
              <Label>Password</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordMode("auto")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    passwordMode === "auto"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "hover:bg-secondary"
                  }`}
                >
                  <div className="font-medium">Auto-generate</div>
                  <div className={`text-xs ${passwordMode === "auto" ? "text-slate-300" : "text-muted-foreground"}`}>
                    Email + forced reset
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordMode("manual")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    passwordMode === "manual"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "hover:bg-secondary"
                  }`}
                >
                  <div className="font-medium">Set manually</div>
                  <div className={`text-xs ${passwordMode === "manual" ? "text-slate-300" : "text-muted-foreground"}`}>
                    No email, no reset
                  </div>
                </button>
              </div>

              {passwordMode === "manual" && (
                <div className="space-y-3 rounded-lg border border-dashed p-3">
                  <div className="space-y-2">
                    <Label htmlFor="user-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="user-password"
                        type={showPassword ? "text" : "password"}
                        value={manualPassword}
                        onChange={(e) => setManualPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        minLength={8}
                        required
                        className="pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-password-confirm">Confirm Password</Label>
                    <Input
                      id="user-password-confirm"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      minLength={8}
                      required
                    />
                    {confirmPassword && manualPassword !== confirmPassword && (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {passwordMode === "auto"
                ? "A random password will be generated and sent to this email. The user must reset their password on first login."
                : "No email will be sent. Share this password with the user directly (e.g. via WhatsApp)."}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || (passwordMode === "manual" && (manualPassword.length < 8 || manualPassword !== confirmPassword))}
              >
                {submitting ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Result Dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Created</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {resultMode === "manual" ? (
              <>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-sm font-medium text-emerald-800">
                    User created with your custom password.
                  </p>
                  <p className="mt-1 text-xs text-emerald-600">
                    No email was sent. The user can log in immediately — no password reset required.
                  </p>
                </div>
                {resultEmail && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Email: </span>
                    <span className="font-medium">{resultEmail}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  The welcome email has been sent. You can also copy the temporary
                  password below to share manually (e.g. via WhatsApp).
                </p>
                {resultEmail && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Email: </span>
                    <span className="font-medium">{resultEmail}</span>
                  </div>
                )}
                {resultPassword && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={resultPassword}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyPassword}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
            <Button onClick={() => setResultOpen(false)} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
