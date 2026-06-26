export interface SessionPayload {
  userId: string
  name: string
  email: string
  role: "admin" | "user"
}
