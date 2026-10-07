import type { AppRole } from "@/lib/roles";

export interface SessionUser {
    id: string;
    name: string | null;
    email: string | null;
    role: AppRole;
}

export interface AuthState {
    status: "loading" | "authenticated" | "unauthenticated";
    user: SessionUser | null;
    signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
    signOut: () => Promise<void>;
    signInWithGoogle: (callbackUrl: string) => void;
}
