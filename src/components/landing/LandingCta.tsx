"use client";
import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";
import { useAuth } from "@/lib/client/auth";
import { IS_DEMO } from "@/lib/client/mode";
import { routes } from "@/lib/client/routes";

/** Primary calls to action; they adapt to the visitor's session. */
export default function LandingCta({ variant = "hero" }: { variant?: "hero" | "nav" }) {
    const { status, user } = useAuth();
    const signedIn = status === "authenticated" && user;

    if (variant === "nav") {
        return signedIn ? (
            <Link href={routes.dashboard} className="btn btn-primary btn-sm">
                Open dashboard
            </Link>
        ) : (
            <Link href={routes.login} className="btn btn-primary btn-sm">
                Sign in
            </Link>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            {signedIn ? (
                <>
                    <Link href={routes.dashboard} className="btn btn-primary btn-lg gap-2">
                        Open your dashboard <LuArrowRight aria-hidden />
                    </Link>
                    <p className="muted text-sm">Signed in as {user.email}</p>
                </>
            ) : (
                <>
                    <Link href={routes.login} className="btn btn-primary btn-lg gap-2">
                        {IS_DEMO ? "Try the live demo" : "Sign in"} <LuArrowRight aria-hidden />
                    </Link>
                    <Link href={routes.register} className="btn btn-outline btn-lg">
                        Create an account
                    </Link>
                </>
            )}
        </div>
    );
}
