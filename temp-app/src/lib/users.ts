import fs from "fs"
import path from "path"
import bcrypt from "bcryptjs"

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  role: "admin" | "user"
}

const FILE = path.join(process.cwd(), "data", "users.json")

export function getUsers(): User[] {
  const raw = fs.readFileSync(FILE, "utf-8")
  return JSON.parse(raw) as User[]
}

export function saveUsers(users: User[]): void {
  fs.writeFileSync(FILE, JSON.stringify(users, null, 2), "utf-8")
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email === email)
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id)
}

export function generateUserId(): string {
  return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)
}

export function createUser(data: { name: string; email: string; password: string; role: "admin" | "user" }): User {
  const users = getUsers()
  const user: User = {
    id: generateUserId(),
    name: data.name,
    email: data.email.trim().toLowerCase(),
    passwordHash: bcrypt.hashSync(data.password, 10),
    role: data.role,
  }
  users.push(user)
  saveUsers(users)
  return user
}

export function deleteUser(id: string): void {
  saveUsers(getUsers().filter((u) => u.id !== id))
}
