"use client";
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface Shared {
    label: string;
    error?: string;
    hint?: string;
}

function Wrapper({ id, label, error, hint, required, children }: Shared & { id: string; required?: boolean; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-medium">
                {label}
                {required && (
                    <span className="text-error" aria-hidden>
                        {" "}
                        *
                    </span>
                )}
            </label>
            {children}
            {hint && !error && (
                <p id={`${id}-hint`} className="muted text-xs">
                    {hint}
                </p>
            )}
            {error && (
                <p id={`${id}-err`} role="alert" className="text-error text-xs font-medium">
                    {error}
                </p>
            )}
        </div>
    );
}

const describe = (id: string, error?: string, hint?: string) => (error ? `${id}-err` : hint ? `${id}-hint` : undefined);

export function TextField({ label, error, hint, className = "", ...rest }: Shared & InputHTMLAttributes<HTMLInputElement>) {
    const id = useId();
    return (
        <Wrapper id={id} label={label} error={error} hint={hint} required={rest.required}>
            <input
                id={id}
                className={`input w-full ${error ? "input-error" : ""} ${className}`}
                aria-invalid={error ? true : undefined}
                aria-describedby={describe(id, error, hint)}
                {...rest}
            />
        </Wrapper>
    );
}

export function SelectField({
    label,
    error,
    hint,
    className = "",
    children,
    ...rest
}: Shared & SelectHTMLAttributes<HTMLSelectElement>) {
    const id = useId();
    return (
        <Wrapper id={id} label={label} error={error} hint={hint} required={rest.required}>
            <select
                id={id}
                className={`select w-full ${error ? "select-error" : ""} ${className}`}
                aria-invalid={error ? true : undefined}
                aria-describedby={describe(id, error, hint)}
                {...rest}
            >
                {children}
            </select>
        </Wrapper>
    );
}

export function TextAreaField({ label, error, hint, className = "", ...rest }: Shared & TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const id = useId();
    return (
        <Wrapper id={id} label={label} error={error} hint={hint} required={rest.required}>
            <textarea
                id={id}
                className={`textarea w-full min-h-28 ${error ? "textarea-error" : ""} ${className}`}
                aria-invalid={error ? true : undefined}
                aria-describedby={describe(id, error, hint)}
                {...rest}
            />
        </Wrapper>
    );
}
