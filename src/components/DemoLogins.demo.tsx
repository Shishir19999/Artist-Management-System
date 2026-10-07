"use client";
import { DEMO_ACCOUNTS } from "@/lib/demo/seed";

/** Preview-only helper under the sign-in form: it fills the fields, the visitor still presses Sign in. */
export default function DemoLogins({ onFill }: { onFill: (email: string, password: string) => void }) {
    return (
        <details className="border-base-300 bg-base-200/60 rounded-xl border">
            <summary className="flex min-h-11 cursor-pointer items-center px-3 text-sm font-semibold">Preview accounts</summary>
            <div className="px-3 pb-3">
                <p className="muted mb-2 text-xs">Sample accounts for the live preview. Fill the form, then press Sign in.</p>
                <ul className="flex flex-col gap-2">
                    {DEMO_ACCOUNTS.map((a) => (
                        <li key={a.role} className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0 text-xs">
                                <p className="font-medium">{a.label}</p>
                                <p className="muted break-all">
                                    {a.email} / {a.password}
                                </p>
                            </div>
                            <button type="button" className="btn btn-outline btn-sm min-h-11" onClick={() => onFill(a.email, a.password)}>
                                Fill form<span className="sr-only"> as {a.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </details>
    );
}
