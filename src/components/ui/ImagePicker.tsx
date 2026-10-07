"use client";
import { useId, useRef } from "react";
import { LuCamera, LuTrash2 } from "react-icons/lu";
import { fileToResizedDataUrl } from "@/lib/client/image";
import { showError } from "@/utils/notify";
import { Avatar, CoverArt } from "./Art";

export default function ImagePicker({
    label,
    value,
    onChange,
    name,
    shape = "avatar",
}: {
    label: string;
    value: string | null | undefined;
    onChange: (dataUrl: string | null) => void;
    name: string;
    shape?: "avatar" | "cover";
}) {
    const id = useId();
    const input = useRef<HTMLInputElement>(null);

    const pick = async (file: File | undefined) => {
        if (!file) return;
        try {
            onChange(await fileToResizedDataUrl(file, shape === "cover" ? 320 : 256));
        } catch (e) {
            showError(e instanceof Error ? e.message : "Could not use that image");
        } finally {
            if (input.current) input.current.value = "";
        }
    };

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium" id={`${id}-l`}>
                {label}
            </span>
            <div className="flex items-center gap-4">
                {shape === "avatar" ? (
                    <Avatar name={name || "?"} src={value} size="lg" />
                ) : (
                    <CoverArt title={name || "Song"} src={value} size="lg" />
                )}
                <div className="flex flex-wrap gap-2">
                    <input
                        ref={input}
                        id={id}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="peer sr-only"
                        aria-labelledby={`${id}-l`}
                        onChange={(e) => void pick(e.target.files?.[0])}
                    />
                    <label htmlFor={id} className="btn btn-sm btn-outline gap-1.5 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                        <LuCamera aria-hidden /> {value ? "Change" : "Upload"}
                    </label>
                    {value && (
                        <button type="button" className="btn btn-sm btn-ghost gap-1.5" onClick={() => onChange(null)}>
                            <LuTrash2 aria-hidden /> Remove
                        </button>
                    )}
                </div>
            </div>
            <p className="muted text-xs">PNG, JPEG, WebP or GIF. It is resized in your browser before saving.</p>
        </div>
    );
}
