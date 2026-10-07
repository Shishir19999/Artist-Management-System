"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { LuX } from "react-icons/lu";

/** Accessible modal built on the native <dialog>: focus trap, Esc to close, inert background. */
export default function Modal({
    open,
    onClose,
    title,
    children,
    footer,
    size = "md",
    hideClose = false,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: "sm" | "md" | "lg";
    hideClose?: boolean;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const d = ref.current;
        if (!d) return;
        if (open && !d.open) {
            d.showModal();
            // children mount before the dialog opens, so their own autofocus is ignored: focus the marked field here
            d.querySelector<HTMLElement>("[data-autofocus]")?.focus();
        }
        if (!open && d.open) d.close();
    }, [open]);

    const width = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-3xl" : "max-w-xl";

    return (
        <dialog
            ref={ref}
            className="modal"
            aria-labelledby={titleId}
            onClose={onClose}
            onClick={(e) => {
                if (e.target === ref.current) onClose();
            }}
        >
            {open && (
                <div className={`modal-box w-[calc(100%-1.5rem)] ${width} p-0 flex flex-col max-h-[90dvh]`}>
                    <div className="flex items-center justify-between gap-3 border-b border-base-300 px-5 py-4">
                        <h2 id={titleId} className="text-lg font-semibold">
                            {title}
                        </h2>
                        {!hideClose && (
                            <button type="button" className="btn btn-ghost btn-sm btn-circle" aria-label="Close dialog" onClick={onClose}>
                                <LuX size={18} aria-hidden />
                            </button>
                        )}
                    </div>
                    <div className="overflow-y-auto px-5 py-4">{children}</div>
                    {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-base-300 px-5 py-3">{footer}</div>}
                </div>
            )}
        </dialog>
    );
}
