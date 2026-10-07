"use client";
import { LuFlaskConical, LuRotateCcw } from "react-icons/lu";
import { useConfirm } from "@/components/ui/Confirm";
import { invalidate } from "@/lib/client/use-api";
import { resetDb } from "@/lib/demo/store";
import { showSucces } from "@/utils/notify";

export default function DemoBanner() {
    const confirm = useConfirm();
    const reset = async () => {
        const ok = await confirm({
            title: "Reset the sample data?",
            message: "All changes made in this browser are discarded and the sample data is restored. You will be signed out.",
            confirmLabel: "Reset",
        });
        if (!ok) return;
        resetDb();
        invalidate();
        showSucces("Sample data restored");
    };
    return (
        <div role="note" className="bg-warning/15 text-base-content border-warning/40 mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-3 py-2 text-sm">
            <LuFlaskConical aria-hidden className="text-warning shrink-0" />
            <span className="font-semibold">Live preview</span>
            <span className="muted">- runs in your browser with sample data. Changes stay on this device.</span>
            <button type="button" className="btn btn-ghost btn-sm ml-auto min-h-11 gap-1" onClick={() => void reset()}>
                <LuRotateCcw aria-hidden /> Reset sample data
            </button>
        </div>
    );
}
