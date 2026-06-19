"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Study,
  Task,
  SubtaskColumn,
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
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

export default function StudyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [study, setStudy] = useState<Study | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [visibility, setVisibility] = useState<ColumnVisibility | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const s = getStudyById(id);
    if (!s) {
      router.replace("/");
      return;
    }
    setStudy(s);
    setTasks(getTasks(id));
    setVisibility(getColumnVisibility(id));
  }, [id, router]);

  const handleTasksChange = useCallback(
    (updated: Task[]) => {
      setTasks(updated);
      saveTasks(id, updated);
    },
    [id]
  );

  const handleVisibilityChange = useCallback(
    (vis: ColumnVisibility) => {
      setVisibility(vis);
      saveColumnVisibility(id, vis);
    },
    [id]
  );

  // Called when Add Task modal submits — receives task draft + (possibly updated) column list
  const handleAddTask = useCallback(
    (
      draft: { description: string; images: string[]; boxPath: string },
      columns: SubtaskColumn[]
    ) => {
      // Persist updated column list back to the study
      if (study) {
        const updatedStudy: Study = { ...study, subtaskColumns: columns };
        setStudy(updatedStudy);
        saveStudy(updatedStudy);
      }

      const newTask: Task = {
        id: generateId(),
        studyId: id,
        no: tasks.length + 1,
        description: draft.description,
        images: draft.images,
        subtasks: [], // filled in by user directly in the table
        boxPath: draft.boxPath,
      };
      const updated = [...tasks, newTask];
      setTasks(updated);
      saveTasks(id, updated);
    },
    [id, tasks, study]
  );

  if (!study || !visibility) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{study.name}</h1>
            <p className="text-xs text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ColumnToggle visibility={visibility} onChange={handleVisibilityChange} />
            <Button onClick={() => setAddOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        <TaskTable
          tasks={tasks}
          subtaskColumns={study.subtaskColumns}
          visibility={visibility}
          onChange={handleTasksChange}
        />
      </main>

      <AddTaskDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAddTask}
        subtaskColumns={study.subtaskColumns}
      />
    </div>
  );
}
