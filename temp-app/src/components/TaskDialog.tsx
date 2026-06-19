"use client";

import { useEffect, useRef, useState } from "react";
import { Task, ItemColor, ColumnItem } from "@/lib/storage";
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
import { ImageIcon, X } from "lucide-react";

// ── Color palette ────────────────────────────────────────────────────────────
const COLORS: { value: ItemColor; label: string; swatch: string; activeBg: string; activeRing: string }[] = [
  { value: "gray",  label: "Gray",  swatch: "bg-gray-300",  activeBg: "bg-gray-100",  activeRing: "ring-gray-400"  },
  { value: "red",   label: "Red",   swatch: "bg-red-400",   activeBg: "bg-red-50",    activeRing: "ring-red-400"   },
  { value: "green", label: "Green", swatch: "bg-green-400", activeBg: "bg-green-50",  activeRing: "ring-green-500" },
];

export const CELL_BG: Record<ItemColor, string> = {
  gray:  "bg-gray-100",
  red:   "bg-red-50",
  green: "bg-green-50",
};

// ── Shared form data ─────────────────────────────────────────────────────────
export interface TaskFormData {
  description: string;
  images: string[];    // max 2
  boxPath: string;
  items: ColumnItem[]; // one per column
}

function blankData(numColumns: number, seed?: Partial<Task>): TaskFormData {
  return {
    description: seed?.description ?? "",
    images: seed?.images ? [...seed.images] : [],
    boxPath: seed?.boxPath ?? "",
    items: Array.from({ length: numColumns }, (_, i) => ({
      color: seed?.items?.[i]?.color ?? "gray",
      description: seed?.items?.[i]?.description ?? "",
      images: [...(seed?.items?.[i]?.images ?? [])],
    })),
  };
}

// ── Image picker helper ───────────────────────────────────────────────────────
function readFiles(files: FileList, maxCount: number): Promise<string[]> {
  const selected = Array.from(files).slice(0, maxCount);
  return Promise.all(
    selected.map(
      (f) =>
        new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = (ev) => resolve(ev.target?.result as string);
          r.readAsDataURL(f);
        })
    )
  );
}

// ── Per-column item editor ────────────────────────────────────────────────────
function ColumnEditor({
  index,
  item,
  onChange,
}: {
  index: number;
  item: ColumnItem;
  onChange: (changes: Partial<ColumnItem>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`rounded-md border p-3 space-y-2.5 ${CELL_BG[item.color]}`}>
      {/* Header: label + color picker */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Column {index + 1}
        </span>
        <div className="flex gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => onChange({ color: c.value })}
              className={`w-5 h-5 rounded-full ${c.swatch} border transition-transform ${
                item.color === c.value
                  ? `ring-2 ring-offset-1 ${c.activeRing} scale-110`
                  : "border-gray-300 hover:scale-105"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Description */}
      <textarea
        rows={2}
        value={item.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Description (optional)..."
        className="w-full rounded border border-input bg-white/70 px-2 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
      />

      {/* Images — no placeholder when 0; add button shown only when < 2 */}
      <div className="flex flex-wrap gap-1.5">
        {item.images.map((url, i) => (
          <div key={i} className="relative group w-14 h-14 rounded overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange({ images: item.images.filter((_, j) => j !== i) })}
              className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-2.5 w-2.5 text-white" />
            </button>
          </div>
        ))}
        {item.images.length < 2 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-14 h-14 rounded border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors bg-white/50"
          >
            <ImageIcon className="h-4 w-4" />
            <span className="text-[10px]">Add</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            if (!e.target.files) return;
            const remaining = 2 - item.images.length;
            const urls = await readFiles(e.target.files, remaining);
            onChange({ images: [...item.images, ...urls] });
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numColumns: number;
  /** Existing task → edit mode. Omit → add mode. */
  task?: Task | null;
  onSubmit: (data: TaskFormData, taskId?: string) => void;
}

// ── Dialog ─────────────────────────────────────────────────────────────────────
export function TaskDialog({ open, onOpenChange, numColumns, task, onSubmit }: Props) {
  const [data, setData] = useState<TaskFormData>(() => blankData(numColumns, task ?? undefined));
  const taskImgRef = useRef<HTMLInputElement>(null);

  const isEdit = !!task;
  const title  = isEdit ? `Edit Row #${task!.no}` : "Add Task";

  // Re-initialise whenever the dialog opens
  useEffect(() => {
    if (open) setData(blankData(numColumns, task ?? undefined));
  }, [open, task, numColumns]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(data, task?.id);
    onOpenChange(false);
  }

  function updateItem(colIdx: number, changes: Partial<ColumnItem>) {
    setData((d) => ({
      ...d,
      items: d.items.map((it, i) => (i === colIdx ? { ...it, ...changes } : it)),
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* ── Description ────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="td-desc">Description</Label>
              <textarea
                id="td-desc"
                rows={2}
                value={data.description}
                onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))}
                placeholder="Optional..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* ── Images (task-level, max 2) ──────────────────────── */}
            <div className="space-y-1.5">
              <Label>
                Images
                <span className="text-muted-foreground font-normal ml-1.5 text-xs">
                  ({data.images.length}/2)
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {data.images.map((url, idx) => (
                  <div key={idx} className="relative group w-16 h-16 rounded-md overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setData((d) => ({ ...d, images: d.images.filter((_, i) => i !== idx) }))
                      }
                      className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
                {data.images.length < 2 && (
                  <button
                    type="button"
                    onClick={() => taskImgRef.current?.click()}
                    className="w-16 h-16 rounded-md border-2 border-dashed border-muted-foreground/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-xs">Add</span>
                  </button>
                )}
                <input
                  ref={taskImgRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    if (!e.target.files) return;
                    const urls = await readFiles(e.target.files, 2 - data.images.length);
                    setData((d) => ({ ...d, images: [...d.images, ...urls] }));
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            {/* ── Box File Path ───────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="td-box">Box File Path</Label>
              <Input
                id="td-box"
                value={data.boxPath}
                onChange={(e) => setData((d) => ({ ...d, boxPath: e.target.value }))}
                placeholder="e.g. /studies/trial-a/box-1"
              />
            </div>

            {/* ── Column items ─────────────────────────────────────── */}
            {numColumns > 0 && (
              <div className="space-y-2.5">
                <Label>Column Data</Label>
                {data.items.map((item, i) => (
                  <ColumnEditor
                    key={i}
                    index={i}
                    item={item}
                    onChange={(changes) => updateItem(i, changes)}
                  />
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? "Save Changes" : "Add Task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
