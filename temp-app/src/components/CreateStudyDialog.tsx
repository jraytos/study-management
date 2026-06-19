"use client";

import { useEffect, useState } from "react";
import { Study } from "@/lib/storage";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with name + numColumns when the user submits */
  onSubmit: (name: string, numColumns: number) => void;
  /** Pre-fill values when editing an existing study */
  initial?: Pick<Study, "name" | "numColumns">;
  mode?: "create" | "edit";
}

export function CreateStudyDialog({
  open,
  onOpenChange,
  onSubmit,
  initial,
  mode = "create",
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [numColumns, setNumColumns] = useState(String(initial?.numColumns ?? 5));
  const [nameError, setNameError] = useState("");
  const [colError, setColError] = useState("");

  // Sync when initial values change (e.g., opening edit dialog)
  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setNumColumns(String(initial?.numColumns ?? 5));
      setNameError("");
      setColError("");
    }
  }, [open, initial]);

  function validate() {
    let ok = true;
    if (!name.trim()) {
      setNameError("Study name is required.");
      ok = false;
    }
    const n = parseInt(numColumns, 10);
    if (isNaN(n) || n < 0 || n > 100) {
      setColError("Number of columns must be between 0 and 100.");
      ok = false;
    }
    return ok;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(name.trim(), parseInt(numColumns, 10));
    onOpenChange(false);
  }

  function handleOpenChange(val: boolean) {
    if (!val) {
      setNameError("");
      setColError("");
    }
    onOpenChange(val);
  }

  const title = mode === "edit" ? "Edit Study" : "Create New Study";
  const submitLabel = mode === "edit" ? "Save Changes" : "Create Study";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="study-name">
              Study Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="study-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(""); }}
              placeholder="Enter study name"
              autoFocus
            />
            {nameError && <p className="text-sm text-red-500">{nameError}</p>}
          </div>

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
