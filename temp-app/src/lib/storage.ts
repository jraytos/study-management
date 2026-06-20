export interface Study {
  id: string;
  name: string;
  createdAt: string;
  numColumns: number; // 0–100, defined at study level
}

export type ItemColor = "gray" | "red" | "green";

/** One column cell within a task row — fully independent data object */
export interface ColumnItem {
  color: ItemColor;    // background color of this cell
  description: string; // optional text
  images: string[];    // max 2 base64 data URLs
}

export interface Task {
  id: string;
  studyId: string;
  no: number;
  description: string; // task-level description (left panel)
  images: string[];    // task-level images, max 2
  boxPath: string;     // box file path (right fixed column)
  items: ColumnItem[]; // one per column — each owns color/description/images
}

export interface ColumnVisibility {
  no: boolean;
  description: boolean;
  images: boolean;
}

const STUDIES_KEY    = "as_studies";
const TASKS_PREFIX   = "as_tasks_";
const COL_VIS_PREFIX = "as_colvis_";

function isBrowser() {
  return typeof window !== "undefined";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseStudy(s: any): Study {
  return {
    id: s.id,
    name: s.name,
    createdAt: s.createdAt,
    numColumns: typeof s.numColumns === "number"
      ? s.numColumns
      : Array.isArray(s.subtaskColumns)
        ? s.subtaskColumns.length
        : 0,
  };
}

export function getStudies(): Study[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(STUDIES_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed.map(normaliseStudy) : [];
}

export function saveStudy(study: Study): void {
  const studies = getStudies();
  const idx = studies.findIndex((s) => s.id === study.id);
  if (idx >= 0) studies[idx] = study;
  else studies.push(study);
  localStorage.setItem(STUDIES_KEY, JSON.stringify(studies));
}

export function deleteStudy(id: string): void {
  const studies = getStudies().filter((s) => s.id !== id);
  localStorage.setItem(STUDIES_KEY, JSON.stringify(studies));
  localStorage.removeItem(TASKS_PREFIX + id);
  localStorage.removeItem(COL_VIS_PREFIX + id);
}

export function getStudyById(id: string): Study | undefined {
  return getStudies().find((s) => s.id === id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseColumnItem(raw: any): ColumnItem {
  const color: ItemColor =
    raw?.color === "red" || raw?.color === "green" ? raw.color : "gray";
  return {
    color,
    description: raw?.description ?? "",
    images: Array.isArray(raw?.images) ? (raw.images as string[]).slice(0, 2) : [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseTask(t: any): Task {
  const images: string[] = Array.isArray(t.images)
    ? (t.images as string[]).slice(0, 2)
    : typeof t.images === "string" && t.images
    ? [t.images]
    : [];

  const rawItems: unknown[] = Array.isArray(t.items)
    ? t.items
    : Array.isArray(t.subtasks)
    ? t.subtasks
    : [];

  return {
    id: t.id,
    studyId: t.studyId,
    no: t.no,
    description: t.description ?? "",
    images,
    boxPath: t.boxPath ?? "",
    items: rawItems.map(normaliseColumnItem),
  };
}

export function getTasks(studyId: string): Task[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(TASKS_PREFIX + studyId);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed.map(normaliseTask) : [];
}

export function saveTasks(studyId: string, tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_PREFIX + studyId, JSON.stringify(tasks));
  } catch {
    console.warn("localStorage quota exceeded — images may be too large.");
  }
}

export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  no: true,
  description: true,
  images: true,
};

export function getColumnVisibility(studyId: string): ColumnVisibility {
  if (!isBrowser()) return DEFAULT_COLUMN_VISIBILITY;
  const raw = localStorage.getItem(COL_VIS_PREFIX + studyId);
  return raw ? { ...DEFAULT_COLUMN_VISIBILITY, ...JSON.parse(raw) } : DEFAULT_COLUMN_VISIBILITY;
}

export function saveColumnVisibility(studyId: string, vis: ColumnVisibility): void {
  localStorage.setItem(COL_VIS_PREFIX + studyId, JSON.stringify(vis));
}

export function generateId(): string {
  return crypto.randomUUID();
}

// ── Filepath Management ───────────────────────────────────────────────────────

export interface FilepathCategory {
  id: string;
  name: string;
}

export interface FilepathItem {
  id: string;
  categoryId: string;
  name: string;
  filepath: string;
  color: string; // hex, default "#3b82f6" (blue)
}

const FP_CATEGORIES_KEY = "as_fp_categories";
const FP_ITEMS_KEY      = "as_fp_items";

export function getFilepathCategories(): FilepathCategory[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(FP_CATEGORIES_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveFilepathCategories(cats: FilepathCategory[]): void {
  localStorage.setItem(FP_CATEGORIES_KEY, JSON.stringify(cats));
}

export function getFilepathItems(): FilepathItem[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(FP_ITEMS_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveFilepathItems(items: FilepathItem[]): void {
  localStorage.setItem(FP_ITEMS_KEY, JSON.stringify(items));
}
