export interface Template {
  id: string
  name: string
  defaultColumns: number
  description: string
}

export const TEMPLATES: Template[] = [
  { id: "default", name: "Default Template", defaultColumns: 5, description: "Standard task tracking table" },
  { id: "minimal", name: "Minimal", defaultColumns: 3, description: "Simple 3-column tracker" },
  { id: "detailed", name: "Detailed", defaultColumns: 8, description: "Extended 8-column tracker" },
]

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
