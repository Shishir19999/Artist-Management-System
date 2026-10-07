import type { ReactNode } from "react";
import { LuCircleAlert, LuInbox } from "react-icons/lu";

export function Skeleton({ className = "" }: { className?: string }) {
    return <div aria-hidden className={`skeleton ${className}`} />;
}

export function SkeletonRows({ rows = 6, label = "Loading" }: { rows?: number; label?: string }) {
    return (
        <div role="status" aria-live="polite" aria-label={label} className="flex flex-col gap-3">
            {Array.from({ length: rows }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
            <span className="sr-only">{label}</span>
        </div>
    );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
    return (
        <div role="status" aria-live="polite" aria-label="Loading" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }, (_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
            ))}
            <span className="sr-only">Loading</span>
        </div>
    );
}

export function EmptyState({
    title,
    message,
    action,
    icon,
}: {
    title: string;
    message?: string;
    action?: ReactNode;
    icon?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <span className="bg-base-200 text-primary flex size-14 items-center justify-center rounded-full" aria-hidden>
                {icon ?? <LuInbox size={26} />}
            </span>
            <h2 className="text-lg font-semibold">{title}</h2>
            {message && <p className="muted max-w-md text-sm">{message}</p>}
            {action}
        </div>
    );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div role="alert" className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <span className="bg-base-200 text-error flex size-14 items-center justify-center rounded-full" aria-hidden>
                <LuCircleAlert size={26} />
            </span>
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="muted max-w-md text-sm">{message}</p>
            {onRetry && (
                <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>
                    Try again
                </button>
            )}
        </div>
    );
}

export function PageHeader({
    title,
    subtitle,
    actions,
    back,
}: {
    title: string;
    subtitle?: ReactNode;
    actions?: ReactNode;
    back?: ReactNode;
}) {
    return (
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
                {back}
                <h1 className="page-title">{title}</h1>
                {subtitle && <p className="muted mt-1 text-sm">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
    );
}
