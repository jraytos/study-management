"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Task, TaskSubtask, SubtaskColumn, ColumnVisibility, SubtaskColor } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { Trash2, ImagePlus, Check } from "lucide-react";

interface Props {
  tasks: Task[];
  subtaskColumns: SubtaskColumn[];
  visibility: ColumnVisibility;
  onChange: (tasks: Task[]) => void;
}

// ── Color palette ──────────────────────────────────────────────────────────
const COLORS: { value: SubtaskColor; dot: string; fill: string; border: string }[] = [
  { value: "gray",  dot: "bg-gray-300",  fill: "bg-gray-400",  border: "border-gray-400"  },
  { value: "red",   dot: "bg-red-400",   fill: "bg-red-500",   border: "border-red-500"   },
  { value: "green", dot: "bg-green-400", fill: "bg-green-500", border: "border-green-500" },
];

const colorFor = (color: SubtaskColor) => COLORS.find((c) => c.value === color) ?? COLORS[0];

// ── Layout constants ───────────────────────────────────────────────────────
const ROW_H    = 44;
const HEAD_H   = 40;
const NO_W     = 60;
const DESC_W   = 220;
const IMG_W    = 130;
const BOX_W    = 180;
const ACT_W    = 48;
const SUB_W    = 180; // each subtask column width

const thCls = "bg-muted/50 font-semibold text-sm whitespace-nowrap px-3 border-b border-r text-left";
const tdCls = "bg-background text-sm border-b border-r";

// ── Subtask cell ───────────────────────────────────────────────────────────
interface SubtaskCellProps {
  subtask: TaskSubtask | undefined;
  columnId: string;
  onUpdate: (changes: Partial<TaskSubtask>) => void;
  onPreviewImage: (url: string) => void;
  onAddImages: () => void; // triggers file picker externally
}

function SubtaskCell({ subtask, columnId, onUpdate, onPreviewImage, onAddImages }: SubtaskCellProps) {
  const data: TaskSubtask = subtask ?? {
    columnId,
    checked: false,
    color: "gray",
    description: "",
    images: [],
  };

  const col = colorFor(data.color);

  return (
    <div className="flex flex-col items-center gap-1.5 p-2" style={{ minWidth: SUB_W }}>
      {/* Description */}
      <input
        value={data.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Description"
        className="w-full text-center text-xs border rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-ring bg-background"
      />

      {/* Images */}
      <div className="flex flex-wrap justify-center gap-1">
        {data.images.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={url}
            alt=""
            onClick={() => onPreviewImage(url)}
            className="w-10 h-10 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
          />
        ))}
        <button
          type="button"
          onClick={onAddImages}
          title="Add image"
          className="w-10 h-10 border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <ImagePlus className="h-4 w-4" />
        </button>
      </div>

      {/* Checkbox + color picker */}
      <div className="flex items-center gap-1.5">
        {/* Custom checkbox */}
        <button
          type="button"
          onClick={() => onUpdate({ checked: !data.checked })}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            data.checked
              ? `${col.fill} ${col.border}`
              : "border-gray-400 bg-white hover:border-gray-600"
          }`}
          title={data.checked ? "Uncheck" : "Check"}
        >
          {data.checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </button>

        {/* Color dots */}
        {COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.value}
            onClick={() => onUpdate({ color: c.value })}
            className={`w-4 h-4 rounded-full ${c.dot} transition-transform ${
              data.color === c.value ? "ring-2 ring-offset-1 ring-gray-500 scale-110" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main table ─────────────────────────────────────────────────────────────
export function TaskTable({ tasks, subtaskColumns, visibility, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const subtaskFileRef = useRef<HTMLInputElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [activeSubtaskTarget, setActiveSubtaskTarget] = useState<{ taskId: string; columnId: string } | null>(null);

  // ── Task-level image preview ─────────────────────────────────────────────
  const handlePreviewImage = useCallback((url: string) => setPreviewSrc(url), []);

  // ── Task field updates ──────────────────────────────────────────────────
  const updateField = useCallback(
    (taskId: string, field: "description" | "boxPath", value: string) =>
      onChange(tasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))),
    [tasks, onChange]
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      const updated = tasks
        .filter((t) => t.id !== taskId)
        .map((t, i) => ({ ...t, no: i + 1 }));
      onChange(updated);
    },
    [tasks, onChange]
  );

  // ── Subtask updates ──────────────────────────────────────────────────────
  const updateSubtask = useCallback(
    (taskId: string, columnId: string, changes: Partial<TaskSubtask>) => {
      onChange(
        tasks.map((t) => {
          if (t.id !== taskId) return t;
          const exists = t.subtasks.find((s) => s.columnId === columnId);
          if (exists) {
            return { ...t, subtasks: t.subtasks.map((s) => (s.columnId === columnId ? { ...s, ...changes } : s)) };
          }
          return {
            ...t,
            subtasks: [
              ...t.subtasks,
              { columnId, checked: false, color: "gray" as SubtaskColor, description: "", images: [], ...changes },
            ],
          };
        })
      );
    },
    [tasks, onChange]
  );

  // ── Subtask image add ────────────────────────────────────────────────────
  function triggerSubtaskImageAdd(taskId: string, columnId: string) {
    setActiveSubtaskTarget({ taskId, columnId });
    subtaskFileRef.current?.click();
  }

  function handleSubtaskImageFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!activeSubtaskTarget || !e.target.files) return;
    const { taskId, columnId } = activeSubtaskTarget;
    const readers = Array.from(e.target.files).map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((urls) => {
      updateSubtask(taskId, columnId, {
        images: [
          ...(tasks.find((t) => t.id === taskId)?.subtasks.find((s) => s.columnId === columnId)?.images ?? []),
          ...urls,
        ],
      });
    });
    e.target.value = "";
  }

  // ── Sync row heights across three sections ────────────────────────────────
  useEffect(() => {
    const container = scrollRef.current?.closest(".task-table-root") as HTMLElement | null;
    if (!container) return;
    const lefts  = container.querySelectorAll<HTMLElement>(".col-left  tbody tr");
    const mids   = container.querySelectorAll<HTMLElement>(".col-mid   tbody tr");
    const rights = container.querySelectorAll<HTMLElement>(".col-right tbody tr");
    lefts.forEach((_, i) => {
      const h = Math.max(
        lefts[i]?.getBoundingClientRect().height ?? 0,
        mids[i]?.getBoundingClientRect().height ?? 0,
        rights[i]?.getBoundingClientRect().height ?? 0,
      );
      [lefts[i], mids[i], rights[i]].forEach((r) => { if (r) r.style.height = h + "px"; });
    });
  }, [tasks, visibility, subtaskColumns]);

  const subtaskCount = visibility.subtasks ? subtaskColumns.length : 0;

  const emptyRow = (cols: number) => (
    <tr>
      <td colSpan={cols} style={{ height: ROW_H }} className="text-center text-muted-foreground text-sm px-4">
        No tasks yet. Click &ldquo;Add Task&rdquo; to get started.
      </td>
    </tr>
  );

  return (
    <>
      {/* Hidden file input for subtask images */}
      <input
        ref={subtaskFileRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleSubtaskImageFiles}
      />

      <div className="task-table-root rounded-md border flex overflow-hidden">

        {/* ── LEFT: fixed columns (No., Task Description, Images) ── */}
        <div className="col-left shrink-0 border-r overflow-hidden">
          <table className="border-collapse" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr style={{ height: HEAD_H }}>
                {visibility.no          && <th className={thCls} style={{ width: NO_W }}>No.</th>}
                {visibility.description && <th className={thCls} style={{ width: DESC_W }}>Task Description</th>}
                {visibility.images      && <th className={`${thCls} border-r-0`} style={{ width: IMG_W }}>Images</th>}
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0
                ? emptyRow((visibility.no ? 1 : 0) + (visibility.description ? 1 : 0) + (visibility.images ? 1 : 0) || 1)
                : tasks.map((task) => (
                  <tr key={task.id} style={{ height: ROW_H }}>
                    {visibility.no && (
                      <td className={`${tdCls} text-center text-muted-foreground`} style={{ width: NO_W }}>
                        {task.no}
                      </td>
                    )}
                    {visibility.description && (
                      <td className={`${tdCls} p-1`} style={{ width: DESC_W }}>
                        <Input
                          value={task.description}
                          onChange={(e) => updateField(task.id, "description", e.target.value)}
                          className="h-8 border-transparent hover:border-input focus:border-input bg-transparent text-sm"
                          placeholder="—"
                        />
                      </td>
                    )}
                    {visibility.images && (
                      <td className={`${tdCls} p-2 border-r-0`} style={{ width: IMG_W }}>
                        {task.images.length === 0 ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {task.images.map((url, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={i}
                                src={url}
                                alt=""
                                onClick={() => handlePreviewImage(url)}
                                className="w-9 h-9 rounded object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                              />
                            ))}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* ── MIDDLE: scrollable subtask columns ── */}
        <div ref={scrollRef} className="col-mid flex-1 overflow-x-auto">
          {subtaskCount === 0 ? (
            <div
              style={{ height: HEAD_H + (tasks.length || 1) * ROW_H }}
              className="flex items-center justify-center text-muted-foreground text-sm px-4 min-w-[200px]"
            >
              {tasks.length === 0 ? "" : "No subtask columns"}
            </div>
          ) : (
            <table
              className="border-collapse"
              style={{ tableLayout: "fixed", minWidth: subtaskCount * SUB_W }}
            >
              <thead>
                <tr style={{ height: HEAD_H }}>
                  {subtaskColumns.map((col, i) => (
                    <th
                      key={col.id}
                      className={`${thCls} text-center ${i === subtaskColumns.length - 1 ? "border-r-0" : ""}`}
                      style={{ width: SUB_W, minWidth: SUB_W }}
                    >
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0
                  ? emptyRow(subtaskCount)
                  : tasks.map((task) => (
                    <tr key={task.id}>
                      {subtaskColumns.map((col, i) => {
                        const sub = task.subtasks.find((s) => s.columnId === col.id);
                        return (
                          <td
                            key={col.id}
                            className={`${tdCls} p-0 ${i === subtaskColumns.length - 1 ? "border-r-0" : ""}`}
                            style={{ width: SUB_W, minWidth: SUB_W, verticalAlign: "top" }}
                          >
                            <SubtaskCell
                              subtask={sub}
                              columnId={col.id}
                              onUpdate={(changes) => updateSubtask(task.id, col.id, changes)}
                              onPreviewImage={handlePreviewImage}
                              onAddImages={() => triggerSubtaskImageAdd(task.id, col.id)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>

        {/* ── RIGHT: fixed columns (Box Path, Actions) ── */}
        <div className="col-right shrink-0 border-l overflow-hidden">
          <table className="border-collapse" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr style={{ height: HEAD_H }}>
                {visibility.boxPath && (
                  <th className={`${thCls} border-r-0`} style={{ width: BOX_W }}>Box Path</th>
                )}
                <th className="bg-muted/50 border-b" style={{ width: ACT_W }} />
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0
                ? emptyRow((visibility.boxPath ? 1 : 0) + 1)
                : tasks.map((task) => (
                  <tr key={task.id} className="group" style={{ height: ROW_H }}>
                    {visibility.boxPath && (
                      <td className={`${tdCls} p-1 border-r-0`} style={{ width: BOX_W }}>
                        <Input
                          value={task.boxPath}
                          onChange={(e) => updateField(task.id, "boxPath", e.target.value)}
                          className="h-8 border-transparent hover:border-input focus:border-input bg-transparent text-sm"
                          placeholder="—"
                        />
                      </td>
                    )}
                    <td className="bg-background border-b p-1" style={{ width: ACT_W }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Image preview modal */}
      <ImagePreviewModal src={previewSrc} onClose={() => setPreviewSrc(null)} />
    </>
  );
}
