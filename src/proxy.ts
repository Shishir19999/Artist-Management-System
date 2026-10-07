import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { isRole } from "@/lib/roles";
import { decideAccess } from "@/lib/domain/access";

/**
 * Coarse, edge-level gate. Route handlers re-check authorization (src/lib/authz.ts),
 * including per-record ownership for USER.
 *
 * ARTIST_MANAGER: everything. ARTIST: own artist + own music. USER: read-only music (src/lib/domain/access.ts).
 */
export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const role = req.nextauth.token?.role;
        const method = req.method;
        const isApi = pathname.startsWith("/api/");

        // NextAuth endpoints stay public
        if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) return NextResponse.next();

        // unauthenticated: JSON 401 for the API, redirect to login for pages
        // a revoked token is re-issued without an id by the jwt callback: treat as signed out
        if (!req.nextauth.token?.id) {
            if (isApi) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
            const login = new URL("/auth/login", req.url);
            login.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(login);
        }

        const deny = () =>
            isApi
                ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
                : NextResponse.redirect(new URL("/not-allowed", req.url));

        if (!isRole(role)) return deny();
        if (role === "ARTIST_MANAGER") return NextResponse.next();

        return decideAccess({ pathname, method, role }) === "allow" ? NextResponse.next() : deny();

    },
    {
        pages: { signIn: "/auth/login" },
        // the middleware function above does its own auth handling (401 vs redirect)
        callbacks: { authorized: () => true },
    }
);

export const config = {
    // /api/auth/** is exempted inside the middleware function
    matcher: ["/admin/:path*", "/api/:path*"],
};
