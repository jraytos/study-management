"use server"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { getUserByEmail } from "@/lib/users"
import { createSession, deleteSession } from "@/lib/session"

export async function login(formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const user = getUserByEmail(email)
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return { error: "Invalid email or password." }
  }
  await createSession({ userId: user.id, name: user.name, email: user.email, role: user.role })
  redirect("/")
}

export async function logout(): Promise<void> {
  await deleteSession()
  redirect("/login")
}
