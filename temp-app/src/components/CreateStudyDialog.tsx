"use client";

import { useEffect, useRef, useState } from "react";
import { Study } from "@/lib/storage";
import { TEMPLATES } from "@/lib/templates";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, numColumns: number, description: string, images: string[], templateId: string) => void;
  initial?: Pick<Study, "name" | "numColumns" | "description" | "images" | "templateId">;
  mode?: "create" | "edit";
}

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

export function CreateStudyDialog({ open, onOpenChange, onSubmit, initial, mode = "create" }: Props) {
  const [name, setName]             = useState(initial?.name ?? "");
  const [numColumns, setNumColumns] = useState(String(initial?.numColumns ?? 5));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [images, setImages]         = useState<string[]>(initial?.images ?? []);
  const [templateId, setTemplateId] = useState(initial?.templateId ?? "default");
  const [nameError, setNameError]   = useState("");
  const [colError, setColError]     = useState("");
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setNumColumns(String(initial?.numColumns ?? 5));
      setDescription(initial?.description ?? "");
      setImages(initial?.images ? [...initial.images] : []);
      setTemplateId(initial?.templateId ?? "default");
      setNameError("");
      setColError("");
    }
  }, [open, initial]);

  function handleTemplateSelect(id: string) {
    const tpl = TEMPLATES.find((t) => t.id === id);
    setTemplateId(id);
    if (tpl) setNumColumns(String(tpl.defaultColumns));
  }

  function validate() {
    let ok = true;
    if (!name.trim()) { setNameError("Project name is required."); ok = false; }
    const n = parseInt(numColumns, 10);
    if (isNaN(n) || n < 0 || n > 100) { setColError("Must be between 0 and 100."); ok = false; }
    return ok;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(name.trim(), parseInt(numColumns, 10), description.trim(), images, templateId);
    onOpenChange(false);
  }

  function handleOpenChange(val: boolean) {
    if (!val) { setNameError(""); setColError(""); }
    onOpenChange(val);
  }

  const title       = mode === "edit" ? "Edit Project" : "Create New Project";
  const submitLabel = mode === "edit" ? "Save Changes" : "Create Project";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">

          {/* Template picker */}
          {mode === "create" && (
            <div className="space-y-1">
              <Label>Template</Label>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleTemplateSelect(tpl.id)}
                    className={`rounded-lg border-2 p-3 text-left transition-colors ${
                      templateId === tpl.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="text-sm font-medium leading-tight">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                    <p className="text-xs font-semibold text-primary mt-1">{tpl.defaultColumns} cols</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="proj-name">
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="proj-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(""); }}
              placeholder="Enter project name"
              autoFocus
            />
            {nameError && <p className="text-sm text-red-500">{nameError}</p>}
          </div>

          {/* Number of Columns */}
          <div className="space-y-1">
            <Label htmlFor="num-cols">Number of Columns</Label>
            <Input
              id="num-cols"
              type="number"
              min={0}
              max={100}
              value={numColumns}
              onChange={(e) => { setNumColumns(e.target.value); setColError(""); }}
              placeholder="e.g. 5"
            />
            {colError && <p className="text-sm text-red-500">{colError}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="proj-desc">Description</Label>
            <textarea
              id="proj-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional project description or location..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Images */}
          <div className="space-y-1">
            <Label>
              Images
              <span className="text-muted-foreground font-normal ml-1.5 text-xs">
                ({images.length}/2)
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {images.map((url, idx) => (
                <div key={idx} className="relative group w-24 h-24 rounded-md overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
              {images.length < 2 && (
                <button
                  type="button"
                  onClick={() => imgRef.current?.click()}
                  className="w-24 h-24 rounded-md border-2 border-dashed border-muted-foreground/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-xs">Add</span>
                </button>
              )}
              <input
                ref={imgRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  if (!e.target.files) return;
                  const urls = await readFiles(e.target.files, 2 - images.length);
                  setImages((prev) => [...prev, ...urls]);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
