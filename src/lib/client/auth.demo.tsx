"use client";
import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { installDemoAdapter } from "@/lib/demo/adapter";
import { log } from "@/lib/demo/server";
import { getSessionUserId, loadDb, saveDb, setSessionUserId, subscribeSession } from "@/lib/demo/store";
import { invalidate } from "./use-api";
import type { AuthState, SessionUser } from "./auth.types";

installDemoAdapter();

const AuthContext = createContext<AuthState | null>(null);

// the server snapshot is "loading" so static HTML and first client render agree
const serverSnapshot = () => "__loading__";

export function AuthProvider({ children }: { children: ReactNode }) {
    const sid = useSyncExternalStore(subscribeSession, () => getSessionUserId() ?? "", serverSnapshot);
    const value = useMemo<AuthState>(() => {
        let user: SessionUser | null = null;
        if (sid && sid !== "__loading__") {
            const u = loadDb().users.find((x) => x.id === sid);
            if (u) user = { id: u.id, name: u.name, email: u.email, role: u.role };
        }
        return {
            status: sid === "__loading__" ? "loading" : user ? "authenticated" : "unauthenticated",
            user,
            async signIn(email, password) {
                const db = loadDb();
                const found = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
                if (!found || found.password !== password) return { ok: false, error: "Invalid email or password" };
                log(db, found, "LOGIN", "SESSION", null, "Signed in");
                saveDb();
                invalidate();
                setSessionUserId(found.id);
                return { ok: true };
            },
            async signOut() {
                invalidate();
                setSessionUserId(null);
            },
            signInWithGoogle() {
                /* not available in the demo */
            },
        };
    }, [sid]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
