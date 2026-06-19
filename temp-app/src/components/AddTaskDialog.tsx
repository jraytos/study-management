"use client";

import { useState, useRef } from "react";
import { SubtaskColumn, generateId } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, ImageIcon, X, ChevronDown, ChevronRight, Pencil, Check } from "lucide-react";

interface TaskDraft {
  description: string;
  images: string[];
  boxPath: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the task draft AND the (possibly updated) column list */
  onSubmit: (draft: TaskDraft, columns: SubtaskColumn[]) => void;
  /** Current study-level subtask columns */
  subtaskColumns: SubtaskColumn[];
}

const EMPTY: TaskDraft = { description: "", images: [], boxPath: "" };

export function AddTaskDialog({ open, onOpenChange, onSubmit, subtaskColumns }: Props) {
  const [draft, setDraft] = useState<TaskDraft>(EMPTY);
  const [columns, setColumns] = useState<SubtaskColumn[]>(subtaskColumns);
  const [subtasksOpen, setSubtasksOpen] = useState(false);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync columns when the dialog opens with fresh study columns
  function handleOpenChange(val: boolean) {
    if (val) {
      setDraft(EMPTY);
      setColumns(subtaskColumns);
      setSubtasksOpen(false);
      setEditingColId(null);
    }
    onOpenChange(val);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(draft, columns);
    handleOpenChange(false);
  }

  // ── Task images ──────────────────────────────────────────────────────────
  function handleImageFiles(files: FileList | null) {
    if (!files) return;
    const readers = Array.from(files).map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((urls) =>
      setDraft((d) => ({ ...d, images: [...d.images, ...urls] }))
    );
  }

  // ── Subtask column management ─────────────────────────────────────────────
  function addColumn() {
    if (columns.length >= 100) return;
    const col: SubtaskColumn = {
      id: generateId(),
      name: `Subtask ${columns.length + 1}`,
    };
    setColumns((c) => [...c, col]);
    setEditingColId(col.id);
  }

  function updateColumnName(id: string, name: string) {
    setColumns((c) => c.map((col) => (col.id === id ? { ...col, name } : col)));
  }

  function removeColumn(id: string) {
    setColumns((c) => c.filter((col) => col.id !== id));
    if (editingColId === id) setEditingColId(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl">Add Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

            {/* Task Description */}
            <div className="space-y-1.5">
              <Label htmlFor="task-desc">Task Description</Label>
              <textarea
                id="task-desc"
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Describe the task..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* Task Images */}
            <div className="space-y-1.5">
              <Label>Images</Label>
              <div className="flex flex-wrap gap-2">
                {draft.images.map((url, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-md overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, images: d.images.filter((_, i) => i !== idx) }))}
                      className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-md border-2 border-dashed border-muted-foreground/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-xs">Add</span>
                </button>
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                  onChange={(e) => handleImageFiles(e.target.files)} />
              </div>
            </div>

            {/* Subtask Columns — collapsed by default */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setSubtasksOpen((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium w-full text-left group"
              >
                {subtasksOpen
                  ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                }
                <span>Subtask Columns</span>
                <span className="text-muted-foreground font-normal">
                  ({columns.length}/100)
                </span>
              </button>

              {subtasksOpen && (
                <div className="border rounded-md overflow-hidden">
                  {columns.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-4 py-3">
                      No columns defined yet.
                    </p>
                  ) : (
                    <div className="overflow-y-auto max-h-56 divide-y">
                      {columns.map((col, idx) => (
                        <div key={col.id} className="flex items-center gap-2 px-3 py-2">
                          <span className="text-xs text-muted-foreground w-5 shrink-0 text-right">
                            {idx + 1}.
                          </span>

                          {editingColId === col.id ? (
                            <>
                              <Input
                                autoFocus
                                value={col.name}
                                onChange={(e) => updateColumnName(col.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === "Escape") {
                                    e.preventDefault();
                                    setEditingColId(null);
                                  }
                                }}
                                className="h-7 text-sm flex-1"
                                placeholder="Column name…"
                              />
                              <button
                                type="button"
                                onClick={() => setEditingColId(null)}
                                className="text-green-600 hover:text-green-700 shrink-0"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-sm truncate">{col.name}</span>
                              <button
                                type="button"
                                onClick={() => setEditingColId(col.id)}
                                className="text-muted-foreground hover:text-foreground shrink-0"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeColumn(col.id)}
                                className="text-destructive/50 hover:text-destructive shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="border-t px-3 py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addColumn}
                      disabled={columns.length >= 100}
                      className="gap-1.5 h-7 text-xs w-full justify-start"
                    >
                      <Plus className="h-3 w-3" />
                      Add Column
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Box Path */}
            <div className="space-y-1.5">
              <Label htmlFor="box-path">Box Path</Label>
              <Input
                id="box-path"
                value={draft.boxPath}
                onChange={(e) => setDraft((d) => ({ ...d, boxPath: e.target.value }))}
                placeholder="e.g. /studies/sample/box-1"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
