"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { SessionProvider, signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession } from "next-auth/react";
import { isRole } from "@/lib/roles";
import type { AuthState, SessionUser } from "./auth.types";
import { invalidate } from "./use-api";


const AuthContext = createContext<AuthState | null>(null);

function Bridge({ children }: { children: ReactNode }) {
    const { data, status } = useSession();
    const value = useMemo<AuthState>(() => {
        const u = data?.user;
        const user: SessionUser | null =
            u?.id && isRole(u.role) ? { id: u.id, name: u.name ?? null, email: u.email ?? null, role: u.role } : null;
        return {
            status: status === "loading" ? "loading" : user ? "authenticated" : "unauthenticated",
            user,
            async signIn(email, password) {
                const res = await nextAuthSignIn("credentials", { email, password, redirect: false });
                invalidate();
                return res?.ok ? { ok: true } : { ok: false, error: "Invalid email or password" };
            },
            async signOut() {
                invalidate();
                await nextAuthSignOut({ callbackUrl: "/auth/login" });
            },
            signInWithGoogle(callbackUrl) {
                void nextAuthSignIn("google", { callbackUrl });
            },
        };
    }, [data, status]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Real mode: NextAuth session. (The browser-only demo swaps this file for auth.demo.tsx.) */
export function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <Bridge>{children}</Bridge>
        </SessionProvider>
    );
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
