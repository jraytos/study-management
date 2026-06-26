import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET ?? "changeme-secret-32-chars-minimum!!")
const PUBLIC = ["/login", "/api/auth/"]

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next()

  const token = request.cookies.get("as_session")?.value
  if (!token) return NextResponse.redirect(new URL("/login", request.url))

  try {
    await jwtVerify(token, SECRET)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }
