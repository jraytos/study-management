"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionPayload } from "@/lib/session-types";
import { FlaskConical, FolderOpen, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setSession(data);
        setLoading(false);
        if (!data) return;
        // Regular users go straight to projects
        if (data.role !== "admin") {
          router.replace("/projects");
        }
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading) return null;
  if (!session) return null;

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white shadow-sm shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">AS Project Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{session.name}</span>
            <Button variant="ghost" size="sm" className="gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Admin Dashboard */}
      <main className="flex flex-col items-center justify-center flex-1 p-8 gap-8">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <p className="text-muted-foreground text-sm">What would you like to do?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Create New Project */}
          <button
            onClick={() => router.push("/projects/new")}
            className="group bg-white rounded-xl shadow border-2 border-transparent hover:border-primary transition-all p-8 flex flex-col items-center gap-4 text-left"
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Create New Project</p>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a template and set up a new project tracker
              </p>
            </div>
          </button>

          {/* Existing Projects */}
          <button
            onClick={() => router.push("/projects")}
            className="group bg-white rounded-xl shadow border-2 border-transparent hover:border-primary transition-all p-8 flex flex-col items-center gap-4 text-left"
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <FolderOpen className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Existing Projects</p>
              <p className="text-sm text-muted-foreground mt-1">
                Browse and manage your created projects
              </p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
