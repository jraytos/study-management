"use client";

import { useEffect, useRef, useState } from "react";
import {
  Task, ItemColor, ColumnItem,
  FilepathCategory, FilepathItem,
  getFilepathCategories, getFilepathItems,
  saveFilepathCategories, saveFilepathItems, generateId,
} from "@/lib/storage";
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
import { ImageIcon, X, Plus, ChevronDown } from "lucide-react";

/** Convert a raw path to an href. URLs open as-is; local paths use file://. */
export function toHref(path: string): string {
  if (/^https?:\/\//i.test(path) || /^ftp:\/\//i.test(path) || /^mailto:/i.test(path)) return path;
  const normalized = path.replace(/\\/g, "/");
  return normalized.startsWith("/") ? `file://${normalized}` : `file:///${normalized}`;
}

export const CELL_BG: Record<ItemColor, string> = {
  gray:   "bg-gray-100",
  yellow: "bg-yellow-50",
  green:  "bg-green-50",
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

  const displayColor = item.color === "green" ? "yellow" : item.color;

  return (
    <div className={`rounded-md border p-2.5 ${CELL_BG[displayColor]}`}>
      <button
        type="button"
        onClick={() => onChange({ color: item.color === "yellow" || item.color === "green" ? "gray" : "yellow" })}
        title="Click to toggle color"
        className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block hover:text-foreground transition-colors cursor-pointer select-none"
      >
        Column {index + 1} {item.color !== "gray" ? "●" : "○"}
      </button>

      <div className="flex items-start gap-2">
        <textarea
          rows={3}
          value={item.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Description (optional)..."
          className="flex-1 min-w-0 rounded border border-input bg-white/70 px-2 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />

        <div className="flex flex-col gap-1 shrink-0">
          {item.images.map((url, i) => (
            <div key={i} className="relative group w-20 h-20 rounded overflow-hidden border">
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
              className="w-20 h-20 rounded border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors bg-white/50"
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
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numColumns: number;
  task?: Task | null;
  onSubmit: (data: TaskFormData, taskId?: string) => void;
}

const NEW_CAT_VALUE = "__new_cat__";

// ── Dialog ─────────────────────────────────────────────────────────────────────
export function TaskDialog({ open, onOpenChange, numColumns, task, onSubmit }: Props) {
  const [data, setData] = useState<TaskFormData>(() => blankData(numColumns, task ?? undefined));
  const taskImgRef = useRef<HTMLInputElement>(null);

  const [fpCategories, setFpCategories] = useState<FilepathCategory[]>([]);
  const [fpItems, setFpItems]           = useState<FilepathItem[]>([]);
  const [showAddForm, setShowAddForm]   = useState(false);
  const [qaName, setQaName]            = useState("");
  const [qaPath, setQaPath]            = useState("");
  const [qaCatId, setQaCatId]          = useState("");
  const [qaNewCat, setQaNewCat]        = useState("");

  const isEdit = !!task;
  const title  = isEdit ? `Edit Row #${task!.no}` : "Add Task";

  useEffect(() => {
    if (open) {
      setData(blankData(numColumns, task ?? undefined));
      const cats  = getFilepathCategories();
      const items = getFilepathItems();
      setFpCategories(cats);
      setFpItems(items);
      setShowAddForm(true);
      setQaName(""); setQaPath(""); setQaNewCat("");
      setQaCatId(cats[0]?.id ?? "");
    }
  }, [open, task, numColumns]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // If the add-path form has data, persist it before saving the task
    if (showAddForm && qaName.trim() && qaPath.trim()) {
      handleAddPath();
    }
    onSubmit(data, task?.id);
    onOpenChange(false);
  }

  function handleAddPath() {
    if (!qaName.trim() || !qaPath.trim()) return;
    const cats = [...fpCategories];
    let catId = qaCatId;

    if (qaCatId === NEW_CAT_VALUE) {
      const name = qaNewCat.trim() || "General";
      const newCat: FilepathCategory = { id: generateId(), name };
      cats.push(newCat);
      saveFilepathCategories(cats);
      catId = newCat.id;
    } else if (!catId) {
      const newCat: FilepathCategory = { id: generateId(), name: "General" };
      cats.push(newCat);
      saveFilepathCategories(cats);
      catId = newCat.id;
    }

    const newItem: FilepathItem = {
      id: generateId(), categoryId: catId,
      name: qaName.trim(), filepath: qaPath.trim(), color: "#3b82f6",
    };
    const allItems = [...getFilepathItems(), newItem];
    saveFilepathItems(allItems);
    setFpCategories(cats);
    setFpItems(allItems);
    setData((d) => ({ ...d, boxPath: newItem.filepath }));
    setShowAddForm(false);
    setQaName(""); setQaPath(""); setQaNewCat("");
    setQaCatId(cats[0]?.id ?? "");
  }

  function updateItem(colIdx: number, changes: Partial<ColumnItem>) {
    setData((d) => ({
      ...d,
      items: d.items.map((it, i) => (i === colIdx ? { ...it, ...changes } : it)),
    }));
  }

  const selectedMatch = fpItems.find((it) => it.filepath === data.boxPath);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-col flex-1 min-h-0 px-6 py-5 gap-5">

            {/* ── Description ────────────────────────────────────── */}
            <div className="space-y-1.5 shrink-0">
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
            <div className="space-y-1.5 shrink-0">
              <Label>
                Images
                <span className="text-muted-foreground font-normal ml-1.5 text-xs">
                  ({data.images.length}/2)
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {data.images.map((url, idx) => (
                  <div key={idx} className="relative group w-24 h-24 rounded-md overflow-hidden border">
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
                    className="w-24 h-24 rounded-md border-2 border-dashed border-muted-foreground/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
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

            {/* ── Column items (scrollable) ─────────────────────────── */}
            {numColumns > 0 && (
              <div className="flex flex-col min-h-0 flex-1">
                <Label className="shrink-0 mb-2.5">Column Data</Label>
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {data.items.map((item, i) => (
                    <ColumnEditor
                      key={i}
                      index={i}
                      item={item}
                      onChange={(changes) => updateItem(i, changes)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Box File Path ───────────────────────────────────── */}
            <div className="space-y-1.5 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="td-box">Box File Path</Label>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm((v) => !v);
                    setQaName(""); setQaPath(""); setQaNewCat("");
                    setQaCatId(fpCategories[0]?.id ?? "");
                  }}
                  className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showAddForm ? "← Select from list" : <><Plus className="h-3.5 w-3.5" />New path</>}
                </button>
              </div>

              {/* Select from list */}
              {fpItems.length > 0 && !showAddForm && (
                <>
                  <select
                    id="td-box"
                    value={data.boxPath}
                    onChange={(e) => setData((d) => ({ ...d, boxPath: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">— Select a file path —</option>
                    {fpCategories.map((cat) => {
                      const catItems = fpItems.filter((it) => it.categoryId === cat.id);
                      if (catItems.length === 0) return null;
                      return (
                        <optgroup key={cat.id} label={cat.name}>
                          {catItems.map((item) => (
                            <option key={item.id} value={item.filepath}>
                              {item.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                  {selectedMatch && (
                    <a
                      href={toHref(selectedMatch.filepath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: selectedMatch.color }}
                      className="text-xs hover:underline break-all inline-flex items-center gap-1 mt-0.5"
                    >
                      {selectedMatch.filepath}
                    </a>
                  )}
                </>
              )}

              {/* Empty state */}
              {fpItems.length === 0 && !showAddForm && (
                <p className="text-sm text-muted-foreground py-1">
                  No file paths saved yet.{" "}
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(true); setQaCatId(""); }}
                    className="underline hover:text-foreground"
                  >
                    Add one now
                  </button>
                </p>
              )}

              {/* Inline add form — single row */}
              {showAddForm && (
                <div className="rounded-md border bg-muted/30 p-3 mt-1">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Add file path to repository</p>
                  <div className="flex items-end gap-2">
                    {/* Name */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <label className="text-xs text-muted-foreground">Name</label>
                      <Input
                        value={qaName}
                        onChange={(e) => setQaName(e.target.value)}
                        placeholder="Name"
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* File Path */}
                    <div className="flex-[2] min-w-0 space-y-1">
                      <label className="text-xs text-muted-foreground">File Path</label>
                      <Input
                        value={qaPath}
                        onChange={(e) => setQaPath(e.target.value)}
                        placeholder="https://… or C:\path\to\folder"
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Category */}
                    <div className="w-36 shrink-0 space-y-1">
                      <label className="text-xs text-muted-foreground">Category</label>
                      <select
                        value={qaCatId}
                        onChange={(e) => setQaCatId(e.target.value)}
                        className="w-full h-8 rounded border border-input bg-background px-2 text-sm focus-visible:outline-none"
                      >
                        {fpCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                        <option value={NEW_CAT_VALUE}>+ New category…</option>
                      </select>
                    </div>

                  </div>

                  {/* New category name — shown below row only when needed */}
                  {qaCatId === NEW_CAT_VALUE && (
                    <div className="mt-2">
                      <Input
                        value={qaNewCat}
                        onChange={(e) => setQaNewCat(e.target.value)}
                        placeholder="New category name"
                        className="h-8 text-sm w-48"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
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
