import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getUserByEmail } from "@/lib/users"
import { createSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()
  const user = getUserByEmail(String(email).trim().toLowerCase())
  if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
  }
  await createSession({ userId: user.id, name: user.name, email: user.email, role: user.role })
  return NextResponse.json({ ok: true })
}
