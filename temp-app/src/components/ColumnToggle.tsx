"use client";

import { ColumnVisibility } from "@/lib/storage";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal } from "lucide-react";

const COLUMN_LABELS: { key: keyof ColumnVisibility; label: string }[] = [
  { key: "no",          label: "No."             },
  { key: "description", label: "Task Description" },
  { key: "images",      label: "Images"           },
  { key: "subtasks",    label: "Subtasks"          },
  { key: "boxPath",     label: "Box Path"          },
];

interface Props {
  visibility: ColumnVisibility;
  onChange: (vis: ColumnVisibility) => void;
}

export function ColumnToggle({ visibility, onChange }: Props) {
  function toggle(key: keyof ColumnVisibility) {
    if (key === "no") return;
    onChange({ ...visibility, [key]: !visibility[key] });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
        <SlidersHorizontal className="h-4 w-4" />
        Columns
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-2">
        {COLUMN_LABELS.map(({ key, label }) => (
          <div
            key={key}
            className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-accent cursor-pointer"
            onClick={() => toggle(key)}
          >
            <Checkbox
              id={`col-${key}`}
              checked={visibility[key]}
              onCheckedChange={() => toggle(key)}
              disabled={key === "no"}
            />
            <Label htmlFor={`col-${key}`} className="cursor-pointer select-none text-sm">
              {label}
            </Label>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
