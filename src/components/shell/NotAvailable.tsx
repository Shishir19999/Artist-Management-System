"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuArrowLeft, LuShield } from "react-icons/lu";
import { routes } from "@/lib/client/routes";
import { ROLE_LABEL } from "@/lib/domain/constants";
import type { AppRole } from "@/lib/roles";

/** Friendly page shown when a signed-in person opens an address their role cannot use. */
export default function NotAvailable({ role }: { role: AppRole }) {
    const router = useRouter();
    return (
        <div className="surface mx-auto mt-6 flex max-w-lg flex-col items-center gap-3 p-8 text-center">
            <span className="bg-base-200 text-warning flex size-14 items-center justify-center rounded-full" aria-hidden>
                <LuShield size={26} />
            </span>
            <h1 className="page-title">Not available for your role</h1>
            <p className="muted text-sm">This page is not part of the {ROLE_LABEL[role]} workspace. Everything you can use is in the menu.</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
                <button type="button" className="btn btn-primary min-h-11 gap-2" onClick={() => router.back()}>
                    <LuArrowLeft aria-hidden /> Go back
                </button>
                <Link href={routes.dashboard} className="btn btn-ghost min-h-11">
                    Dashboard
                </Link>
            </div>
        </div>
    );
}
