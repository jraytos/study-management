"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FilepathCategory,
  FilepathItem,
  getFilepathCategories,
  saveFilepathCategories,
  getFilepathItems,
  saveFilepathItems,
  generateId,
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
import { ArrowLeft, Plus, Pencil, Trash2, FolderOpen, ExternalLink } from "lucide-react";

const DEFAULT_COLOR = "#3b82f6";

// ── Category Dialog ───────────────────────────────────────────────────────────
function CategoryDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: FilepathCategory;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");

  useEffect(() => {
    if (open) setName(initial?.name ?? "");
  }, [open, initial]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Category Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Clinical Documents"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {initial ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Item Dialog ───────────────────────────────────────────────────────────────
function ItemDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: FilepathItem;
  onSubmit: (data: { name: string; filepath: string; color: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [filepath, setFilepath] = useState(initial?.filepath ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setFilepath(initial?.filepath ?? "");
      setColor(initial?.color ?? DEFAULT_COLOR);
    }
  }, [open, initial]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !filepath.trim()) return;
    onSubmit({ name: name.trim(), filepath: filepath.trim(), color });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Item" : "Add Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Protocol Document"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-path">Filepath</Label>
            <Input
              id="item-path"
              value={filepath}
              onChange={(e) => setFilepath(e.target.value)}
              placeholder="e.g. https://... or /path/to/file"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-color">Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="item-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-16 cursor-pointer rounded border border-input p-0.5"
              />
              <span className="text-sm font-mono text-muted-foreground">{color}</span>
              <button
                type="button"
                onClick={() => setColor(DEFAULT_COLOR)}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Reset to blue
              </button>
            </div>
            {/* Live preview */}
            {filepath.trim() && (
              <p className="text-sm mt-1">
                Preview:{" "}
                <span style={{ color }} className="font-medium">
                  {name || "Link"}
                </span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !filepath.trim()}>
              {initial ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FilepathsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<FilepathCategory[]>([]);
  const [items, setItems] = useState<FilepathItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<FilepathCategory | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FilepathItem | null>(null);

  useEffect(() => {
    const cats = getFilepathCategories();
    const its  = getFilepathItems();
    setCategories(cats);
    setItems(its);
    if (cats.length > 0) setSelectedCatId(cats[0].id);
  }, []);

  const persistCats = useCallback((cats: FilepathCategory[]) => {
    setCategories(cats);
    saveFilepathCategories(cats);
  }, []);

  const persistItems = useCallback((its: FilepathItem[]) => {
    setItems(its);
    saveFilepathItems(its);
  }, []);

  // Category ops
  function handleAddCategory(name: string) {
    const cat: FilepathCategory = { id: generateId(), name };
    const updated = [...categories, cat];
    persistCats(updated);
    setSelectedCatId(cat.id);
  }

  function handleEditCategory(name: string) {
    if (!editingCat) return;
    const updated = categories.map((c) => c.id === editingCat.id ? { ...c, name } : c);
    persistCats(updated);
    setEditingCat(null);
  }

  function handleDeleteCategory(id: string) {
    if (!confirm("Delete this category and all its items?")) return;
    persistCats(categories.filter((c) => c.id !== id));
    persistItems(items.filter((it) => it.categoryId !== id));
    setSelectedCatId((prev) => {
      if (prev !== id) return prev;
      const remaining = categories.filter((c) => c.id !== id);
      return remaining.length > 0 ? remaining[0].id : null;
    });
  }

  // Item ops
  function handleAddItem(data: { name: string; filepath: string; color: string }) {
    if (!selectedCatId) return;
    const item: FilepathItem = { id: generateId(), categoryId: selectedCatId, ...data };
    persistItems([...items, item]);
  }

  function handleEditItem(data: { name: string; filepath: string; color: string }) {
    if (!editingItem) return;
    persistItems(items.map((it) => it.id === editingItem.id ? { ...it, ...data } : it));
    setEditingItem(null);
  }

  function handleDeleteItem(id: string) {
    persistItems(items.filter((it) => it.id !== id));
  }

  const selectedCat = categories.find((c) => c.id === selectedCatId);
  const visibleItems = items.filter((it) => it.categoryId === selectedCatId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card shadow-sm shrink-0">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <FolderOpen className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">File Path Management</h1>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden max-w-screen-2xl w-full mx-auto px-6 py-6 gap-6">

        {/* Sidebar — categories */}
        <aside className="w-56 shrink-0 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Categories
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => { setEditingCat(null); setCatDialogOpen(true); }}
              title="Add category"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {categories.length === 0 && (
            <p className="text-xs text-muted-foreground px-1">No categories yet.</p>
          )}

          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`group flex items-center justify-between gap-1 rounded-md px-3 py-2 cursor-pointer text-sm transition-colors ${
                cat.id === selectedCatId
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <span className="truncate flex-1">{cat.name}</span>
              <div className={`flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${cat.id === selectedCatId ? "text-primary-foreground" : ""}`}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setEditingCat(cat); setCatDialogOpen(true); }}
                  className="p-0.5 rounded hover:bg-black/10"
                  title="Edit"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                  className="p-0.5 rounded hover:bg-black/10"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </aside>

        {/* Main panel — items */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {!selectedCat ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground">
              <FolderOpen className="h-10 w-10" />
              <p className="text-sm">Select or create a category to get started.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditingCat(null); setCatDialogOpen(true); }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-base">{selectedCat.name}</h2>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => { setEditingItem(null); setItemDialogOpen(true); }}
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left font-semibold px-4 py-2.5 border-b border-r w-48">Name</th>
                      <th className="text-left font-semibold px-4 py-2.5 border-b border-r">Filepath</th>
                      <th className="text-left font-semibold px-4 py-2.5 border-b border-r w-24">Color</th>
                      <th className="border-b w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted-foreground py-10 px-4">
                          No items yet. Click &ldquo;Add Item&rdquo; to get started.
                        </td>
                      </tr>
                    ) : (
                      visibleItems.map((item) => (
                        <tr key={item.id} className="group border-b last:border-b-0 hover:bg-muted/30">
                          <td className="px-4 py-3 border-r font-medium">{item.name}</td>
                          <td className="px-4 py-3 border-r">
                            <a
                              href={item.filepath}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: item.color }}
                              className="inline-flex items-center gap-1 hover:underline font-medium break-all"
                            >
                              {item.filepath}
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </td>
                          <td className="px-4 py-3 border-r">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block w-4 h-4 rounded-full border border-black/10"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="font-mono text-xs text-muted-foreground">{item.color}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => { setEditingItem(item); setItemDialogOpen(true); }}
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteItem(item.id)}
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CategoryDialog
        open={catDialogOpen}
        onOpenChange={(v) => { setCatDialogOpen(v); if (!v) setEditingCat(null); }}
        initial={editingCat ?? undefined}
        onSubmit={editingCat ? handleEditCategory : handleAddCategory}
      />

      <ItemDialog
        open={itemDialogOpen}
        onOpenChange={(v) => { setItemDialogOpen(v); if (!v) setEditingItem(null); }}
        initial={editingItem ?? undefined}
        onSubmit={editingItem ? handleEditItem : handleAddItem}
      />
    </div>
  );
}
