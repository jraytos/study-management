"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Study,
  Task,
  ColumnVisibility,
  getStudyById,
  getTasks,
  saveTasks,
  saveStudy,
  getColumnVisibility,
  saveColumnVisibility,
  generateId,
} from "@/lib/storage";
import { TaskTable } from "@/components/TaskTable";
import { ColumnToggle } from "@/components/ColumnToggle";
import { TaskDialog, TaskFormData } from "@/components/TaskDialog";
import { CreateStudyDialog } from "@/components/CreateStudyDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Pencil, FolderOpen } from "lucide-react";
import { SessionPayload } from "@/lib/session-types";

export default function StudyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<SessionPayload | null>(null);
  const [study, setStudy] = useState<Study | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [visibility, setVisibility] = useState<ColumnVisibility | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setSession(data));
    const s = getStudyById(id);
    if (!s) { router.replace("/"); return; }
    setStudy(s);
    setTasks(getTasks(id));
    setVisibility(getColumnVisibility(id));
  }, [id, router]);

  const handleTasksChange = useCallback(
    (updated: Task[]) => { setTasks(updated); saveTasks(id, updated); },
    [id]
  );

  const handleVisibilityChange = useCallback(
    (vis: ColumnVisibility) => { setVisibility(vis); saveColumnVisibility(id, vis); },
    [id]
  );

  // Add mode — no taskId passed
  const handleAddSubmit = useCallback(
    (data: TaskFormData) => {
      if (!study) return;
      const newTask: Task = {
        id: generateId(),
        studyId: id,
        no: tasks.length + 1,
        description: data.description,
        images: data.images,
        boxPath: data.boxPath,
        items: data.items,
      };
      const updated = [...tasks, newTask];
      setTasks(updated);
      saveTasks(id, updated);
    },
    [id, tasks, study]
  );

  const handleEditStudy = useCallback(
    (name: string, numColumns: number, description: string, images: string[], templateId: string) => {
      if (!study) return;
      const updated: Study = { ...study, name, numColumns, description, images, templateId };
      saveStudy(updated);
      setStudy(updated);
    },
    [study]
  );

  if (!study || !visibility) return null;

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-card shadow-sm sticky top-0 z-20 shrink-0">
        <div className="w-full px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold truncate">{study.name}</h1>
              {session?.role === "admin" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} · {study.numColumns} column{study.numColumns !== 1 ? "s" : ""} · Project
              {session && <span> · {session.name}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ColumnToggle visibility={visibility} onChange={handleVisibilityChange} />
            <Button variant="outline" size="sm" onClick={() => router.push("/filepaths")} className="gap-2">
              <FolderOpen className="h-4 w-4" />
              File Paths
            </Button>
            <Button onClick={() => setAddOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-6 py-6">
          <TaskTable
            tasks={tasks}
            numColumns={study.numColumns}
            visibility={visibility}
            onChange={handleTasksChange}
          />
        </div>
      </main>

      {/* Add Task — same form as Edit, no pre-fill */}
      <TaskDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        numColumns={study.numColumns}
        onSubmit={handleAddSubmit}
      />

      {/* Edit Study — admin only */}
      {session?.role === "admin" && (
        <CreateStudyDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          onSubmit={handleEditStudy}
          initial={study}
          mode="edit"
        />
      )}
    </div>
  );
}
