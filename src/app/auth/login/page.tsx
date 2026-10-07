import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { isGoogleEnabled } from "@/lib/google-enabled";

// read env at request time (not baked in at build time)
export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm googleEnabled={isGoogleEnabled()} />
        </Suspense>
    );
}
