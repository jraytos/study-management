"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionPayload } from "@/lib/session-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlaskConical, ArrowLeft, X, UserPlus } from "lucide-react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

export default function UsersPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);

  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<"admin" | "user">("user");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  useEffect(() => {
    fetch("/api/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setSession(data);
        setLoading(false);
        if (!data || data.role !== "admin") {
          router.replace("/projects");
        }
      });
  }, [router]);

  useEffect(() => {
    if (session?.role === "admin") fetchUsers();
  }, [session]);

  async function fetchUsers() {
    const r = await fetch("/api/users");
    if (r.ok) setUsers(await r.json());
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    const r = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: addName, email: addEmail, password: addPassword, role: addRole }),
    });
    if (!r.ok) {
      const d = await r.json();
      setAddError(d.error ?? "Failed to add user.");
      return;
    }
    setAddName(""); setAddEmail(""); setAddPassword(""); setAddRole("user");
    setAddSuccess("User added successfully.");
    fetchUsers();
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("Remove this user?")) return;
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchUsers();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading || !session) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white shadow-sm shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/projects")} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <FlaskConical className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Manage Users</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{session.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-4xl mx-auto w-full">

        {/* Current users table */}
        <section className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-base font-semibold">Users</h2>
            <span className="text-sm text-muted-foreground">{users.length} total</span>
          </div>
          <div className="divide-y">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 py-8 text-center">No users found.</p>
            ) : (
              users.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      u.role === "admin"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {u.role === "admin" ? "Admin" : "User"}
                    </span>
                    {u.id !== session.userId && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Remove user"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Add user form */}
        <section className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Add New User</h2>
          </div>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="u-name">Full Name</Label>
                <Input
                  id="u-name"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  required
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="u-email">Email</Label>
                <Input
                  id="u-email"
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  required
                  placeholder="jane@example.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="u-pass">Password</Label>
                <Input
                  id="u-pass"
                  type="password"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="u-role">Role</Label>
                <select
                  id="u-role"
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as "admin" | "user")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            {addError && <p className="text-sm text-red-500">{addError}</p>}
            {addSuccess && <p className="text-sm text-green-600">{addSuccess}</p>}
            <div className="flex justify-end">
              <Button type="submit" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
