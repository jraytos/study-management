export interface SubtaskColumn {
  id: string;
  name: string;
}

export interface Study {
  id: string;
  name: string;
  createdAt: string;
  subtaskColumns: SubtaskColumn[]; // study-level column definitions, up to 100
}

export type SubtaskColor = "gray" | "red" | "green";

export interface TaskSubtask {
  columnId: string;
  checked: boolean;
  color: SubtaskColor;
  description: string;
  images: string[]; // base64 data URLs
}

export interface Task {
  id: string;
  studyId: string;
  no: number;
  description: string;
  images: string[]; // base64 data URLs
  subtasks: TaskSubtask[];
  boxPath: string;
}

export type ColumnKey = keyof Omit<Task, "id" | "studyId">;

export interface ColumnVisibility {
  no: boolean;
  description: boolean;
  images: boolean;
  subtasks: boolean;
  boxPath: boolean;
}

const STUDIES_KEY = "as_studies";
const TASKS_PREFIX = "as_tasks_";
const COL_VIS_PREFIX = "as_colvis_";

function isBrowser() {
  return typeof window !== "undefined";
}

// Normalise a raw study object from localStorage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseStudy(s: any): Study {
  return {
    id: s.id,
    name: s.name,
    createdAt: s.createdAt,
    subtaskColumns: Array.isArray(s.subtaskColumns) ? s.subtaskColumns : [],
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

// Normalise a raw task from localStorage to the current TaskSubtask[] format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseTask(t: any): Task {
  let subtasks: TaskSubtask[];

  if (Array.isArray(t.subtasks) && t.subtasks.length > 0 && "columnId" in t.subtasks[0]) {
    // Already in new format
    subtasks = t.subtasks;
  } else {
    // Old format (Subtask[] with id/text/color, or subtask1-5 strings) — drop legacy data
    subtasks = [];
  }

  const images: string[] = Array.isArray(t.images)
    ? t.images
    : typeof t.images === "string" && t.images
    ? [t.images]
    : [];

  return {
    id: t.id,
    studyId: t.studyId,
    no: t.no,
    description: t.description ?? "",
    images,
    subtasks,
    boxPath: t.boxPath ?? "",
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
  subtasks: true,
  boxPath: true,
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
