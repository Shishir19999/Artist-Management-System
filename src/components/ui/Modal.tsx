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
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: "sm" | "md" | "lg";
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const opener = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const d = ref.current;
        if (!d) return;
        if (open && !d.open) {
            opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            d.showModal();
            // children mount before the dialog opens, so their own autofocus is ignored: focus the marked field here
            d.querySelector<HTMLElement>("[data-autofocus]")?.focus();
        }
        if (!open && d.open) d.close();
    }, [open]);

    // hand focus back to whatever opened the dialog (the browser does this too, but not for removed or re-rendered openers)
    const handleClose = () => {
        const target = opener.current;
        opener.current = null;
        if (target?.isConnected) target.focus();
        onClose();
    };

    const width = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-3xl" : "max-w-xl";

    return (
        <dialog
            ref={ref}
            className="modal"
            aria-labelledby={titleId}
            onClose={handleClose}
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
                        <button type="button" className="btn btn-ghost btn-circle size-11" aria-label="Close dialog" onClick={onClose}>
                            <LuX size={20} aria-hidden />
                        </button>
                    </div>
                    <div className="overflow-y-auto px-5 py-4">{children}</div>
                    {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-base-300 px-5 py-3">{footer}</div>}
                </div>
            )}
        </dialog>
    );
}
