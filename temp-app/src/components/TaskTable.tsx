"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Task, ColumnVisibility } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { TaskDialog, TaskFormData, CELL_BG } from "@/components/TaskDialog";
import { Trash2, Pencil } from "lucide-react";

interface Props {
  tasks: Task[];
  numColumns: number;
  visibility: ColumnVisibility;
  onChange: (tasks: Task[]) => void;
}

// ── Layout ────────────────────────────────────────────────────────────────────
const HEAD_H = 40;
const NO_W   = 60;
const DESC_W = 200;
const IMG_W  = 130;
const BOX_W  = 200;
const ACT_W  = 88;
const COL_W  = 200;

const thCls = "bg-muted/50 font-semibold text-sm whitespace-nowrap px-3 border-b border-r text-left select-none";
const tdBase = "text-sm border-b";

export function TaskTable({ tasks, numColumns, visibility, onChange }: Props) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Sync row heights across the three independent table panels
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const leftRows  = root.querySelectorAll<HTMLElement>(".col-left  tbody tr");
    const midRows   = root.querySelectorAll<HTMLElement>(".col-mid   tbody tr");
    const rightRows = root.querySelectorAll<HTMLElement>(".col-right tbody tr");
    // Reset first so we measure natural content height
    [...leftRows, ...midRows, ...rightRows].forEach((r) => { r.style.height = ""; });
    const count = Math.max(leftRows.length, midRows.length, rightRows.length);
    for (let i = 0; i < count; i++) {
      const h = Math.max(
        leftRows[i]?.getBoundingClientRect().height ?? 0,
        midRows[i]?.getBoundingClientRect().height ?? 0,
        rightRows[i]?.getBoundingClientRect().height ?? 0,
      );
      [leftRows[i], midRows[i], rightRows[i]].forEach((r) => {
        if (r) r.style.height = `${h}px`;
      });
    }
  }, [tasks, numColumns, visibility]);

  function deleteTask(taskId: string) {
    onChange(tasks.filter((t) => t.id !== taskId).map((t, i) => ({ ...t, no: i + 1 })));
  }

  function handleDialogSubmit(data: TaskFormData, taskId?: string) {
    if (taskId) {
      // Edit mode — patch only the target row
      onChange(tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t)));
    }
  }

  const colIndices = Array.from({ length: numColumns }, (_, i) => i);

  function emptyRow(cols: number) {
    return (
      <tr>
        <td colSpan={cols} className="text-center text-muted-foreground text-sm px-4 py-10 bg-background">
          No tasks yet. Click &ldquo;Add Task&rdquo; to get started.
        </td>
      </tr>
    );
  }

  return (
    <>
      <div ref={rootRef} className="rounded-md border flex overflow-hidden">

        {/* ── LEFT: No., Task Description, Task Images ─────────── */}
        <div className="col-left shrink-0 border-r overflow-hidden">
          <table className="border-collapse" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr style={{ height: HEAD_H }}>
                {visibility.no          && <th className={thCls} style={{ width: NO_W }}>No.</th>}
                {visibility.description && <th className={thCls} style={{ width: DESC_W }}>Description</th>}
                {visibility.images      && <th className={`${thCls} border-r-0`} style={{ width: IMG_W }}>Images</th>}
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0
                ? emptyRow((visibility.no ? 1 : 0) + (visibility.description ? 1 : 0) + (visibility.images ? 1 : 0) || 1)
                : tasks.map((task) => (
                  <tr key={task.id}>
                    {visibility.no && (
                      <td className={`${tdBase} border-r bg-background text-center text-muted-foreground`} style={{ width: NO_W }}>
                        {task.no}
                      </td>
                    )}
                    {visibility.description && (
                      <td className={`${tdBase} border-r bg-background px-3 py-2`} style={{ width: DESC_W }}>
                        {task.description || <span className="text-muted-foreground">—</span>}
                      </td>
                    )}
                    {visibility.images && (
                      <td className={`${tdBase} bg-background px-2 py-2`} style={{ width: IMG_W }}>
                        {task.images.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.images.map((url, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={i} src={url} alt=""
                                onClick={() => setPreviewSrc(url)}
                                className="w-10 h-10 rounded object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                              />
                            ))}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* ── MIDDLE: scrollable column cells ──────────────────── */}
        <div className="col-mid flex-1 overflow-x-auto">
          {numColumns === 0 ? (
            <div
              style={{ minHeight: HEAD_H + Math.max(tasks.length, 1) * 48 }}
              className="flex items-center justify-center text-muted-foreground text-sm px-4 min-w-[200px]"
            >
              {tasks.length > 0 ? "No columns configured" : ""}
            </div>
          ) : (
            <table className="border-collapse" style={{ tableLayout: "fixed", minWidth: numColumns * COL_W }}>
              <thead>
                <tr style={{ height: HEAD_H }}>
                  {colIndices.map((i) => (
                    <th
                      key={i}
                      className={`${thCls} text-center ${i === numColumns - 1 ? "border-r-0" : ""}`}
                      style={{ width: COL_W, minWidth: COL_W }}
                    >
                      Column {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0
                  ? emptyRow(numColumns)
                  : tasks.map((task) => (
                    <tr key={task.id}>
                      {colIndices.map((i) => {
                        const raw = task.items[i];
                        const item = {
                          color: raw?.color ?? ("gray" as const),
                          description: raw?.description ?? "",
                          images: raw?.images ?? [],
                        };
                        const bg = CELL_BG[item.color];
                        return (
                          <td
                            key={i}
                            className={`${tdBase} ${bg} px-3 py-2 ${i < numColumns - 1 ? "border-r" : ""}`}
                            style={{ width: COL_W, minWidth: COL_W, verticalAlign: "top" }}
                          >
                            {/* Description */}
                            {item.description && (
                              <p className="text-sm leading-snug mb-1.5">{item.description}</p>
                            )}
                            {/* Images — only when present */}
                            {item.images.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.images.map((url, j) => (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img key={j} src={url} alt=""
                                    onClick={() => setPreviewSrc(url)}
                                    className="w-9 h-9 rounded object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                                  />
                                ))}
                              </div>
                            )}
                            {/* Empty fallback */}
                            {!item.description && item.images.length === 0 && (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── RIGHT: Box File Path + Edit + Delete ─────────────── */}
        <div className="col-right shrink-0 border-l overflow-hidden">
          <table className="border-collapse" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr style={{ height: HEAD_H }}>
                <th className={thCls} style={{ width: BOX_W }}>Box File Path</th>
                <th className="bg-muted/50 border-b" style={{ width: ACT_W }} />
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0
                ? emptyRow(2)
                : tasks.map((task) => (
                  <tr key={task.id} className="group">
                    <td className={`${tdBase} border-r bg-background px-3 py-2`} style={{ width: BOX_W }}>
                      {task.boxPath || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="bg-background border-b px-1 py-1" style={{ width: ACT_W }}>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingTask(task)} title="Edit row">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteTask(task.id)} title="Delete row">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <ImagePreviewModal src={previewSrc} onClose={() => setPreviewSrc(null)} />

      {/* Edit modal — same form as Add */}
      <TaskDialog
        open={!!editingTask}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
        numColumns={numColumns}
        task={editingTask}
        onSubmit={handleDialogSubmit}
      />
    </>
  );
}
