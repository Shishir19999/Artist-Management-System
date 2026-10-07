"use client";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { useEntityId } from "@/lib/client/use-entity-id";
import { EmptyState, ErrorState, SkeletonRows } from "./States";

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link href={href} className="muted hover:text-base-content mb-2 inline-flex items-center gap-1 text-sm hover:underline">
            <LuArrowLeft aria-hidden /> {children}
        </Link>
    );
}

/** Reads the record id from the route (real build) or the ?id= query (static demo) and hands it to `children`. */
function Inner({ param, children }: { param: string; children: (id: string) => ReactNode }) {
    const id = useEntityId(param);
    if (!id) return <EmptyState title="Nothing selected" message="Open a record from the list to see it here." />;
    return <>{children(id)}</>;
}

export default function DetailGate({ param, children }: { param: string; children: (id: string) => ReactNode }) {
    return (
        <Suspense fallback={<SkeletonRows rows={4} />}>
            <Inner param={param}>{children}</Inner>
        </Suspense>
    );
}

export function LoadState({ loading, error, onRetry, notFound }: { loading: boolean; error: string | null; onRetry?: () => void; notFound?: string }) {
    if (loading) return <SkeletonRows rows={5} />;
    if (error) return <ErrorState message={notFound && /not found|forbidden/i.test(error) ? notFound : error} onRetry={onRetry} />;
    return null;
}
