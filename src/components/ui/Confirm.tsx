"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import Modal from "./Modal";

interface ConfirmOptions {
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: "danger" | "primary";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolver = useRef<((v: boolean) => void) | null>(null);

    const confirm = useCallback<ConfirmFn>((opts) => {
        setOptions(opts);
        return new Promise<boolean>((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    const settle = (value: boolean) => {
        resolver.current?.(value);
        resolver.current = null;
        setOptions(null);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <Modal
                open={options !== null}
                onClose={() => settle(false)}
                title={options?.title ?? ""}
                size="sm"
                footer={
                    <>
                        <button type="button" className="btn btn-ghost" onClick={() => settle(false)}>
                            {options?.cancelLabel ?? "Cancel"}
                        </button>
                        <button
                            type="button"
                            autoFocus
                            className={`btn ${options?.tone === "primary" ? "btn-primary" : "btn-error"}`}
                            onClick={() => settle(true)}
                        >
                            {options?.confirmLabel ?? "Delete"}
                        </button>
                    </>
                }
            >
                <div className="text-sm">{options?.message}</div>
            </Modal>
        </ConfirmContext.Provider>
    );
}

export function useConfirm(): ConfirmFn {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
    return ctx;
}
