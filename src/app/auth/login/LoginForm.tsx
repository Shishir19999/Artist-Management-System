"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import DemoLogins from "@/components/DemoLogins";
import { TextField } from "@/components/ui/Fields";
import { useAuth } from "@/lib/client/auth";
import { showError, showSucces } from "@/utils/notify";

const AUTH_ERRORS: Record<string, string> = {
    OAuthAccountNotLinked:
        "An account with this email already exists and uses a different sign-in method. Sign in with your email and password instead.",
    AccessDenied: "Google sign-in was denied (the Google email must be verified).",
    Callback: "Google sign-in failed. Please try again.",
    OAuthCallback: "Google sign-in failed. Please try again.",
    CredentialsSignin: "Invalid email or password",
};

export function safeCallback(cb: string | null): string {
    // only allow same-site relative redirects
    return cb && cb.startsWith("/") && !cb.startsWith("//") ? cb : "/admin/dashboard";
}

export default function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
    const router = useRouter();
    const params = useSearchParams();
    const auth = useAuth();
    const authError = params.get("error");
    const [isSubmitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    };

    const submit = async (email: string, password: string) => {
        setSubmitting(true);
        try {
            const res = await auth.signIn(email.trim(), password);
            if (res.ok) {
                showSucces("Signed in");
                router.push(safeCallback(params.get("callbackUrl")));
                router.refresh();
            } else {
                showError(res.error ?? "Invalid email or password");
            }
        } catch {
            showError("Sign-in failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const next = {
            email: formData.email.trim() === "" ? "Enter your email" : undefined,
            password: formData.password === "" ? "Enter your password" : undefined,
        };
        setErrors(next);
        if (!next.email && !next.password) void submit(formData.email, formData.password);
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {authError && (
                <div role="alert" className="alert alert-error alert-soft text-sm">
                    {AUTH_ERRORS[authError] ?? "Sign-in failed. Please try again."}
                </div>
            )}

            <TextField
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
            />
            <TextField
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
            />

            <button disabled={isSubmitting} type="submit" className="btn btn-primary w-full">
                {isSubmitting ? (
                    <>
                        <span className="loading loading-spinner loading-sm" aria-hidden />
                        Signing in
                    </>
                ) : (
                    "Sign in"
                )}
            </button>

            {googleEnabled && (
                <>
                    <div className="divider my-0">OR</div>
                    <button
                        type="button"
                        onClick={() => auth.signInWithGoogle(safeCallback(params.get("callbackUrl")))}
                        className="btn btn-outline w-full"
                    >
                        Continue with Google
                    </button>
                </>
            )}

            <DemoLogins disabled={isSubmitting} onPick={(email, password) => void submit(email, password)} />

            <p className="muted text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="link link-primary font-medium">
                    Register
                </Link>
            </p>
        </form>
    );
}
