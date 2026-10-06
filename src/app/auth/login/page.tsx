import LoginForm from "./LoginForm";
import { isGoogleEnabled } from "@/lib/google-enabled";

// read env at request time (not baked in at build time)
export const dynamic = "force-dynamic";

export default function LoginPage() {
    return <LoginForm googleEnabled={isGoogleEnabled()} />;
}
