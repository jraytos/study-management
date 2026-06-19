"use client";

import { useEffect, useRef, useState } from "react";
import { Task, ItemColor, ColumnItem } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ImageIcon, X } from "lucide-react";

// ── Color options ─────────────────────────────────────────────────────────────
const COLORS: { value: ItemColor; label: string; swatch: string; activeBg: string; activeRing: string }[] = [
  { value: "gray",  label: "Gray",  swatch: "bg-gray-300",  activeBg: "bg-gray-100",  activeRing: "ring-gray-400"  },
  { value: "red",   label: "Red",   swatch: "bg-red-400",   activeBg: "bg-red-50",    activeRing: "ring-red-400"   },
  { value: "green", label: "Green", swatch: "bg-green-400", activeBg: "bg-green-50",  activeRing: "ring-green-500" },
];

// ── Cell bg used in display ───────────────────────────────────────────────────
export const CELL_BG: Record<ItemColor, string> = {
  gray:  "bg-gray-100",
  red:   "bg-red-50",
  green: "bg-green-50",
};

interface TaskDraft {
  description: string;
  images: string[];
  items: ColumnItem[];
}

interface Props {
  task: Task | null;
  numColumns: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskId: string, draft: TaskDraft) => void;
}

function makeDraft(task: Task, numColumns: number): TaskDraft {
  return {
    description: task.description,
    images: [...task.images],
    items: Array.from({ length: numColumns }, (_, i) => ({
      color: task.items[i]?.color ?? "gray",
      description: task.items[i]?.description ?? "",
      images: [...(task.items[i]?.images ?? [])],
    })),
  };
}

// ── Per-column item editor ────────────────────────────────────────────────────
function ColumnEditor({
  colIndex,
  item,
  onChange,
}: {
  colIndex: number;
  item: ColumnItem;
  onChange: (changes: Partial<ColumnItem>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function addImages(files: FileList | null) {
    if (!files) return;
    const remaining = 2 - item.images.length;
    if (remaining <= 0) return;
    const selected = Array.from(files).slice(0, remaining);
    Promise.all(
      selected.map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = (ev) => resolve(ev.target?.result as string);
            r.readAsDataURL(f);
          })
      )
    ).then((urls) => onChange({ images: [...item.images, ...urls] }));
  }

  return (
    <div className={`rounded-md border p-3 space-y-3 ${CELL_BG[item.color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Column {colIndex + 1}
        </span>
        {/* Color picker */}
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

      {/* Images — only show thumbnails + add button when < 2 */}
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
        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
          onChange={(e) => addImages(e.target.files)} />
      </div>
    </div>
  );
}

// ── Dialog ────────────────────────────────────────────────────────────────────
export function EditTaskDialog({ task, numColumns, open, onOpenChange, onSave }: Props) {
  const [draft, setDraft] = useState<TaskDraft | null>(null);
  const taskImgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) setDraft(makeDraft(task, numColumns));
  }, [task, numColumns]);

  if (!task || !draft) return null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    onSave(task!.id, draft);
    onOpenChange(false);
  }

  function addTaskImages(files: FileList | null) {
    if (!files || !draft) return;
    const remaining = 2 - draft.images.length;
    if (remaining <= 0) return;
    const selected = Array.from(files).slice(0, remaining);
    Promise.all(
      selected.map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = (ev) => resolve(ev.target?.result as string);
            r.readAsDataURL(f);
          })
      )
    ).then((urls) =>
      setDraft((d) => d ? { ...d, images: [...d.images, ...urls] } : d)
    );
  }

  function updateItem(colIdx: number, changes: Partial<ColumnItem>) {
    setDraft((d) => {
      if (!d) return d;
      const items = d.items.map((it, i) =>
        i === colIdx ? { ...it, ...changes } : it
      );
      return { ...d, items };
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Edit Row #{task.no}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* ── Task description ─────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-desc">Description</Label>
              <textarea
                id="edit-desc"
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft((d) => d ? { ...d, description: e.target.value } : d)}
                placeholder="Optional..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* ── Task images ──────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label>
                Images
                <span className="text-muted-foreground font-normal ml-1.5 text-xs">
                  ({draft.images.length}/2)
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {draft.images.map((url, idx) => (
                  <div key={idx} className="relative group w-16 h-16 rounded-md overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setDraft((d) => d ? { ...d, images: d.images.filter((_, i) => i !== idx) } : d)}
                      className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
                {draft.images.length < 2 && (
                  <button
                    type="button"
                    onClick={() => taskImgRef.current?.click()}
                    className="w-16 h-16 rounded-md border-2 border-dashed border-muted-foreground/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-xs">Add</span>
                  </button>
                )}
                <input ref={taskImgRef} type="file" multiple accept="image/*" className="hidden"
                  onChange={(e) => addTaskImages(e.target.files)} />
              </div>
            </div>

            {/* ── Column items ─────────────────────────────────── */}
            {numColumns > 0 && (
              <div className="space-y-3">
                <Label>Column Data</Label>
                <div className="space-y-2">
                  {draft.items.map((item, i) => (
                    <ColumnEditor
                      key={i}
                      colIndex={i}
                      item={item}
                      onChange={(changes) => updateItem(i, changes)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
