"use client";
import { DEMO_ACCOUNTS } from "@/lib/demo/seed";

export default function DemoLogins({ disabled, onPick }: { disabled?: boolean; onPick: (email: string, password: string) => void }) {
    return (
        <section aria-labelledby="demo-logins" className="border-base-300 bg-base-200/60 mt-1 rounded-xl border p-3">
            <h2 id="demo-logins" className="text-sm font-semibold">
                Demo logins
            </h2>
            <p className="muted mb-2 text-xs">Pick a role to sign in instantly, or type the credentials yourself.</p>
            <ul className="flex flex-col gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                    <li key={a.role} className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0 text-xs">
                            <p className="font-medium">{a.label}</p>
                            <p className="muted break-all">
                                {a.email} / {a.password}
                            </p>
                        </div>
                        <button type="button" disabled={disabled} className="btn btn-outline btn-sm" onClick={() => onPick(a.email, a.password)}>
                            Sign in as {a.label.toLowerCase()}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
