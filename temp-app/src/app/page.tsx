"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Study, getStudies, saveStudy, deleteStudy, generateId } from "@/lib/storage";
import { CreateStudyDialog } from "@/components/CreateStudyDialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, FlaskConical, ImageIcon } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Study[]>([]);
  const [selected, setSelected] = useState<Study | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Study | null>(null);

  useEffect(() => {
    const s = getStudies();
    setProjects(s);
    if (s.length > 0) setSelected(s[0]);
  }, []);

  function handleCreate(name: string, numColumns: number, description: string, images: string[]) {
    const project: Study = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      numColumns,
      description,
      images,
    };
    saveStudy(project);
    const updated = getStudies();
    setProjects(updated);
    setSelected(project);
  }

  function handleEdit(name: string, numColumns: number, description: string, images: string[]) {
    if (!editTarget) return;
    const updated: Study = { ...editTarget, name, numColumns, description, images };
    saveStudy(updated);
    const all = getStudies();
    setProjects(all);
    setSelected(updated);
    setEditTarget(null);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this project and all its tasks?")) return;
    deleteStudy(id);
    const remaining = getStudies();
    setProjects(remaining);
    setSelected(remaining[0] ?? null);
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white shadow-sm shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">AS Project Management</h1>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </header>

      {/* Body */}
      <main className="flex flex-1 gap-4 p-6 min-h-0">

        {/* Left — scrollable project list */}
        <div className="w-52 shrink-0 bg-white rounded-lg shadow flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Projects
            </span>
            <button
              onClick={() => setCreateOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="New project"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {projects.length === 0 ? (
              <p className="text-xs text-muted-foreground px-4 py-4 text-center">
                No projects yet.
              </p>
            ) : (
              projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`relative flex items-center gap-2 px-4 py-3 cursor-pointer border-b text-sm transition-colors group ${
                    selected?.id === p.id
                      ? "bg-gray-50 font-medium"
                      : "hover:bg-gray-50 text-muted-foreground"
                  }`}
                >
                  {selected?.id === p.id && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                  )}
                  <span className="flex-1 truncate pl-1">{p.name}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setEditTarget(p); }}
                      className="p-0.5 rounded hover:bg-gray-200 text-muted-foreground hover:text-foreground"
                      title="Edit"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                      className="p-0.5 rounded hover:bg-gray-200 text-red-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right — project detail */}
        <div className="flex-1 bg-white rounded-lg shadow flex flex-col overflow-hidden min-w-0">
          {!selected ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-muted-foreground">
              <FlaskConical className="h-12 w-12" />
              <p className="text-sm">Select or create a project to get started.</p>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>
          ) : (
            <div className="flex flex-col flex-1 p-8 min-h-0">
              <div className="mb-5 space-y-1.5 shrink-0">
                <p className="text-sm">
                  <span className="font-semibold">Project Name: </span>
                  <span className="text-muted-foreground">{selected.name}</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Project Protocol: </span>
                  <span className="text-muted-foreground">
                    {selected.description || <em className="not-italic opacity-50">—</em>}
                  </span>
                </p>
              </div>

              {/* Image area */}
              <div className="flex-1 flex items-center justify-center bg-pink-50 rounded-lg border border-pink-100 min-h-0 mb-6 overflow-hidden">
                {selected.images && selected.images.length > 0 ? (
                  <div className="flex flex-wrap gap-4 p-6 justify-center items-center">
                    {selected.images.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="max-h-64 max-w-sm rounded-md object-contain shadow-sm"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-pink-200 select-none">
                    <ImageIcon className="h-20 w-20" />
                    <span className="text-lg font-medium text-pink-300">Project Image</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center shrink-0">
                <Button
                  onClick={() => router.push(`/studies/${selected.id}`)}
                  size="lg"
                  className="px-16"
                >
                  Start
                </Button>
              </div>
            </div>
          )}
        </div>
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
