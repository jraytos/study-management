"use client";

import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { Task, ColumnVisibility, FilepathItem, getFilepathItems } from "@/lib/storage";
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

// ── Layout constants (px) ────────────────────────────────────────────────────
const HEAD_H = 40;
const NO_W   = 60;
const DESC_W = 200;
const IMG_W  = 130;
const BOX_W  = 200;
const ACT_W  = 88;
const COL_W  = 200;

const thCls  = "bg-muted font-semibold text-sm whitespace-nowrap px-3 border-r text-left select-none";
const tdBase = "text-sm border-b";

export function TaskTable({ tasks, numColumns, visibility, onChange }: Props) {
  const [previewSrc, setPreviewSrc]   = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [fpItems, setFpItems]         = useState<FilepathItem[]>([]);

  const rootRef      = useRef<HTMLDivElement>(null);
  const midHeaderRef = useRef<HTMLDivElement>(null);
  const midBodyRef   = useRef<HTMLDivElement>(null);

  useEffect(() => { setFpItems(getFilepathItems()); }, []);

  // Sync body row heights across the three panels
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const leftRows  = root.querySelectorAll<HTMLElement>(".col-left  tbody tr");
    const midRows   = root.querySelectorAll<HTMLElement>(".col-mid   tbody tr");
    const rightRows = root.querySelectorAll<HTMLElement>(".col-right tbody tr");
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

  function syncHeaderScroll() {
    if (midHeaderRef.current && midBodyRef.current) {
      midHeaderRef.current.scrollLeft = midBodyRef.current.scrollLeft;
    }
  }

  function deleteTask(taskId: string) {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    onChange(tasks.filter((t) => t.id !== taskId).map((t, i) => ({ ...t, no: i + 1 })));
  }

  function toggleItemColor(taskId: string, colIdx: number, currentColor: string) {
    const next = currentColor === "yellow" ? "green" : "yellow";
    onChange(tasks.map((t) =>
      t.id !== taskId ? t : {
        ...t,
        items: t.items.map((it, i) =>
          i === colIdx ? { ...it, color: next as "yellow" | "green" } : it
        ),
      }
    ));
  }

  function handleDialogSubmit(data: TaskFormData, taskId?: string) {
    if (taskId) onChange(tasks.map((t) => t.id === taskId ? { ...t, ...data } : t));
  }

  const colIndices   = Array.from({ length: numColumns }, (_, i) => i);
  const leftColCount = (visibility.no ? 1 : 0) + (visibility.description ? 1 : 0) + (visibility.images ? 1 : 0) || 1;

  return (
    <>
      {/* overflow:clip keeps the rounded border clipping without creating a scroll container */}
      <div ref={rootRef} className="rounded-md border" style={{ overflow: "clip" }}>

        {/* ── STICKY HEADER ─────────────────────────────────────────────────── */}
        {/* This div is sticky relative to <main> (the nearest overflow-y-auto ancestor).
            It is NOT inside any overflow-x container, so it won't intercept sticky. */}
        <div className="flex sticky top-0 z-10 bg-muted border-b" style={{ height: HEAD_H }}>

          {/* Left fixed columns header */}
          <div className="shrink-0 border-r">
            <table className="border-collapse h-full" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr style={{ height: HEAD_H }}>
                  {visibility.no          && <th className={thCls} style={{ width: NO_W }}>No.</th>}
                  {visibility.description && <th className={thCls} style={{ width: DESC_W }}>Description</th>}
                  {visibility.images      && <th className="bg-muted font-semibold text-sm whitespace-nowrap px-3 text-left select-none" style={{ width: IMG_W }}>Images</th>}
                </tr>
              </thead>
            </table>
          </div>

          {/* Mid scrollable header — overflow:hidden, scrollLeft synced with body */}
          <div ref={midHeaderRef} className="flex-1" style={{ overflow: "hidden" }}>
            {numColumns > 0 && (
              <table className="border-collapse h-full" style={{ tableLayout: "fixed", minWidth: numColumns * COL_W }}>
                <thead>
                  <tr style={{ height: HEAD_H }}>
                    {colIndices.map((i) => (
                      <th
                        key={i}
                        className={`${thCls} text-center ${i === numColumns - 1 ? "" : ""}`}
                        style={{ width: COL_W, minWidth: COL_W }}
                      >
                        Column {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
              </table>
            )}
          </div>

          {/* Right fixed columns header */}
          <div className="shrink-0 border-l">
            <table className="border-collapse h-full" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr style={{ height: HEAD_H }}>
                  <th className={thCls} style={{ width: BOX_W }}>Box File Path</th>
                  <th className="bg-muted" style={{ width: ACT_W }} />
                </tr>
              </thead>
            </table>
          </div>
        </div>

        {/* ── BODY ──────────────────────────────────────────────────────────── */}
        <div className="flex">

          {/* Left fixed body */}
          <div className="col-left shrink-0 border-r" style={{ overflow: "clip" }}>
            <table className="border-collapse" style={{ tableLayout: "fixed" }}>
              <tbody>
                {tasks.length === 0
                  ? <tr><td colSpan={leftColCount} className="py-10 bg-background border-b" /></tr>
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

          {/* Mid scrollable body — only this element has overflow-x:auto.
              onScroll syncs the header's scrollLeft so headers track columns. */}
          <div
            ref={midBodyRef}
            className="col-mid flex-1"
            style={{ overflowX: "auto", overflowY: "clip" }}
            onScroll={syncHeaderScroll}
          >
            {numColumns === 0 ? (
              <div className="flex items-center justify-center text-muted-foreground text-sm px-4 py-10 min-w-[200px]">
                {tasks.length > 0 ? "No columns configured" : ""}
              </div>
            ) : (
              <table className="border-collapse" style={{ tableLayout: "fixed", minWidth: numColumns * COL_W }}>
                <tbody>
                  {tasks.length === 0
                    ? (
                      <tr>
                        <td colSpan={numColumns} className="text-center text-muted-foreground text-sm px-4 py-10 bg-background border-b">
                          No tasks yet. Click &ldquo;Add Task&rdquo; to get started.
                        </td>
                      </tr>
                    )
                    : tasks.map((task) => (
                      <tr key={task.id}>
                        {colIndices.map((i) => {
                          const raw  = task.items[i];
                          const item = {
                            color:       raw?.color       ?? ("gray" as const),
                            description: raw?.description ?? "",
                            images:      raw?.images      ?? [],
                          };
                          const bg          = CELL_BG[item.color];
                          const isYellowish = item.color === "yellow" || item.color === "green";
                          return (
                            <td
                              key={i}
                              className={`${tdBase} ${bg} px-3 py-2 ${i < numColumns - 1 ? "border-r" : ""}`}
                              style={{ width: COL_W, minWidth: COL_W, verticalAlign: "top" }}
                            >
                              {item.description && (
                                <p className="text-sm leading-snug mb-1.5">{item.description}</p>
                              )}
                              {item.images.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-1.5">
                                  {item.images.map((url, j) => (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img key={j} src={url} alt=""
                                      onClick={() => setPreviewSrc(url)}
                                      className="w-9 h-9 rounded object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                                    />
                                  ))}
                                </div>
                              )}
                              {!isYellowish && !item.description && item.images.length === 0 && (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                              {isYellowish && (
                                <div className="flex justify-center pt-1">
                                  <input
                                    type="checkbox"
                                    checked={item.color === "green"}
                                    onChange={() => toggleItemColor(task.id, i, item.color)}
                                    className="h-4 w-4 cursor-pointer accent-green-600"
                                  />
                                </div>
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

          {/* Right fixed body */}
          <div className="col-right shrink-0 border-l" style={{ overflow: "clip" }}>
            <table className="border-collapse" style={{ tableLayout: "fixed" }}>
              <tbody>
                {tasks.length === 0
                  ? <tr><td colSpan={2} className="py-10 bg-background border-b" /></tr>
                  : tasks.map((task) => (
                    <tr key={task.id} className="group">
                      <td className={`${tdBase} border-r bg-background px-3 py-2`} style={{ width: BOX_W }}>
                        {task.boxPath ? (() => {
                          const match = fpItems.find((it) => it.filepath === task.boxPath);
                          return (
                            <a
                              href={task.boxPath}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: match?.color ?? "var(--primary)" }}
                              className="hover:underline break-all text-sm"
                            >
                              {task.boxPath}
                            </a>
                          );
                        })() : <span className="text-muted-foreground">—</span>}
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
      </div>

      <ImagePreviewModal src={previewSrc} onClose={() => setPreviewSrc(null)} />

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
