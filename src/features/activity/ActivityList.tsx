"use client";
import type { ReactNode } from "react";
import { LuCirclePlus, LuLogIn, LuLogOut, LuPencil, LuTrash2, LuUserPlus } from "react-icons/lu";
import { relativeTime, formatDateTime } from "@/lib/client/format";
import type { ActivityDTO } from "@/lib/domain/types";

const ICON: Record<string, ReactNode> = {
    CREATE: <LuCirclePlus aria-hidden />,
    UPDATE: <LuPencil aria-hidden />,
    DELETE: <LuTrash2 aria-hidden />,
    LOGIN: <LuLogIn aria-hidden />,
    LOGOUT: <LuLogOut aria-hidden />,
    REGISTER: <LuUserPlus aria-hidden />,
};

const TONE: Record<string, string> = {
    CREATE: "bg-success/15 text-success",
    UPDATE: "bg-info/15 text-info",
    DELETE: "bg-error/15 text-error",
    LOGIN: "bg-primary/15 text-primary",
    LOGOUT: "bg-base-200",
    REGISTER: "bg-secondary/15 text-secondary",
};

export default function ActivityList({ items, showUser = false }: { items: ActivityDTO[]; showUser?: boolean }) {
    return (
        <ol className="flex flex-col" aria-label="Activity">
            {items.map((a) => (
                <li key={a.id} className="border-base-300 flex items-start gap-3 border-b py-3 last:border-0">
                    <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${TONE[a.action] ?? "bg-base-200"}`}>
                        {ICON[a.action]}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm">
                            {showUser && a.userName && <strong className="font-semibold">{a.userName}: </strong>}
                            {a.summary}
                        </p>
                        <p className="muted text-xs">
                            <time dateTime={a.created_at} title={formatDateTime(a.created_at)}>
                                {relativeTime(a.created_at)}
                            </time>
                            <span className="sr-only"> ({a.action.toLowerCase()})</span>
                        </p>
                    </div>
                </li>
            ))}
        </ol>
    );
}
