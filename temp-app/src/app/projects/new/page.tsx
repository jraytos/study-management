"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionPayload } from "@/lib/session-types";
import { Study, generateId, saveStudy } from "@/lib/storage";
import { TEMPLATES } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlaskConical, ArrowLeft, ImageIcon, X } from "lucide-react";

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

export default function NewProjectPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [name, setName] = useState("");
  const [numColumns, setNumColumns] = useState(String(TEMPLATES[0].defaultColumns));
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [nameError, setNameError] = useState("");
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setSession(data);
        setLoading(false);
        if (!data || data.role !== "admin") {
          router.replace("/projects");
        }
      });
  }, [router]);

  function handleTemplateSelect(id: string) {
    setSelectedTemplate(id);
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (tpl) setNumColumns(String(tpl.defaultColumns));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setNameError("Project name is required."); return; }
    const project: Study = {
      id: generateId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      numColumns: parseInt(numColumns, 10) || 5,
      description: description.trim(),
      images,
      templateId: selectedTemplate,
    };
    saveStudy(project);
    router.push("/projects");
  }

  if (loading || !session) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white shadow-sm shrink-0">
        <div className="px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <FlaskConical className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Create New Project</h1>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-8">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow p-8 space-y-8">

          {/* Step 1 — Template */}
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">Select a Template</h2>
              <p className="text-sm text-muted-foreground">Choose the column structure for your project.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleTemplateSelect(tpl.id)}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    selectedTemplate === tpl.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="text-sm font-semibold leading-tight">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tpl.description}</p>
                  <p className="text-xs font-bold text-primary mt-2">{tpl.defaultColumns} columns</p>
                </button>
              ))}
            </div>
          </section>

          <hr />

          {/* Step 2 — Project Details */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">Project Details</h2>
              <p className="text-sm text-muted-foreground">Fill in the information for your new project.</p>
            </div>

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

            <div className="space-y-1">
              <Label htmlFor="num-cols">Number of Columns</Label>
              <Input
                id="num-cols"
                type="number"
                min={0}
                max={100}
                value={numColumns}
                onChange={(e) => setNumColumns(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="proj-desc">Description / Protocol</Label>
              <textarea
                id="proj-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional project description or protocol..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label>
                Images{" "}
                <span className="text-muted-foreground font-normal text-xs">({images.length}/2)</span>
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

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push("/")}>
                Cancel
              </Button>
              <Button type="submit">Create Project</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
