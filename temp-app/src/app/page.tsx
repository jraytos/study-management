"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Study, getStudies, saveStudy, deleteStudy, generateId } from "@/lib/storage";
import { CreateStudyDialog } from "@/components/CreateStudyDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FlaskConical, Pencil } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [studies, setStudies] = useState<Study[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Study | null>(null);

  useEffect(() => {
    setStudies(getStudies());
  }, []);

  function handleCreate(name: string, numColumns: number) {
    const study: Study = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      numColumns,
    };
    saveStudy(study);
    setStudies(getStudies());
  }

  function handleEdit(name: string, numColumns: number) {
    if (!editTarget) return;
    const updated: Study = { ...editTarget, name, numColumns };
    saveStudy(updated);
    setStudies(getStudies());
    setEditTarget(null);
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this study and all its tasks?")) return;
    deleteStudy(id);
    setStudies(getStudies());
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">AS Project Management</h1>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Study
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {studies.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <FlaskConical className="h-12 w-12 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">No studies yet</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Create your first study to start managing tasks.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Study
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {studies.map((study) => (
              <Card
                key={study.id}
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => router.push(`/studies/${study.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{study.name}</CardTitle>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={(e) => { e.stopPropagation(); setEditTarget(study); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(study.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {new Date(study.createdAt).toLocaleDateString()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {study.numColumns} col{study.numColumns !== 1 ? "s" : ""}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <CreateStudyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        mode="create"
      />

      <CreateStudyDialog
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        onSubmit={handleEdit}
        initial={editTarget ?? undefined}
        mode="edit"
      />
    </div>
  );
}
