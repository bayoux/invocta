import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const PUBLIC_ROUTES = ["/login", "/register"]

const ROLE_ROUTES: Record<string, string[]> = {
  "/users": ["admin", "supervisor"],
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  const token = request.cookies.get("access_token")?.value

  // No token → redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString()
    )
    const role: string = payload.role ?? ""
    const exp: number = payload.exp ?? 0

    // Token expired
    if (Date.now() / 1000 > exp) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("from", pathname)
      const res = NextResponse.redirect(loginUrl)
      res.cookies.delete("access_token")
      return res
    }

    // Role-based restrictions
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }
  } catch {
    const loginUrl = new URL("/login", request.url)
    const res = NextResponse.redirect(loginUrl)
    res.cookies.delete("access_token")
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
}
