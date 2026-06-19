"use client";

import { useState, useRef } from "react";
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

interface TaskDraft {
  description: string;
  images: string[]; // max 2
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: TaskDraft) => void;
}

const EMPTY: TaskDraft = { description: "", images: [] };

export function AddTaskDialog({ open, onOpenChange, onSubmit }: Props) {
  const [draft, setDraft] = useState<TaskDraft>(EMPTY);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleOpenChange(val: boolean) {
    if (val) setDraft(EMPTY);
    onOpenChange(val);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(draft);
    handleOpenChange(false);
  }

  function handleImageFiles(files: FileList | null) {
    if (!files) return;
    const remaining = 2 - draft.images.length;
    if (remaining <= 0) return;
    const selected = Array.from(files).slice(0, remaining);
    const readers = selected.map(
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description</Label>
            <textarea
              id="task-desc"
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Describe the task... (optional)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Images — max 2 */}
          <div className="space-y-1.5">
            <Label>
              Images
              <span className="text-muted-foreground font-normal ml-1.5 text-xs">
                ({draft.images.length}/2)
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {draft.images.map((url, idx) => (
                <div key={idx} className="relative group w-20 h-20 rounded-md overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({ ...d, images: d.images.filter((_, i) => i !== idx) }))
                    }
                    className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
              {draft.images.length < 2 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-md border-2 border-dashed border-muted-foreground/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-xs">Add</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageFiles(e.target.files)}
              />
            </div>
          </div>

          <DialogFooter>
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
