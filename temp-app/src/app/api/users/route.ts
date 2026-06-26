import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getUsers, createUser, deleteUser } from "@/lib/users"

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== "admin") return false
  return true
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const users = getUsers().map(({ passwordHash: _, ...u }) => u)
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { name, email, password, role } = await request.json()
  if (!name || !email || !password || !["admin", "user"].includes(role)) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 })
  }
  const user = createUser({ name, email, password, role })
  const { passwordHash: _, ...safe } = user
  return NextResponse.json(safe, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await request.json()
  const session = await getSession()
  if (session?.userId === id) return NextResponse.json({ error: "Cannot delete yourself." }, { status: 400 })
  deleteUser(id)
  return NextResponse.json({ ok: true })
}
