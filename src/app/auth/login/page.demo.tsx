import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in" };

// Static demo build: no server, so no Google sign-in and no request-time env.
export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm googleEnabled={false} />
        </Suspense>
    );
}
